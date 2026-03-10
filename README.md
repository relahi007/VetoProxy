<p align="center">
  <img src="frontend/public/logo192.png" width="120" alt="VetoProxy Logo" />
</p>

<h1 align="center">VetoProxy</h1>

<p align="center">
  AI-powered proxy voting automation for institutional investors.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" />
  <img src="https://img.shields.io/badge/python-3.11-blue" />
  <img src="https://img.shields.io/badge/react-18-61dafb" />
  <img src="https://img.shields.io/badge/blockchain-SHA--256-indigo" />
  <img src="https://img.shields.io/badge/llm-Llama%203.3%2070B-orange" />
  <img src="https://img.shields.io/badge/deployed-live-success" />
</p>

<p align="center">
  <a href="https://vetoproxy-weld.vercel.app">Live Demo</a> ·
  <a href="https://vetoproxy-production-230b.up.railway.app/api/health">API Health</a> ·
  <a href="https://github.com/jahirxpikachuu/vetoproxy">GitHub</a>
</p>

---

VetoProxy lets institutional investors encode their governance values once in plain English and automatically votes every proxy ballot according to their own rules — with a tamper-evident blockchain audit trail for every single decision.

## Features

- **Plain English Policy Compiler** — write rules like "Vote NO on executive pay raises above 10%" and the AI converts them into enforceable logic
- **Live SEC EDGAR Integration** — fetches real DEF 14A proxy filings by ticker symbol in seconds
- **Deterministic Rules Engine** — zero AI in the voting path, pure Python logic for full auditability
- **VetoChain Audit Ledger** — every decision recorded as a SHA-256 linked block, tamper-evident and regulator-ready
- **Three Input Modes** — ticker symbol, PDF upload, or paste raw filing text
- **CSV Export** — download complete voting decisions for any analysis
- **Chain Integrity Verification** — cryptographically verify no decisions have been altered

## Quick Start

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "GROQ_API_KEY=your_key_here" > .env
python3 main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## How It Works

```
Write policy in plain English
        ↓
AI converts it to structured JSON rules
        ↓
Enter ticker / upload PDF / paste filing text
        ↓
SEC EDGAR fetches the DEF 14A proxy filing
        ↓
AI extracts proposals from the filing
        ↓
Python rules engine votes on each proposal (zero AI)
        ↓
Decisions recorded to VetoChain (SHA-256)
        ↓
Results displayed with full audit trail
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python + Flask |
| AI Engine | Groq API — Llama 3.3 70B |
| Blockchain | Custom VetoChain (SHA-256) |
| Data Source | SEC EDGAR public API |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/compile-policy` | Plain English → JSON rules |
| `POST` | `/api/fetch-proxy` | Fetch SEC EDGAR filing by ticker |
| `POST` | `/api/extract-proposals` | Extract proposals from PDF or text |
| `POST` | `/api/vote` | Run rules engine + record to VetoChain |
| `GET` | `/api/audit-log` | All VetoChain blocks |
| `GET` | `/api/verify-chain` | Validate chain integrity |

## Why Deterministic Voting?

AI does not vote. Ever.

The AI engine does two things only: parse plain English rules into structured JSON, and extract proposals from SEC filings. All voting is deterministic Python logic. Regulators and fiduciaries need to explain every vote — *"the AI decided"* is not defensible. *"Rule r2 states vote NO on pay raises above 10%, the filing showed 15%, therefore NO"* is.

## Environment Variables

**Backend** — `backend/.env`
```
GROQ_API_KEY=your_groq_api_key
```

**Frontend** — `frontend/.env.production`
```
VITE_API_URL=https://your-railway-url.up.railway.app
```

## Team

Built at **BME HackNight 2026** by **el quattro**

- Rehman Elahi
- Ahmed Mugeeb
- Ahmed Jahir
- Tinoda Sam Dangwa
