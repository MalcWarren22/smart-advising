from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models

router = APIRouter(prefix="/courses", tags=["courses"])


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


@router.get("/", response_model=list[CourseResponse])
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
