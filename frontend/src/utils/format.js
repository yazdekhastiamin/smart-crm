export function formatToman(value) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

export function formatPercent(value) {
  return `${Math.round(value * 100)}٪`;
}

export function formatDays(value) {
  return `${Math.round(value).toLocaleString("fa-IR")} روز`;
}

export function formatCount(value) {
  return value.toLocaleString("fa-IR");
}

// اعداد بزرگ (ارزش تومانی) در کارت‌های KPI به‌صورت فشرده — چون هدف اینجا
// برجستگی و خوانایی سریع است، نه دقت ریالی.
export function formatCompactToman(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} میلیارد تومان`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} میلیون تومان`;
  return formatToman(value);
}
