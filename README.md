
# NEURA — AI Financial Decision Intelligence Layer

Hackathon Project: Fintech Forward 2026 — Be U by Bank Islam × UMPSA | By: Last Minute

Overview
--------
NEURA is an AI-driven financial decision support system that helps users make safer, smarter, and more financially responsible decisions before, during, and after transactions. Inspired by neural systems, NEURA continuously monitors signals, detects risks, and responds proactively to protect users' finances.

Key capabilities
- Predict financial impact before spending (Affordability checks)
- Compare prices and find better deals with an AI scanner (Reality Lens)
- Prevent scam transfers and mule account fraud (Shield)
- Provide elderly protection with caregiver approval flows
- Offer multi-agent AI guidance (Mizan, Barakah, Safar, Ehsan)

Persona — Meet Emma
-------------------
Emma is a frequent online shopper, who needs confidence, clarity, and protection when buying online. NEURA helps Emma by:
- Showing evidence-backed price comparisons and savings
- Estimating budget impact and recommending whether to make or delay purchase
- Screening receivers' bank account number for scam risk and enforcing cooling periods for detected scam or suspicious mule account

Core Features — the Pipeline
---------------------------------------
1) Predictive Financial Insights (Before: deciding to make a purchase)
   - NEURA analyzes a user's spending history, commitments and behavioral patterns to estimate affordability and the likely budget impact of a purchase. It highlights anomalies, computes whether a purchase fits within safe limits, and can recommend delaying a purchase by placing it in a Wishlist Vault (Delay & Lock) for reconsideration.

2) Smart Deal AI Scanner — Reality Lens (During: finding the best deal for a purchase)
   - The Reality Lens lets users capture a product image or price tag and returns an evidence-backed comparison: detected item, store price, online market price(s), marketplace proof links and the computed savings. The UI surfaces whether the item is affordable, suggests safer alternatives and offers direct actions (e.g., invest the savings or keep in wallet).

3) Scam Prevention (After: making payment for the purchase)
   - NEURA screens recipients' bank account to detect blacklisted scam or mule accounts. For high-risk transfers (scam or mule account matched with database records), the system warns the user and enforce a 60-second cooling period to reduce impulsive fraud losses.
   - Database is sourced from government, such as Semak Mule PDRM, and verified user reports. Semak Mule PDRM is an online portal provided by the Commercial Crime Investigation Department (CCID) of the Royal Malaysia Police to help the public check bank accounts, phone numbers, or company names that may potentially be involved in fraudulent activities or used as mule accounts.

4) Elderly Financial Protection
   - An optional Elderly Mode provides an extra safeguards layer: predefined spending limits, caregiver registration and OTP-based caregiver approvals for transfers that exceed those limits. The flow is designed to protect vulnerable users while preserving access.

5) Multi-Agent AI Chatbot
   - A conversational orchestrator routes questions and actions to specialized agents: Shield (fraud & security), Mizan (financial wellness), Barakah (Shariah compliance), Ehsan (accessibility/emergency support) and Safar (travel planning). Each agent provides focused guidance and recommendations tailored to its domain.

System Architecture (simplified)
--------------------------------
User → Frontend (React) → Backend (Express + Orchestrator + RealityLens) → Firestore
                                                               ↳ Gemini (Google GenAI)

Tech Stack
----------
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, TypeScript, Express
- AI: Google GenAI (Gemini) via `@google/genai`
- Database: Google Firestore (Firebase Admin SDK)

Quick Start (development)
-------------------------
Prerequisites
- Node.js 18+ and npm
- Firebase service account JSON for Firestore
- GEMINI_API_KEY for live Gemini AI scans

Install dependencies

```bash
npm install
```

Start backend (development)

1. Ensure Firestore credentials are available. Two common options:
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to the service account JSON path
   - Or set `FIREBASE_SERVICE_ACCOUNT_PATH` to the path expected by `backend/src/config/firebase.ts`

2. Start backend:

```bash
npm run dev:backend -w backend
# or from backend/ folder: npm run dev
```

Start frontend (development)

```bash
npm run dev -w frontend
# open http://localhost:5173
```

Environment Variables
---------------------
Create a `.env` in the backend folder (or set env vars in your shell). Example entries:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/service-account.json
PORT=3000
```

Notes
- The frontend Vite dev server proxies `/api` to the backend (default 3000). See `frontend/vite.config.ts`.
- If `GEMINI_API_KEY` is not present the backend falls back to a conservative demo response so UI remains usable.

Contributing
------------
Open an issue, then create a PR. 



