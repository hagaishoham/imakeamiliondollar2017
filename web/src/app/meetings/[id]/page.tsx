"use client";

import { use } from "react";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

type Meeting = {
  id: number;
  title: string;
  date: string;
  attendees: string;
  type: string;
  status: string;
  summary: string;
  action_items: string;
  key_points: string;
  raw_transcript: string;
};

export default function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
      }
    } catch (err) {
      console.error("Failed to fetch meeting:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  async function saveField(field: string, value: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMeeting(updated);
      }
    } catch (err) {
      console.error("Failed to save field:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleBlur(field: string, value: string) {
    if (!meeting) return;
    const current = meeting[field as keyof Meeting];
    if (value !== current) {
      saveField(field, value);
    }
  }

  function updateLocal(field: string, value: string) {
    setMeeting((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleProcess() {
    if (!meeting) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/ai/process-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id }),
      });
      if (res.ok) {
        // Re-fetch to get AI-generated data
        await fetchMeeting();
      }
    } catch (err) {
      console.error("Failed to process meeting:", err);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted text-sm animate-pulse">
          Loading meeting...
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/meetings"
          className="text-sm text-primary hover:underline"
        >
          &larr; Back to Meetings
        </Link>
        <div className="py-12 text-center text-muted">Meeting not found.</div>
      </div>
    );
  }

  const isProcessed = meeting.status === "processed";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link & saving indicator */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/meetings"
          className="text-sm text-primary hover:underline"
        >
          &larr; Back to Meetings
        </Link>
        {saving && (
          <span className="text-xs text-muted animate-pulse">Saving...</span>
        )}
      </div>

      {/* Header */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <input
          type="text"
          value={meeting.title || ""}
          onChange={(e) => updateLocal("title", e.target.value)}
          onBlur={(e) => handleBlur("title", e.target.value)}
          placeholder="Untitled Meeting"
          className="w-full bg-transparent text-xl font-bold focus:outline-none placeholder:text-muted"
        />

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground/70">Date:</span>
            <input
              type="date"
              value={meeting.date || ""}
              onChange={(e) => updateLocal("date", e.target.value)}
              onBlur={(e) => handleBlur("date", e.target.value)}
              className="bg-transparent focus:outline-none"
            />
          </div>

          <span className="text-border">|</span>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground/70">Attendees:</span>
            <input
              type="text"
              value={meeting.attendees || ""}
              onChange={(e) => updateLocal("attendees", e.target.value)}
              onBlur={(e) => handleBlur("attendees", e.target.value)}
              placeholder="Add attendees"
              className="bg-transparent focus:outline-none placeholder:text-muted/60"
            />
          </div>

          <span className="text-border">|</span>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground/70">Type:</span>
            <input
              type="text"
              value={meeting.type || ""}
              onChange={(e) => updateLocal("type", e.target.value)}
              onBlur={(e) => handleBlur("type", e.target.value)}
              placeholder="e.g., 1:1"
              className="bg-transparent focus:outline-none placeholder:text-muted/60"
            />
          </div>

          <span className="text-border">|</span>

          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isProcessed
                ? "bg-success/20 text-success"
                : "bg-warning/20 text-warning"
            }`}
          >
            {meeting.status}
          </span>
        </div>

        {/* Process button */}
        {!isProcessed && (
          <div className="mt-4">
            <button
              onClick={handleProcess}
              disabled={processing}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {processing ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing with AI...
                </>
              ) : (
                "Process with AI"
              )}
            </button>
          </div>
        )}
      </div>

      {/* AI Sections (shown if processed) */}
      {isProcessed && (
        <div className="mb-6 space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              Summary
            </h2>
            <textarea
              value={meeting.summary || ""}
              onChange={(e) => updateLocal("summary", e.target.value)}
              onBlur={(e) => handleBlur("summary", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            />
          </div>

          {/* Action Items */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              Action Items
            </h2>
            <textarea
              value={meeting.action_items || ""}
              onChange={(e) => updateLocal("action_items", e.target.value)}
              onBlur={(e) => handleBlur("action_items", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            />
          </div>

          {/* Key Points */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              Key Points
            </h2>
            <textarea
              value={meeting.key_points || ""}
              onChange={(e) => updateLocal("key_points", e.target.value)}
              onBlur={(e) => handleBlur("key_points", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            />
          </div>
        </div>
      )}

      {/* Raw Transcript */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Raw Transcript
        </h2>
        <textarea
          value={meeting.raw_transcript || ""}
          onChange={(e) => updateLocal("raw_transcript", e.target.value)}
          onBlur={(e) => handleBlur("raw_transcript", e.target.value)}
          rows={16}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          placeholder="Paste meeting transcript here..."
        />
      </div>
    </div>
  );
}
