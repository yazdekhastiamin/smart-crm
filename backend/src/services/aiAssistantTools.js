// توابع «امن» که دستیار هوشمند (Gemini) اجازه دارد صدا بزند — هرکدام
// همان منطق سرویس‌های موجود (forecastEngine/alertEngine/geoAnalysis) را
// دوباره استفاده می‌کنند، نه کوئری SQL مستقیم و آزاد. Gemini هیچ‌وقت به
// دیتابیس دسترسی مستقیم ندارد، فقط می‌تواند از بین همین چند تابع
// از‌پیش‌تعریف‌شده انتخاب کند.
import { prisma } from "../config/prisma.js";
import { getPipelineForecast, getForecastHistory } from "./forecastEngine.js";
import { getFollowUpAlerts } from "./alertEngine.js";
import { getGeoAnalysis } from "./geoAnalysis.js";
import { getProvinceId, getProvinceName } from "../utils/provinceMap.js";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function monthRangeFor(monthStr) {
  // monthStr به فرمت "YYYY-MM"
  const [y, m] = monthStr.split("-").map(Number);
  if (!y || !m) return currentMonthRange();
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

// مجموع درآمد معاملات برده‌شده در یک بازه‌ی ماهانه، به‌صورت اختیاری فیلترشده
// بر اساس استان (از روی شهر مخاطب هر معامله).
export async function getRevenueByPeriod({ month, province } = {}) {
  const { start, end } = month ? monthRangeFor(month) : currentMonthRange();

  const wonDeals = await prisma.deal.findMany({
    where: { status: "won", updatedAt: { gte: start, lt: end } },
    include: { contact: true },
  });

  const filtered = province
    ? wonDeals.filter((d) => getProvinceId(d.contact?.city) === province)
    : wonDeals;

  return {
    period: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    province: province ? getProvinceName(province) : "کل کشور",
    wonDealsCount: filtered.length,
    wonRevenueToman: Math.round(filtered.reduce((s, d) => s + d.value, 0)),
  };
}

// نرخ تبدیل فعلی (پیش‌فاکتور به فاکتور) به‌علاوه‌ی روند چند روز اخیر.
export async function getConversionRate({ days = 30 } = {}) {
  const forecast = await getPipelineForecast();
  const history = await getForecastHistory(days);
  return {
    currentConversionRate: forecast.conversionRate,
    days,
    trend: history.map((h) => ({
      date: h.date.toISOString().slice(0, 10),
      conversionRate: h.conversionRate,
    })),
  };
}

// سرنخ‌هایی که امروز نیاز به پیگیری دارند (راکد مانده یا افت احتمال داشته‌اند).
export async function getFollowUpLeads() {
  const alerts = await getFollowUpAlerts();
  return {
    count: alerts.length,
    leads: alerts.slice(0, 10).map((a) => ({
      customer: a.customer,
      stage: a.stage,
      valueToman: a.value,
      daysSinceActivity: a.daysSinceActivity,
      reason: a.reason,
    })),
  };
}

// معاملات باز در یک مرحله‌ی مشخص از قیف فروش (یا خلاصه‌ی همه‌ی مراحل اگر
// نامی داده نشود).
export async function getDealsByStage({ stage } = {}) {
  const deals = await prisma.deal.findMany({
    where: { status: "open" },
    include: { contact: true, stage: true },
  });

  if (!stage) {
    const byStage = new Map();
    for (const d of deals) {
      const s = byStage.get(d.stage.name) ?? { stage: d.stage.name, count: 0, totalValueToman: 0 };
      s.count += 1;
      s.totalValueToman += d.value;
      byStage.set(d.stage.name, s);
    }
    return { stages: Array.from(byStage.values()) };
  }

  const matched = deals.filter((d) => d.stage.name.includes(stage));
  return {
    stage,
    count: matched.length,
    totalValueToman: Math.round(matched.reduce((s, d) => s + d.value, 0)),
    deals: matched
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((d) => ({ customer: d.contact?.name, valueToman: d.value, probability: d.probability })),
  };
}

// رتبه‌بندی استان‌ها بر اساس یکی از این معیارها: revenue (درآمد پیش‌بینی‌شده‌ی
// معاملات باز)، openDeals (تعداد فرصت باز)، conversionRate (نرخ برد).
export async function getTopProvinces({ metric = "revenue" } = {}) {
  const { provinces } = await getGeoAnalysis();
  const key = ["revenue", "openDeals", "conversionRate"].includes(metric) ? metric : "revenue";

  const sorted = provinces
    .filter((p) => p[key] != null)
    .sort((a, b) => b[key] - a[key])
    .slice(0, 5)
    .map((p) => ({
      province: getProvinceName(p.id),
      revenueToman: p.revenue,
      openDeals: p.openDeals,
      conversionRate: p.conversionRate,
    }));

  return { metric: key, topProvinces: sorted };
}

export const TOOL_IMPLEMENTATIONS = {
  getRevenueByPeriod,
  getConversionRate,
  getFollowUpLeads,
  getDealsByStage,
  getTopProvinces,
};
