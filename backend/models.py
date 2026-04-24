from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    reports = relationship("Report", back_populates="owner")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Making it optional at first for backward compatibility
    owner = relationship("User", back_populates="reports")
    
    image_path = Column(String, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # AI Results
    labels = Column(String)  # We will store the list as a JSON string
    severity = Column(String, index=True)
    priority = Column(String, index=True)
    authority = Column(String, index=True)
    explanation = Column(String)
    
    # Clustering / Deduplication
    upvotes = Column(Integer, default=1)
