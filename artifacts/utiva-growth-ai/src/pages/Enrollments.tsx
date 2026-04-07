import { useListEnrollments, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  dropped: "bg-red-100 text-red-700",
};

function EngagementBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-14">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}>{score}</span>
    </div>
  );
}

export default function Enrollments() {
  const { data: enrollments, isLoading } = useListEnrollments({}, { query: { queryKey: getListEnrollmentsQueryKey({}) } });

  const fmtNaira = (n: number) => `₦${Number(n).toLocaleString()}`;

  return (
    <div className="flex flex-col h-full">
      <Header title="Enrollments" subtitle="Active, completed, and at-risk students" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Cohort</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Amount Paid</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Completion</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">AI Engagement</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : (enrollments ?? []).map((en) => (
                <tr key={en.id} className={cn("border-b border-border last:border-0 hover:bg-muted/30 transition-colors", en.aiEngagementScore < 55 && "bg-red-50/30")}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{en.studentName}</div>
                    <div className="text-xs text-muted-foreground">{en.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">{en.course}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{en.cohort}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", STATUS_COLORS[en.status] ?? "bg-gray-100 text-gray-700")}>
                      {en.status.charAt(0).toUpperCase() + en.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{fmtNaira(en.amountPaid)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-14">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${en.completionRate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{en.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 w-28">
                    <EngagementBar score={en.aiEngagementScore} />
                    {en.aiEngagementScore < 55 && (
                      <p className="text-[10px] text-red-500 mt-0.5 font-medium">At risk</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {enrollments?.length === 0 && !isLoading && (
            <div className="py-12 text-center text-muted-foreground text-sm">No enrollments found</div>
          )}
        </div>
      </div>
    </div>
  );
}
