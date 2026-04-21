from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # AI Results
    labels = Column(String)  # We will store the list as a comma-separated string or JSON string
    severity = Column(String, index=True)
    priority = Column(String, index=True)
    authority = Column(String, index=True)
    explanation = Column(String)
