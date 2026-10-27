export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "clipper-theme";

/**
 * Runs before paint in a blocking <script> so the first frame already has the
 * right palette. Kept dependency-free and self-contained for that reason.
 */
export const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** The theme the document is actually showing, as the init script left it. */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Record an explicit choice, paint it, and notify subscribers. */
export function chooseTheme(theme: Theme) {
  storeTheme(theme);
  applyTheme(theme);
  emit();
}

/**
 * Subscribes to theme changes: an explicit choice here, or the OS preference
 * moving while no explicit choice is stored.
 */
export function subscribeTheme(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => {
    // An explicit choice wins over the OS preference.
    if (readStoredTheme()) return;
    applyTheme(media.matches ? "dark" : "light");
    emit();
  };
  media.addEventListener("change", onMediaChange);
  return () => {
    listeners.delete(onStoreChange);
    media.removeEventListener("change", onMediaChange);
  };
}
