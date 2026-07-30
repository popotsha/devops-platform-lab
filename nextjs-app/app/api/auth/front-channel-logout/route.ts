import { signOut } from "@/auth";
import { logger } from "@/lib/logger";

const LOGOUT_SIGNAL = "ms-kit-sso-logout";

export async function GET() {
  logger.info('SSO front-channel logout received ...', { event: 'auth.front-channel-logout' });
  await signOut({ redirect: false });

  const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>
      try {
        localStorage.setItem("${LOGOUT_SIGNAL}", String(Date.now()));
      } catch (e) {}
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
