from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from deps import get_current_user

router = APIRouter(tags=["courses"])


class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    credits: int
    year: int
    category: str
    semesterOffered: str
    prerequisites: list[str]
    description: Optional[str] = None


class CurriculumResponse(BaseModel):
    id: int
    code: str
    name: str
    totalCredits: int


@router.get("/courses", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(models.Course).order_by(models.Course.year, models.Course.id).all()
    return [
        CourseResponse(
            id=c.id,
            code=c.code,
            name=c.name,
            credits=c.credits,
            year=c.year,
            category=c.category,
            semesterOffered=c.semester_offered,
            prerequisites=c.prerequisites or [],
            description=c.description,
        )
        for c in courses
    ]


@router.get("/curricula", response_model=list[CurriculumResponse])
def list_curricula(db: Session = Depends(get_db)):
    curricula = db.query(models.Curriculum).order_by(models.Curriculum.id).all()
    return [
        CurriculumResponse(
            id=c.id,
            code=c.code,
            name=c.name,
            totalCredits=c.total_credits,
        )
        for c in curricula
    ]


@router.get("/curricula/{curriculum_id}/courses", response_model=list[CourseResponse])
def list_curriculum_courses(curriculum_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Course, models.CurriculumCourse).join(
        models.CurriculumCourse,
        models.Course.id == models.CurriculumCourse.course_id,
    ).filter(
        models.CurriculumCourse.curriculum_id == curriculum_id
    ).order_by(models.CurriculumCourse.year, models.Course.id).all()

    seen = set()
    result = []
    for c, cc in rows:
        if c.id not in seen:
            seen.add(c.id)
            result.append(CourseResponse(
                id=c.id,
                code=c.code,
                name=c.name,
                credits=c.credits,
                year=cc.year,
                category=c.category,
                semesterOffered=c.semester_offered,
                prerequisites=c.prerequisites or [],
                description=c.description,
            ))
    return result
