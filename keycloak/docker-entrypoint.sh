#!/bin/sh
# Render realm import with SMTP from compose env, then start Keycloak.
# Re-apply SMTP + Lattice theme on every boot (existing volumes skip re-import).
set -eu

TEMPLATE=/opt/keycloak/ms-init-realm.template.json
OUT=/tmp/ms-realm-import.json
IMPORT_DIR=/opt/keycloak/data/import
IMPORTED_REALM_FILE=ms-realm-realm.json

SMTP_HOST="${SMTP_HOST:-smtp.resend.com}"
SMTP_PORT="${SMTP_PORT:-465}"
SMTP_USER="${SMTP_USER:-resend}"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_FROM_RAW="${SMTP_FROM:-noreply@localhost}"
SMTP_SSL="${SMTP_SSL:-true}"
SMTP_STARTTLS="${SMTP_STARTTLS:-false}"
SMTP_FROM_DISPLAY_DEFAULT="${SMTP_FROM_DISPLAY_NAME:-Storefront}"

strip_quotes() {
  printf '%s' "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

parse_from() {
  raw="$(strip_quotes "$1")"
  case "$raw" in
    *\<*\@*\>*)
      SMTP_FROM_DISPLAY=$(printf '%s' "$raw" | sed -e 's/[[:space:]]*<.*$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
      SMTP_FROM_EMAIL=$(printf '%s' "$raw" | sed -e 's/^.*<\([^>]*\)>.*$/\1/' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
      ;;
    *)
      SMTP_FROM_DISPLAY="$SMTP_FROM_DISPLAY_DEFAULT"
      SMTP_FROM_EMAIL="$raw"
      ;;
  esac
  if [ -z "$SMTP_FROM_DISPLAY" ]; then
    SMTP_FROM_DISPLAY="$SMTP_FROM_DISPLAY_DEFAULT"
  fi
}

parse_from "$SMTP_FROM_RAW"

escape_sed() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/|/\\|/g' -e 's/&/\\&/g'
}

escape_json() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

sed \
  -e "s|\${SMTP_HOST}|$(escape_sed "$SMTP_HOST")|g" \
  -e "s|\${SMTP_PORT}|$(escape_sed "$SMTP_PORT")|g" \
  -e "s|\${SMTP_USER}|$(escape_sed "$SMTP_USER")|g" \
  -e "s|\${SMTP_PASS}|$(escape_sed "$SMTP_PASS")|g" \
  -e "s|\${SMTP_FROM}|$(escape_sed "$SMTP_FROM_EMAIL")|g" \
  -e "s|\${SMTP_FROM_DISPLAY}|$(escape_sed "$SMTP_FROM_DISPLAY")|g" \
  -e "s|\${SMTP_SSL}|$(escape_sed "$SMTP_SSL")|g" \
  -e "s|\${SMTP_STARTTLS}|$(escape_sed "$SMTP_STARTTLS")|g" \
  "$TEMPLATE" > "$OUT"

mkdir -p "$IMPORT_DIR"
cp "$OUT" "$IMPORT_DIR/$IMPORTED_REALM_FILE"

apply_realm_runtime_config() {
  i=0
  while [ "$i" -lt 45 ]; do
    if /opt/keycloak/bin/kcadm.sh config credentials \
      --server http://127.0.0.1:8080 \
      --realm master \
      --user "${KEYCLOAK_ADMIN}" \
      --password "${KEYCLOAK_ADMIN_PASSWORD}" >/dev/null 2>&1; then
      /opt/keycloak/bin/kcadm.sh update realms/ms-realm \
        -s loginTheme=lattice \
        -s displayName=Storefront \
        -s 'displayNameHtml=Storefront' \
        -s resetPasswordAllowed=true \
        -s rememberMe=true >/dev/null 2>&1 || true

      SMTP_JSON=$(printf '{"host":"%s","port":"%s","from":"%s","fromDisplayName":"%s","replyTo":"","replyToDisplayName":"","envelopeFrom":"","ssl":"%s","starttls":"%s","auth":"true","user":"%s","password":"%s"}' \
        "$(escape_json "$SMTP_HOST")" \
        "$(escape_json "$SMTP_PORT")" \
        "$(escape_json "$SMTP_FROM_EMAIL")" \
        "$(escape_json "$SMTP_FROM_DISPLAY")" \
        "$(escape_json "$SMTP_SSL")" \
        "$(escape_json "$SMTP_STARTTLS")" \
        "$(escape_json "$SMTP_USER")" \
        "$(escape_json "$SMTP_PASS")")
      /opt/keycloak/bin/kcadm.sh update realms/ms-realm -s "smtpServer=${SMTP_JSON}" >/dev/null 2>&1 || true
      return 0
    fi
    i=$((i + 1))
    sleep 2
  done
}

apply_realm_runtime_config &

exec /opt/keycloak/bin/kc.sh "$@" --import-realm
