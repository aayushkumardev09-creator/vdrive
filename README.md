<div align="center">
  <h1>V Drive</h1>
  <p><strong>An End-to-End Recruitment Operations Dashboard</strong></p>
</div>

## Overview

**V Drive** is a recruitment operations dashboard built with React, TypeScript, and Vite. It automates candidate intake, job ingestion, smart matching, and recruiter note drafting. Pipeline state lives in Supabase; inbox sync and email submission are handled via Activepieces webhooks (see [`workflows/`](workflows/)).

## Features

- **Candidate intake** — Manual entry and CSV bulk upload with header mapping
- **Job ingestion** — DriveMail sync via webhook (`VITE_DRIVEMAIL_SYNC_WEBHOOK_URL`)
- **Smart match** — Supabase RPC scoring with client-side fallback
- **AI assistance** — Groq (LLaMA 3) for summaries and recruiter notes (optional)
- **Submissions** — Webhook delivery with Gmail thread/reply context
- **Settings** — Profile and preferences in Supabase with `localStorage` fallback

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, React Router 7 |
| Styling | Tailwind CSS v4, Motion, Lucide React |
| Data | Supabase (PostgreSQL, RPC) |
| Automation | Activepieces (`workflows/`) |
| AI | Groq API (optional) |

## Getting started

### Prerequisites

- **Node.js 20+** (matches CI)
- A [Supabase](https://supabase.com) project
- Activepieces instance with workflows from [`workflows/`](workflows/) (or equivalent webhooks)
- [Groq API key](https://console.groq.com) (optional, for AI features)

### Install

```bash
git clone https://github.com/aayushkumardev09-creator/vdrive.git
cd vdrive
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_DRIVEMAIL_SYNC_WEBHOOK_URL` | Yes | Activepieces DriveMail sync webhook |
| `VITE_SUBMISSION_WEBHOOK_URL` | Yes | Activepieces submission webhook |
| `GROQ_API_KEY` | No | Enables AI drafting; app works without it |

See [`.env.example`](.env.example) for a template.

> **Security:** `GROQ_API_KEY` is injected at build time for local/dev convenience. Do not commit real keys. For production, prefer a backend proxy so API keys never ship in the browser bundle. See [SECURITY.md](SECURITY.md).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript check (`tsc --noEmit`) |
| `npm run format` | Format source with Prettier |

## Project structure

```
vdrive/
├── src/
│   ├── components/     # Layout and shared UI
│   ├── pages/          # Route-level views
│   └── lib/            # Supabase, config, AI, utilities
├── workflows/          # Activepieces JSON exports
├── .github/workflows/  # CI (typecheck + build)
└── ...
```

## Automation workflows

Import the JSON files in [`workflows/`](workflows/) into [Activepieces](https://www.activepieces.com/) and connect your Supabase and email integrations. See [`workflows/README.md`](workflows/README.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
