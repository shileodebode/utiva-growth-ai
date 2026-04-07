import { useGetAnalyticsSummary, useGetConversionFunnel, useGetEnrollmentTrend, useListActivity, getGetAnalyticsSummaryQueryKey, getGetConversionFunnelQueryKey, getGetEnrollmentTrendQueryKey, getListActivityQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, GraduationCap, DollarSign, Zap, Bot, ArrowUpRight, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";

function StatCard({ title, value, sub, icon: Icon, trend }: { title: string; value: string; sub: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const styles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    workflow_run: { bg: "bg-blue-100", text: "text-blue-600", icon: Zap },
    lead_created: { bg: "bg-green-100", text: "text-green-600", icon: Users },
    enrollment_created: { bg: "bg-purple-100", text: "text-purple-600", icon: GraduationCap },
    content_generated: { bg: "bg-amber-100", text: "text-amber-600", icon: Bot },
    lead_scored: { bg: "bg-teal-100", text: "text-teal-600", icon: TrendingUp },
  };
  const s = styles[type] ?? { bg: "bg-gray-100", text: "text-gray-600", icon: Clock };
  return (
    <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
      <s.icon className={`w-4 h-4 ${s.text}`} />
    </div>
  );
}

const FUNNEL_COLORS = ["#14b8a6", "#0ea5e9", "#8b5cf6", "#f59e0b"];

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummary({ query: { queryKey: getGetAnalyticsSummaryQueryKey() } });
  const { data: funnel } = useGetConversionFunnel({ query: { queryKey: getGetConversionFunnelQueryKey() } });
  const { data: trend } = useGetEnrollmentTrend({ query: { queryKey: getGetEnrollmentTrendQueryKey() } });
  const { data: activity } = useListActivity({}, { query: { queryKey: getListActivityQueryKey({}) } });

  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);
  const fmtNaira = (n: number) => `₦${fmt(n)}`;

  return (
    <div className="flex flex-col h-full">
      <Header title="Growth Dashboard" subtitle="Utiva growth team command center — powered by AI" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {summaryLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Leads" value={String(summary.totalLeads)} sub={`+${summary.newLeadsThisWeek} this week`} icon={Users} trend={`+${summary.newLeadsThisWeek} this week`} />
            <StatCard title="Enrollments" value={String(summary.totalEnrollments)} sub={`+${summary.enrollmentsThisWeek} this week`} icon={GraduationCap} trend={`${summary.conversionRate}% conversion`} />
            <StatCard title="Revenue" value={fmtNaira(summary.totalRevenue)} sub={`${fmtNaira(summary.revenueThisMonth)} this month`} icon={DollarSign} trend="This month" />
            <StatCard title="Workflow Runs" value={String(summary.workflowRunsThisWeek)} sub={`${summary.activeWorkflows} active workflows`} icon={Zap} trend="This week" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Conversion Funnel</h3>
                <p className="text-xs text-muted-foreground">Lead pipeline breakdown</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnel ?? []} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(funnel ?? []).map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Enrollment Trend</h3>
                <p className="text-xs text-muted-foreground">Weekly enrollments & leads</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="enrollments" stroke="#14b8a6" strokeWidth={2} dot={false} name="Enrollments" />
                <Line type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Leads" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
              <span className="text-xs text-muted-foreground">Live feed</span>
            </div>
            <div className="space-y-3">
              {(activity ?? []).slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{item.description}</p>
                    {item.workflowName && (
                      <span className="text-xs text-primary font-medium">{item.workflowName}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0 mt-0.5">{timeAgo(item.timestamp)}</span>
                </div>
              ))}
              {(!activity || activity.length === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
              )}
            </div>
          </div>

          {summary && (
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground text-sm mb-4">AI Insights</h3>
              <div className="space-y-4">
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs font-semibold text-primary mb-1">Avg AI Lead Score</p>
                  <p className="text-2xl font-bold text-foreground">{summary.avgAiLeadScore.toFixed(0)}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${summary.avgAiLeadScore}%` }} />
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Top Course</p>
                  <p className="text-sm font-bold text-foreground">{summary.topPerformingCourse}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Conversion Rate</p>
                  <p className="text-2xl font-bold text-foreground">{summary.conversionRate}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
