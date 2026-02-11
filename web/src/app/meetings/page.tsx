"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

type Meeting = {
  id: number;
  title: string;
  date: string;
  status: string;
  summary: string;
};

function todayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayDate());
  const [attendees, setAttendees] = useState("");
  const [type, setType] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date,
          attendees: attendees.trim(),
          type: type.trim(),
          raw_transcript: rawTranscript,
        }),
      });
      if (res.ok) {
        const meeting = await res.json();
        setMeetings((prev) => [meeting, ...prev]);
        setTitle("");
        setDate(todayDate());
        setAttendees("");
        setType("");
        setRawTranscript("");
        setShowForm(false);
      }
    } catch (err) {
      console.error("Failed to create meeting:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleProcess(meetingId: number) {
    setProcessingId(meetingId);
    try {
      const res = await fetch("/api/ai/process-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });
      if (res.ok) {
        // Re-fetch to get updated meeting data
        const updatedRes = await fetch("/api/meetings");
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setMeetings(data);
        }
      }
    } catch (err) {
      console.error("Failed to process meeting:", err);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete meeting:", err);
    }
  }

  const sorted = [...meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted text-sm animate-pulse">
          Loading meetings...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meetings</h1>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          {showForm ? "Cancel" : "New Meeting"}
        </button>
      </div>

      {/* New Meeting Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting title"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Attendees
              </label>
              <input
                type="text"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="e.g., Alice, Bob"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g., 1:1, standup, planning"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Raw Transcript
            </label>
            <textarea
              value={rawTranscript}
              onChange={(e) => setRawTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              rows={10}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted resize-y"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Meetings List */}
      {sorted.length === 0 ? (
        <div className="py-12 text-center text-muted">
          No meetings yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((meeting) => {
            const isProcessing = processingId === meeting.id;
            const isProcessed = meeting.status === "processed";

            return (
              <div
                key={meeting.id}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-base font-semibold truncate">
                        {meeting.title || "Untitled"}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isProcessed
                            ? "bg-success/20 text-success"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {meeting.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted mb-1">
                      {meeting.date}
                    </div>
                    {meeting.summary && (
                      <p className="line-clamp-2 text-sm text-muted">
                        {meeting.summary}
                      </p>
                    )}
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isProcessed && (
                      <button
                        onClick={() => handleProcess(meeting.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <svg
                              className="h-3.5 w-3.5 animate-spin"
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
                            Processing...
                          </>
                        ) : (
                          "Process with AI"
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(meeting.id)}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
                      aria-label="Delete meeting"
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
