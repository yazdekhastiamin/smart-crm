import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "sd-language";
const LanguageContext = createContext(null);

// فقط برای صفحه‌ی داشبورد/قیف فروش (طبق طراحی اصلی که یک نسخه‌ی EN و یک
// نسخه‌ی FA داشت) — بقیه‌ی برنامه (مخاطبین و ...) همچنان فارسی‌اند.
function readInitial() {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "fa" || saved === "en") return saved;
  }
  return "fa";
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(readInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  function toggleLanguage() {
    setLanguage((prev) => (prev === "fa" ? "en" : "fa"));
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
