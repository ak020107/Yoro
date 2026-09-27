# MongoDB for Yoro

Yoro uses a **MongoDB Atlas database connection string**, not an Atlas management API key.

1. Create/select an Atlas cluster.
2. Under **Database Access**, create a database user with read/write access to the chosen application database. This is separate from your Atlas website login.
3. Under **Network Access**, allow the IP of the computer/server running Yoro.
4. Choose **Connect → Drivers → Node.js** and copy the connection string.
5. Put it in `.env.local` as `MONGODB_URI`; set `MONGODB_DATABASE=voice_coach` (or your chosen database).
6. Replace the username/password placeholders, **including removing the surrounding `< >` brackets**. URL-encode special characters in credentials. Keep secrets out of chat and version control.
7. Restart Yoro after configuration changes, then reload the same browser session.

[Official Atlas connection guide](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)

## Current verification

On 27 September 2026, the configured URI had template brackets around the password. Removing them successfully authenticated; the corrected URI was saved locally without exposing it. Verified the running API's isolated state write, direct Atlas read and API reload. Deleted only the test session document afterward.

## What is stored

Profiles, plans, attempts and feedback, conversation history, real-world check-ins, progress and personal-voice setup metadata live in Atlas. On first access, a local session is imported if the cloud has no document for that session; existing cloud state is never overwritten by an older local file. Connection errors are surfaced instead of silently splitting writes between local and cloud storage.

Audio remains on this development server. Selected before/after pairs can be kept until released or reset; ordinary recording access expires after 24 hours, with cleanup on expired access or reset. MongoDB does not make recordings available after moving to a different server, and it does not add login or cross-device identity. Keep using the same browser session for this demo.
