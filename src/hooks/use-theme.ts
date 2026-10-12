"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
const THEME_EVENT = "rinconcito-theme-change";

function readTheme(): Theme {
  const value = localStorage.getItem("theme");
  return value === "light" || value === "dark" || value === "system" ? value : "dark";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const notify = () => {
    applyTheme(readTheme());
    onChange();
  };
  window.addEventListener("storage", notify);
  window.addEventListener(THEME_EVENT, notify);
  media.addEventListener("change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(THEME_EVENT, notify);
    media.removeEventListener("change", notify);
  };
}

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const changeTheme = (value: Theme) => {
    localStorage.setItem("theme", value);
    applyTheme(value);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return { theme, changeTheme };
}
