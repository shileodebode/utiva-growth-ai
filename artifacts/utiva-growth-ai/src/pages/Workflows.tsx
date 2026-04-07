import { useState } from "react";
import { useListWorkflows, useToggleWorkflow, useRunWorkflow, getListWorkflowsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Play, Zap, Clock, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  lead_followup: "bg-blue-100 text-blue-700",
  enrollment_reminder: "bg-purple-100 text-purple-700",
  re_engagement: "bg-amber-100 text-amber-700",
  content_push: "bg-green-100 text-green-700",
  lead_scoring: "bg-teal-100 text-teal-700",
  drop_alert: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<string, string> = {
  lead_followup: "Lead Follow-up",
  enrollment_reminder: "Enrollment Reminder",
  re_engagement: "Re-engagement",
  content_push: "Content Push",
  lead_scoring: "Lead Scoring",
  drop_alert: "Drop Alert",
};

function timeAgo(ts: string | null | undefined) {
  if (!ts) return "Never";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface RunResult {
  affectedCount: number;
  message: string;
  aiGeneratedMessage?: string;
  workflowName: string;
}

export default function Workflows() {
  const queryClient = useQueryClient();
  const { data: workflows, isLoading } = useListWorkflows({ query: { queryKey: getListWorkflowsQueryKey() } });
  const toggleWorkflow = useToggleWorkflow();
  const runWorkflow = useRunWorkflow();
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);

  const handleToggle = async (id: number) => {
    await toggleWorkflow.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
  };

  const handleRun = async (id: number, name: string) => {
    setRunningId(id);
    try {
      const result = await runWorkflow.mutateAsync({ id });
      setRunResult({ ...result, workflowName: name });
      queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="AI Workflows" subtitle="Automated outreach, scoring, and engagement pipelines" />
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-5 animate-pulse h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(workflows ?? []).map((wf) => (
              <div key={wf.id} className={cn("bg-card border rounded-xl p-5 transition-all", wf.isActive ? "border-card-border" : "border-border opacity-60")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_COLORS[wf.type] ?? "bg-gray-100 text-gray-700")}>
                        {TYPE_LABELS[wf.type] ?? wf.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm leading-snug">{wf.name}</h3>
                  </div>
                  <button
                    onClick={() => handleToggle(wf.id)}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-all flex-shrink-0 ml-3",
                      wf.isActive ? "bg-primary" : "bg-gray-200"
                    )}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", wf.isActive ? "left-5" : "left-0.5")} />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{wf.description}</p>

                <div className="bg-muted/60 rounded-lg px-3 py-2 mb-4">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">TRIGGER</p>
                  <p className="text-xs text-foreground">{wf.triggerCondition}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{wf.runsThisWeek} this week</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span className="text-green-600 font-medium">{Number(wf.successRate).toFixed(0)}% success</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo(wf.lastRunAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRun(wf.id, wf.name)}
                    disabled={!wf.isActive || runningId === wf.id}
                    className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    {runningId === wf.id ? "Running..." : "Run Now"}
                  </button>
                  <div className="flex-1 flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg">
                    <span className="text-[10px] text-muted-foreground">{wf.runsTotal} total runs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {runResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-card-border rounded-xl max-w-lg w-full shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Workflow Executed</h3>
                  <p className="text-xs text-muted-foreground">{runResult.workflowName}</p>
                </div>
              </div>
              <button onClick={() => setRunResult(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700 font-medium">{runResult.message}</p>
            </div>

            {runResult.aiGeneratedMessage && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">SAMPLE AI-GENERATED MESSAGE</p>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[9px] text-white font-bold">AI</span>
                    </div>
                    <span className="text-xs font-semibold text-primary">AI-generated outreach</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{runResult.aiGeneratedMessage}</p>
                </div>
              </div>
            )}

            <button onClick={() => setRunResult(null)} className="mt-4 w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
