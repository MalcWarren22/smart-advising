from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Literal
from database import get_db
import models
from deps import get_current_user, require_student_access

router = APIRouter(prefix="/progress", tags=["progress"])


class CourseWithStatus(BaseModel):
    id: int
    code: str
    name: str
    credits: int
    year: int
    category: str
    semesterOffered: str
    prerequisites: list[str]
    status: str
    grade: Optional[str] = None
    prerequisitesMet: bool


class DegreeProgress(BaseModel):
    studentId: int
    totalCredits: int
    completedCredits: int
    inProgressCredits: int
    remainingCredits: int
    percentComplete: float
    courses: list[CourseWithStatus]


class UpdateCourseStatusBody(BaseModel):
    status: Literal["completed", "in_progress", "not_started"]
    grade: Optional[str] = None


class StudentCourseResponse(BaseModel):
    studentId: int
    courseId: int
    status: str
    grade: Optional[str] = None


def get_curriculum_courses(student: models.Student, db: Session):
    """Return courses for the student's curriculum with curriculum-specific year ordering."""
    if student.curriculum_id:
        rows = db.query(models.Course, models.CurriculumCourse).join(
            models.CurriculumCourse,
            models.Course.id == models.CurriculumCourse.course_id,
        ).filter(
            models.CurriculumCourse.curriculum_id == student.curriculum_id
        ).order_by(models.CurriculumCourse.year, models.Course.id).all()

        # Deduplicate (a course may appear in multiple years for elective flexibility)
        seen = set()
        result = []
        for c, cc in rows:
            if c.id not in seen:
                seen.add(c.id)
                result.append((c, cc.year))
        return result
    else:
        # Fallback: all courses with their default year
        courses = db.query(models.Course).order_by(models.Course.year, models.Course.id).all()
        return [(c, c.year) for c in courses]


@router.get("/{student_id}", response_model=DegreeProgress)
def get_progress(student_id: int, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    student = require_student_access(current_user, student_id, db)

    curriculum_courses = get_curriculum_courses(student, db)

    student_courses = db.query(models.StudentCourse).filter(
        models.StudentCourse.student_id == student_id
    ).all()

    status_map = {sc.course_id: sc for sc in student_courses}
    completed_codes = {
        c.code for c, _ in curriculum_courses
        if status_map.get(c.id) and status_map[c.id].status == "completed"
    }

    courses = []
    for c, year in curriculum_courses:
        sc = status_map.get(c.id)
        status = sc.status if sc else "not_started"
        prereqs_met = all(p in completed_codes for p in (c.prerequisites or []))
        courses.append(CourseWithStatus(
            id=c.id,
            code=c.code,
            name=c.name,
            credits=c.credits,
            year=year,
            category=c.category,
            semesterOffered=c.semester_offered,
            prerequisites=c.prerequisites or [],
            status=status,
            grade=sc.grade if sc else None,
            prerequisitesMet=prereqs_met,
        ))

    total = sum(c.credits for c, _ in curriculum_courses)
    completed = sum(
        c.credits for c, _ in curriculum_courses
        if status_map.get(c.id) and status_map[c.id].status == "completed"
    )
    in_progress = sum(
        c.credits for c, _ in curriculum_courses
        if status_map.get(c.id) and status_map[c.id].status == "in_progress"
    )
    remaining = total - completed - in_progress

    return DegreeProgress(
        studentId=student_id,
        totalCredits=total,
        completedCredits=completed,
        inProgressCredits=in_progress,
        remainingCredits=remaining,
        percentComplete=round((completed / total) * 100, 1) if total > 0 else 0,
        courses=courses,
    )


@router.put("/{student_id}/courses/{course_id}", response_model=StudentCourseResponse)
def update_course_status(
    student_id: int,
    course_id: int,
    body: UpdateCourseStatusBody,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(request, db)

    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can update their own course status")

    student = db.query(models.Student).filter(
        models.Student.id == student_id,
        models.Student.user_id == current_user.id,
    ).first()
    if not student:
        raise HTTPException(status_code=403, detail="Access denied")

    existing = db.query(models.StudentCourse).filter(
        models.StudentCourse.student_id == student_id,
        models.StudentCourse.course_id == course_id,
    ).first()

    if existing:
        existing.status = body.status
        existing.grade = body.grade
        db.commit()
        db.refresh(existing)
        result = existing
    else:
        new_sc = models.StudentCourse(
            student_id=student_id,
            course_id=course_id,
            status=body.status,
            grade=body.grade,
        )
        db.add(new_sc)
        db.commit()
        db.refresh(new_sc)
        result = new_sc

    # Recalculate credits_completed from this student's curriculum
    curriculum_courses = get_curriculum_courses(student, db)
    curriculum_course_ids = {c.id for c, _ in curriculum_courses}

    student_courses_completed = db.query(models.StudentCourse).filter(
        models.StudentCourse.student_id == student_id,
        models.StudentCourse.status == "completed",
    ).all()

    all_courses_map = {c.id: c for c, _ in curriculum_courses}
    completed_credits = sum(
        all_courses_map[sc.course_id].credits
        for sc in student_courses_completed
        if sc.course_id in all_courses_map
    )
    db.query(models.Student).filter(models.Student.id == student_id).update(
        {"credits_completed": completed_credits}
    )
    db.commit()

    return StudentCourseResponse(
        studentId=result.student_id,
        courseId=result.course_id,
        status=result.status,
        grade=result.grade,
    )
