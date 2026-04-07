import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, GraduationCap, Zap, FileText, BookOpen, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/enrollments", label: "Enrollments", icon: GraduationCap },
  { href: "/workflows", label: "AI Workflows", icon: Zap },
  { href: "/content", label: "Content AI", icon: FileText },
  { href: "/courses", label: "Courses", icon: BookOpen },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Utiva Growth AI</p>
            <p className="text-[11px] text-sidebar-foreground/60 leading-tight">Command Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-primary text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <p className="text-xs font-semibold text-sidebar-foreground/80 mb-1">AI Automation Active</p>
          <p className="text-[11px] text-sidebar-foreground/50">5 workflows running</p>
          <div className="mt-2 h-1.5 rounded-full bg-sidebar-border overflow-hidden">
            <div className="h-full w-4/5 rounded-full bg-sidebar-primary" />
          </div>
        </div>
      </div>
    </aside>
  );
}
