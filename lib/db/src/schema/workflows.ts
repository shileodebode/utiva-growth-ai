import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workflowsTable = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  triggerCondition: text("trigger_condition").notNull(),
  actionTemplate: text("action_template").notNull(),
  runsTotal: integer("runs_total").notNull().default(0),
  runsThisWeek: integer("runs_this_week").notNull().default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkflowSchema = createInsertSchema(workflowsTable).omit({ id: true, createdAt: true });
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflowsTable.$inferSelect;
