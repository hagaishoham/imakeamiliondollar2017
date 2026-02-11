"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MemoryItem {
  id: string;
  content: string;
  section: string;
  position: number;
}

const SECTIONS = [
  { key: "now", label: "Now", description: "Current focus & priorities" },
  { key: "open_threads", label: "Open Threads", description: "Active items being tracked" },
  { key: "parked", label: "Parked", description: "Ideas & items for later" },
  { key: "people_context", label: "People & Context", description: "Key people info" },
  { key: "recent_decisions", label: "Recent Decisions", description: "Decisions with dates" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function sectionBorderClass(key: SectionKey): string {
  switch (key) {
    case "now":
      return "border-primary";
    case "parked":
      return "border-muted";
    default:
      return "border-border";
  }
}

function LineCountBadge({ count }: { count: number }) {
  const isWarning = count >= 80;
  const isDanger = count >= 95;

  let colorClass = "text-muted";
  if (isDanger) colorClass = "text-danger";
  else if (isWarning) colorClass = "text-warning";

  return (
    <div className={`flex items-center gap-2 text-sm ${colorClass}`}>
      <span className="font-mono font-medium">{count}</span>
      <span>/ 100 items</span>
      {isDanger && (
        <span className="ml-1 rounded-md bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
          Near limit
        </span>
      )}
      {isWarning && !isDanger && (
        <span className="ml-1 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
          Getting full
        </span>
      )}
    </div>
  );
}

function InlineEditor({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = text.trim();
      if (trimmed && trimmed !== value) {
        onSave(trimmed);
      } else {
        onCancel();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      className="w-full rounded-md border border-primary bg-card px-2 py-1 text-sm text-foreground outline-none"
    />
  );
}

function SectionMoveDropdown({
  currentSection,
  onMove,
}: {
  currentSection: string;
  onMove: (section: SectionKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const otherSections = SECTIONS.filter((s) => s.key !== currentSection);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-muted transition-colors hover:bg-border/50 hover:text-foreground"
        title="Move to section"
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
          <path d="M5 9l4-4 4 4" />
          <path d="M9 5v12" />
          <path d="M19 15l-4 4-4-4" />
          <path d="M15 19V7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg">
          {otherSections.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                onMove(s.key);
                setOpen(false);
              }}
              className="block w-full px-3 py-1.5 text-left text-xs text-foreground/80 transition-colors hover:bg-border/50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryItemRow({
  item,
  onUpdate,
  onDelete,
  onMove,
}: {
  item: MemoryItem;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, section: SectionKey) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="group flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-border/30">
      {editing ? (
        <div className="flex-1">
          <InlineEditor
            value={item.content}
            onSave={(val) => {
              onUpdate(item.id, val);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <span
          className="flex-1 cursor-pointer text-sm text-foreground/90 leading-relaxed"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {item.content}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <SectionMoveDropdown
          currentSection={item.section}
          onMove={(section) => onMove(item.id, section)}
        />
        <button
          onClick={() => onDelete(item.id)}
          className="rounded p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          title="Delete item"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function AddItemInput({
  sectionKey,
  onAdd,
}: {
  sectionKey: string;
  onAdd: (content: string, section: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onAdd(trimmed, sectionKey);
        setValue("");
      }
    }
  }

  return (
    <div className="mt-2 px-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add item... (Enter to save)"
        className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}

function SectionCard({
  sectionKey,
  label,
  description,
  items,
  onAdd,
  onUpdate,
  onDelete,
  onMove,
}: {
  sectionKey: SectionKey;
  label: string;
  description: string;
  items: MemoryItem[];
  onAdd: (content: string, section: string) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, section: SectionKey) => void;
}) {
  const borderClass = sectionBorderClass(sectionKey);
  const isNow = sectionKey === "now";
  const isParked = sectionKey === "parked";

  return (
    <div
      className={`bg-card rounded-xl border ${borderClass} ${
        isNow ? "border-2 shadow-sm shadow-primary/5" : ""
      } ${isParked ? "opacity-80" : ""}`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2
            className={`text-sm font-semibold ${
              isNow ? "text-primary" : "text-foreground"
            }`}
          >
            {label}
          </h2>
          <span className="text-xs text-muted">{description}</span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isNow
              ? "bg-primary/10 text-primary"
              : "bg-border/50 text-muted"
          }`}
        >
          {items.length}
        </span>
      </div>
      <div className="p-2">
        {items.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-muted/60">
            No items yet
          </p>
        )}
        {items
          .sort((a, b) => a.position - b.position)
          .map((item) => (
            <MemoryItemRow
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        <AddItemInput sectionKey={sectionKey} onAdd={onAdd} />
      </div>
    </div>
  );
}

export default function MemoryPage() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/memory");
      if (!res.ok) throw new Error("Failed to load memory");
      const data: MemoryItem[] = await res.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function addItem(content: string, section: string) {
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, section }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      const newItem: MemoryItem = await res.json();
      setItems((prev) => [...prev, newItem]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    }
  }

  async function updateItem(id: string, content: string) {
    const prev = items;
    setItems((items) =>
      items.map((item) => (item.id === id ? { ...item, content } : item))
    );
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        setItems(prev);
        throw new Error("Failed to update item");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  }

  async function deleteItem(id: string) {
    const prev = items;
    setItems((items) => items.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setItems(prev);
        throw new Error("Failed to delete item");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  async function moveItem(id: string, section: SectionKey) {
    const prev = items;
    setItems((items) =>
      items.map((item) => (item.id === id ? { ...item, section } : item))
    );
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      if (!res.ok) {
        setItems(prev);
        throw new Error("Failed to move item");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move item");
    }
  }

  const totalCount = items.length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted">Loading memory...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Memory</h1>
            <p className="mt-1 text-sm text-muted">
              Active context. Keep it under 100 lines.
            </p>
          </div>
          <LineCountBadge count={totalCount} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-2 text-sm text-danger">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <SectionCard
            key={section.key}
            sectionKey={section.key}
            label={section.label}
            description={section.description}
            items={items.filter((item) => item.section === section.key)}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onMove={moveItem}
          />
        ))}
      </div>
    </div>
  );
}
