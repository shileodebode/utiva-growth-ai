import { useState } from "react";
import { useListLeads, useCreateLead, useUpdateLead, getListLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Plus, Bot, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-purple-100 text-purple-700",
  enrolled: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  referral: "Referral",
  social_media: "Social Media",
  event: "Event",
  paid_ad: "Paid Ad",
  organic: "Organic",
};

function AiScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-red-600"}`}>{score}</span>
    </div>
  );
}

const COURSES = [
  "Data Analysis with Excel & Power BI",
  "Data Science & Machine Learning",
  "Product Management Bootcamp",
  "Cybersecurity Fundamentals",
  "Cloud Computing (AWS)",
  "UI/UX Design",
  "Business Intelligence & SQL",
  "Digital Marketing Analytics",
];

export default function Leads() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", courseInterest: COURSES[0], source: "website", notes: "" });

  const params = statusFilter ? { status: statusFilter as "new" | "contacted" | "qualified" | "enrolled" | "lost" } : {};
  const { data: leads, isLoading } = useListLeads(params, { query: { queryKey: getListLeadsQueryKey(params) } });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLead.mutateAsync({ data: { ...form, source: form.source as "website" | "referral" | "social_media" | "event" | "paid_ad" | "organic" } });
    queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey({}) });
    setShowForm(false);
    setForm({ name: "", email: "", phone: "", courseInterest: COURSES[0], source: "website", notes: "" });
  };

  const handleStatusChange = async (id: number, status: string) => {
    await updateLead.mutateAsync({ id, data: { status: status as "new" | "contacted" | "qualified" | "enrolled" | "lost" } });
    queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey({}) });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Leads" subtitle="AI-scored pipeline of prospective Utiva students" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {["", "new", "contacted", "qualified", "enrolled", "lost"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  statusFilter === s ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-card border border-card-border rounded-xl p-5 mb-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="font-semibold text-foreground text-sm mb-3">New Lead</h3>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name</label>
              <input required className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
              <input required type="email" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
              <input className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Source</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Course Interest</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" value={form.courseInterest} onChange={e => setForm(f => ({ ...f, courseInterest: e.target.value }))}>
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="submit" disabled={createLead.isPending} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
                {createLead.isPending ? "Creating..." : "Create Lead"}
              </button>
            </div>
          </form>
        )}

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Course Interest</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">AI Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">AI Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : (leads ?? []).map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{lead.courseInterest}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{SOURCE_LABELS[lead.source] ?? lead.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className={cn("text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer appearance-none pr-5", STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-700")}
                      >
                        {["new", "contacted", "qualified", "enrolled", "lost"].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                    </div>
                  </td>
                  <td className="px-4 py-3 w-28">
                    <AiScoreBadge score={lead.aiScore} />
                  </td>
                  <td className="px-4 py-3">
                    {lead.aiSuggestedAction && (
                      <div className="flex items-start gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-snug">{lead.aiSuggestedAction}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads?.length === 0 && !isLoading && (
            <div className="py-12 text-center text-muted-foreground text-sm">No leads found</div>
          )}
        </div>
      </div>
    </div>
  );
}
