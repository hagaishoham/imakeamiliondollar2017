"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  tasks: { section: string; content: string; completed: number; id: number }[];
  scratchpadCount: number;
  memoryItems: { section: string; content: string }[];
  unprocessedMeetings: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [ritualLoading, setRitualLoading] = useState<string | null>(null);
  const [ritualMessage, setRitualMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [tasksRes, scratchRes, memoryRes, meetingsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/scratchpad"),
      fetch("/api/memory"),
      fetch("/api/meetings"),
    ]);
    const tasks = await tasksRes.json();
    const scratchpad = await scratchRes.json();
    const memory = await memoryRes.json();
    const meetings = await meetingsRes.json();

    setData({
      tasks: Array.isArray(tasks) ? tasks : [],
      scratchpadCount: Array.isArray(scratchpad) ? scratchpad.length : 0,
      memoryItems: Array.isArray(memory) ? memory : [],
      unprocessedMeetings: Array.isArray(meetings)
        ? meetings.filter((m: { status: string }) => m.status === "unprocessed").length
        : 0,
    });
  }

  async function runRitual(ritual: string) {
    setRitualLoading(ritual);
    setRitualMessage(null);
    try {
      const res = await fetch(`/api/ai/${ritual}`, { method: "POST" });
      const result = await res.json();
      if (result.error) {
        setRitualMessage(`שגיאה: ${result.error}`);
      } else if (ritual === "start") {
        setRitualMessage(result.message || "היום התחיל!");
      } else if (ritual === "sync") {
        setRitualMessage(result.suggestions?.summary || "הסנכרון הושלם!");
      } else if (ritual === "wrap-up") {
        setRitualMessage(result.summary || "היום סוכם!");
      }
      loadDashboard();
    } catch {
      setRitualMessage("נכשל. בדוק את מפתח ה-API בהגדרות.");
    }
    setRitualLoading(null);
  }

  const todayTasks = data?.tasks.filter((t) => t.section === "today") || [];
  const waitingTasks = data?.tasks.filter((t) => t.section === "waiting") || [];
  const nowItems = data?.memoryItems.filter((m) => m.section === "now") || [];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI OS</h1>
        <p className="text-muted text-sm">מערכת ההפעלה האישית שלך</p>
      </div>

      {/* Rituals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "start", label: "התחלת יום", icon: "☀", desc: "טעינת הקשר" },
          { key: "sync", label: "סנכרון", icon: "⟳", desc: "רענון אמצע יום" },
          { key: "wrap-up", label: "סיכום יום", icon: "☽", desc: "סוף היום" },
        ].map((r) => (
          <button
            key={r.key}
            onClick={() => runRitual(r.key)}
            disabled={ritualLoading !== null}
            className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary transition-colors disabled:opacity-50"
          >
            <div className="text-2xl mb-1">{r.icon}</div>
            <div className="font-medium text-sm">{r.label}</div>
            <div className="text-xs text-muted">{r.desc}</div>
            {ritualLoading === r.key && (
              <div className="text-xs text-primary mt-1 animate-pulse">מעבד...</div>
            )}
          </button>
        ))}
      </div>

      {ritualMessage && (
        <div className="bg-card border border-border rounded-xl p-4 text-sm whitespace-pre-wrap">
          {ritualMessage}
        </div>
      )}

      {/* Current Focus */}
      {nowItems.length > 0 && (
        <div className="bg-card border border-primary/30 rounded-xl p-4">
          <h2 className="font-semibold text-sm text-primary mb-2">פוקוס נוכחי</h2>
          <ul className="space-y-1">
            {nowItems.map((item, i) => (
              <li key={i} className="text-sm">{item.content}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Today's Tasks */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">משימות להיום</h2>
          <Link href="/tasks" className="text-xs text-primary hover:underline">הצג הכל</Link>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted">אין משימות להיום.</p>
        ) : (
          <ul className="space-y-2">
            {todayTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <span className={task.completed ? "line-through text-muted" : ""}>
                  {task.completed ? "☑" : "☐"} {task.content}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/scratchpad" className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
          <div className="text-2xl mb-1">✎</div>
          <div className="text-xs text-muted">טיוטה</div>
          <div className="font-semibold">{data?.scratchpadCount || 0} פריטים</div>
        </Link>
        <Link href="/tasks" className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
          <div className="text-2xl mb-1">◷</div>
          <div className="text-xs text-muted">ממתין</div>
          <div className="font-semibold">{waitingTasks.length} פריטים</div>
        </Link>
        <Link href="/meetings" className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
          <div className="text-2xl mb-1">◎</div>
          <div className="text-xs text-muted">לא מעובד</div>
          <div className="font-semibold">{data?.unprocessedMeetings || 0} פגישות</div>
        </Link>
        <Link href="/memory" className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
          <div className="text-2xl mb-1">◉</div>
          <div className="text-xs text-muted">זיכרון</div>
          <div className="font-semibold">{data?.memoryItems.length || 0} פריטים</div>
        </Link>
      </div>
    </div>
  );
}
