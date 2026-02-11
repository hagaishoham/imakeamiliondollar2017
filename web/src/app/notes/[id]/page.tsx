"use client";

import Link from "next/link";
import { use, useEffect, useState, useRef, useCallback } from "react";

interface DailyNoteDetail {
  id: string;
  date: string;
  decisions: string;
  meetings_conversations: string;
  notes: string;
  summary: string;
}

type EditableField = "decisions" | "meetings_conversations" | "notes" | "summary";

const SECTIONS: { field: EditableField; label: string; placeholder: string }[] = [
  { field: "decisions", label: "החלטות", placeholder: "כתוב את ההחלטות שלך..." },
  { field: "meetings_conversations", label: "פגישות ושיחות", placeholder: "כתוב פגישות ושיחות..." },
  { field: "notes", label: "הערות", placeholder: "כתוב את ההערות שלך..." },
  { field: "summary", label: "סיכום יום", placeholder: "כתוב סיכום יום..." },
];

function formatDate(mmddyy: string): string {
  if (!mmddyy || mmddyy.length !== 6) return mmddyy;
  const mm = mmddyy.slice(0, 2);
  const dd = mmddyy.slice(2, 4);
  const yy = mmddyy.slice(4, 6);
  const year = parseInt(yy) + 2000;
  const date = new Date(year, parseInt(mm) - 1, parseInt(dd));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [note, setNote] = useState<DailyNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedField, setSavedField] = useState<string | null>(null);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await fetch(`/api/daily-notes/${id}`);
        if (res.ok) {
          const data = await res.json();
          setNote(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchNote();
  }, [id]);

  const saveField = useCallback(
    async (field: EditableField, value: string) => {
      try {
        const res = await fetch(`/api/daily-notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (res.ok) {
          setSavedField(field);
          setTimeout(() => setSavedField(null), 2000);
        }
      } catch {
        // silently fail
      }
    },
    [id]
  );

  function handleChange(field: EditableField, value: string) {
    setNote((prev) => (prev ? { ...prev, [field]: value } : prev));

    // Debounce auto-save: 1 second after typing
    if (debounceTimers.current[field]) {
      clearTimeout(debounceTimers.current[field]);
    }
    debounceTimers.current[field] = setTimeout(() => {
      saveField(field, value);
    }, 1000);
  }

  function handleBlur(field: EditableField) {
    if (!note) return;
    // Clear any pending debounce and save immediately on blur
    if (debounceTimers.current[field]) {
      clearTimeout(debounceTimers.current[field]);
      delete debounceTimers.current[field];
    }
    saveField(field, note[field]);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="py-12 text-center text-muted">טוען...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="py-12 text-center text-muted">הרשומה לא נמצאה.</div>
        <div className="text-center">
          <Link href="/notes" className="text-sm text-primary hover:underline">
            חזרה להערות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/notes"
          className="mb-3 inline-block text-sm text-muted transition-colors hover:text-foreground"
        >
          &rarr; חזרה להערות
        </Link>
        <h1 className="text-2xl font-bold">{formatDate(note.date)}</h1>
      </div>

      <div className="space-y-6">
        {SECTIONS.map(({ field, label, placeholder }) => (
          <div key={field} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground/80">
                {label}
              </label>
              {savedField === field && (
                <span className="text-xs text-success animate-pulse">
                  נשמר
                </span>
              )}
            </div>
            <textarea
              value={note[field] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={placeholder}
              rows={4}
              className="w-full resize-y rounded-lg border-0 bg-transparent p-0 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
