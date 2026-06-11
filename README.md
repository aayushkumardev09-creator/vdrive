<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="MIT License" />

  # 🚀 V Drive

  **An End-to-End Recruitment Operations Dashboard**

  Streamline your entire recruitment pipeline from candidate intake to submission delivery with an AI-powered, webhook-orchestrated platform.

  [Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📌 Overview

**V Drive** is a modern, full-stack recruitment operations dashboard designed to orchestrate complex hiring workflows at scale. Built with React 19, TypeScript, and powered by Supabase, V Drive automates candidate intake, job ingestion, intelligent matching, and submission delivery—all while maintaining real-time pipeline visibility.

Whether you're managing 10 or 10,000 candidates, V Drive provides the operational controls and AI-powered insights needed to make data-driven hiring decisions faster.

### Key Highlights

- ⚡ **Real-Time Pipeline State**: Supabase-backed PostgreSQL with live event streaming
- 🤖 **AI-Powered Automation**: LLaMA 3 integration via Groq for candidate summaries and recruiter notes
- 📧 **Email Orchestration**: Webhook-based workflows via Activepieces for inbox sync and submissions
- 📊 **Smart Scoring**: Deterministic candidate ranking with client-side fallback mechanisms
- 🎯 **Bulk Operations**: CSV import with intelligent header mapping and validation
- 🔒 **Enterprise-Ready**: Built-in authentication, role management, and secure credential handling

---

## ✨ Key Features

### 🎯 Candidate Management
- **Manual Entry**: Add candidates with full profile information
- **Bulk Upload**: CSV import with intelligent column detection and data validation
- **Smart Validation**: Real-time validation for emails, phone numbers, and location data

### 📧 Job Ingestion
- **Webhook Integration**: Automated job syncing via DriveMail with webhook triggers
- **Email Parsing**: Intelligent extraction of job requirements from email inbox
- **Real-Time Sync**: Automatic job database updates as emails arrive

### 🧠 Intelligent Matching
- **Smart Scoring Algorithm**: Deterministic ranking based on skills, seniority, and location
- **Supabase RPC Functions**: Server-side computation with instant fallback to client-side scoring
- **Ranking Pipeline**: Customizable match thresholds and weighting

### 🤖 AI-Powered Intelligence
- **Candidate Summaries**: Auto-generate concise candidate profiles using LLaMA 3
- **Recruiter Notes**: AI-drafted collaboration notes with context awareness
- **Thread Context**: Gmail reply/thread awareness for contextual submissions
- **Graceful Degradation**: All features work offline when GROQ_API_KEY is unavailable

### 📨 Submission Management
- **One-Click Delivery**: Submit candidates directly to hiring managers
- **Email Thread Integration**: Maintain conversation context in Gmail threads
- **Webhook Orchestration**: Activepieces-powered submission workflows
- **Audit Trail**: Complete submission history and status tracking

### ⚙️ Operational Controls
- **User Settings**: Persistent preferences and UI customization
- **Profile Management**: Team member profiles with role-based access
- **Supabase Sync**: Real-time settings propagation with localStorage fallback
- **Pipeline Filters**: Advanced filtering by status, stage, and custom fields

---

## 🛠️ Tech Stack

### Frontend
- **React 19**: Latest React with concurrent features and automatic batching
- **TypeScript 5.8**: Strict type safety across the entire codebase
- **Vite 6.2**: Lightning-fast development and optimized production builds
- **React Router v7**: Modern routing with lazy-loaded pages
- **Tailwind CSS v4**: Utility-first styling with Just-In-Time compilation
- **Motion/React**: Smooth, performant animations and transitions
- **Lucide React**: 1000+ consistent, beautiful icons

### Backend & Infrastructure
- **Express.js**: Lightweight, battle-tested HTTP server
- **Supabase**: PostgreSQL database with real-time capabilities, authentication, and RPC
- **Activepieces**: Low-code workflow orchestration for webhooks and integrations
- **DriveMail**: Email parsing and integration service

### AI & External Integrations
- **Groq API**: LLaMA 3 for high-performance AI inference
- **PapaParse**: Robust CSV parsing with header detection
- **XLSX.js**: Excel file support for bulk operations

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Code quality and consistency checks
- **Prettier**: Automatic code formatting
- **Node.js 20+**: Modern runtime with latest JavaScript features
- **Concurrently**: Parallel process management for dev/frontend/backend

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js**: v18 or higher (v20+ recommended)
- **npm** or **yarn**: v10+
- **Supabase Account**: Free tier available at [supabase.com](https://supabase.com)
- **Groq API Key**: Free tier available at [groq.com](https://console.groq.com) (optional, for AI features)
- **Git**: For cloning the repository

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/aayushkumardev09-creator/vdrive.git
cd vdrive
```

#### 2. Install Dependencies

```bash
# Install root and frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

#### 3. Configure Environment Variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Groq API Configuration (Optional - AI features gracefully degrade without this)
GROQ_API_KEY=your_groq_api_key_here

# Activepieces Webhook URLs (Required for email sync and submissions)
VITE_DRIVEMAIL_SYNC_WEBHOOK_URL=https://your-activepieces-instance/webhook/drivemail-sync
VITE_SUBMISSION_WEBHOOK_URL=https://your-activepieces-instance/webhook/submission

# Observability (Optional)
# VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### 4. Start Development Server

```bash
# Starts frontend (port 3000) and backend (port 3001) concurrently
npm run dev
```

Open your browser and navigate to `http://localhost:3000`

### Development Commands

```bash
# Development mode (frontend + backend)
npm run dev

# Frontend only (port 3000)
npm run dev:frontend

# Backend only (port 3001)
npm run dev:backend

# Build for production
npm run build

# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend

# Start production server
npm start

# Type checking
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

---

## 🏗️ Project Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    V Drive Application                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌──────────────────────┐  │
│  │   React 19 UI    │         │   Express Backend    │  │
│  │  (Port 3000)     │────────▶│   (Port 3001)        │  │
│  └──────────────────┘         └──────────────────────┘  │
│         │                              │                 │
│         │                              ▼                 │
│         │                    ┌──────────────────┐        │
│         └──────────────────▶ │  Supabase DB     │        │
│                              │  (PostgreSQL)    │        │
│                              └──────────────────┘        │
│                                      │                   │
│  ┌──────────────────┐                │                   │
│  │  Activepieces    │◀───────────────┘                   │
│  │  Webhooks        │                                    │
│  └──────────────────┘                                    │
│         │                                                │
│         ├─▶ Email Ingestion Workflow                    │
│         └─▶ Submission Workflow                         │
│                                                           │
│  ┌──────────────────┐                                    │
│  │  Groq API        │ (LLaMA 3 AI)                      │
│  │  (Optional)      │                                    │
│  └──────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
vdrive/
├── src/                    # Frontend source
│   ├── components/        # React components
│   ├── pages/             # Route pages
│   ├── hooks/             # Custom hooks
│   ├── services/          # API clients
│   ├── types/             # TypeScript types
│   ├── utils/             # Helper functions
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── types/         # API types
│   │   └── server.ts
│   └── package.json
├── workflows/             # Activepieces workflows
│   ├── email_ingestion.json
│   └── reply_logic.json
├── .github/               # GitHub config
├── dist/                  # Production build
├── .env.example          # Env template
├── package.json          # Dependencies
├── tsconfig.json         # TS config
└── Dockerfile            # Docker config
```

---

## 🐳 Docker Support

### Build and Run

```bash
# Build Docker image
docker build -t vdrive:latest .

# Run container
docker run -p 3001:3001 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  -e GROQ_API_KEY=your_groq_key \
  vdrive:latest
```

---

## 📚 Documentation

### Guides
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [SECURITY.md](SECURITY.md) - Security policies and best practices
- [CHANGELOG.md](CHANGELOG.md) - Version history and updates

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Groq API Docs](https://console.groq.com/docs)

---

## 🤝 Contributing

We love contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Setting up development environment
- Code standards and best practices
- Git workflow and commit conventions
- Pull request process
- Code of conduct

### Quick Start for Contributors

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/vdrive.git
cd vdrive

# 3. Create a feature branch
git checkout -b feature/my-feature

# 4. Install dependencies
npm install && cd backend && npm install && cd ..

# 5. Start development
npm run dev

# 6. Make your changes, commit, and push
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# 7. Open a Pull Request on GitHub
```

---

## 🔒 Security

### Security Best Practices

- ✅ Never commit `.env` files
- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Use HTTPS for all external connections
- ✅ Enable Row-Level Security in Supabase
- ✅ Validate all user inputs

### Reporting Security Issues

Found a security vulnerability? Please email **security@example.com** instead of using GitHub issues.

See [SECURITY.md](SECURITY.md) for more details.

---

## 📊 Performance

### Optimization Techniques

- **Code Splitting**: React Router lazy-loading
- **Database Indexing**: Optimized Supabase queries
- **Caching**: Browser and Redis caching strategies
- **Real-Time Optimization**: Efficient Supabase subscriptions
- **Bundle Size**: Monitored with Vite build analysis

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `lsof -i :3000 \| awk '{print $2}' \| xargs kill -9` |
| VITE_SUPABASE_URL undefined | Check `.env` file and restart dev server |
| Dependencies not installing | Try `npm install --legacy-peer-deps` |
| AI features not working | Ensure GROQ_API_KEY is set; features degrade gracefully |

### Getting Help

- **[GitHub Issues](https://github.com/aayushkumardev09-creator/vdrive/issues)** - Bug reports
- **[GitHub Discussions](https://github.com/aayushkumardev09-creator/vdrive/discussions)** - Questions
- **[Documentation](./docs/)** - Detailed guides

---

## 📄 License

This project is licensed under the **MIT License**.

See [LICENSE](LICENSE) for details. MIT License allows:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ⚠️ Includes license copy requirement

---

## 🙏 Acknowledgments

Built with support from:
- [React](https://react.dev)
- [Supabase](https://supabase.com)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Groq](https://groq.com)

---

## 📞 Contact

- **Author**: Aayush Kumar Dev
- **GitHub**: [@aayushkumardev09-creator](https://github.com/aayushkumardev09-creator)
- **Issues**: [GitHub Issues](https://github.com/aayushkumardev09-creator/vdrive/issues)

---

<div align="center">

**[⬆ Back to Top](#-vdrive)**

Made with ❤️ for the recruitment community

[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

</div>
