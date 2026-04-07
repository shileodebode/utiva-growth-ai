import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const enrollmentsTable = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id"),
  studentName: text("student_name").notNull(),
  email: text("email").notNull(),
  course: text("course").notNull(),
  cohort: text("cohort").notNull(),
  status: text("status").notNull().default("active"),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  completionRate: integer("completion_rate").notNull().default(0),
  aiEngagementScore: integer("ai_engagement_score").notNull().default(0),
});

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({ id: true, enrolledAt: true });
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
