from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ARRAY, JSON, PrimaryKeyConstraint
from sqlalchemy.sql import func
from database import Base


class Curriculum(Base):
    __tablename__ = "curricula"

    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    total_credits = Column(Integer, nullable=False, default=120)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CurriculumCourse(Base):
    __tablename__ = "curriculum_courses"

    curriculum_id = Column(Integer, nullable=False)
    course_id = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    __table_args__ = (PrimaryKeyConstraint("curriculum_id", "course_id"),)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student")
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    advisor_id = Column(Integer, nullable=True)
    curriculum_id = Column(Integer, nullable=True)
    year = Column(Integer, nullable=False, default=1)
    gpa = Column(Float, nullable=False, default=0.0)
    credits_completed = Column(Integer, nullable=False, default=0)
    credits_total = Column(Integer, nullable=False, default=120)
    plan_approved = Column(Boolean, nullable=False, default=False)
    plan_approved_at = Column(DateTime(timezone=True), nullable=True)
    plan_approved_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    category = Column(String, nullable=False, default="core")
    semester_offered = Column(String, nullable=False, default="both")
    prerequisites = Column(ARRAY(Text), nullable=False, default=[])
    description = Column(Text, nullable=True)


class StudentCourse(Base):
    __tablename__ = "student_courses"

    student_id = Column(Integer, nullable=False)
    course_id = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="not_started")
    grade = Column(String, nullable=True)

    __table_args__ = (PrimaryKeyConstraint("student_id", "course_id"),)


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, nullable=False, unique=True)
    semesters = Column(JSON, nullable=False, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AdvisorNote(Base):
    __tablename__ = "advisor_notes"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, nullable=False)
    advisor_id = Column(Integer, nullable=False)
    advisor_name = Column(String, nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
