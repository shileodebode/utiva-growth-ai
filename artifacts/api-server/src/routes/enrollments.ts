import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, enrollmentsTable, activityTable } from "@workspace/db";
import {
  ListEnrollmentsQueryParams,
  ListEnrollmentsResponse,
  CreateEnrollmentBody,
  UpdateEnrollmentParams,
  UpdateEnrollmentBody,
  UpdateEnrollmentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/enrollments", async (req, res): Promise<void> => {
  const params = ListEnrollmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(enrollmentsTable).$dynamic();

  if (params.data.status) {
    query = query.where(eq(enrollmentsTable.status, params.data.status));
  }

  const enrollments = await query.orderBy(desc(enrollmentsTable.enrolledAt));
  res.json(ListEnrollmentsResponse.parse(enrollments.map(e => ({
    ...e,
    amountPaid: Number(e.amountPaid),
  }))));
});

router.post("/enrollments", async (req, res): Promise<void> => {
  const parsed = CreateEnrollmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const aiEngagementScore = Math.floor(Math.random() * 40) + 60;

  const [enrollment] = await db
    .insert(enrollmentsTable)
    .values({ ...parsed.data, aiEngagementScore })
    .returning();

  await db.insert(activityTable).values({
    type: "enrollment_created",
    description: `New enrollment: ${enrollment.studentName} enrolled in ${enrollment.course}`,
    affectedEntity: enrollment.studentName,
  });

  res.status(201).json({ ...enrollment, amountPaid: Number(enrollment.amountPaid) });
});

router.patch("/enrollments/:id", async (req, res): Promise<void> => {
  const params = UpdateEnrollmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEnrollmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [enrollment] = await db
    .update(enrollmentsTable)
    .set(parsed.data)
    .where(eq(enrollmentsTable.id, params.data.id))
    .returning();

  if (!enrollment) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }

  res.json(UpdateEnrollmentResponse.parse({ ...enrollment, amountPaid: Number(enrollment.amountPaid) }));
});

export default router;
