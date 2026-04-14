"""
Run this once to create all tables and load demo data.
Usage: python seed.py
"""
import os
import sys
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(__file__))

from database import engine, Base
import models


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as db:
        # Skip if already seeded
        if db.query(models.User).first():
            print("Database already seeded. Skipping.")
            return

        print("Seeding users...")
        advisor = models.User(
            username="advisor1",
            password="advisor123",
            role="advisor",
            name="Dr. Abdulgader Musbah",
        )
        u_jlee = models.User(username="jlee", password="student123", role="student", name="Jayson Lee")
        u_mwarren = models.User(username="mwarren", password="student123", role="student", name="Malcolm Warren")
        u_ashavers = models.User(username="ashavers", password="student123", role="student", name="Arriel Shavers")
        db.add_all([advisor, u_jlee, u_mwarren, u_ashavers])
        db.flush()

        print("Seeding students...")
        s_jlee = models.Student(user_id=u_jlee.id, advisor_id=advisor.id, year=2, gpa=3.4, credits_completed=30, credits_total=120)
        s_mwarren = models.Student(user_id=u_mwarren.id, advisor_id=advisor.id, year=3, gpa=2.9, credits_completed=61, credits_total=120)
        s_ashavers = models.Student(user_id=u_ashavers.id, advisor_id=advisor.id, year=2, gpa=3.7, credits_completed=28, credits_total=120)
        db.add_all([s_jlee, s_mwarren, s_ashavers])
        db.flush()

        print("Seeding courses...")
        courses_data = [
            # Year 1
            ("SEM101", "Spartan Seminar 101", 1, 1, "general_ed", "fall", [], "Introduction to university life and resources"),
            ("SEM102", "Spartan Seminar 102", 1, 1, "general_ed", "spring", ["SEM101"], "Continued orientation and professional development"),
            ("CSC101", "Introduction to the Computer Science Profession", 1, 1, "core", "fall", [], "Overview of the CS field and career paths"),
            ("CSC170", "Computer Programming I", 3, 1, "core", "fall", [], "Fundamentals of programming using Python"),
            ("CSC170L", "Computer Programming Laboratory I", 1, 1, "core", "fall", ["CSC170"], "Laboratory component for CSC 170"),
            ("MTH153", "College Algebra & Trigonometry", 3, 1, "general_ed", "fall", [], "Algebraic and trigonometric concepts"),
            ("ENG101", "College English I", 3, 1, "general_ed", "fall", [], "Composition and rhetoric fundamentals"),
            ("PED100", "Fundamentals of Fitness for Life", 1, 1, "general_ed", "both", [], "Physical fitness and wellness"),
            ("CSC260", "Computer Programming II", 3, 1, "core", "spring", ["CSC170"], "Object-oriented programming concepts"),
            ("CSC260L", "Computer Programming II Laboratory", 1, 1, "core", "spring", ["CSC170L"], "Laboratory component for CSC 260"),
            ("MTH184", "Calculus I", 4, 1, "general_ed", "spring", ["MTH153"], "Differential calculus"),
            ("ENG102", "College English II", 3, 1, "general_ed", "spring", ["ENG101"], "Advanced composition and research writing"),
            ("HED100", "Personal and Community Health", 2, 1, "general_ed", "both", [], "Health principles and wellness"),
            # Year 2
            ("SEM201", "Spartan Seminar 201", 1, 2, "general_ed", "fall", [], "Professional development seminar"),
            ("CSC372", "Data Structures", 3, 2, "core", "fall", ["CSC260"], "Arrays, linked lists, trees, and algorithms"),
            ("MTH251", "Calculus II", 4, 2, "general_ed", "spring", ["MTH184"], "Integral calculus"),
            ("MTH371", "Discrete Mathematical Structures", 4, 2, "core", "spring", ["MTH153"], "Logic, sets, graphs, and combinatorics"),
            ("CSC268", "Computer Organization", 3, 2, "core", "fall", ["CSC170"], "Computer hardware architecture and assembly"),
            ("CSC295", "Java Applications Programming", 3, 2, "core", "spring", ["CSC260"], "Java programming and application development"),
            ("CSC361", "Survey of Programming Languages", 3, 2, "core", "spring", ["CSC260"], "Comparative study of programming languages"),
            ("ENG303", "Professional & Technical Writing", 3, 2, "general_ed", "both", ["ENG102"], "Technical writing for STEM fields"),
            ("ENG285", "Public Speaking", 3, 2, "general_ed", "both", [], "Oral communication and presentation skills"),
            # Year 3 — Core
            ("CSC292", "Unix and C Programming", 3, 3, "core", "fall", ["CSC260"], "Unix environment and C language programming"),
            ("CSC380", "Software Engineering", 3, 3, "core", "fall", ["CSC372"], "Software development life cycle and methodologies"),
            ("CSC468", "Computer Architecture", 3, 3, "core", "both", ["CSC268"], "Advanced computer organization and design"),
            ("MTH351", "Probability & Statistics I", 3, 3, "core", "both", ["MTH251"], "Probability theory and statistical methods"),
            ("CSC430", "Data Communications", 3, 3, "core", "fall", ["CSC268"], "Network protocols and data transmission"),
            ("CSC275", "Fundamentals of Cybersecurity", 3, 3, "core", "spring", ["CSC260"], "Introduction to cybersecurity principles"),
            # Year 3 — Electives
            ("CSC312", "Topics in Information Technology", 3, 3, "elective", "both", ["CSC260"], "Current topics in IT"),
            ("CSC313", "Network Administration", 3, 3, "elective", "both", ["CSC430"], "Network setup and administration"),
            ("CSC314", "Advanced Internet Programming", 3, 3, "elective", "both", ["CSC295"], "Web development and internet technologies"),
            ("CSC316", "Introduction to Cloud Computing", 3, 3, "elective", "both", ["CSC430"], "Cloud platforms and services"),
            ("CSC360", "Interface Design", 3, 3, "elective", "both", ["CSC260"], "UI/UX design principles"),
            ("CSC373", "Algorithms Design and Analysis", 3, 3, "elective", "both", ["CSC372", "MTH371"], "Algorithm complexity and design"),
            ("CSC395", "Mobile App Development Using Android", 3, 3, "elective", "both", ["CSC295"], "Android application development"),
            # Year 4 — Core
            ("CSC498", "Computer Science Seminar I", 2, 4, "core", "fall", ["CSC380"], "Senior capstone seminar part one"),
            ("CSC464", "Operating Systems", 3, 4, "core", "both", ["CSC292", "CSC468"], "Operating system design and implementation"),
            ("CSC499", "Computer Science Seminar II", 2, 4, "core", "spring", ["CSC498"], "Senior capstone seminar part two"),
            # Year 4 — Electives
            ("CSC420", "Database Principles and Design", 3, 4, "elective", "both", ["CSC372"], "Relational database design and SQL"),
            ("CSC422", "Database Implementation", 3, 4, "elective", "both", ["CSC420"], "Advanced database management systems"),
            ("CSC435", "Computer Security I", 3, 4, "elective", "both", ["CSC275"], "Computer and network security"),
            ("CSC470", "Artificial Intelligence", 3, 4, "elective", "both", ["CSC373"], "AI algorithms and applications"),
            ("CSC485", "Software Quality Assurance and Testing", 3, 4, "elective", "both", ["CSC380"], "Software testing methods"),
            ("CSC486", "Software Project Management", 3, 4, "elective", "both", ["CSC380"], "Managing software projects"),
        ]

        course_objs = []
        for code, name, credits, year, category, semester_offered, prerequisites, description in courses_data:
            c = models.Course(
                code=code, name=name, credits=credits, year=year,
                category=category, semester_offered=semester_offered,
                prerequisites=prerequisites, description=description,
            )
            db.add(c)
            course_objs.append(c)
        db.flush()

        # Build code -> id map
        code_to_id = {c.code: c.id for c in course_objs}

        print("Seeding student course progress...")

        # Jayson Lee (student 1, jlee) — Year 2, completed Year 1 + some Year 2
        jlee_courses = [
            ("SEM101", "completed", "A"), ("SEM102", "completed", "A"),
            ("CSC101", "completed", "A"), ("CSC170", "completed", "B+"),
            ("CSC170L", "completed", "A"), ("MTH153", "completed", "B"),
            ("ENG101", "completed", "A"), ("PED100", "completed", "A"),
            ("CSC260", "completed", "B+"), ("CSC260L", "completed", "B+"),
            ("MTH184", "completed", "B"), ("ENG102", "completed", "A-"),
            ("HED100", "completed", "A"), ("SEM201", "completed", "A"),
            ("CSC372", "in_progress", None), ("CSC268", "in_progress", None),
        ]
        for code, status, grade in jlee_courses:
            db.add(models.StudentCourse(student_id=s_jlee.id, course_id=code_to_id[code], status=status, grade=grade))

        # Malcolm Warren (student 2, mwarren) — Year 3, further along
        mwarren_courses = [
            ("SEM101", "completed", "B"), ("SEM102", "completed", "B+"),
            ("CSC101", "completed", "A"), ("CSC170", "completed", "B"),
            ("CSC170L", "completed", "B"), ("MTH153", "completed", "C+"),
            ("ENG101", "completed", "B+"), ("PED100", "completed", "A"),
            ("CSC260", "completed", "B"), ("CSC260L", "completed", "B"),
            ("MTH184", "completed", "C"), ("ENG102", "completed", "B"),
            ("HED100", "completed", "A"), ("SEM201", "completed", "B"),
            ("CSC372", "completed", "B+"), ("MTH251", "completed", "C+"),
            ("MTH371", "completed", "B"), ("CSC268", "completed", "B+"),
            ("CSC295", "completed", "B"), ("CSC361", "completed", "C"),
            ("ENG285", "in_progress", None), ("CSC292", "in_progress", None),
        ]
        for code, status, grade in mwarren_courses:
            db.add(models.StudentCourse(student_id=s_mwarren.id, course_id=code_to_id[code], status=status, grade=grade))

        # Arriel Shavers (student 3, ashavers) — Year 2, high GPA
        ashavers_courses = [
            ("SEM101", "completed", "A"), ("SEM102", "completed", "A"),
            ("CSC101", "completed", "A"), ("CSC170", "completed", "A"),
            ("CSC170L", "completed", "A"), ("MTH153", "completed", "A"),
            ("ENG101", "completed", "A"), ("PED100", "completed", "A"),
            ("CSC260", "completed", "A-"), ("CSC260L", "completed", "A-"),
            ("MTH184", "completed", "A"), ("ENG102", "completed", "A"),
            ("HED100", "completed", "A"), ("SEM201", "in_progress", None),
            ("CSC372", "in_progress", None),
        ]
        for code, status, grade in ashavers_courses:
            db.add(models.StudentCourse(student_id=s_ashavers.id, course_id=code_to_id[code], status=status, grade=grade))

        db.commit()
        print("Done! Database seeded successfully.")
        print("\nDemo accounts:")
        print("  Advisor: advisor1 / advisor123")
        print("  Student: jlee / student123")
        print("  Student: mwarren / student123")
        print("  Student: ashavers / student123")


if __name__ == "__main__":
    seed()
