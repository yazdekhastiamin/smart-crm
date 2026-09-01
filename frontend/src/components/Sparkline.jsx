import { LineChart, Line, ResponsiveContainer } from "recharts";

// اسپارک‌لاین کوچک بدون axis/tooltip — فقط برای حس «زنده و دیتامحور» کارت KPI.
export default function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div className="kpi-sparkline" />;

  return (
    <div className="kpi-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((value) => ({ value }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
