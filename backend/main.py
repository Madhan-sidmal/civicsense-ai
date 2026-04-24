import os
import json
import math
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uvicorn
from typing import Optional, List
from datetime import datetime
import jwt

from pipeline import run_gemini_pipeline
from database import engine, get_db, Base
from models import Report, User
from auth import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM

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

# Utility: Haversine distance in meters
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000 # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Authentication Schemas
class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Report Schemas
class ReportResponse(BaseModel):
    id: int
    user_id: Optional[int]
    labels: list[str]
    severity: str
    priority: str
    authority: str
    explanation: str
    image_url: str
    upvotes: int

class DBReportResponse(BaseModel):
    id: int
    user_id: Optional[int]
    image_path: str
    latitude: Optional[float]
    longitude: Optional[float]
    timestamp: datetime
    labels: str
    severity: str
    priority: str
    authority: str
    explanation: str
    upvotes: int

def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[int]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None

@app.get("/")
def read_root():
    return {"status": "ALL SYSTEMS OPERATIONAL (with Auth & Database)"}

@app.post("/api/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/report", response_model=ReportResponse)
async def create_report(
    image: UploadFile = File(...),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    user_id = get_current_user_id(authorization)
    
    print(f"Received report by User {user_id} with image: {image.filename}, Location: {latitude}, {longitude}")
    
    # Save Image
    image_bytes = await image.read()
    file_path = f"uploads/{datetime.now().strftime('%Y%m%d%H%M%S')}_{image.filename}"
    with open(file_path, "wb") as f:
        f.write(image_bytes)
        
    mime_type = image.content_type or "image/jpeg"
    
    # Run AI pipeline
    result = run_gemini_pipeline(image_bytes, mime_type)
    
    req_lat = float(latitude) if latitude and latitude != "null" else None
    req_lng = float(longitude) if longitude and longitude != "null" else None
    parsed_authority = result.get("authority", "Unknown")

    # CLUSTERING LOGIC: Check for duplicates within 50 meters
    if req_lat is not None and req_lng is not None:
        recent_reports = db.query(Report).order_by(Report.timestamp.desc()).limit(100).all()
        for r in recent_reports:
            if r.latitude is not None and r.longitude is not None:
                dist = haversine_distance(req_lat, req_lng, r.latitude, r.longitude)
                if dist <= 50.0 and r.authority == parsed_authority:
                    # Pile Up!
                    print(f"CLUSTERED: Matched existing report {r.id} at distance {dist:.2f}m")
                    r.upvotes = (r.upvotes or 1) + 1
                    db.commit()
                    db.refresh(r)
                    
                    return {
                        "id": r.id,
                        "user_id": r.user_id,
                        "labels": json.loads(r.labels) if isinstance(r.labels, str) else r.labels,
                        "severity": r.severity,
                        "priority": r.priority,
                        "authority": r.authority,
                        "explanation": r.explanation,
                        "image_url": f"/{r.image_path}",
                        "upvotes": r.upvotes
                    }

    # Save to Database
    db_report = Report(
        user_id=user_id,
        image_path=file_path,
        latitude=req_lat,
        longitude=req_lng,
        labels=json.dumps(result.get("labels", [])),
        severity=result.get("severity", "MEDIUM"),
        priority=result.get("priority", "NORMAL"),
        authority=parsed_authority,
        explanation=result.get("explanation", ""),
        upvotes=1
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return {
        "id": db_report.id,
        "user_id": db_report.user_id,
        "labels": result.get("labels", []),
        "severity": result.get("severity", "MEDIUM"),
        "priority": result.get("priority", "NORMAL"),
        "authority": result.get("authority", "Unknown"),
        "explanation": result.get("explanation", ""),
        "image_url": f"/{file_path}",
        "upvotes": db_report.upvotes
    }

@app.get("/api/reports", response_model=List[DBReportResponse])
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.timestamp.desc()).all()
    # Default to 1 if null for backwards compatibility
    for r in reports:
        if r.upvotes is None:
            r.upvotes = 1
    return reports

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
