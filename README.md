# FlowAI — AI Business Operations Assistant Prototype

## What is working
- React SaaS dashboard
- Node.js + Express API
- Persistent local JSON data store
- Dashboard metrics
- AI Inbox
- Deterministic AI task extraction endpoint
- Priority detection
- Assignee detection
- Due-date extraction
- Create task from AI result
- Task status updates
- Follow-ups, meetings, reports, integrations and settings screens
- Responsive UI

## Run
Requirements: Node.js 18+.

```bash
npm install
npm run install:all
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:4000

## Important
This is a real runnable MVP prototype, but external Gmail/Google Calendar/WhatsApp/SAP connections are represented by prototype data and connector UI. Production OAuth, webhooks, API scopes, approval workflows and audit infrastructure should be implemented before connecting real customer systems.
