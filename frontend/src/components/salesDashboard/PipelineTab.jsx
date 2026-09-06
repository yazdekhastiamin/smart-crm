import { useEffect, useState } from "react";
import { api } from "../../services/api";
import NewDealModal from "../NewDealModal";
import DealDetailModal from "../DealDetailModal";
import { n } from "./format";

const riskColor = (prob) => (prob >= 0.7 ? "var(--pos)" : prob >= 0.45 ? "var(--accent)" : "var(--accentDeep)");

export default function PipelineTab({ refreshToken, onChanged }) {
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [error, setError] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState(null);

  useEffect(() => {
    Promise.all([api.stages.list(), api.deals.list()])
      .then(([s, d]) => {
        setStages(s);
        setDeals(d.filter((deal) => deal.status === "open"));
      })
      .catch((err) => setError(err.message));
  }, [refreshToken]);

  if (error) return <p className="form-error">{error}</p>;

  // ترتیب نزولی: چیدمان گرید در صفحه‌ی RTL باعث می‌شود اولین آیتم در DOM
  // سمت چپ قرار بگیرد، پس برای اینکه «سرنخ» (اولین مرحله) سمت راست
  // (شروع خواندن در فارسی) بیفتد، ترتیب DOM باید نزولی باشد.
  const openStages = stages.filter((s) => !s.isWon && !s.isLost).sort((a, b) => b.order - a.order);

  async function handleDrop(stageId) {
    setOverStage(null);
    const id = dragId;
    setDragId(null);
    if (id == null) return;
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stageId === stageId) return;
    await api.deals.updateStage(id, stageId);
    onChanged();
  }

  const totalValue = deals.reduce((s, d) => s + d.value, 0);
  const weightedValue = deals.reduce((s, d) => s + d.value * d.probability, 0);
  const finalStage = openStages.reduce((max, s) => (!max || s.order > max.order ? s : max), null);
  const finalCount = finalStage ? deals.filter((d) => d.stageId === finalStage.id).length : 0;

  const pipeStats = [
    { k: "ارزش کل قیف (میلیارد تومان)", v: n(totalValue / 1_000_000_000, 1) },
    { k: "ارزش وزنی بر پایه احتمال", v: n(weightedValue / 1_000_000_000, 1) },
    { k: "معامله در چانه‌زنی نهایی", v: n(finalCount) },
  ];

  return (
    <main className="sd-pipe">
      <div className="sd-pipe-stats">
        {pipeStats.map((s) => (
          <div className="sd-card sd-pipe-stat" key={s.k}>
            <div className="sd-num" style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 15, color: "var(--ink2)", marginTop: 8 }}>{s.k}</div>
          </div>
        ))}
        <button className="sd-btn-ghost" onClick={() => setShowNewDeal(true)} style={{ padding: "0 22px" }}>
          + فرصت جدید
        </button>
      </div>

      <div className="sd-pipe-columns">
        {openStages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stageId === stage.id);
          const sum = stageDeals.reduce((s, d) => s + d.value, 0);
          return (
            <div
              key={stage.id}
              className="sd-pipe-column"
              style={{ background: overStage === stage.id ? "var(--over)" : "var(--card)", outline: overStage === stage.id ? "2px solid var(--accent)" : "none" }}
              onDragOver={(e) => {
                e.preventDefault();
                if (overStage !== stage.id) setOverStage(stage.id);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(stage.id);
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                <b style={{ fontSize: 15, fontWeight: 700 }}>{stage.name}</b>
                <span style={{ flex: 1 }} />
                <span className="sd-num" style={{ fontSize: 12.5, color: "var(--faint)" }}>{n(stageDeals.length)}</span>
              </div>
              <div className="sd-num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", margin: "6px 0 14px" }}>
                {n(sum / 1_000_000_000, 1)}<span style={{ fontSize: 12.5, fontWeight: 400, color: "var(--faint)" }}> میلیارد تومان</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(deal.id));
                      setDragId(deal.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverStage(null);
                    }}
                    onClick={() => setSelectedDealId(deal.id)}
                    className="sd-deal-card"
                    style={{ borderColor: dragId === deal.id ? "var(--accent)" : "var(--line)", opacity: dragId === deal.id ? 0.5 : 1 }}
                  >
                    <b style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{deal.contact?.name}</b>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.65 }}>{deal.itemDescription || deal.title}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                      <span className="sd-num" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.03em" }}>{n(deal.value / 1_000_000_000, 1)}</span>
                      <span style={{ fontSize: 11.5, color: "var(--faint)" }}>میلیارد تومان</span>
                    </div>
                    <div className="sd-gauge-track sd-gauge-track-thin">
                      <i style={{ width: `${Math.round(deal.probability * 100)}%`, background: riskColor(deal.probability) }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11.5, color: "var(--faint)" }}>
                      <span>احتمال <span className="sd-num" style={{ color: riskColor(deal.probability), fontWeight: 600 }}>{Math.round(deal.probability * 100)}%</span></span>
                      <span>{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString("fa-IR") : "—"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--faint)", paddingTop: 8, borderTop: "1px solid var(--line2)" }}>
                      <span>{deal.contact?.city || "—"}</span><span>·</span><span>{deal.owner?.name || "بدون مسئول"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showNewDeal && (
        <NewDealModal
          stages={stages}
          onClose={() => setShowNewDeal(false)}
          onCreated={() => onChanged()}
        />
      )}
      {selectedDealId && (
        <DealDetailModal dealId={selectedDealId} onClose={() => setSelectedDealId(null)} onChanged={onChanged} />
      )}
    </main>
  );
}
