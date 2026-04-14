from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from deps import get_current_user, require_advisor, require_student_access

router = APIRouter(prefix="/students", tags=["students"])


class StudentResponse(BaseModel):
    id: int
    name: str
    username: str
    year: int
    gpa: float
    creditsCompleted: int
    creditsTotal: int
    planApproved: bool
    planApprovedAt: Optional[str] = None
    advisorId: Optional[int] = None


def student_to_response(student: models.Student, user: models.User) -> StudentResponse:
    return StudentResponse(
        id=student.id,
        name=user.name,
        username=user.username,
        year=student.year,
        gpa=student.gpa,
        creditsCompleted=student.credits_completed,
        creditsTotal=student.credits_total,
        planApproved=student.plan_approved,
        planApprovedAt=student.plan_approved_at.isoformat() if student.plan_approved_at else None,
        advisorId=student.advisor_id,
    )


@router.get("/", response_model=list[StudentResponse])
def list_students(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    require_advisor(current_user)

    rows = db.query(models.Student, models.User).join(
        models.User, models.Student.user_id == models.User.id
    ).filter(models.Student.advisor_id == current_user.id).all()

    return [student_to_response(s, u) for s, u in rows]


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    student = require_student_access(current_user, student_id, db)

    user = db.query(models.User).filter(models.User.id == student.user_id).first()
    return student_to_response(student, user)
