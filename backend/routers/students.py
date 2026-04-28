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
    curriculumId: Optional[int] = None
    curriculumName: Optional[str] = None


def student_to_response(student: models.Student, user: models.User, db: Session) -> StudentResponse:
    curriculum_name = None
    if student.curriculum_id:
        curriculum = db.query(models.Curriculum).filter(models.Curriculum.id == student.curriculum_id).first()
        if curriculum:
            curriculum_name = curriculum.name

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
        curriculumId=student.curriculum_id,
        curriculumName=curriculum_name,
    )


@router.get("/", response_model=list[StudentResponse])
def list_students(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    require_advisor(current_user)

    rows = db.query(models.Student, models.User).join(
        models.User, models.Student.user_id == models.User.id
    ).filter(models.Student.advisor_id == current_user.id).all()

    return [student_to_response(s, u, db) for s, u in rows]


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    student = require_student_access(current_user, student_id, db)

    user = db.query(models.User).filter(models.User.id == student.user_id).first()
    return student_to_response(student, user, db)


class UpdateCurriculumBody(BaseModel):
    curriculumId: int


@router.put("/{student_id}/curriculum", response_model=StudentResponse)
def update_student_curriculum(
    student_id: int,
    body: UpdateCurriculumBody,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(request, db)
    require_advisor(current_user)

    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify advisor manages this student
    if student.advisor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    curriculum = db.query(models.Curriculum).filter(models.Curriculum.id == body.curriculumId).first()
    if not curriculum:
        raise HTTPException(status_code=404, detail="Curriculum not found")

    student.curriculum_id = body.curriculumId
    student.credits_total = curriculum.total_credits
    db.commit()
    db.refresh(student)

    user = db.query(models.User).filter(models.User.id == student.user_id).first()
    return student_to_response(student, user, db)
