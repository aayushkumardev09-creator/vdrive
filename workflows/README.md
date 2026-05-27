# Webhook Workflows (Automation)

This directory contains orchestration logic (exported as JSON) for the V Drive backend webhooks. These workflows are designed for **[Activepieces](https://www.activepieces.com/)**. Import them into your instance and configure **Supabase** and **email** connections — do not commit real API keys into these files.

> After import, re-link each Supabase step to your project connection. Connection IDs in the JSON (e.g. `{{connections['...']}}`) are instance-specific and must be updated in the Activepieces UI.

## 📂 Included Workflows

### 1. Email Ingestion (`email_ingestion.json`)
- **Trigger**: Receives the webhook from the DriveMail UI (`VITE_DRIVEMAIL_SYNC_WEBHOOK_URL`).
- **Logic**: Connects to the designated email inbox, parses the latest job requirements, structures the data, and securely syncs it into the Supabase database.

### 2. Submission Reply Logic (`reply_logic.json`)
- **Trigger**: Receives the outgoing payload from the Submissions UI (`VITE_SUBMISSION_WEBHOOK_URL`).
- **Logic**: Uses the provided job and candidate data, formats the AI-generated recruiter notes, and triggers an email reply directly within the correct email thread.
