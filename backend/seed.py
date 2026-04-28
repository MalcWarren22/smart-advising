"""
Run this once to create all tables and load demo data.
Usage: python seed.py
"""
import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(__file__))

from database import engine, Base
import models


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    # Run migrations for columns that may not exist yet
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS curriculum_id INTEGER"))
        conn.commit()

    with Session(engine) as db:
        # ---------------------------------------------------------------------------
        # Curricula
        # ---------------------------------------------------------------------------
        cs_general = db.query(models.Curriculum).filter_by(code="cs_general").first()
        cybersecurity = db.query(models.Curriculum).filter_by(code="cybersecurity").first()

        if not cs_general:
            cs_general = models.Curriculum(
                code="cs_general",
                name="CS General",
                total_credits=120,
            )
            db.add(cs_general)

        if not cybersecurity:
            cybersecurity = models.Curriculum(
                code="cybersecurity",
                name="Cybersecurity Track",
                total_credits=125,
            )
            db.add(cybersecurity)

        db.flush()

        # ---------------------------------------------------------------------------
        # Courses shared between both curricula (already in original seed)
        # ---------------------------------------------------------------------------
        shared_courses_data = [
            # Year 1
            ("SEM101", "Spartan Seminar 101", 1, "general_ed", "fall", [], "Introduction to university life and resources"),
            ("SEM102", "Spartan Seminar 102", 1, "general_ed", "spring", ["SEM101"], "Continued orientation and professional development"),
            ("CSC101", "Introduction to the Computer Science Profession", 1, "core", "fall", [], "Overview of the CS field and career paths"),
            ("CSC170", "Computer Programming I", 3, "core", "fall", [], "Fundamentals of programming using Python"),
            ("CSC170L", "Computer Programming Laboratory I", 1, "core", "fall", ["CSC170"], "Laboratory component for CSC 170"),
            ("MTH153", "College Algebra & Trigonometry", 3, "general_ed", "fall", [], "Algebraic and trigonometric concepts"),
            ("ENG101", "College English I", 3, "general_ed", "fall", [], "Composition and rhetoric fundamentals"),
            ("PED100", "Fundamentals of Fitness for Life", 1, "general_ed", "both", [], "Physical fitness and wellness"),
            ("CSC260", "Computer Programming II", 3, "core", "spring", ["CSC170"], "Object-oriented programming concepts"),
            ("CSC260L", "Computer Programming II Laboratory", 1, "core", "spring", ["CSC170L"], "Laboratory component for CSC 260"),
            ("MTH184", "Calculus I", 4, "general_ed", "spring", ["MTH153"], "Differential calculus"),
            ("ENG102", "College English II", 3, "general_ed", "spring", ["ENG101"], "Advanced composition and research writing"),
            ("HED100", "Personal and Community Health", 2, "general_ed", "both", [], "Health principles and wellness"),
            # Year 2
            ("SEM201", "Spartan Seminar 201", 1, "general_ed", "fall", [], "Professional development seminar"),
            ("CSC372", "Data Structures", 3, "core", "fall", ["CSC260"], "Arrays, linked lists, trees, and algorithms"),
            ("MTH251", "Calculus II", 4, "general_ed", "spring", ["MTH184"], "Integral calculus"),
            ("MTH371", "Discrete Mathematical Structures", 4, "core", "spring", ["MTH153"], "Logic, sets, graphs, and combinatorics"),
            ("CSC268", "Computer Organization", 3, "core", "fall", ["CSC170"], "Computer hardware architecture and assembly"),
            ("CSC295", "Java Applications Programming", 3, "core", "spring", ["CSC260"], "Java programming and application development"),
            ("CSC275", "Fundamentals of Cybersecurity", 3, "core", "spring", ["CSC260"], "Introduction to cybersecurity principles"),
            ("ENG303", "Professional & Technical Writing", 3, "general_ed", "both", ["ENG102"], "Technical writing for STEM fields"),
            ("ENG285", "Public Speaking", 3, "general_ed", "both", [], "Oral communication and presentation skills"),
            # Year 3
            ("CSC292", "Unix and C Programming", 3, "core", "fall", ["CSC260"], "Unix environment and C language programming"),
            ("CSC380", "Software Engineering", 3, "core", "fall", ["CSC372"], "Software development life cycle and methodologies"),
            ("CSC468", "Computer Architecture", 3, "core", "both", ["CSC268"], "Advanced computer organization and design"),
            ("MTH351", "Probability & Statistics I", 3, "core", "both", ["MTH251"], "Probability theory and statistical methods"),
            ("CSC430", "Data Communications", 3, "core", "fall", ["CSC268"], "Network protocols and data transmission"),
            ("CSC361", "Survey of Programming Languages", 3, "core", "spring", ["CSC260"], "Comparative study of programming languages"),
            ("CSC420", "Database Principles and Design", 3, "elective", "both", ["CSC372"], "Relational database design and SQL"),
            ("CSC435", "Computer Security I", 3, "elective", "both", ["CSC275"], "Computer and network security"),
            # Year 4
            ("CSC498", "Computer Science Seminar I", 2, "core", "fall", ["CSC380"], "Senior capstone seminar part one"),
            ("CSC464", "Operating Systems", 3, "core", "both", ["CSC292", "CSC468"], "Operating system design and implementation"),
            ("CSC499", "Computer Science Seminar II", 2, "core", "spring", ["CSC498"], "Senior capstone seminar part two"),
            ("CSC313", "Network Administration", 3, "elective", "both", ["CSC430"], "Network setup and administration"),
            # CS General-only electives
            ("CSC312", "Topics in Information Technology", 3, "elective", "both", ["CSC260"], "Current topics in IT"),
            ("CSC314", "Advanced Internet Programming", 3, "elective", "both", ["CSC295"], "Web development and internet technologies"),
            ("CSC316", "Introduction to Cloud Computing", 3, "elective", "both", ["CSC430"], "Cloud platforms and services"),
            ("CSC360", "Interface Design", 3, "elective", "both", ["CSC260"], "UI/UX design principles"),
            ("CSC373", "Algorithms Design and Analysis", 3, "elective", "both", ["CSC372", "MTH371"], "Algorithm complexity and design"),
            ("CSC395", "Mobile App Development Using Android", 3, "elective", "both", ["CSC295"], "Android application development"),
            ("CSC422", "Database Implementation", 3, "elective", "both", ["CSC420"], "Advanced database management systems"),
            ("CSC470", "Artificial Intelligence", 3, "elective", "both", ["CSC373"], "AI algorithms and applications"),
            ("CSC485", "Software Quality Assurance and Testing", 3, "elective", "both", ["CSC380"], "Software testing methods"),
            ("CSC486", "Software Project Management", 3, "elective", "both", ["CSC380"], "Managing software projects"),
        ]

        # Cybersecurity-only new courses
        cyber_only_courses_data = [
            # Year 1 — Social Science Elective options
            ("HIS101", "History of Civilization", 3, "general_ed", "both", [], "Survey of world civilizations from ancient to modern"),
            ("HIS103", "United States History Since 1865", 3, "general_ed", "both", [], "American history from Reconstruction to present"),
            ("BUS175", "Introduction to Business & Entrepreneurship", 3, "general_ed", "both", [], "Fundamentals of business and entrepreneurship"),
            ("ECN200", "Basic Principles of Economics", 3, "general_ed", "both", [], "Introduction to micro and macroeconomic principles"),
            ("SOC101", "Introduction to the Social Sciences", 3, "general_ed", "both", [], "Survey of social science disciplines"),
            # Year 2 — Lab Science Elective options
            ("PHY152", "General Physics", 3, "general_ed", "both", [], "Principles of mechanics, heat, and light"),
            ("PHY152L", "General Physics Laboratory I", 1, "general_ed", "both", ["PHY152"], "Laboratory for General Physics"),
            ("CHM221", "General Chemistry I", 3, "general_ed", "both", [], "Principles of chemistry: atomic structure and bonding"),
            ("CHM221L", "General Chemistry I Laboratory", 1, "general_ed", "both", ["CHM221"], "Laboratory for General Chemistry I"),
            ("BIO110", "General Biology", 3, "general_ed", "both", [], "Introduction to cell biology and life processes"),
            ("BIO110L", "General Biology Laboratory", 1, "general_ed", "both", ["BIO110"], "Laboratory for General Biology"),
            # Year 3
            ("CSC449", "Cryptography and Network Security", 3, "core", "both", ["CSC275"], "Cryptographic algorithms and network security protocols"),
            ("ENG207", "Introduction to World Literature", 3, "general_ed", "both", [], "Survey of major works of world literature"),
            ("FIA201", "Basic Art Appreciation", 3, "general_ed", "both", [], "Survey of visual arts across cultures"),
            ("MUS301", "Music Appreciation", 3, "general_ed", "both", [], "History and appreciation of music"),
            # Year 4
            ("CSC445", "Computer Network Defense", 3, "core", "both", ["CSC430", "CSC275"], "Techniques for protecting computer networks from attack"),
            ("CSC494", "Digital Forensics", 3, "core", "both", ["CSC275"], "Investigation of digital crimes and evidence collection"),
            ("HIS335", "African-American History", 3, "general_ed", "both", [], "Survey of African-American history from slavery to civil rights"),
            ("HIS336", "African-American History Since 1865", 3, "general_ed", "both", [], "African-American history from Reconstruction to present"),
            ("HIS371", "Modern African History & Cultures 1600–PRESENT", 3, "general_ed", "both", [], "African history and cultures from 1600 to present"),
            ("HRP320", "African American Health", 3, "general_ed", "both", [], "Health disparities and wellness in the African-American community"),
            ("ENG383", "African-American Literature, 1940–PRESENT", 3, "general_ed", "both", [], "Major works of African-American literature from 1940 to present"),
            ("MUS234", "African-American Music", 3, "general_ed", "both", [], "History and cultural significance of African-American music"),
        ]

        # Upsert all courses (insert if not exists)
        all_course_data = [
            (code, name, credits, cat, sem, prereqs, desc)
            for code, name, credits, cat, sem, prereqs, desc in shared_courses_data
        ] + [
            (code, name, credits, cat, sem, prereqs, desc)
            for code, name, credits, cat, sem, prereqs, desc in cyber_only_courses_data
        ]

        for code, name, credits, category, semester_offered, prerequisites, description in all_course_data:
            existing = db.query(models.Course).filter_by(code=code).first()
            if not existing:
                db.add(models.Course(
                    code=code, name=name, credits=credits,
                    year=1,  # default; overridden per-curriculum in curriculum_courses
                    category=category, semester_offered=semester_offered,
                    prerequisites=prerequisites, description=description,
                ))

        db.flush()

        # Build code -> course object map
        all_courses = db.query(models.Course).all()
        code_to_course = {c.code: c for c in all_courses}

        # ---------------------------------------------------------------------------
        # CS General curriculum — course-to-year mapping
        # ---------------------------------------------------------------------------
        cs_general_course_years = [
            # Year 1
            ("SEM101", 1), ("SEM102", 1), ("CSC101", 1), ("CSC170", 1), ("CSC170L", 1),
            ("MTH153", 1), ("ENG101", 1), ("PED100", 1), ("CSC260", 1), ("CSC260L", 1),
            ("MTH184", 1), ("ENG102", 1), ("HED100", 1),
            # Year 2
            ("SEM201", 2), ("CSC372", 2), ("MTH251", 2), ("MTH371", 2), ("CSC268", 2),
            ("CSC295", 2), ("ENG303", 2), ("ENG285", 2),
            # Year 3
            ("CSC292", 3), ("CSC380", 3), ("CSC468", 3), ("MTH351", 3), ("CSC430", 3),
            ("CSC275", 3), ("CSC361", 3),
            # Year 3 Electives
            ("CSC312", 3), ("CSC313", 3), ("CSC314", 3), ("CSC316", 3), ("CSC360", 3),
            ("CSC373", 3), ("CSC395", 3),
            # Year 4
            ("CSC498", 4), ("CSC464", 4), ("CSC499", 4),
            # Year 4 Electives
            ("CSC420", 4), ("CSC422", 4), ("CSC435", 4), ("CSC470", 4),
            ("CSC485", 4), ("CSC486", 4),
        ]

        for code, year in cs_general_course_years:
            course = code_to_course.get(code)
            if not course:
                continue
            existing_cc = db.query(models.CurriculumCourse).filter_by(
                curriculum_id=cs_general.id, course_id=course.id
            ).first()
            if not existing_cc:
                db.add(models.CurriculumCourse(
                    curriculum_id=cs_general.id,
                    course_id=course.id,
                    year=year,
                ))

        # ---------------------------------------------------------------------------
        # Cybersecurity curriculum — course-to-year mapping
        # ---------------------------------------------------------------------------
        cybersecurity_course_years = [
            # Year 1 — core
            ("SEM101", 1), ("SEM102", 1), ("CSC101", 1), ("CSC170", 1), ("CSC170L", 1),
            ("ENG101", 1), ("MTH153", 1), ("PED100", 1), ("CSC260", 1), ("CSC260L", 1),
            ("MTH184", 1), ("ENG102", 1), ("HED100", 1),
            # Year 1 — Social Science Elective options
            ("HIS101", 1), ("HIS103", 1), ("BUS175", 1), ("ECN200", 1), ("SOC101", 1),
            # Year 2
            ("SEM102", 2),  # listed again for year 2 placement
            ("CSC372", 2), ("MTH251", 2), ("MTH371", 2), ("CSC268", 2),
            ("CSC295", 2), ("CSC275", 2), ("ENG303", 2), ("ENG285", 2),
            # Year 2 — Lab Science Elective options
            ("PHY152", 2), ("PHY152L", 2), ("CHM221", 2), ("CHM221L", 2),
            ("BIO110", 2), ("BIO110L", 2),
            # Year 3
            ("CSC292", 3), ("CSC380", 3), ("CSC430", 3), ("MTH351", 3),
            ("CSC449", 3), ("CSC420", 3), ("CSC361", 3), ("CSC435", 3),
            # Year 3 — Science elective options (same as year 2 options)
            ("PHY152", 3), ("CHM221", 3), ("BIO110", 3),
            # Year 3 — Humanities Elective options
            ("ENG207", 3), ("FIA201", 3), ("MUS301", 3),
            # Year 4
            ("CSC445", 4), ("CSC498", 4), ("CSC464", 4), ("CSC468", 4),
            ("CSC499", 4), ("CSC494", 4), ("CSC313", 4),
            # Year 4 — Social Science Cultural Elective options
            ("HIS335", 4), ("HIS336", 4), ("HIS371", 4), ("HRP320", 4),
            # Year 4 — Humanities Cultural Elective options
            ("ENG383", 4), ("MUS234", 4),
        ]

        # Use a set to avoid duplicate (curriculum_id, course_id) pairs
        seen_cyber_pairs = set()
        for code, year in cybersecurity_course_years:
            course = code_to_course.get(code)
            if not course:
                continue
            pair = (cybersecurity.id, course.id)
            if pair in seen_cyber_pairs:
                continue
            seen_cyber_pairs.add(pair)
            existing_cc = db.query(models.CurriculumCourse).filter_by(
                curriculum_id=cybersecurity.id, course_id=course.id
            ).first()
            if not existing_cc:
                db.add(models.CurriculumCourse(
                    curriculum_id=cybersecurity.id,
                    course_id=course.id,
                    year=year,
                ))

        db.flush()

        # ---------------------------------------------------------------------------
        # Users & Students (skip if already seeded)
        # ---------------------------------------------------------------------------
        if db.query(models.User).first():
            # Still assign curriculum_id to existing students if not set
            students = db.query(models.Student).all()
            for s in students:
                if s.curriculum_id is None:
                    s.curriculum_id = cs_general.id
            db.commit()
            print("Users already seeded. Curricula and courses updated.")
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
        u_kthomas = models.User(username="kthomas", password="student123", role="student", name="Kezia Thomas")
        db.add_all([advisor, u_jlee, u_mwarren, u_ashavers, u_kthomas])
        db.flush()

        print("Seeding students...")
        s_jlee = models.Student(
            user_id=u_jlee.id, advisor_id=advisor.id, curriculum_id=cs_general.id,
            year=2, gpa=3.4, credits_completed=30, credits_total=120,
        )
        s_mwarren = models.Student(
            user_id=u_mwarren.id, advisor_id=advisor.id, curriculum_id=cs_general.id,
            year=3, gpa=2.9, credits_completed=61, credits_total=120,
        )
        s_ashavers = models.Student(
            user_id=u_ashavers.id, advisor_id=advisor.id, curriculum_id=cs_general.id,
            year=2, gpa=3.7, credits_completed=28, credits_total=120,
        )
        s_kthomas = models.Student(
            user_id=u_kthomas.id, advisor_id=advisor.id, curriculum_id=cybersecurity.id,
            year=1, gpa=3.8, credits_completed=0, credits_total=125,
        )
        db.add_all([s_jlee, s_mwarren, s_ashavers, s_kthomas])
        db.flush()

        print("Seeding student course progress...")

        # Jayson Lee — Year 2, completed Year 1 + some Year 2
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
            course = code_to_course.get(code)
            if course:
                db.add(models.StudentCourse(
                    student_id=s_jlee.id, course_id=course.id,
                    status=status, grade=grade,
                ))

        # Malcolm Warren — Year 3, further along
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
            course = code_to_course.get(code)
            if course:
                db.add(models.StudentCourse(
                    student_id=s_mwarren.id, course_id=course.id,
                    status=status, grade=grade,
                ))

        # Arriel Shavers — Year 2, high GPA
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
            course = code_to_course.get(code)
            if course:
                db.add(models.StudentCourse(
                    student_id=s_ashavers.id, course_id=course.id,
                    status=status, grade=grade,
                ))

        db.commit()
        print("Done! Database seeded successfully.")
        print("\nDemo accounts:")
        print("  Advisor: advisor1 / advisor123")
        print("  Student: jlee / student123 (CS General)")
        print("  Student: mwarren / student123 (CS General)")
        print("  Student: ashavers / student123 (CS General)")
        print("  Student: kthomas / student123 (Cybersecurity Track)")


if __name__ == "__main__":
    seed()
