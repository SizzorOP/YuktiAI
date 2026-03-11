"""
SQLAlchemy ORM models for YuktiAI Case Management.
Models: Case, Document, CalendarEvent.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, Integer, Float, DateTime,
    ForeignKey, Boolean, Enum as SAEnum
)
from sqlalchemy.orm import relationship

from database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    case_number = Column(String(100), nullable=True)
    client_name = Column(String(255), nullable=True)
    court = Column(String(255), nullable=True)
    status = Column(String(20), default="active")  # active | closed | pending
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="case", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Case(id={self.id}, title={self.title}, status={self.status})>"


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String(255), nullable=False)        # UUID-based stored name
    original_filename = Column(String(255), nullable=False)  # User's original filename
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)         # pdf, docx, png, etc.
    file_size = Column(Integer, nullable=True)             # bytes
    uploaded_at = Column(DateTime, default=utcnow)
    transcript = Column(Text, nullable=True)               # Generated transcript
    summary = Column(Text, nullable=True)                  # Generated summary

    # Relationships
    case = relationship("Case", back_populates="documents")

    def __repr__(self):
        return f"<Document(id={self.id}, original_filename={self.original_filename})>"


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    event_type = Column(String(20), default="hearing")  # hearing | deadline | reminder
    event_date = Column(DateTime, nullable=False)
    category = Column(String(20), default="court")      # court | non-court
    meeting_link = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    is_reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    case = relationship("Case", back_populates="calendar_events")

    def __repr__(self):
        return f"<CalendarEvent(id={self.id}, title={self.title}, event_date={self.event_date})>"

class ContractAnalysis(Base):
    __tablename__ = "contract_analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="SET NULL"), nullable=True) # Optional link to a case
    title = Column(String(255), nullable=True)
    original_text = Column(Text, nullable=False)
    status = Column(String(50), default="processing") # processing | completed | failed
    clauses = Column(Text, nullable=True) # JSON serialized list of clauses
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    case = relationship("Case")

    def __repr__(self):
        return f"<ContractAnalysis(id={self.id}, status={self.status})>"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info") # info | success | warning | error
    is_read = Column(Boolean, default=False)
    link = Column(String(500), nullable=True) # Optional link to a related entity
    created_at = Column(DateTime, default=utcnow)

    def __repr__(self):
        return f"<Notification(id={self.id}, title={self.title}, is_read={self.is_read})>"
