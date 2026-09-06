import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { LIGHT, DARK, varsToStyle } from "./salesDashboard/colorTokens";
import { getStrings } from "./salesDashboard/i18n";

// ناوبری واحد کل برنامه — جایگزین NavBar قدیمی (سبز/تیل). سبک بصری از
// همان طراحی Claude Design (توکن‌های colorTokens.js) می‌آید، چون این تنها
// هدر برنامه است، نه یک هدر جدا برای هر صفحه.
export default function AppHeader({ province, provinceName, onClearProvince }) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const colors = theme === "dark" ? DARK : LIGHT;
  const t = getStrings(language);
  const dir = language === "en" ? "ltr" : "rtl";

  const now = new Date();
  const dateText =
    language === "en"
      ? now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : now.toLocaleDateString("fa-IR", { month: "long", year: "numeric" });

  return (
    <header className="sd-header" dir={dir} style={varsToStyle(colors.vars)}>
      <div className="sd-tabs">
        <NavLink to="/" end className={({ isActive }) => `sd-tab ${isActive ? "sd-tab-active" : ""}`}>
          {t.dashboardTab}
        </NavLink>
        <NavLink to="/pipeline" className={({ isActive }) => `sd-tab ${isActive ? "sd-tab-active" : ""}`}>
          {t.pipelineTab}
        </NavLink>
      </div>
      <NavLink to="/contacts" className={({ isActive }) => `sd-contacts-link ${isActive ? "sd-contacts-link-active" : ""}`}>
        {t.contactsLink}
      </NavLink>
      <div style={{ flex: 1 }} />
      {province && (
        <button className="sd-badge" onClick={onClearProvince}>
          <span>{t.provinceBadgePrefix ? `${t.provinceBadgePrefix} ${provinceName}` : provinceName}</span>
          <span style={{ color: "var(--faint)" }}>✕</span>
        </button>
      )}
      <div className="sd-sync-text">{dateText}</div>
      <button className="sd-theme-btn" onClick={toggleTheme}>
        {theme === "dark" ? t.lightTheme : t.darkTheme}
      </button>
      <button className="sd-lang-btn" onClick={toggleLanguage} title={language === "fa" ? "English" : "فارسی"}>
        {t.langToggle}
      </button>
    </header>
  );
}
