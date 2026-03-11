"""
Cases API Router — CRUD operations for case management.
"""
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Case
from schemas import CaseCreate, CaseUpdate, CaseResponse, CaseDetailResponse

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    """Create a new case."""
    new_case = Case(**payload.model_dump())
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return _to_case_response(new_case)


@router.get("", response_model=list[CaseResponse])
def list_cases(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all cases, optionally filtered by status."""
    query = db.query(Case).options(
        joinedload(Case.documents),
        joinedload(Case.calendar_events)
    ).order_by(Case.updated_at.desc())
    if status_filter:
        query = query.filter(Case.status == status_filter)
    cases = query.all()
    return [_to_case_response(c) for c in cases]


@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    """Get full case details including documents and calendar events."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return _to_case_detail_response(case)


@router.put("/{case_id}", response_model=CaseResponse)
def update_case(case_id: str, payload: CaseUpdate, db: Session = Depends(get_db)):
    """Update case metadata."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)

    db.commit()
    db.refresh(case)
    return _to_case_response(case)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(case_id: str, db: Session = Depends(get_db)):
    """Delete a case and all associated documents and events."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    # Also remove uploaded files from disk
    uploads_dir = os.path.join("uploads", case_id)
    if os.path.isdir(uploads_dir):
        import shutil
        shutil.rmtree(uploads_dir)

    db.delete(case)
    db.commit()


# ─── Helpers ──────────────────────────────────────────────────

def _to_case_response(case: Case) -> CaseResponse:
    return CaseResponse(
        id=case.id,
        title=case.title,
        case_number=case.case_number,
        client_name=case.client_name,
        court=case.court,
        status=case.status,
        description=case.description,
        created_at=case.created_at,
        updated_at=case.updated_at,
        document_count=len(case.documents),
        event_count=len(case.calendar_events),
    )


def _to_case_detail_response(case: Case) -> CaseDetailResponse:
    return CaseDetailResponse(
        id=case.id,
        title=case.title,
        case_number=case.case_number,
        client_name=case.client_name,
        court=case.court,
        status=case.status,
        description=case.description,
        created_at=case.created_at,
        updated_at=case.updated_at,
        document_count=len(case.documents),
        event_count=len(case.calendar_events),
        documents=case.documents,
        calendar_events=case.calendar_events,
    )
