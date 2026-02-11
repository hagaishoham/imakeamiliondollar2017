"use client";

import { useState, useEffect, useCallback } from "react";

type Task = {
  id: number;
  content: string;
  section: string;
  completed: number;
  position: number;
};

const SECTIONS = [
  { key: "today", label: "היום", icon: "●", color: "text-primary" },
  { key: "soon", label: "בקרוב", icon: "◐", color: "text-foreground" },
  { key: "later", label: "אחר כך", icon: "○", color: "text-muted" },
  { key: "waiting", label: "ממתין", icon: "◷", color: "text-warning" },
  { key: "agenda", label: "סדר יום", icon: "◈", color: "text-foreground" },
  { key: "inbox", label: "תיבת דואר", icon: "▣", color: "text-primary" },
  { key: "done", label: "הושלם", icon: "✓", color: "text-success" },
  { key: "reference", label: "הפניה", icon: "◆", color: "text-muted" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newSection, setNewSection] = useState("inbox");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function addTask() {
    const content = newTask.trim();
    if (!content || adding) return;

    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, section: newSection }),
      });
      if (res.ok) {
        const task = await res.json();
        setTasks((prev) => [...prev, task]);
        setNewTask("");
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setAdding(false);
    }
  }

  async function toggleComplete(task: Task) {
    const newCompleted = task.completed ? 0 : 1;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, completed: newCompleted } : t
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  }

  async function moveTask(task: Task, toSection: string) {
    if (toSection === task.section) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: toSection }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, section: toSection } : t
          )
        );
      }
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  }

  async function deleteTask(id: number) {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  function getTasksForSection(sectionKey: string) {
    return tasks
      .filter((t) => t.section === sectionKey)
      .sort((a, b) => a.position - b.position);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted text-sm animate-pulse">
          טוען...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">לוח משימות</h1>

      {/* Add Task — sticky */}
      <div className="sticky top-0 z-10 bg-background pb-4">
        <div className="flex gap-2 bg-card border border-border rounded-xl p-3 shadow-sm">
          <select
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0"
          >
            {SECTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.icon} {s.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
            placeholder="מה צריך לעשות?"
            className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted"
          />

          <button
            onClick={addTask}
            disabled={!newTask.trim() || adding}
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            הוסף משימה
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => {
          const sectionTasks = getTasksForSection(section.key);

          return (
            <div
              key={section.key}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className={`text-lg leading-none ${section.color}`}>
                    {section.icon}
                  </span>
                  <h2 className="text-sm font-semibold">{section.label}</h2>
                </div>
                <span className="text-xs text-muted bg-background rounded-full px-2 py-0.5 font-medium tabular-nums">
                  {sectionTasks.length}
                </span>
              </div>

              {/* Tasks */}
              {sectionTasks.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted italic">
                  אין משימות
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {sectionTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-2.5 group hover:bg-background/50 transition-colors"
                    >
                      {/* Checkbox — only for today section */}
                      {section.key === "today" ? (
                        <button
                          onClick={() => toggleComplete(task)}
                          className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            task.completed
                              ? "bg-success border-success text-white"
                              : "border-border hover:border-primary"
                          }`}
                          aria-label={
                            task.completed
                              ? "סמן כלא הושלם"
                              : "סמן כהושלם"
                          }
                        >
                          {task.completed ? (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 6l3 3 5-5" />
                            </svg>
                          ) : null}
                        </button>
                      ) : (
                        <div className="w-[18px] shrink-0" />
                      )}

                      {/* Content */}
                      <span
                        className={`flex-1 text-sm min-w-0 break-words ${
                          task.completed && section.key === "today"
                            ? "line-through text-muted"
                            : ""
                        }`}
                      >
                        {task.content}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {/* Move to section dropdown */}
                        <select
                          value={task.section}
                          onChange={(e) => moveTask(task, e.target.value)}
                          className="bg-background border border-border rounded-md px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                          aria-label="העבר לקטע"
                        >
                          {SECTIONS.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.icon} {s.label}
                            </option>
                          ))}
                        </select>

                        {/* Delete */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-muted hover:text-danger p-1 rounded transition-colors"
                          aria-label="מחק משימה"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
