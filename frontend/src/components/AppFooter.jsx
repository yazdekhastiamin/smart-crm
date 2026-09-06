import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { LIGHT, DARK, varsToStyle } from "./salesDashboard/colorTokens";

export default function AppFooter() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = theme === "dark" ? DARK : LIGHT;
  const dir = language === "en" ? "ltr" : "rtl";

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="sd-footer" dir={dir} style={varsToStyle(colors.vars)}>
      <div className="sd-logo-mark">{language === "en" ? "S" : "آ"}</div>
      <div style={{ fontSize: 17, fontWeight: 500 }}>Smart CRM</div>
      <div style={{ flex: 1 }} />
      <div className="sd-num" style={{ fontSize: 17, color: "var(--ink2)" }}>
        {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </footer>
  );
}
