"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ScratchpadItem } from "@/lib/types";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "עכשיו";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ד׳ לפני`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ש׳ לפני`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} י׳ לפני`;
}

export default function ScratchpadPage() {
  const [items, setItems] = useState<ScratchpadItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/scratchpad");
      if (res.ok) {
        const data: ScratchpadItem[] = await res.json();
        // Newest first
        setItems(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.error("Failed to fetch scratchpad items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Auto-focus on load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Update relative times every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => [...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const addItem = async () => {
    const content = input.trim();
    if (!content || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/scratchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const newItem: ScratchpadItem = await res.json();
        setItems((prev) => [newItem, ...prev]);
        setInput("");
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    } catch (err) {
      console.error("Failed to add item:", err);
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  };

  const deleteItem = async (id: number) => {
    // Optimistic removal
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/scratchpad/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete item:", err);
      fetchItems();
    }
  };

  const clearAll = async () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    setClearConfirm(false);
    try {
      const res = await fetch("/api/scratchpad/clear", { method: "POST" });
      if (res.ok) {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to clear scratchpad:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addItem();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  // Reset clear confirmation when clicking elsewhere
  useEffect(() => {
    if (!clearConfirm) return;
    const timer = setTimeout(() => setClearConfirm(false), 3000);
    return () => clearTimeout(timer);
  }, [clearConfirm]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">טיוטה</h1>
        <p className="mt-1 text-sm text-muted">
          רישום מהיר. מעובד בזמן סנכרון.
        </p>
      </div>

      {/* Input area */}
      <div className="mb-8">
        <div className="bg-card rounded-xl border border-border p-3 focus-within:border-primary transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="מה עובר לך בראש?"
            rows={1}
            className="w-full resize-none bg-transparent text-foreground placeholder:text-muted/60 text-base leading-relaxed outline-none"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <span className="text-xs text-muted">
              Enter להוספה &middot; Shift+Enter לשורה חדשה
            </span>
            <button
              onClick={addItem}
              disabled={!input.trim() || submitting}
              className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "מוסיף..." : "הוסף"}
            </button>
          </div>
        </div>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-sm text-muted">טוען...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3 opacity-30">&#9998;</div>
          <p className="text-sm text-muted">
            אין פריטים. התחל לכתוב למעלה.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-card rounded-xl border border-border px-4 py-3 flex items-start gap-3 transition-colors hover:border-primary/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                    {item.content}
                  </p>
                  <span className="text-xs text-muted mt-1 block">
                    {relativeTime(item.created_at)}
                  </span>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-md text-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="מחק פריט"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Clear all button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={clearAll}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                clearConfirm
                  ? "border-danger text-danger bg-danger/10 hover:bg-danger/20"
                  : "border-border text-muted hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {clearConfirm ? "בטוח? נקה הכל" : "נקה הכל"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
