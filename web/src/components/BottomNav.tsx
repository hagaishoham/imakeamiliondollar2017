"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/tasks", label: "Tasks", icon: "☐" },
  { href: "/scratchpad", label: "Pad", icon: "✎" },
  { href: "/notes", label: "Notes", icon: "▤" },
  { href: "/more", label: "More", icon: "⋯" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center h-16 z-50">
      {nav.map((item) => {
        const active = item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-xs transition-colors ${
              active ? "text-primary" : "text-muted"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
