import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { n } from "./format";
import IranMap from "./IranMap";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function ageLabel(createdAt) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / MS_PER_DAY));
  if (days === 0) return "امروز";
  if (days < 7) return `${n(days)} روز پیش`;
  if (days < 30) return `${n(Math.round(days / 7))} هفته پیش`;
  return `${n(Math.round(days / 30))} ماه پیش`;
}

function formatToman(v) {
  return `${n(v / 1_000_000_000, 1)}`;
}

export default function DashboardTab({ colors, selected, onSelect, refreshToken }) {
  const [geoShape, setGeoShape] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [history, setHistory] = useState([]);
  const [geo, setGeo] = useState(null);
  const [leads, setLeads] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/iran-provinces.json").then((r) => r.json()).then(setGeoShape).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([api.forecast.get(), api.forecast.history(), api.analytics.geo(), api.deals.priority(), api.alerts.list()])
      .then(([f, h, g, l, a]) => {
        setForecast(f);
        setHistory(h);
        setGeo(g);
        setLeads(l);
        setAlerts(a);
      })
      .catch((err) => setError(err.message));
  }, [refreshToken]);

  const provinceMap = useMemo(() => {
    const map = new Map();
    (geo?.provinces ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [geo]);

  const pname = useMemo(() => {
    const map = new Map((geoShape?.features ?? []).map((f) => [f.properties.id, f.properties.fa]));
    return (id) => map.get(id) ?? "—";
  }, [geoShape]);

  if (error) return <p className="form-error">{error}</p>;
  if (!forecast || !geo) return <div style={{ padding: 24, color: "var(--faint)" }}>در حال بارگذاری…</div>;

  const scoped = selected ? provinceMap.get(selected) ?? { revenue: 0, openDeals: 0, conversionRate: null } : null;
  const scopeLabel = selected ? `استان ${pname(selected)}` : "کل کشور";

  const heroRevenue = selected ? scoped.revenue : forecast.totalForecast;
  const target = forecast.targetRevenue;
  const heroPct = Math.round(Math.min(100, (heroRevenue / target) * 100));

  const convValue = selected ? scoped.conversionRate : forecast.conversionRate;
  const openInScope = selected ? scoped.openDeals : forecast.openDealsCount;

  const activeProvinces = geo.provinces.length;
  const provActive = selected ? 1 : activeProvinces;
  const provPct = Math.round(((selected ? 1 : activeProvinces) / 31) * 100);

  const ranks = geo.provinces
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((p) => ({ ...p, name: pname(p.id) }));

  const monthly = selected ? geo.monthlyByProvince[selected] ?? [] : geo.monthly;
  const barMax = Math.max(1, ...monthly.map((m) => m.revenue)) * 1.15;
  const tickEvery = monthly.length > 8 ? 2 : 1;

  const sparkVals = history.map((h) => h.conversionRate * 100);
  const cmin = sparkVals.length ? Math.min(...sparkVals) - 3 : 0;
  const cmax = sparkVals.length ? Math.max(...sparkVals) + 3 : 100;
  const sp = sparkVals.map((v, i) => ({
    x: sparkVals.length > 1 ? (260 / (sparkVals.length - 1)) * i : 0,
    y: 50 - 46 * ((v - cmin) / Math.max(1, cmax - cmin)) + 4,
  }));
  const sparkPath = sp.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const tip = sp[sp.length - 1];

  const needFollow = selected ? alerts.filter((a) => a.province === selected).length : alerts.length;

  const scopedLeads = (selected ? leads.filter((l) => l.province === selected) : leads).slice(0, 6);

  const risk = (score) => (score >= 85 ? "var(--pos)" : score >= 72 ? "var(--ink)" : "var(--accentDeep)");

  return (
    <main className="sd-dash-grid">
      <section className="sd-card" style={{ gridArea: "hero", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
        <div className="sd-hero-big">{formatToman(heroRevenue)}</div>
        <div style={{ fontSize: 26, fontWeight: 400, letterSpacing: "-.01em", lineHeight: 1.35 }}>
          درآمد دوره <span style={{ fontSize: 17, color: "var(--muted)" }}>میلیارد تومان</span>
        </div>
        <div className="sd-gauge-track" style={{ marginTop: 16 }}>
          <i style={{ width: `${heroPct}%`, background: "var(--accent)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 7 }}>
          <span className="sd-num" style={{ fontSize: 13, fontWeight: 600, color: "var(--accentDeep)" }}>{heroPct}%</span>
          <span className="sd-num" style={{ fontSize: 13, color: "var(--faint)" }}>{formatToman(target)}</span>
        </div>
      </section>

      <section className="sd-card" style={{ gridArea: "chart", padding: "22px 26px 16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h3 className="sd-h3">فروش ماهانه ({scopeLabel})</h3>
          <div style={{ flex: 1 }} />
          <span className="sd-num" style={{ fontSize: 13, color: "var(--muted)" }}>
            {n(monthly.reduce((s, m) => s + m.revenue, 0) / 1_000_000_000, 1)} میلیارد مجموع
          </span>
        </div>
        {monthly.length === 0 ? (
          <p className="sd-empty">هنوز معامله‌ی برده‌شده‌ای در این محدوده ثبت نشده</p>
        ) : (
          <div style={{ position: "relative", marginTop: 8 }}>
            <svg viewBox="0 0 640 250" preserveAspectRatio="none" style={{ width: "100%", height: 216, display: "block", overflow: "visible" }}>
              {[0, 1, 2, 3].map((i) => {
                const y = 12 + (250 - 34 - 12) * (1 - i / 3);
                return <line key={i} x1={44} x2={624} y1={y} y2={y} stroke={colors.grid} strokeWidth={1} />;
              })}
              {monthly.map((m, i) => {
                const step = (640 - 16 - 44) / monthly.length;
                const bw = Math.min(30, step * 0.5);
                const h = (250 - 34 - 12) * (m.revenue / barMax);
                const cx = 44 + step * (i + 0.5);
                return (
                  <rect
                    key={m.month}
                    x={cx - bw / 2}
                    y={250 - 34 - h}
                    width={bw}
                    height={Math.max(2, h)}
                    fill={i === monthly.length - 1 ? colors.barB : colors.barA}
                  />
                );
              })}
            </svg>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {[0, 1, 2, 3].map((i) => {
                const v = (barMax * i) / 3;
                const y = 12 + (250 - 34 - 12) * (1 - i / 3);
                return (
                  <span key={i} className="sd-axis-label sd-num" style={{ left: `${((44 - 10) / 640) * 100}%`, top: `${(y / 250) * 100}%`, transform: "translate(-100%,-50%)" }}>
                    {n(v / 1_000_000_000, 1)}
                  </span>
                );
              })}
              {monthly.map((m, i) => {
                if (i % tickEvery !== 0) return null;
                const step = (640 - 16 - 44) / monthly.length;
                const x = 44 + step * (i + 0.5);
                return (
                  <span key={m.month} className="sd-axis-label" style={{ left: `${(x / 640) * 100}%`, top: `${(238 / 250) * 100}%`, transform: "translate(-50%,-50%)" }}>
                    {m.shortLabel}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="sd-card" style={{ gridArea: "geo", display: "flex", flexDirection: "column" }}>
        <h3 className="sd-h3">پوشش جغرافیایی</h3>
        <div className="sd-hero-big" style={{ fontSize: 60, marginTop: 14 }}>{n(provActive)}</div>
        <div style={{ fontSize: 19, marginTop: 2 }}>استان فعال</div>
        <div className="sd-gauge-track sd-gauge-track-sm" style={{ marginTop: 12 }}>
          <i style={{ width: `${provPct}%`, background: "var(--accent)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
          <span className="sd-num" style={{ fontSize: 12, fontWeight: 600, color: "var(--accentDeep)" }}>{provPct}%</span>
          <span className="sd-num" style={{ fontSize: 12, color: "var(--faint)" }}>31</span>
        </div>
        <div style={{ fontSize: 16, margin: "22px 0 4px" }}>
          استان‌های برتر <span style={{ fontSize: 13, color: "var(--faint)" }}>(درآمد)</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", overflow: "auto", minHeight: 0, flex: 1 }}>
          {ranks.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(selected === r.id ? null : r.id, r.name)}
              className="sd-rank-row"
              style={{ background: selected === r.id ? "var(--sel)" : "transparent", borderRadius: selected === r.id ? 8 : 0 }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 500 }}>{r.name}</span>
              <span className="sd-num" style={{ fontSize: 14.5, color: "var(--ink2)" }}>{formatToman(r.revenue)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sd-card" style={{ gridArea: "conv", display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 className="sd-h3">نرخ تبدیل</h3>
        <div className="sd-conv-box">
          <div className="sd-num" style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1 }}>
            {convValue == null ? "—" : `${n(Math.round(convValue * 100))}%`}
          </div>
          <div style={{ fontSize: 14.5, color: "var(--posInk)", marginTop: 6 }}>پیش‌فاکتور به فاکتور</div>
          {sp.length > 1 && (
            <svg viewBox="0 0 260 54" preserveAspectRatio="none" style={{ width: "100%", height: 44, display: "block", marginTop: 10, overflow: "visible" }}>
              <path d={sparkPath} fill="none" stroke={colors.pos} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={tip.x} cy={tip.y} r={3.4} fill={colors.pos} />
            </svg>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="sd-ministat">
            <span style={{ fontSize: 14, color: "var(--ink2)" }}>سرنخ نیازمند پیگیری</span>
            <span className="sd-num" style={{ fontSize: 17, fontWeight: 600 }}>{n(needFollow)}</span>
          </div>
          <div className="sd-ministat">
            <span style={{ fontSize: 14, color: "var(--ink2)" }}>فرصت باز در محدوده</span>
            <span className="sd-num" style={{ fontSize: 17, fontWeight: 600 }}>{n(openInScope)}</span>
          </div>
        </div>
      </section>

      <div style={{ gridArea: "map", display: "flex", minWidth: 0 }}>
        <IranMap
          geo={geoShape}
          valuesById={new Map(geo.provinces.map((p) => [p.id, { value: p.revenue, extra: [
            { k: "فرصت باز", v: n(p.openDeals) },
            { k: "نرخ تبدیل", v: p.conversionRate == null ? "—" : `${n(Math.round(p.conversionRate * 100))}%` },
          ] }]))}
          metricLabel="درآمد"
          formatValue={(v) => formatToman(v)}
          selected={selected}
          onSelect={onSelect}
          colors={colors}
        />
      </div>

      <section className="sd-card" style={{ gridArea: "leads", padding: "22px 26px 8px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h3 className="sd-h3">لیدهای جذاب برای پیگیری</h3>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, color: "var(--faint)" }}>{scopeLabel} · امتیازدهی بر پایه پیش‌بینی و سابقه</span>
        </div>
        <div className="sd-leads-header">
          <span>امتیاز</span><span>شرکت</span><span>دلیل اولویت</span><span>ارزش</span><span>کارشناس</span><span>سن سرنخ</span>
        </div>
        {scopedLeads.length === 0 ? (
          <p className="sd-empty">سرنخی در این محدوده یافت نشد</p>
        ) : (
          scopedLeads.map((l) => (
            <div className="sd-lead-row" key={l.dealId}>
              <span className="sd-num" style={{ fontSize: 18, fontWeight: 600, color: risk(l.score) }}>{l.score}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.4 }}>{l.customer}</div>
                <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 2 }}>{pname(l.province)}</div>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.65 }}>{l.reason}</div>
              <span className="sd-num" style={{ fontSize: 15, fontWeight: 600 }}>{formatToman(l.value)}</span>
              <span style={{ fontSize: 13.5, color: "var(--ink2)" }}>{l.owner ?? "—"}</span>
              <span style={{ fontSize: 13, color: "var(--faint)" }}>{ageLabel(l.createdAt)}</span>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
