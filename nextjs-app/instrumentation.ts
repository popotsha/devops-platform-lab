export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const required = ['AUTH_SECRET', 'AUTH_KEYCLOAK_ID', 'AUTH_KEYCLOAK_SECRET', 'AUTH_KEYCLOAK_ISSUER'];
    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length > 0) {
      console.error(
        `\n[Config] nextjs-app is missing required environment variables:\n` +
        missing.map((k) => `  • ${k}`).join('\n') +
        `\n\nFix: run  cp nextjs-app/.env.local.example nextjs-app/.env.local  then restart.\n`,
      );
    }

    await import('./instrumentation.node');
  }
}
