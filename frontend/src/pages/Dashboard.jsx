import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { LIGHT, DARK, varsToStyle } from "../components/salesDashboard/colorTokens";
import DashboardTab from "../components/salesDashboard/DashboardTab";
import PipelineTab from "../components/salesDashboard/PipelineTab";
import "../components/salesDashboard/salesDashboard.css";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const colors = theme === "dark" ? DARK : LIGHT;

  const [tab, setTab] = useState("dash");
  const [province, setProvince] = useState(null);
  const [provinceName, setProvinceName] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const now = useClock();

  const bump = () => setRefreshToken((v) => v + 1);

  return (
    <div className="sd-root" style={varsToStyle(colors.vars)}>
      <header className="sd-header">
        <div className="sd-tabs">
          <button className={`sd-tab ${tab === "dash" ? "sd-tab-active" : ""}`} onClick={() => setTab("dash")}>
            داشبورد فروش
          </button>
          <button className={`sd-tab ${tab === "pipe" ? "sd-tab-active" : ""}`} onClick={() => setTab("pipe")}>
            قیف فروش
          </button>
        </div>
        <div style={{ flex: 1 }} />
        {province && (
          <button className="sd-badge" onClick={() => setProvince(null)}>
            <span>استان {provinceName}</span>
            <span style={{ color: "var(--faint)" }}>✕</span>
          </button>
        )}
        <div className="sd-sync-text">{now.toLocaleDateString("fa-IR", { month: "long", year: "numeric" })}</div>
        <button className="sd-theme-btn" onClick={toggleTheme}>
          {theme === "dark" ? "تم روشن" : "تم تاریک"}
        </button>
      </header>

      {tab === "dash" ? (
        <DashboardTab
          colors={colors}
          selected={province}
          onSelect={(id, name) => {
            setProvince(id);
            setProvinceName(name || "");
          }}
          refreshToken={refreshToken}
        />
      ) : (
        <PipelineTab refreshToken={refreshToken} onChanged={bump} />
      )}

      <footer className="sd-footer">
        <div className="sd-logo-mark">آ</div>
        <div style={{ fontSize: 17, fontWeight: 500 }}>Smart CRM</div>
        <div style={{ flex: 1 }} />
        <div className="sd-num" style={{ fontSize: 17, color: "var(--ink2)" }}>
          {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </footer>
    </div>
  );
}
