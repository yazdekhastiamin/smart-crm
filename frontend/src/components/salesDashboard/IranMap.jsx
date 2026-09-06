import { useMemo, useState } from "react";
import * as d3 from "d3";
import { n } from "./format";

const VIEWBOX = { w: 1000, h: 600 };
const FIT = [[24, 18], [976, 582]];

// نقشه‌ی choropleth استان‌های ایران با مرز واقعی (GeoJSON کامل، نه ساده‌شده)
// — دقیقاً همان تصویر طراحی: پروجکشن مرکاتور + رنگ‌آمیزی کوانتایل، برچسب
// ۶ استان برتر، تول‌تیپ هاور، و کلیک برای فیلترکردن کل داشبورد روی آن استان.
export default function IranMap({ geo, valuesById, metricLabel, formatValue, selected, onSelect, colors }) {
  const [hover, setHover] = useState(null);

  const { path, provPaths, provLabels, legend, legendLo, legendHi, pname } = useMemo(() => {
    if (!geo) return { path: null, provPaths: [], provLabels: [], legend: [], legendLo: "—", legendHi: "—", pname: () => "—" };

    const nameById = new Map(geo.features.map((f) => [f.properties.id, f.properties.fa]));
    const pname = (id) => nameById.get(id) ?? "—";

    const allValues = geo.features.map((f) => valuesById.get(f.properties.id)?.value ?? 0);
    const scale = d3.scaleQuantile().domain(allValues).range(colors.ramp);
    const proj = d3.geoMercator().fitExtent(FIT, geo);
    const path = d3.geoPath(proj);

    const provPaths = geo.features.map((f) => {
      const id = f.properties.id;
      const entry = valuesById.get(id);
      const sel = selected === id;
      const hvv = hover === id;
      return {
        id,
        d: path(f),
        fill: entry ? scale(entry.value) : colors.ramp[0],
        stroke: sel ? colors.sel : hvv ? colors.hover : colors.mapEdge,
        sw: sel ? 2 : 1.2,
        op: selected && !sel ? 0.42 : 1,
      };
    });

    const sorted = geo.features
      .filter((f) => valuesById.has(f.properties.id))
      .slice()
      .sort((a, b) => valuesById.get(b.properties.id).value - valuesById.get(a.properties.id).value);

    const provLabels = sorted.slice(0, 6).map((f) => {
      const [x, y] = path.centroid(f);
      const id = f.properties.id;
      const dim = selected && selected !== id;
      const entry = valuesById.get(id);
      return {
        x, y, name: f.properties.fa, val: formatValue(entry.value),
        color: dim ? colors.labDim : colors.lab, valColor: dim ? colors.valDim : colors.val,
      };
    });

    const ext = d3.extent(allValues);
    return {
      path, provPaths, provLabels,
      legend: colors.ramp.map((fill) => ({ fill })),
      legendLo: formatValue(ext[0] ?? 0), legendHi: formatValue(ext[1] ?? 0),
      pname,
    };
  }, [geo, valuesById, selected, hover, colors, formatValue]);

  const hv = hover ? valuesById.get(hover) : null;

  return (
    <section className="sd-card sd-map-card">
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h3 className="sd-h3">توزیع {metricLabel} در استان‌ها</h3>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="sd-legend-label">{legendLo}</span>
          <div style={{ display: "flex", borderRadius: 3, overflow: "hidden" }}>
            {legend.map((c, i) => (
              <i key={i} style={{ width: 20, height: 8, background: c.fill, display: "block" }} />
            ))}
          </div>
          <span className="sd-legend-label">{legendHi}</span>
        </div>
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 360, marginTop: 6 }}>
        <svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} style={{ width: "100%", height: "100%", display: "block" }}>
          {provPaths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth={p.sw}
              opacity={p.op}
              onClick={() => onSelect(selected === p.id ? null : p.id, pname(p.id))}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer", transition: "opacity .16s" }}
            />
          ))}
          <g style={{ pointerEvents: "none" }}>
            {provLabels.map((l, i) => (
              <g key={i}>
                <text x={l.x} y={l.y} fill={l.color} fontSize={14} fontFamily="Estedad, sans-serif" fontWeight={600} textAnchor="middle">
                  {l.name}
                </text>
                <text x={l.x} y={l.y + 17} fill={l.valColor} fontSize={12} fontFamily="Inter, sans-serif" textAnchor="middle">
                  {l.val}
                </text>
              </g>
            ))}
          </g>
        </svg>
        {hv && (
          <div className="sd-map-tooltip">
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 8 }}>{pname(hover)}</div>
            <div className="sd-tooltip-row">
              <span>{metricLabel}</span>
              <span className="sd-tooltip-val">{formatValue(hv.value)}</span>
            </div>
            {hv.extra?.map((row, i) => (
              <div className="sd-tooltip-row" key={i}>
                <span>{row.k}</span>
                <span className="sd-tooltip-val">{row.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function formatCompactBillions(tomanValue) {
  return `${n(tomanValue / 1_000_000_000, 2)}B`;
}
