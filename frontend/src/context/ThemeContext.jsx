import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "theme";
const ThemeContext = createContext(null);

// پیش‌فرض تیره (نه prefers-color-scheme سیستم) — برای حس حرفه‌ای‌تر داشبورد
// آنالیتیکس؛ انتخاب دستی کاربر در localStorage همیشه از این پیش‌فرض برنده است.
function readInitialTheme() {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
  }
  return "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
