"""
Pydantic schemas for request/response validation.
Covers Cases, Documents, and Calendar Events.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Case Schemas ─────────────────────────────────────────────

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    case_number: Optional[str] = None
    client_name: Optional[str] = None
    court: Optional[str] = None
    status: str = Field(default="active", pattern="^(active|closed|pending)$")
    description: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    case_number: Optional[str] = None
    client_name: Optional[str] = None
    court: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|closed|pending)$")
    description: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    case_id: Optional[str] = None
    filename: str
    original_filename: str
    file_type: Optional[str]
    file_size: Optional[int]
    uploaded_at: datetime
    transcript: Optional[str] = None
    summary: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentUpdate(BaseModel):
    case_id: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None


class CalendarEventBrief(BaseModel):
    id: str
    title: str
    event_type: str
    event_date: datetime
    category: str
    meeting_link: Optional[str] = None

    class Config:
        from_attributes = True


class CaseResponse(BaseModel):
    id: str
    title: str
    case_number: Optional[str]
    client_name: Optional[str]
    court: Optional[str]
    status: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    document_count: int = 0
    event_count: int = 0

    class Config:
        from_attributes = True


class CaseDetailResponse(CaseResponse):
    documents: List[DocumentResponse] = []
    calendar_events: List[CalendarEventBrief] = []


# ─── Calendar Event Schemas ───────────────────────────────────

class CalendarEventCreate(BaseModel):
    case_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    event_type: str = Field(default="hearing", pattern="^(hearing|deadline|reminder)$")
    event_date: datetime
    category: str = Field(default="court", pattern="^(court|non-court)$")
    meeting_link: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None


class CalendarEventUpdate(BaseModel):
    case_id: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    event_type: Optional[str] = Field(None, pattern="^(hearing|deadline|reminder)$")
    event_date: Optional[datetime] = None
    category: Optional[str] = Field(None, pattern="^(court|non-court)$")
    meeting_link: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None


class CalendarEventResponse(BaseModel):
    id: str
    case_id: Optional[str]
    case_title: Optional[str] = None
    title: str
    event_type: str
    event_date: datetime
    category: str
    meeting_link: Optional[str]
    description: Optional[str]
    location: Optional[str]
    is_reminder_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Notification Schemas ─────────────────────────────────────

class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str
    type: str = Field(default="info", pattern="^(info|success|warning|error)$")
    link: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
