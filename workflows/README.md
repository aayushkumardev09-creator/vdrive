# Webhook Workflows (Automation)

This directory contains the actual orchestration logic (exported as JSON) that powers the V Drive backend webhooks. These workflows were built and designed specifically for **Activepieces**. By importing these files into your Activepieces environment, you can recreate the full end-to-end data pipeline.

## 📂 Included Workflows

### 1. Email Ingestion (`email_ingestion.json`)
- **Trigger**: Receives the webhook from the DriveMail UI (`VITE_DRIVEMAIL_SYNC_WEBHOOK_URL`).
- **Logic**: Connects to the designated email inbox, parses the latest job requirements, structures the data, and securely syncs it into the Supabase database.

### 2. Submission Reply Logic (`reply_logic.json`)
- **Trigger**: Receives the outgoing payload from the Submissions UI (`VITE_SUBMISSION_WEBHOOK_URL`).
- **Logic**: Uses the provided job and candidate data, formats the AI-generated recruiter notes, and triggers an email reply directly within the correct email thread.
