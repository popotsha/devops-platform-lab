# Lattice login theme baked into the image so Compose builds
# get the same SSO UI as the volume-mounted theme files.
FROM quay.io/keycloak/keycloak:25.0

COPY --chown=1000:0 themes/lattice /opt/keycloak/themes/lattice
