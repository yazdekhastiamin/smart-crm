import { prisma } from "../config/prisma.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// تا حجم معاملات بسته‌ی کافی جمع نشده، این عدد جایگزین میانگین چرخه‌ی
// فروش واقعی می‌شود (جلوگیری از تقسیم بر صفر و از نوسان شدید با داده‌ی کم).
const DEFAULT_CYCLE_DAYS = 30;

const MIN_PROBABILITY = 0.02;
const MAX_PROBABILITY = 0.95;

// تعدیل احتمال بر اساس تعداد روز از آخرین تعامل (بخش ۳.۱ SPEC).
// هر ردیف یعنی: «اگر حداکثر تا این تعداد روز بوده، این تعدیل اعمال شود».
const RECENCY_ADJUSTMENTS = [
  { maxDays: 3, adjustment: 0.05 },
  { maxDays: 7, adjustment: 0 },
  { maxDays: 14, adjustment: -0.08 },
  { maxDays: 30, adjustment: -0.15 },
  { maxDays: Infinity, adjustment: -0.25 },
];

// تعدیل احتمال بر اساس نسبت «سن معامله از تاریخ ایجاد» به «میانگین چرخه‌ی
// فروش تاریخی» — نسبت کمتر از ۱ یعنی معامله سریع‌تر از حد معمول پیش می‌رود.
const SPEED_ADJUSTMENTS = [
  { maxRatio: 0.5, adjustment: 0.08 },
  { maxRatio: 1.0, adjustment: 0.03 },
  { maxRatio: 1.5, adjustment: -0.05 },
  { maxRatio: 2.0, adjustment: -0.12 },
  { maxRatio: Infinity, adjustment: -0.2 },
];

function pickAdjustment(table, value, key) {
  return table.find((row) => value <= row[key]).adjustment;
}

function daysBetween(later, earlier) {
  return (later.getTime() - earlier.getTime()) / MS_PER_DAY;
}

// تابع خالص (بدون I/O) تا قابل تست و تنظیم مجزا از دیتابیس باشد.
export function calculateProbability({ baseProbability, createdAt, lastActivityAt, avgCycleDays, now = new Date() }) {
  const daysSinceActivity = daysBetween(now, lastActivityAt ?? createdAt);
  const ageDays = daysBetween(now, createdAt);
  const cycleRatio = ageDays / (avgCycleDays || DEFAULT_CYCLE_DAYS);

  const recencyAdjustment = pickAdjustment(RECENCY_ADJUSTMENTS, daysSinceActivity, "maxDays");
  const speedAdjustment = pickAdjustment(SPEED_ADJUSTMENTS, cycleRatio, "maxRatio");

  const raw = baseProbability + recencyAdjustment + speedAdjustment;
  return Math.min(MAX_PROBABILITY, Math.max(MIN_PROBABILITY, raw));
}

// میانگین طول چرخه‌ی فروش (روز) از معاملات بسته‌شده‌ی واقعی (برد و باخت).
export async function getAverageCycleDays() {
  const closedDeals = await prisma.deal.findMany({
    where: { status: { in: ["won", "lost"] } },
    select: { createdAt: true, updatedAt: true },
  });
  if (closedDeals.length === 0) return DEFAULT_CYCLE_DAYS;

  const totalDays = closedDeals.reduce((sum, deal) => sum + daysBetween(deal.updatedAt, deal.createdAt), 0);
  return totalDays / closedDeals.length;
}

async function loadOpenDeal(dealId) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: { stage: true, activities: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
}

function dealProbability(deal, avgCycleDays) {
  return calculateProbability({
    baseProbability: deal.stage.winProbability,
    createdAt: deal.createdAt,
    lastActivityAt: deal.activities[0]?.createdAt,
    avgCycleDays,
  });
}

// یک معامله‌ی باز را دوباره امتیازدهی و روی probability پایدار می‌کند.
// روی معاملات بسته‌شده اثری ندارد (probability آن‌ها همان ۱/۰ نهایی است).
export async function recalculateDealProbability(dealId) {
  const deal = await loadOpenDeal(dealId);
  if (!deal || deal.status !== "open") return deal ?? null;

  const avgCycleDays = await getAverageCycleDays();
  const probability = dealProbability(deal, avgCycleDays);

  return prisma.deal.update({ where: { id: dealId }, data: { probability } });
}

export async function recalculateOpenDealProbabilities() {
  const avgCycleDays = await getAverageCycleDays();
  const openDeals = await prisma.deal.findMany({
    where: { status: "open" },
    include: { stage: true, activities: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const updated = [];
  for (const deal of openDeals) {
    const probability = dealProbability(deal, avgCycleDays);
    updated.push(await prisma.deal.update({ where: { id: deal.id }, data: { probability } }));
  }
  return updated;
}

// پیش‌بینی کل قیف = مجموع (ارزش × احتمال) همه‌ی معاملات باز (بخش ۳.۱ SPEC).
// قبل از جمع زدن، احتمال هر معامله را تازه می‌کند تا عدد همیشه به‌روز باشد.
export async function getPipelineForecast() {
  const deals = await recalculateOpenDealProbabilities();
  const totalForecast = deals.reduce((sum, deal) => sum + deal.value * deal.probability, 0);

  return {
    totalForecast,
    openDealsCount: deals.length,
    generatedAt: new Date().toISOString(),
  };
}
