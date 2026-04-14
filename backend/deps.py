from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
import models


def get_current_user(request: Request, db: Session) -> models.User:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_advisor(current_user: models.User) -> models.User:
    if current_user.role != "advisor":
        raise HTTPException(status_code=403, detail="Advisor access required")
    return current_user


def require_student_access(
    current_user: models.User,
    student_id: int,
    db: Session,
) -> models.Student:
    """
    Fetch student and enforce access rules:
    - Students may only access their own record.
    - Advisors may only access students assigned to them (advisor_id == current_user.id).
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "student":
        if student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "advisor":
        if student.advisor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return student
