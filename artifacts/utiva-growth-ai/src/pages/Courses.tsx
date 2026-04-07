import { useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import { Header } from "@/components/layout/Header";
import { Star } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Data: "bg-blue-100 text-blue-700",
  Product: "bg-purple-100 text-purple-700",
  Security: "bg-red-100 text-red-700",
  Cloud: "bg-sky-100 text-sky-700",
  Design: "bg-pink-100 text-pink-700",
  Marketing: "bg-amber-100 text-amber-700",
};

export default function Courses() {
  const { data: courses, isLoading } = useListCourses({ query: { queryKey: getListCoursesQueryKey() } });

  return (
    <div className="flex flex-col h-full">
      <Header title="Courses" subtitle="Utiva tech training catalog" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Enrollments</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Completion Rate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Rating</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : (courses ?? []).map((course) => (
                <tr key={course.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{course.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[course.category] ?? "bg-gray-100 text-gray-700"}`}>
                      {course.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{course.duration}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    ₦{Number(course.price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{course.enrollmentCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${course.completionRate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{Number(course.completionRate).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-foreground">{Number(course.rating).toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
