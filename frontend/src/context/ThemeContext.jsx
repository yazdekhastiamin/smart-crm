import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "theme";
const ThemeContext = createContext(null);

function readInitialTheme() {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    // فقط تا وقتی کاربر انتخاب دستی نکرده، تغییر prefers-color-scheme سیستم را دنبال کن.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(event) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(event.matches ? "dark" : "light");
      }
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
