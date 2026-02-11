"use client";

import Link from "next/link";

const links = [
  { href: "/memory", label: "זיכרון", icon: "◉", desc: "הקשר פעיל ונושאים פתוחים" },
  { href: "/meetings", label: "פגישות", icon: "◎", desc: "תמלילים ועיבוד" },
  { href: "/settings", label: "הגדרות", icon: "⚙", desc: "מפתח API והעדפות" },
];

export default function MorePage() {
  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">עוד</h1>
      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors"
          >
            <span className="text-2xl">{link.icon}</span>
            <div>
              <div className="font-medium text-sm">{link.label}</div>
              <div className="text-xs text-muted">{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
