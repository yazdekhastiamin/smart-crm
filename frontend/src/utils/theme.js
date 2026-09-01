// چهار توکن اصلی برند/وضعیت که هر دو تم را با هم اعتبارسنجی می‌کنند — منبع
// واقعی رندر CSS (index.css :root) است؛ این‌ها فقط برای Recharts لازم‌اند
// چون رنگ آنجا یک prop جاوااسکریپتی است، نه یک مقدار CSS قابل وراثت.
export const BRAND_TOKENS = {
  light: {
    ink: "#20242b",
    page: "#f1f2f4",
    surface: "#ffffff",
    teal: "#1c4a52",
    amber: "#bd7526",
    good: "#1f8f72",
    warning: "#a67807",
    critical: "#a83226",
  },
  dark: {
    ink: "#edeef0",
    page: "#121417",
    surface: "#20242b",
    teal: "#1f525c",
    amber: "#e3a75c",
    good: "#1f8f72",
    warning: "#a67807",
    critical: "#a83226",
  },
};

export function statusColors(theme) {
  const t = BRAND_TOKENS[theme] ?? BRAND_TOKENS.light;
  return { good: t.good, warning: t.warning, critical: t.critical };
}

// رنگ خط/ناحیه‌ی نمودار روند — همان amber برند هر تم (روی سطح روشن، امبر
// عمیق کافی است؛ روی سطح تیره باید tint روشن‌تر باشد تا خوانا بماند).
export function trendLineColor(theme) {
  return (BRAND_TOKENS[theme] ?? BRAND_TOKENS.light).amber;
}

// رمپ تک‌رنگ (amber) روشن به تیره برای مراحل باز قیف — ترتیب مراحل معنادار
// است (ordinal)، پس رنگ عمیق‌تر یعنی نزدیک‌تر به بسته‌شدن. هر دو رمپ با
// validate_palette.js (اسکیل dataviz، --ordinal) روی سطح خودشان تأیید شده‌اند؛
// رمپ تیره فقط از میانه‌ی روشن‌تر همان طیف استفاده می‌کند چون پله‌ی خیلی تیره
// روی سطح تیره ناخوانا می‌شود (نکته‌ی خود اسکیل درباره‌ی رمپ‌های ordinal).
export const STAGE_RAMP_LIGHT = ["#ce9c5c", "#b87f3a", "#9c6425", "#7a4a16"];
export const STAGE_RAMP_DARK = ["#f4ac68", "#d6904b", "#b8742d", "#9b5a02"];

export function stageRamp(theme) {
  return theme === "dark" ? STAGE_RAMP_DARK : STAGE_RAMP_LIGHT;
}
