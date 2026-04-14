import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  advisorId: integer("advisor_id"),
  year: integer("year").notNull().default(1),
  gpa: real("gpa").notNull().default(0),
  creditsCompleted: integer("credits_completed").notNull().default(0),
  creditsTotal: integer("credits_total").notNull().default(120),
  planApproved: boolean("plan_approved").notNull().default(false),
  planApprovedAt: timestamp("plan_approved_at", { withTimezone: true }),
  planApprovedBy: text("plan_approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
