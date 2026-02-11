"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.anthropic_api_key) {
          setApiKey(data.anthropic_api_key);
        }
        setLoading(false);
      });
  }, []);

  async function saveKey() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "anthropic_api_key", value: apiKey }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-6">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted text-sm">Configure your AI OS</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-sm mb-1">Anthropic API Key</h2>
          <p className="text-xs text-muted mb-3">
            Required for AI features: meeting processing, memory sync, daily rituals.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveKey}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Save
          </button>
          {saved && <span className="text-success text-sm">Saved!</span>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-sm">About</h2>
        <p className="text-sm text-muted">
          AI OS is your personal AI-powered productivity system. It combines a task board,
          persistent memory, scratchpad, meeting processing, and daily notes with three
          AI-powered rituals: Start Day, Sync, and Wrap Up.
        </p>
        <div className="text-xs text-muted space-y-1">
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
