# GRC Risk Assessment & Heatmap Dashboard

A full-stack web application for risk assessment using the standard likelihood × impact matrix, aligned with NIST SP 800-30 methodology.

### Deployment
client: https://grc-filter-task-takshakmudgal.vercel.app/
server: https://grc-filter-task-takshakmudgal-production.up.railway.app

## Features

**Backend (FastAPI + SQLite)**
- POST `/assess-risk`: Submit new risk assessments with automatic score calculation
- GET `/risks`: Retrieve all risks with optional level filtering (`?level=Critical`)
- Input validation (likelihood/impact must be 1-5)
- Risk scoring: `score = likelihood × impact`
- Level mapping: Low (1-5), Medium (6-12), High (13-18), Critical (19-25)

**Frontend (React + Vite)**
- Risk input form with real-time score preview
- Sortable risk register table with level filtering
- 5×5 risk matrix heatmap with color-coded cells and hover tooltips
- Stats cards (Total Risks, High/Critical count, Average Score)
- CSV export functionality
- Mitigation hints based on risk level
- Responsive dark theme design

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## API Reference

### POST /assess-risk
```json
{
  "asset": "Customer Database",
  "threat": "Data Breach",
  "likelihood": 4,
  "impact": 5
}
```

Response:
```json
{
  "id": 1,
  "asset": "Customer Database",
  "threat": "Data Breach",
  "likelihood": 4,
  "impact": 5,
  "score": 20,
  "level": "Critical"
}
```

### GET /risks
Returns array of all risks. Supports `?level=` query parameter for filtering.

## Risk Scoring

| Score Range | Level    | Color  | Mitigation Hint                          |
|-------------|----------|--------|------------------------------------------|
| 1-5         | Low      | Green  | Accept / monitor                         |
| 6-12        | Medium   | Yellow | Plan mitigation within 6 months          |
| 13-18       | High     | Orange | Prioritize action (NIST PR.AC)           |
| 19-25       | Critical | Red    | Immediate mitigation + executive report  |

## Project Structure
```
├── backend/
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── risks.db          # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main application component
│   │   ├── index.css     # Styling
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## GRC Context

This application implements risk assessment aligned with NIST SP 800-30 "Guide for Conducting Risk Assessments". The 5×5 matrix approach is commonly used in ISO 27001 and other compliance frameworks to:

1. **Identify risks** by documenting assets and potential threats
2. **Evaluate risks** using likelihood × impact scoring
3. **Prioritize response** based on risk levels
4. **Support compliance** with straightforward risk visualization

## Tested Edge Cases

- Empty database returns empty array
- Invalid likelihood/impact values return HTTP 422 with detailed error
- Level filtering works correctly (`?level=Critical`)
- Heatmap handles multiple risks in same cell
- CSV export includes all table data

## Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect your GitHub repo, set root directory to `backend`
3. Render will auto-detect the Dockerfile
4. Note your backend URL (e.g., `https://your-app.onrender.com`)

### Frontend (Vercel)
1. Import project on Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy
