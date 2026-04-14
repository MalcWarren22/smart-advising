import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().unique(),
  semesters: jsonb("semesters").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const advisorNotesTable = pgTable("advisor_notes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  advisorId: integer("advisor_id").notNull(),
  advisorName: text("advisor_name").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;

export const insertAdvisorNoteSchema = createInsertSchema(advisorNotesTable).omit({ id: true, createdAt: true });
export type InsertAdvisorNote = z.infer<typeof insertAdvisorNoteSchema>;
export type AdvisorNote = typeof advisorNotesTable.$inferSelect;
