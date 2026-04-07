import { Router, type IRouter } from "express";
import { desc, count, sql } from "drizzle-orm";
import { db, leadsTable, enrollmentsTable, workflowsTable, activityTable } from "@workspace/db";
import {
  GetAnalyticsSummaryResponse,
  GetConversionFunnelResponse,
  GetEnrollmentTrendResponse,
  ListActivityQueryParams,
  ListActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const [leadCount] = await db.select({ count: count() }).from(leadsTable);
  const [enrollmentCount] = await db.select({ count: count() }).from(enrollmentsTable);
  const [activeWorkflows] = await db
    .select({ count: count() })
    .from(workflowsTable)
    .where(sql`is_active = true`);

  const [workflowRunsThis] = await db
    .select({ total: sql<number>`sum(runs_this_week)` })
    .from(workflowsTable);

  const revenueResult = await db
    .select({ total: sql<number>`sum(amount_paid)` })
    .from(enrollmentsTable);

  const monthlyRevResult = await db
    .select({ total: sql<number>`sum(amount_paid)` })
    .from(enrollmentsTable)
    .where(sql`enrolled_at >= date_trunc('month', now())`);

  const weekLeadsResult = await db
    .select({ count: count() })
    .from(leadsTable)
    .where(sql`created_at >= now() - interval '7 days'`);

  const weekEnrollmentsResult = await db
    .select({ count: count() })
    .from(enrollmentsTable)
    .where(sql`enrolled_at >= now() - interval '7 days'`);

  const avgScoreResult = await db
    .select({ avg: sql<number>`avg(ai_score)` })
    .from(leadsTable);

  const topCourseResult = await db
    .select({ course: enrollmentsTable.course, count: count() })
    .from(enrollmentsTable)
    .groupBy(enrollmentsTable.course)
    .orderBy(desc(count()))
    .limit(1);

  const totalLeads = leadCount.count;
  const totalEnrollments = enrollmentCount.count;
  const conversionRate = totalLeads > 0 ? (totalEnrollments / totalLeads) * 100 : 0;

  const summary = {
    totalLeads,
    newLeadsThisWeek: weekLeadsResult[0]?.count ?? 0,
    totalEnrollments,
    enrollmentsThisWeek: weekEnrollmentsResult[0]?.count ?? 0,
    conversionRate: parseFloat(conversionRate.toFixed(1)),
    totalRevenue: parseFloat(String(revenueResult[0]?.total ?? 0)),
    revenueThisMonth: parseFloat(String(monthlyRevResult[0]?.total ?? 0)),
    activeWorkflows: activeWorkflows.count,
    workflowRunsThisWeek: Number(workflowRunsThis[0]?.total ?? 0),
    avgAiLeadScore: parseFloat(String(avgScoreResult[0]?.avg ?? 0).slice(0, 5)),
    topPerformingCourse: topCourseResult[0]?.course ?? "Data Analysis",
  };

  res.json(GetAnalyticsSummaryResponse.parse(summary));
});

router.get("/analytics/conversion-funnel", async (_req, res): Promise<void> => {
  const statuses = ["new", "contacted", "qualified", "enrolled"];
  const [total] = await db.select({ count: count() }).from(leadsTable);
  const totalCount = total.count || 1;

  const funnel = await Promise.all(
    statuses.map(async (status) => {
      const [row] = await db
        .select({ count: count() })
        .from(leadsTable)
        .where(sql`status = ${status}`);
      return {
        stage: status.charAt(0).toUpperCase() + status.slice(1),
        count: row.count,
        percentage: parseFloat(((row.count / totalCount) * 100).toFixed(1)),
      };
    })
  );

  res.json(GetConversionFunnelResponse.parse(funnel));
});

router.get("/analytics/enrollment-trend", async (_req, res): Promise<void> => {
  const trend = [];
  for (let i = 7; i >= 0; i--) {
    const weekLabel = i === 0 ? "This week" : `${i}w ago`;
    const [enroll] = await db
      .select({ count: count(), revenue: sql<number>`coalesce(sum(amount_paid), 0)` })
      .from(enrollmentsTable)
      .where(sql`enrolled_at >= now() - interval '${sql.raw(String(i + 1))} weeks' and enrolled_at < now() - interval '${sql.raw(String(i))} weeks'`);

    const [leads] = await db
      .select({ count: count() })
      .from(leadsTable)
      .where(sql`created_at >= now() - interval '${sql.raw(String(i + 1))} weeks' and created_at < now() - interval '${sql.raw(String(i))} weeks'`);

    trend.push({
      week: weekLabel,
      enrollments: enroll?.count ?? 0,
      leads: leads?.count ?? 0,
      revenue: parseFloat(String(enroll?.revenue ?? 0)),
    });
  }

  res.json(GetEnrollmentTrendResponse.parse(trend));
});

router.get("/activity", async (req, res): Promise<void> => {
  const params = ListActivityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const items = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.timestamp))
    .limit(params.data.limit ?? 20);

  const cleaned = items.map(item => ({
    ...item,
    workflowName: item.workflowName ?? undefined,
    affectedEntity: item.affectedEntity ?? undefined,
  }));

  res.json(ListActivityResponse.parse(cleaned));
});

export default router;
