"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";
import { chooseTheme, currentTheme, subscribeTheme } from "@/lib/clipper/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  // The server cannot know the stored choice, so it assumes light; the init
  // script has already painted the right one by the time this hydrates.
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => "light" as const);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => chooseTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface-card text-ink-muted transition-colors",
        "hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
    >
      {/* Shown by class, not state, so the first paint already matches the theme. */}
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
    </button>
  );
}
