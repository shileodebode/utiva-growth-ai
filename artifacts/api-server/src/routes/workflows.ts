import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, workflowsTable, activityTable } from "@workspace/db";
import {
  ListWorkflowsResponse,
  CreateWorkflowBody,
  ToggleWorkflowParams,
  ToggleWorkflowResponse,
  RunWorkflowParams,
  RunWorkflowResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const AI_MESSAGES: Record<string, string[]> = {
  lead_followup: [
    "Hi {name}! I noticed you showed interest in our {course} program. At Utiva, we have helped over 5,000 professionals transition into tech careers. Would you like to schedule a free 15-minute career consultation?",
    "Hello {name}, your journey into tech starts here. Our {course} cohort begins soon — limited seats available. Reply YES to get your personalized learning roadmap.",
  ],
  enrollment_reminder: [
    "Hi {name}, your {course} cohort kicks off in 3 days! Log in to access your pre-class resources and meet your cohort mates. Questions? Reply to this message.",
    "Reminder: Your Utiva {course} class starts Monday. Your instructor has shared a welcome note — check your portal!",
  ],
  re_engagement: [
    "Hey {name}, we miss you! Your {course} journey is not over. Pick up where you left off — your cohort is rooting for you. Log in today and reclaim your momentum.",
  ],
  content_push: [
    "NEW: Utiva's {course} program just added a module on real-world projects. Alumni are landing jobs at top companies. Don't miss the next cohort!",
  ],
  lead_scoring: [
    "AI Lead Scoring complete. 47 leads re-scored. 12 leads upgraded to HIGH priority based on engagement signals. Recommended: immediate follow-up sequence.",
  ],
  drop_alert: [
    "Alert: 3 students in {course} cohort show disengagement signals (>5 days inactive, quiz submissions dropped). Automated re-engagement emails sent.",
  ],
};

function getAiMessage(type: string): string {
  const messages = AI_MESSAGES[type] ?? ["Workflow executed successfully."];
  return messages[Math.floor(Math.random() * messages.length)];
}

router.get("/workflows", async (_req, res): Promise<void> => {
  const workflows = await db.select().from(workflowsTable).orderBy(workflowsTable.id);
  res.json(ListWorkflowsResponse.parse(workflows.map(w => ({
    ...w,
    successRate: Number(w.successRate),
  }))));
});

router.post("/workflows", async (req, res): Promise<void> => {
  const parsed = CreateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workflow] = await db.insert(workflowsTable).values(parsed.data).returning();
  res.status(201).json({ ...workflow, successRate: Number(workflow.successRate) });
});

router.post("/workflows/:id/toggle", async (req, res): Promise<void> => {
  const params = ToggleWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const [workflow] = await db
    .update(workflowsTable)
    .set({ isActive: !existing.isActive })
    .where(eq(workflowsTable.id, params.data.id))
    .returning();

  res.json(ToggleWorkflowResponse.parse({ ...workflow, successRate: Number(workflow.successRate) }));
});

router.post("/workflows/:id/run", async (req, res): Promise<void> => {
  const params = RunWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, params.data.id));
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const affectedCount = Math.floor(Math.random() * 20) + 3;
  const aiGeneratedMessage = getAiMessage(workflow.type);

  await db
    .update(workflowsTable)
    .set({
      runsTotal: (workflow.runsTotal ?? 0) + 1,
      runsThisWeek: (workflow.runsThisWeek ?? 0) + 1,
      lastRunAt: new Date(),
      successRate: String(Math.min(100, Number(workflow.successRate) + Math.random() * 2).toFixed(2)),
    })
    .where(eq(workflowsTable.id, params.data.id));

  await db.insert(activityTable).values({
    type: "workflow_run",
    description: `Workflow "${workflow.name}" ran and affected ${affectedCount} contacts`,
    workflowName: workflow.name,
    affectedEntity: `${affectedCount} contacts`,
  });

  logger.info({ workflowId: params.data.id, affectedCount }, "Workflow run triggered");

  res.json(RunWorkflowResponse.parse({
    workflowId: params.data.id,
    affectedCount,
    status: "success",
    message: `Workflow executed successfully. ${affectedCount} contacts affected.`,
    aiGeneratedMessage,
  }));
});

export default router;
