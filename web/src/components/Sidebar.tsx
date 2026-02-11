"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "ראשי", icon: "⌂" },
  { href: "/tasks", label: "משימות", icon: "☐" },
  { href: "/scratchpad", label: "טיוטה", icon: "✎" },
  { href: "/memory", label: "זיכרון", icon: "◉" },
  { href: "/notes", label: "יומן", icon: "▤" },
  { href: "/meetings", label: "פגישות", icon: "◎" },
  { href: "/settings", label: "הגדרות", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-card border-l border-border h-full shrink-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-primary">AI OS</h1>
        <p className="text-xs text-muted">מערכת הפעלה אישית</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/70 hover:bg-border/50 hover:text-foreground"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
