<div align="center">
  <h1>V Drive</h1>
  <p><strong>An End-to-End Recruitment Operations Dashboard</strong></p>
</div>

## 📌 Overview

**V Drive** is a modern recruitment operations dashboard built with React, TypeScript, and Vite. It serves as an end-to-end hiring pipeline, automating candidate intake, job ingestion, smart candidate matching, and recruiter note drafting using AI. 

Designed for efficiency and scalability, V Drive orchestrates real-world inbox and submission workflows via DriveMail and webhooks, backed by Supabase for real-time pipeline state management.

## ✨ Key Features

- **Candidate Intake**: Add candidates manually or via CSV bulk upload with intelligent header mapping and validation.
- **Job Ingestion**: Webhook-triggered inbox synchronization via DriveMail.
- **Smart Match Scoring**: Deterministic candidate ranking via Supabase RPC with a client-side fallback mechanism based on skills, seniority, and location relevance.
- **AI-Powered Acceleration**: Integrated with LLaMA 3 via Groq for drafting strategic summaries and recruiter notes.
- **Submission Delivery**: Webhook-based finalizing step supporting Gmail reply/thread contexts.
- **Operational Controls**: Persistent user settings and profile management powered by Supabase with immediate localStorage fallback.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router DOM v7
- **Styling**: Tailwind CSS v4, Motion/React, Lucide React
- **Backend & State**: Supabase (PostgreSQL, RPC)
- **AI Integration**: Groq API (LLaMA 3)
- **Data Parsing**: PapaParse for CSV ingestion

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A Supabase Project
- A Groq API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/v-drive.git
   cd v-drive
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example environment file and configure your credentials.
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GROQ_API_KEY` are set.*

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture & Implementation

- **Frontend Architecture**: Utilizes React Router for navigation with lazy-loaded pages via `React.lazy` and `Suspense` for optimal performance.
- **State Layer**: Supabase client is used for reading/updating pipeline tables and orchestrating Remote Procedure Calls (RPC).
- **Integration Patterns**: Webhook orchestration for inbox syncing and submission payload delivery.
- **Graceful Degradation**: The AI integrations safely degrade when `GROQ_API_KEY` is absent, ensuring core features remain operational.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
