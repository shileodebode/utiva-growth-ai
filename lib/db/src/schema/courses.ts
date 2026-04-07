import { pgTable, text, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  duration: text("duration").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  enrollmentCount: integer("enrollment_count").notNull().default(0),
  completionRate: numeric("completion_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0"),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
