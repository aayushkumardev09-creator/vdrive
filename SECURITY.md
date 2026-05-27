# Security Policy

## Reporting vulnerabilities

If you discover a security issue, please open a [private security advisory](https://github.com/aayushkumardev09-creator/vdrive/security/advisories/new) on GitHub rather than filing a public issue.

## Secrets and credentials

- Never commit `.env` files or API keys.
- **Supabase anon keys** are intended for client-side use with Row Level Security enabled on all tables.
- **Groq API keys** must not be exposed in public production builds. The current Vite setup embeds `GROQ_API_KEY` in the client bundle when set at build time — use only for local development or rotate keys if they were ever committed.
- **Activepieces workflow exports** should use connection references, not hardcoded JWTs. Reconfigure Supabase connections after importing `workflows/*.json`.

## If credentials were committed

1. Rotate the affected keys in Supabase and Groq immediately.
2. Update Activepieces connections with the new credentials.
3. Consider rewriting git history if secrets reached a public remote.
