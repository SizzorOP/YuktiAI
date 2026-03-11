"""
Calendar Events API Router — CRUD operations for court dates, deadlines, and reminders.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models import CalendarEvent, Case, Notification
from schemas import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse

router = APIRouter(prefix="/api/calendar/events", tags=["Calendar"])


@router.post("", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(payload: CalendarEventCreate, db: Session = Depends(get_db)):
    """Create a new calendar event, optionally linked to a case."""
    # Verify case exists (if provided)
    if payload.case_id:
        case = db.query(Case).filter(Case.id == payload.case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Linked case not found.")

    event = CalendarEvent(**payload.model_dump())
    db.add(event)
    
    # Generate Notification
    notification = Notification(
        title="New Calendar Event",
        message=f"Event '{payload.title}' was scheduled for {payload.event_date.strftime('%Y-%m-%d %H:%M')}.",
        type="info",
        link="/calendar"
    )
    db.add(notification)
    
    db.commit()
    db.refresh(event)
    return _to_event_response(event)


@router.get("", response_model=list[CalendarEventResponse])
def list_events(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    event_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List calendar events with optional date-range and type filters."""
    query = db.query(CalendarEvent).order_by(CalendarEvent.event_date.asc())

    if start_date:
        query = query.filter(CalendarEvent.event_date >= start_date)
    if end_date:
        query = query.filter(CalendarEvent.event_date <= end_date)
    if event_type:
        query = query.filter(CalendarEvent.event_type == event_type)

    events = query.all()
    return [_to_event_response(e) for e in events]


@router.put("/{event_id}", response_model=CalendarEventResponse)
def update_event(event_id: str, payload: CalendarEventUpdate, db: Session = Depends(get_db)):
    """Update a calendar event."""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    # Verify new case_id if provided
    update_data = payload.model_dump(exclude_unset=True)
    if "case_id" in update_data and update_data["case_id"]:
        case = db.query(Case).filter(Case.id == update_data["case_id"]).first()
        if not case:
            raise HTTPException(status_code=404, detail="Linked case not found.")

    for field, value in update_data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return _to_event_response(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: str, db: Session = Depends(get_db)):
    """Delete a calendar event."""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    db.delete(event)
    db.commit()


# ─── Helpers ──────────────────────────────────────────────────

def _to_event_response(event: CalendarEvent) -> CalendarEventResponse:
    return CalendarEventResponse(
        id=event.id,
        case_id=event.case_id,
        case_title=event.case.title if event.case else None,
        title=event.title,
        event_type=event.event_type,
        event_date=event.event_date,
        category=event.category,
        meeting_link=event.meeting_link,
        description=event.description,
        location=event.location,
        is_reminder_sent=event.is_reminder_sent,
        created_at=event.created_at,
    )
