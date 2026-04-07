import { useState } from "react";
import { useListContent, useGenerateContent, getListContentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Bot, Sparkles, Mail, MessageSquare, Smartphone, FileText, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  social_post: MessageSquare,
  whatsapp: Smartphone,
  blog: FileText,
  ad_copy: Megaphone,
};

const TYPE_LABELS: Record<string, string> = {
  email: "Email",
  social_post: "Social Post",
  whatsapp: "WhatsApp",
  blog: "Blog",
  ad_copy: "Ad Copy",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
};

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

export default function ContentAI() {
  const queryClient = useQueryClient();
  const { data: content, isLoading } = useListContent({}, { query: { queryKey: getListContentQueryKey({}) } });
  const generateContent = useGenerateContent();

  const [form, setForm] = useState({
    type: "email" as "email" | "social_post" | "whatsapp" | "blog" | "ad_copy",
    targetCourse: COURSES[0],
    targetAudience: "Working professionals",
    tone: "professional" as "professional" | "casual" | "urgent" | "inspirational",
  });
  const [generatedItem, setGeneratedItem] = useState<{ title: string; body: string } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await generateContent.mutateAsync({ data: form });
    setGeneratedItem({ title: result.title, body: result.body });
    queryClient.invalidateQueries({ queryKey: getListContentQueryKey({}) });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Content AI" subtitle="AI-powered content generation for leads and students" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-card border border-card-border rounded-xl p-5 sticky top-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Generate Content</h3>
                  <p className="text-[11px] text-muted-foreground">AI writes it for you</p>
                </div>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Content Type</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["email", "social_post", "whatsapp", "blog", "ad_copy"] as const).map((type) => {
                      const Icon = TYPE_ICONS[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, type }))}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                            form.type === type ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{TYPE_LABELS[type]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Target Course</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground" value={form.targetCourse} onChange={e => setForm(f => ({ ...f, targetCourse: e.target.value }))}>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Target Audience</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} placeholder="e.g. Fresh graduates" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tone</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["professional", "casual", "urgent", "inspirational"] as const).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, tone }))}
                        className={cn(
                          "px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all",
                          form.tone === tone ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={generateContent.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {generateContent.isPending ? "Generating..." : "Generate with AI"}
                </button>
              </form>

              {generatedItem && (
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs font-semibold text-primary mb-2">Generated: {generatedItem.title}</p>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line line-clamp-6">{generatedItem.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Saved to content library below</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card border border-card-border rounded-xl p-5 animate-pulse h-36" />
                ))
              ) : (content ?? []).map((item) => {
                const Icon = TYPE_ICONS[item.type] ?? FileText;
                return (
                  <div key={item.id} className="bg-card border border-card-border rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{item.title}</span>
                          {item.aiGenerated && (
                            <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                              <Bot className="w-2.5 h-2.5" />
                              AI
                            </span>
                          )}
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-700")}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          {item.targetCourse && <span>{item.targetCourse}</span>}
                          {item.targetAudience && <span>{item.targetAudience}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {content?.length === 0 && !isLoading && (
                <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
                  <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No content yet. Use the form to generate your first AI content.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
