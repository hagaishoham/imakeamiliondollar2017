"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface DailyNote {
  id: string;
  date: string;
  summary: string;
}

function formatDate(mmddyy: string): string {
  if (!mmddyy || mmddyy.length !== 6) return mmddyy;
  const mm = mmddyy.slice(0, 2);
  const dd = mmddyy.slice(2, 4);
  const yy = mmddyy.slice(4, 6);
  const year = parseInt(yy) + 2000;
  const date = new Date(year, parseInt(mm) - 1, parseInt(dd));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTodayMMDDYY(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleCreateToday() {
    setCreating(true);
    try {
      const res = await fetch("/api/daily-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getTodayMMDDYY() }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/notes/${data.id}`);
      }
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">יומן יומי</h1>
        <button
          onClick={handleCreateToday}
          disabled={creating}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {creating ? "יוצר..." : "צור רשומה להיום"}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted">טוען...</div>
      ) : notes.length === 0 ? (
        <div className="py-12 text-center text-muted">
          אין רשומות עדיין. התחל את היום כדי ליצור אחת.
        </div>
      ) : (
        <div className="space-y-3">
          {notes
            .sort((a, b) => {
              // Sort by date descending (MMDDYY)
              const yearA = parseInt(a.date.slice(4, 6)) + 2000;
              const monthA = parseInt(a.date.slice(0, 2));
              const dayA = parseInt(a.date.slice(2, 4));
              const yearB = parseInt(b.date.slice(4, 6)) + 2000;
              const monthB = parseInt(b.date.slice(0, 2));
              const dayB = parseInt(b.date.slice(2, 4));
              const dateA = new Date(yearA, monthA - 1, dayA);
              const dateB = new Date(yearB, monthB - 1, dayB);
              return dateB.getTime() - dateA.getTime();
            })
            .map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
              >
                <div className="mb-1 text-base font-semibold">
                  {formatDate(note.date)}
                </div>
                {note.summary ? (
                  <p className="line-clamp-2 text-sm text-muted">
                    {note.summary}
                  </p>
                ) : (
                  <p className="text-sm text-muted/60 italic">אין סיכום</p>
                )}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
