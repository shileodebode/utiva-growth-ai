import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, leadsTable } from "@workspace/db";
import {
  ListLeadsQueryParams,
  ListLeadsResponse,
  GetLeadParams,
  GetLeadResponse,
  CreateLeadBody,
  UpdateLeadParams,
  UpdateLeadBody,
  UpdateLeadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const AI_ACTIONS: Record<string, string> = {
  new: "Send introduction email with course brochure",
  contacted: "Follow up with a personalized WhatsApp message",
  qualified: "Schedule a 1-on-1 call to discuss enrollment options",
  enrolled: "Send onboarding resources and cohort welcome kit",
  lost: "Add to re-engagement sequence in 30 days",
};

function computeAiScore(source: string, courseInterest: string): number {
  let score = 50;
  if (source === "referral") score += 20;
  if (source === "event") score += 15;
  if (source === "social_media") score += 5;
  if (source === "paid_ad") score -= 5;
  if (courseInterest.toLowerCase().includes("data")) score += 10;
  if (courseInterest.toLowerCase().includes("cloud")) score += 8;
  return Math.max(0, Math.min(100, score + Math.floor(Math.random() * 20 - 10)));
}

router.get("/leads", async (req, res): Promise<void> => {
  const params = ListLeadsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(leadsTable).$dynamic();

  if (params.data.status) {
    query = query.where(eq(leadsTable.status, params.data.status));
  }

  const leads = await query.orderBy(desc(leadsTable.createdAt)).limit(params.data.limit ?? 50);
  res.json(ListLeadsResponse.parse(leads.map(l => ({
    ...l,
    phone: l.phone ?? undefined,
    notes: l.notes ?? undefined,
    aiSuggestedAction: l.aiSuggestedAction ?? undefined,
  }))));
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const aiScore = computeAiScore(parsed.data.source, parsed.data.courseInterest);
  const aiSuggestedAction = AI_ACTIONS["new"];

  const [lead] = await db
    .insert(leadsTable)
    .values({ ...parsed.data, aiScore, aiSuggestedAction })
    .returning();

  await db.insert((await import("@workspace/db")).activityTable).values({
    type: "lead_created",
    description: `New lead created: ${lead.name} (${lead.courseInterest})`,
    affectedEntity: lead.name,
  });

  res.status(201).json(GetLeadResponse.parse(lead));
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(GetLeadResponse.parse({
    ...lead,
    phone: lead.phone ?? undefined,
    notes: lead.notes ?? undefined,
    aiSuggestedAction: lead.aiSuggestedAction ?? undefined,
  }));
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status) {
    updateData.aiSuggestedAction = AI_ACTIONS[parsed.data.status];
  }

  const [lead] = await db
    .update(leadsTable)
    .set(updateData)
    .where(eq(leadsTable.id, params.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(UpdateLeadResponse.parse(lead));
});

export default router;
