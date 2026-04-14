from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from database import get_db
import models
from deps import get_current_user, require_advisor, require_student_access

router = APIRouter(tags=["plans"])


class SemesterPlan(BaseModel):
    semester: str
    year: int
    courses: list[int]
    totalCredits: int


class AdvisorNoteResponse(BaseModel):
    id: int
    advisorName: str
    note: str
    createdAt: str


class CoursePlanResponse(BaseModel):
    studentId: int
    approved: bool
    approvedAt: Optional[str] = None
    approvedBy: Optional[str] = None
    semesters: list[SemesterPlan]
    advisorNotes: list[AdvisorNoteResponse]


class UpdatePlanBody(BaseModel):
    semesters: list[SemesterPlan]


class AdvisorNoteBody(BaseModel):
    note: str


class AdvisorUpdatePlanBody(BaseModel):
    semesters: list[SemesterPlan]
    note: Optional[str] = None


class CourseRecommendation(BaseModel):
    course: dict
    reason: str
    priority: str


@router.get("/plans/{student_id}", response_model=CoursePlanResponse)
def get_student_plan(student_id: int, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    student = require_student_access(current_user, student_id, db)

    plan = db.query(models.Plan).filter(models.Plan.student_id == student_id).first()
    notes = db.query(models.AdvisorNote).filter(
        models.AdvisorNote.student_id == student_id
    ).order_by(models.AdvisorNote.created_at).all()

    semesters = plan.semesters if plan else []

    return CoursePlanResponse(
        studentId=student_id,
        approved=student.plan_approved,
        approvedAt=student.plan_approved_at.isoformat() if student.plan_approved_at else None,
        approvedBy=student.plan_approved_by,
        semesters=[SemesterPlan(**s) for s in semesters],
        advisorNotes=[
            AdvisorNoteResponse(
                id=n.id,
                advisorName=n.advisor_name,
                note=n.note,
                createdAt=n.created_at.isoformat(),
            )
            for n in notes
        ],
    )


@router.put("/plans/{student_id}", response_model=CoursePlanResponse)
def update_student_plan(
    student_id: int,
    body: UpdatePlanBody,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(request, db)

    # Only the student themselves may edit their own plan
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can edit their own plan")

    student = db.query(models.Student).filter(
        models.Student.id == student_id,
        models.Student.user_id == current_user.id,
    ).first()
    if not student:
        raise HTTPException(status_code=403, detail="Access denied")

    all_courses = db.query(models.Course).all()
    course_credits = {c.id: c.credits for c in all_courses}

    semesters_data = []
    for sem in body.semesters:
        total = sum(course_credits.get(cid, 0) for cid in sem.courses)
        semesters_data.append({
            "semester": sem.semester,
            "year": sem.year,
            "courses": sem.courses,
            "totalCredits": total,
        })

    plan = db.query(models.Plan).filter(models.Plan.student_id == student_id).first()
    if plan:
        plan.semesters = semesters_data
        plan.updated_at = datetime.now(timezone.utc)
    else:
        plan = models.Plan(student_id=student_id, semesters=semesters_data)
        db.add(plan)

    db.query(models.Student).filter(models.Student.id == student_id).update({
        "plan_approved": False,
        "plan_approved_at": None,
    })
    db.commit()

    notes = db.query(models.AdvisorNote).filter(
        models.AdvisorNote.student_id == student_id
    ).all()

    return CoursePlanResponse(
        studentId=student_id,
        approved=False,
        approvedAt=None,
        approvedBy=None,
        semesters=[SemesterPlan(**s) for s in semesters_data],
        advisorNotes=[
            AdvisorNoteResponse(id=n.id, advisorName=n.advisor_name, note=n.note, createdAt=n.created_at.isoformat())
            for n in notes
        ],
    )


@router.get("/recommendations/{student_id}", response_model=list[CourseRecommendation])
def get_recommendations(student_id: int, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    require_student_access(current_user, student_id, db)

    all_courses = db.query(models.Course).order_by(models.Course.year, models.Course.id).all()
    student_courses = db.query(models.StudentCourse).filter(
        models.StudentCourse.student_id == student_id
    ).all()

    completed_ids = {sc.course_id for sc in student_courses if sc.status == "completed"}
    in_progress_ids = {sc.course_id for sc in student_courses if sc.status == "in_progress"}
    completed_codes = {c.code for c in all_courses if c.id in completed_ids}

    recommendations = []
    for course in all_courses:
        if course.id in completed_ids or course.id in in_progress_ids:
            continue
        prereqs = course.prerequisites or []
        if not all(p in completed_codes for p in prereqs):
            continue

        if course.category == "core":
            priority = "high"
            reason = "Required core course — all prerequisites met"
        elif course.category == "elective":
            priority = "medium"
            reason = "Major elective — counts toward your 15 required elective credits"
        else:
            priority = "low"
            reason = "General education or graduation requirement"

        recommendations.append(CourseRecommendation(
            course={
                "id": course.id,
                "code": course.code,
                "name": course.name,
                "credits": course.credits,
                "year": course.year,
                "category": course.category,
                "semesterOffered": course.semester_offered,
                "prerequisites": course.prerequisites or [],
                "description": course.description,
            },
            reason=reason,
            priority=priority,
        ))

        if len(recommendations) >= 8:
            break

    recommendations.sort(key=lambda r: {"high": 0, "medium": 1, "low": 2}[r.priority])
    return recommendations


@router.put("/advisor/students/{student_id}/plan", response_model=CoursePlanResponse)
def advisor_update_student_plan(
    student_id: int,
    body: AdvisorUpdatePlanBody,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(request, db)
    require_advisor(current_user)
    student = require_student_access(current_user, student_id, db)

    all_courses = db.query(models.Course).all()
    course_credits = {c.id: c.credits for c in all_courses}

    semesters_data = []
    for sem in body.semesters:
        total = sum(course_credits.get(cid, 0) for cid in sem.courses)
        semesters_data.append({
            "semester": sem.semester,
            "year": sem.year,
            "courses": sem.courses,
            "totalCredits": total,
        })

    plan = db.query(models.Plan).filter(models.Plan.student_id == student_id).first()
    if plan:
        plan.semesters = semesters_data
        plan.updated_at = datetime.now(timezone.utc)
    else:
        plan = models.Plan(student_id=student_id, semesters=semesters_data)
        db.add(plan)

    db.query(models.Student).filter(models.Student.id == student_id).update({
        "plan_approved": False,
        "plan_approved_at": None,
    })

    if body.note:
        note = models.AdvisorNote(
            student_id=student_id,
            advisor_id=current_user.id,
            advisor_name=current_user.name,
            note=body.note,
        )
        db.add(note)

    db.commit()

    notes = db.query(models.AdvisorNote).filter(
        models.AdvisorNote.student_id == student_id
    ).order_by(models.AdvisorNote.created_at).all()

    return CoursePlanResponse(
        studentId=student_id,
        approved=False,
        approvedAt=None,
        approvedBy=None,
        semesters=[SemesterPlan(**s) for s in semesters_data],
        advisorNotes=[
            AdvisorNoteResponse(id=n.id, advisorName=n.advisor_name, note=n.note, createdAt=n.created_at.isoformat())
            for n in notes
        ],
    )


@router.post("/advisor/students/{student_id}/approve")
def approve_plan(
    student_id: int,
    body: AdvisorNoteBody,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(request, db)
    require_advisor(current_user)
    require_student_access(current_user, student_id, db)

    db.query(models.Student).filter(models.Student.id == student_id).update({
        "plan_approved": True,
        "plan_approved_at": datetime.now(timezone.utc),
        "plan_approved_by": current_user.name,
    })

    if body.note:
        note = models.AdvisorNote(
            student_id=student_id,
            advisor_id=current_user.id,
            advisor_name=current_user.name,
            note=body.note,
        )
        db.add(note)

    db.commit()
    return {"message": "Plan approved successfully"}


@router.post("/advisor/students/{student_id}/notes", response_model=AdvisorNoteResponse)
def add_advisor_note(
    student_id: int,
    body: AdvisorNoteBody,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(request, db)
    require_advisor(current_user)
    require_student_access(current_user, student_id, db)

    note = models.AdvisorNote(
        student_id=student_id,
        advisor_id=current_user.id,
        advisor_name=current_user.name,
        note=body.note,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return AdvisorNoteResponse(
        id=note.id,
        advisorName=note.advisor_name,
        note=note.note,
        createdAt=note.created_at.isoformat(),
    )
