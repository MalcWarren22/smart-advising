import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  year: integer("year").notNull(),
  category: text("category", { enum: ["core", "elective", "general_ed", "other"] }).notNull().default("core"),
  semesterOffered: text("semester_offered", { enum: ["fall", "spring", "both"] }).notNull().default("both"),
  prerequisites: text("prerequisites").array().notNull().default([]),
  description: text("description"),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
