from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    id: int
    username: str
    role: str
    name: str
    studentId: Optional[int] = None


@router.post("/login", response_model=AuthResponse)
def login(body: LoginBody, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == body.username).first()
    if not user or user.password != body.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    student_id = None
    if user.role == "student":
        student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
        student_id = student.id if student else None

    request.session["user_id"] = user.id
    return AuthResponse(id=user.id, username=user.username, role=user.role, name=user.name, studentId=student_id)


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=AuthResponse)
def get_me(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    student_id = None
    if user.role == "student":
        student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
        student_id = student.id if student else None

    return AuthResponse(id=user.id, username=user.username, role=user.role, name=user.name, studentId=student_id)
