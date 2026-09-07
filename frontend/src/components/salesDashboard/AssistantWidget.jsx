import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../../services/api";
import { n } from "./format";

const STRINGS = {
  fa: {
    title: "دستیار هوشمند",
    placeholder: "مثلاً: این ماه چند تا فروش داشتیم؟",
    send: "پرسیدن",
    thinking: "در حال بررسی داده‌ها…",
    hint: "بر اساس داده‌ی واقعی همین CRM جواب می‌دهد.",
    error: "پاسخی دریافت نشد.",
    cachedBadge: "پاسخ ذخیره‌شده",
  },
  en: {
    title: "Smart assistant",
    placeholder: "e.g. How many sales did we close this month?",
    send: "Ask",
    thinking: "Checking the data…",
    hint: "Answers using this CRM's real data.",
    error: "No response received.",
    cachedBadge: "Cached answer",
  },
};

function ChartBlock({ chart }) {
  if (!chart) return null;
  if (chart.type === "number") {
    return (
      <div className="sd-assistant-number">
        <div className="sd-num" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-.03em" }}>
          {n(chart.value ?? 0)}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {chart.title}
          {chart.unit ? ` (${chart.unit})` : ""}
        </div>
      </div>
    );
  }

  if (!chart.points?.length) return null;
  const Chart = chart.type === "bar" ? BarChart : LineChart;
  const Mark = chart.type === "bar" ? Bar : Line;

  return (
    <div className="sd-assistant-chart">
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
        {chart.title}
        {chart.unit ? ` (${chart.unit})` : ""}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <Chart data={chart.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--faint)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--faint)" }} width={36} />
          <Tooltip contentStyle={{ background: "var(--card2)", border: "1px solid var(--line)", fontSize: 12 }} />
          <Mark dataKey="value" fill="var(--accent)" stroke="var(--accent)" strokeWidth={2} dot={false} />
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AssistantWidget({ language = "fa" }) {
  const t = STRINGS[language] ?? STRINGS.fa;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.assistant.chat(question, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply || t.error, chart: res.chart, cached: !!res.cached },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: err.message || t.error, chart: null }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sd-card sd-assistant">
      <h3 className="sd-h3">{t.title}</h3>
      {messages.length > 0 && (
        <div className="sd-assistant-messages">
          {messages.map((m, i) => (
            <div key={i} className={`sd-assistant-msg sd-assistant-msg-${m.role}`}>
              {m.cached && <span className="sd-assistant-cached-badge">{t.cachedBadge}</span>}
              <div className="sd-assistant-bubble">{m.content}</div>
              {m.role === "assistant" && <ChartBlock chart={m.chart} />}
            </div>
          ))}
          {loading && <div className="sd-assistant-msg sd-assistant-msg-assistant"><div className="sd-assistant-bubble sd-assistant-thinking">{t.thinking}</div></div>}
        </div>
      )}
      <form onSubmit={handleSubmit} className="sd-assistant-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>{t.send}</button>
      </form>
      {messages.length === 0 && <p className="sd-assistant-hint">{t.hint}</p>}
    </section>
  );
}
