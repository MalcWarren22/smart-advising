import { pgTable, text, integer, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentCoursesTable = pgTable("student_courses", {
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  status: text("status", { enum: ["completed", "in_progress", "not_started"] }).notNull().default("not_started"),
  grade: text("grade"),
}, (table) => [
  primaryKey({ columns: [table.studentId, table.courseId] })
]);

export const insertStudentCourseSchema = createInsertSchema(studentCoursesTable);
export type InsertStudentCourse = z.infer<typeof insertStudentCourseSchema>;
export type StudentCourse = typeof studentCoursesTable.$inferSelect;
