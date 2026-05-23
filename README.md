
# NEURA — AI Financial Decision Intelligence Layer

Hackathon project: Fintech Forward 2026 — Be U by Bank Islam × UMPSA

Overview
--------
NEURA is an AI-driven financial decision support system that helps users make safer, smarter, and more financially responsible decisions before, during, and after transactions. Inspired by neural systems, NEURA continuously monitors signals, detects risks, and responds proactively to protect users' finances.

Key capabilities
- Predict financial impact before spending (affordability checks)
- Compare prices and find better deals with an AI scanner (Reality Lens)
- Prevent scam transfers and mule account fraud (Shield)
- Provide elderly protection with caregiver approval flows
- Offer multi-agent AI guidance (Mizan, Barakah, Safar, Ehsan)

Persona — Meet Emma
-------------------
Emma is a frequent online shopper who needs confidence, clarity, and protection when buying online. NEURA helps Emma by:
- Showing evidence-backed price comparisons and savings
- Estimating budget impact and recommending whether to delay
- Screening receivers for scam risk and enforcing cooling periods

Core features — user‑facing descriptions
---------------------------------------
1) Predictive Financial Insights (Before purchase)
   - NEURA analyzes a user's spending history, commitments and behavioral patterns to estimate affordability and the likely budget impact of a purchase. It highlights anomalies, computes whether a purchase fits within safe limits, and can recommend delaying a purchase by placing it in a Wishlist Vault (Delay & Lock) for reconsideration.

2) Smart Deal AI Scanner — Reality Lens (During purchase)
   - The Reality Lens lets users capture a product image or price tag and returns an evidence-backed comparison: detected item, store price, online market price(s), marketplace proof links and the computed savings. The UI surfaces whether the item is affordable, suggests safer alternatives and offers direct actions (e.g., invest the savings or keep in wallet).

3) Scam Prevention (During / After)
   - NEURA screens transfer recipients and transaction context for scam signals such as mule accounts, suspicious patterns, urgency language or phishing indicators. For high-risk transfers the system warns the user and can enforce a configurable cooling period (for example 60 seconds) to reduce impulsive fraud losses.

4) Elderly Financial Protection
   - An optional Elderly Mode provides an extra safeguards layer: predefined spending limits, caregiver registration and OTP-based caregiver approvals for transfers that exceed those limits. The flow is designed to protect vulnerable users while preserving access.

5) Multi-Agent AI Chatbot
   - A conversational orchestrator routes questions and actions to specialized agents: Shield (fraud & security), Mizan (financial wellness), Barakah (Shariah compliance), Ehsan (accessibility/emergency support) and Safar (travel planning). Each agent provides focused guidance and recommendations tailored to its domain.

System architecture (simplified)
--------------------------------
User → Frontend (React) → Backend (Express + Orchestrator + RealityLens) → Firestore
                                                               ↳ Gemini (Google GenAI)

Project structure (important files)
----------------------------------
- frontend/
  - src/components/RealityLens.tsx
  - src/App.tsx
  - src/types.ts

- backend/
  - src/app.ts
  - src/modules/realityLens/service.ts
  - src/modules/realityLens/router.ts
  - src/modules/predictionAnalysis/state/state.service.ts
  - src/modules/predictionAnalysis/tracker/tracker.service.ts
  - src/config/firebase.ts

Tech stack
----------
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, TypeScript, Express
- AI: Google GenAI (Gemini) via `@google/genai`
- Database: Google Firestore (Firebase Admin SDK)

Quick start (development)
-------------------------
Prerequisites
- Node.js 18+ and npm
- Firebase service account JSON for Firestore
- (Optional) GEMINI_API_KEY for live Gemini scans

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

Environment variables
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

Expected Reality Lens output (example)
-------------------------------------
Value Card
- Store Price: RM 149.90
- Online (fallback estimate): RM 132.00
- Platform proof: Lazada RM 135.00, Shopee RM 129.00
- You save: RM 17.90

Impact Card
- Category: General
- Impact: LOW (≈19% of Wants budget)

Shariah Shield
- Review complete — Fast fallback used while the live vision model was taking too long.

Troubleshooting
---------------
- 404s from frontend `/api` calls: ensure backend is running and proxy is configured.
- Gemini errors (400/invalid image): check backend logs; fallback will be used if Gemini rejects input.

Next steps & improvements
-------------------------
- Replace `window.confirm()` with a custom confirmation modal and an Undo action.
- Add server-side marketplace verification (headless checks) to validate Gemini marketplace URLs.
- Add unit/integration tests for investScanSavings and scan JSON parsing.

Contributing
------------
Open an issue, then create a PR. I can scaffold CONTRIBUTING.md and developer scripts on request.

License
-------
Add a LICENSE file if you intend to publish this project publicly.


