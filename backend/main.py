import os
import json
from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uvicorn
from typing import Optional, List
from datetime import datetime

from pipeline import run_gemini_pipeline
from database import engine, get_db, Base
from models import Report

# Create tables and upload directory
Base.metadata.create_all(bind=engine)
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="CivicSense AI Backend")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReportResponse(BaseModel):
    id: int
    labels: list[str]
    severity: str
    priority: str
    authority: str
    explanation: str
    image_url: str

class DBReportResponse(BaseModel):
    id: int
    image_path: str
    latitude: Optional[float]
    longitude: Optional[float]
    timestamp: datetime
    labels: str
    severity: str
    priority: str
    authority: str
    explanation: str

@app.get("/")
def read_root():
    return {"status": "ALL SYSTEMS OPERATIONAL (with Database)"}

@app.post("/api/report", response_model=ReportResponse)
async def create_report(
    image: UploadFile = File(...),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    print(f"Received report with image: {image.filename}, Location: {latitude}, {longitude}")
    
    # Save Image
    image_bytes = await image.read()
    file_path = f"uploads/{datetime.now().strftime('%Y%m%d%H%M%S')}_{image.filename}"
    with open(file_path, "wb") as f:
        f.write(image_bytes)
        
    mime_type = image.content_type or "image/jpeg"
    
    # Run AI pipeline
    result = run_gemini_pipeline(image_bytes, mime_type)
    
    # Save to Database
    db_report = Report(
        image_path=file_path,
        latitude=float(latitude) if latitude and latitude != "null" else None,
        longitude=float(longitude) if longitude and longitude != "null" else None,
        labels=json.dumps(result.get("labels", [])),
        severity=result.get("severity", "MEDIUM"),
        priority=result.get("priority", "NORMAL"),
        authority=result.get("authority", "Unknown"),
        explanation=result.get("explanation", "")
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return {
        "id": db_report.id,
        "labels": result.get("labels", []),
        "severity": result.get("severity", "MEDIUM"),
        "priority": result.get("priority", "NORMAL"),
        "authority": result.get("authority", "Unknown"),
        "explanation": result.get("explanation", ""),
        "image_url": f"/{file_path}"
    }

@app.get("/api/reports", response_model=List[DBReportResponse])
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.timestamp.desc()).all()
    return reports

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
