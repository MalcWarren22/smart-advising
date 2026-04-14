from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from database import get_db
import models
from deps import get_current_user, require_advisor, require_student_access

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/student/{student_id}")
def get_student_dashboard(student_id: int, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    student = require_student_access(current_user, student_id, db)

    user = db.query(models.User).filter(models.User.id == student.user_id).first()
    all_courses = db.query(models.Course).all()
    student_courses = db.query(models.StudentCourse).filter(
        models.StudentCourse.student_id == student_id
    ).all()

    status_map = {sc.course_id: sc for sc in student_courses}
    completed_codes = {
        c.code for c in all_courses
        if status_map.get(c.id) and status_map[c.id].status == "completed"
    }

    total_credits = sum(c.credits for c in all_courses)
    completed_credits = sum(
        c.credits for c in all_courses
        if status_map.get(c.id) and status_map[c.id].status == "completed"
    )
    percent_complete = round((completed_credits / total_credits) * 100, 1) if total_credits > 0 else 0
    remaining_credits = total_credits - completed_credits

    current_courses = [
        {
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "credits": c.credits,
            "year": c.year,
            "category": c.category,
            "semesterOffered": c.semester_offered,
            "prerequisites": c.prerequisites or [],
            "status": "in_progress",
            "grade": None,
            "prerequisitesMet": all(p in completed_codes for p in (c.prerequisites or [])),
        }
        for c in all_courses
        if status_map.get(c.id) and status_map[c.id].status == "in_progress"
    ]

    upcoming_deadlines = [
        {"title": "Registration Deadline — Fall 2026", "date": "2026-04-15", "type": "registration"},
        {"title": "Advising Appointment Window", "date": "2026-04-10", "type": "advising"},
        {"title": "Last Day to Drop a Course", "date": "2026-04-20", "type": "other"},
        {"title": "Final Exams Begin", "date": "2026-05-01", "type": "exam"},
    ]

    gpa_history = [
        {"semester": "Fall 2023", "gpa": round(max(student.gpa - 0.3, 0.0), 2)},
        {"semester": "Spring 2024", "gpa": round(max(student.gpa - 0.1, 0.0), 2)},
        {"semester": "Fall 2024", "gpa": round(max(student.gpa - 0.05, 0.0), 2)},
        {"semester": "Spring 2025", "gpa": student.gpa},
    ]

    return {
        "student": {
            "id": student.id,
            "name": user.name,
            "username": user.username,
            "year": student.year,
            "gpa": student.gpa,
            "creditsCompleted": student.credits_completed,
            "creditsTotal": student.credits_total,
            "planApproved": student.plan_approved,
            "planApprovedAt": student.plan_approved_at.isoformat() if student.plan_approved_at else None,
            "advisorId": student.advisor_id,
        },
        "percentComplete": percent_complete,
        "completedCredits": completed_credits,
        "remainingCredits": remaining_credits,
        "currentSemesterCourses": current_courses,
        "upcomingDeadlines": upcoming_deadlines,
        "gpaHistory": gpa_history,
    }


@router.get("/advisor")
def get_advisor_dashboard(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    require_advisor(current_user)

    # Only students assigned to this advisor
    assigned_rows = db.query(models.Student, models.User).join(
        models.User, models.Student.user_id == models.User.id
    ).filter(models.Student.advisor_id == current_user.id).all()

    all_courses = db.query(models.Course).all()
    total_credits = sum(c.credits for c in all_courses)

    student_progress = []
    for student, user in assigned_rows:
        percent = round((student.credits_completed / total_credits) * 100, 1) if total_credits > 0 else 0
        at_risk = student.gpa < 2.0 or percent < 20
        student_progress.append({
            "id": student.id,
            "name": user.name,
            "year": student.year,
            "percentComplete": percent,
            "gpa": student.gpa,
            "planApproved": student.plan_approved,
            "atRisk": at_risk,
        })

    students_on_track = sum(1 for s in student_progress if not s["atRisk"])
    students_at_risk = sum(1 for s in student_progress if s["atRisk"])
    pending_approvals = sum(1 for s, _ in assigned_rows if not s.plan_approved)

    names = [u.name for _, u in assigned_rows]
    now = datetime.now(timezone.utc)
    recent_activity = [
        {"studentName": names[0] if names else "Student", "action": "Updated course plan for Fall 2026", "timestamp": (now - timedelta(hours=2)).isoformat()},
        {"studentName": names[1] if len(names) > 1 else "Student", "action": "Marked CSC 372 as completed", "timestamp": (now - timedelta(hours=5)).isoformat()},
        {"studentName": names[0] if names else "Student", "action": "Requested advising appointment", "timestamp": (now - timedelta(hours=24)).isoformat()},
    ]

    return {
        "totalStudents": len(assigned_rows),
        "studentsOnTrack": students_on_track,
        "studentsAtRisk": students_at_risk,
        "pendingApprovals": pending_approvals,
        "recentActivity": recent_activity,
        "studentProgress": student_progress,
    }
