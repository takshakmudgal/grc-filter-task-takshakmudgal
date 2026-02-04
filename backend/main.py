from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sqlite3
from typing import Optional
from contextlib import contextmanager

app = FastAPI(title="GRC Risk Assessment API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "risks.db"


def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS risks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset TEXT NOT NULL,
                threat TEXT NOT NULL,
                likelihood INTEGER NOT NULL,
                impact INTEGER NOT NULL,
                score INTEGER NOT NULL,
                level TEXT NOT NULL
            )
        """)
        conn.commit()


init_db()


@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def calculate_level(score: int) -> str:
    if score <= 5:
        return "Low"
    elif score <= 12:
        return "Medium"
    elif score <= 18:
        return "High"
    else:
        return "Critical"


class RiskInput(BaseModel):
    asset: str = Field(..., min_length=1)
    threat: str = Field(..., min_length=1)
    likelihood: int = Field(..., ge=1, le=5)
    impact: int = Field(..., ge=1, le=5)


class RiskOutput(BaseModel):
    id: int
    asset: str
    threat: str
    likelihood: int
    impact: int
    score: int
    level: str


@app.post("/assess-risk", response_model=RiskOutput)
def assess_risk(risk: RiskInput):
    score = risk.likelihood * risk.impact
    level = calculate_level(score)

    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO risks (asset, threat, likelihood, impact, score, level)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (risk.asset, risk.threat, risk.likelihood, risk.impact, score, level)
        )
        conn.commit()
        risk_id = cursor.lastrowid

    return RiskOutput(
        id=risk_id,
        asset=risk.asset,
        threat=risk.threat,
        likelihood=risk.likelihood,
        impact=risk.impact,
        score=score,
        level=level
    )


@app.get("/risks", response_model=list[RiskOutput])
def get_risks(level: Optional[str] = Query(None)):
    with get_db() as conn:
        if level:
            rows = conn.execute(
                "SELECT * FROM risks WHERE level = ?", (level,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM risks").fetchall()

    return [
        RiskOutput(
            id=row["id"],
            asset=row["asset"],
            threat=row["threat"],
            likelihood=row["likelihood"],
            impact=row["impact"],
            score=row["score"],
            level=row["level"]
        )
        for row in rows
    ]
