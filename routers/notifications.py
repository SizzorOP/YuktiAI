"""
Notifications API Router — CRUD operations for system notifications.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Notification
from schemas import NotificationCreate, NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    """List all notifications, ordered by newest first."""
    notifications = db.query(Notification).order_by(Notification.created_at.desc()).all()
    return notifications


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(notification_id: str, db: Session = Depends(get_db)):
    """Mark a specific notification as read."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_as_read(db: Session = Depends(get_db)):
    """Mark all unread notifications as read."""
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All unread notifications marked as read."}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(notification_id: str, db: Session = Depends(get_db)):
    """Delete a specific notification."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    
    db.delete(notification)
    db.commit()
