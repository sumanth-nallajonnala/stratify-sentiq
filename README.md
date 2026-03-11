# SentIQ — Multi-Dimensional Customer Intelligence Platform

> **DAKSH '26 AI Hackathon** · Category 4: Business & E-Commerce · Team Stratify

![SentIQ Dashboard](docs/dashboard_screenshot.png)

## What is SentIQ?

E-commerce brands receive thousands of reviews but reduce all that 
feedback to a single star rating. SentIQ changes that.

We built an AI platform that analyzes product reviews across **5 dimensions** — 
Fit, Comfort, Quality, Style, and Value — giving brands a complete picture 
of exactly what customers love and what needs fixing.

**The problem in numbers:**
- $2.1 Billion lost annually from undetected product issues
- 40% of product problems go undetected with star ratings alone
- 60% of returns are preventable with dimension-level insights

---

## Live Demo

| Component | URL |
|---|---|
| Frontend Dashboard | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |

---

## Key Results

| Metric | Value |
|---|---|
| Reviews processed in test | 22,641 |
| Total infrastructure cost | $0.070432 |
| Cost per review | $0.00000311 |
| Processing speed | 51 reviews/second |
| Load test (100 users) | 0% failure rate |
| Competitor cost per review | $0.05 – $0.12 |
| Our cost advantage | **200x cheaper** |

---

## Features

- **5-Dimension Scoring** — Fit, Comfort, Quality, Style, Value (1–5 each)
- **Universal CSV Support** — Works with any review dataset, auto-detects columns
- **Smart Recommendations** — Specific, numbered action steps per product
- **Product Comparison** — Side-by-side bar charts across all dimensions
- **Radar Charts** — Visual scorecard per product
- **Cost Tracking** — Real-time infrastructure cost per analysis job
- **Load Tested** — Validated at 10, 50, and 100 concurrent users

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML / NLP | Keyword-based ABSA, spaCy NER for PII removal |
| Backend | Python, FastAPI, Uvicorn |
| Frontend | React, Recharts, Axios |
| Data | Pandas, scikit-learn |
| Deployment | AWS EC2 + Amplify (Finals) / Render + Vercel (Free tier) |
| Cost | 100% Open-Source — zero proprietary API costs |

---

## Project Structure
```
stratify-sentiq/
├── backend/
│   ├── main.py              # FastAPI app — all endpoints
│   ├── locustfile.py        # Load testing configuration
│   └── run_loadtest.py      # Automated scalability tests
├── frontend/
│   └── sentiq-dashboard/    # React dashboard
│       └── src/
│           └── App.js       # Complete UI — single file
├── ml/
│   ├── scorer.py            # Core NLP scoring engine
│   └── explore.py           # Dataset exploration
├── docs/
│   └── sample_data/
│       ├── reviews.csv              # Primary dataset (23K reviews)
│       └── test_amazon_format.csv   # Cross-format test dataset
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone the repo
```bash
git clone https://github.com/sumanth-nallajonnala/stratify-sentiq.git
cd stratify-sentiq
```

### 2. Install Python dependencies
```bash
pip install fastapi uvicorn pandas transformers sentence-transformers torch scikit-learn spacy langdetect
python -m spacy download en_core_web_sm
```

### 3. Start the backend
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 4. Install and start the frontend
```bash
cd frontend/sentiq-dashboard
npm install
npm start
```

### 5. Open the dashboard
Go to **http://localhost:3000**, upload any reviews CSV and click **Analyze with SentIQ**.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API info and status |
| GET | `/health` | Health check with timestamp |
| POST | `/analyze` | Upload CSV, get 5-dimension scorecards |
| GET | `/results/{job_id}` | Retrieve previous analysis by job ID |
| GET | `/metrics` | Platform cost and performance metrics |

Full interactive docs at: **http://localhost:8000/docs**

---

## Cost Analysis

### Per 1,000 Reviews
| Component | Cost |
|---|---|
| EC2 t3.small inference | $0.18 |
| AWS Lambda API calls | $0.02 |
| S3 Storage | $0.00005 |
| **Total** | **~$0.20** |

### At Scale
| Users | Monthly Reviews | Monthly Cost | Cost/User |
|---|---|---|---|
| 100 | 500K | ~$12 | $0.12 |
| 1,000 | 5M | ~$85 | $0.085 |
| 10,000 | 50M | ~$480 | $0.048 |
| 100,000 | 500M | ~$3,200 | $0.032 |

Cost per user **drops** as scale increases — proving strong economies of scale.

---

## Load Test Results

| Scenario | Users | Requests | Failure Rate | Avg Response |
|---|---|---|---|---|
| Low Load | 10 | 65 | 0% | ~2000ms |
| Medium Load | 50 | 304 | 0% | ~2032ms |
| High Load | 100 | 606 | 0% | ~2034ms |

**0% failure rate across all load levels.**

---

## Ethical Guardrails

- **PII Scrubbing** — spaCy NER removes names, emails, locations before ML processing
- **Bot Detection** — Anomaly detection flags fake review clusters
- **Data Ephemerality** — Raw reviews deleted within 24 hours by default
- **DPDPA 2023 Aligned** — Compliant with India's Digital Personal Data Protection Act
- **No Jailbreaking** — All inputs sanitized before any model inference

---

## Team Stratify

Built with purpose at **DAKSH '26 AI Hackathon**
SASTRA Deemed University · March 13–15, 2026
Powered by Amazon Web Services

---

*SentIQ — Because one star rating is never the whole story.*