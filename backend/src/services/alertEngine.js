import { prisma } from "../config/prisma.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// آستانه‌ی «چند روز بدون تعامل یعنی هشدار»، بر اساس winProbability پایه‌ی
// مرحله — هر چه معامله به بسته‌شدن نزدیک‌تر باشد (مرحله‌ای با نرخ تبدیل
// بالاتر)، زودتر باید هشدار بدهیم؛ سرنخ‌های اولیه فرصت بیشتری دارند.
// با مقادیر پیش‌فرض مراحل (۱۰٪/۳۵٪/۶۰٪/۸۰٪) نتیجه می‌شود: ۱۴/۱۰/۷/۵ روز.
const FOLLOW_UP_THRESHOLDS = [
  { minWinProbability: 0.7, maxDaysSinceActivity: 5 },
  { minWinProbability: 0.5, maxDaysSinceActivity: 7 },
  { minWinProbability: 0.2, maxDaysSinceActivity: 10 },
  { minWinProbability: 0, maxDaysSinceActivity: 14 },
];

// افت این مقدار یا بیشتر در probability نسبت به محاسبه‌ی قبلی، هشدار می‌سازد.
const PROBABILITY_DROP_THRESHOLD = 0.1;

function daysBetween(later, earlier) {
  return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

function thresholdFor(winProbability) {
  return FOLLOW_UP_THRESHOLDS.find((row) => winProbability >= row.minWinProbability).maxDaysSinceActivity;
}

// بزرگ‌ترین آستانه (سرنخ‌های اولیه) — فقط برای نرمال‌سازی امتیاز اولویت در sort.
const MAX_THRESHOLD_DAYS = Math.max(...FOLLOW_UP_THRESHOLDS.map((row) => row.maxDaysSinceActivity));

function formatPercent(value) {
  return `${Math.round(value * 100)}٪`;
}

// لیست معاملات باز که امروز نیاز به پیگیری دارند، هر کدام با یک دلیل کوتاه.
// فقط وضعیت فعلی (probability/previousProbability) را می‌خواند — خودش
// دوباره امتیازدهی نمی‌کند، چون آن مسئولیت forecastEngine است.
export async function getFollowUpAlerts() {
  const deals = await prisma.deal.findMany({
    where: { status: "open" },
    include: { contact: true, stage: true, activities: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const now = new Date();
  const alerts = [];

  for (const deal of deals) {
    const lastActivityAt = deal.activities[0]?.createdAt ?? deal.createdAt;
    const daysSinceActivity = daysBetween(now, lastActivityAt);
    const threshold = thresholdFor(deal.stage.winProbability);
    const isOverdue = daysSinceActivity >= threshold;

    const probabilityDrop =
      deal.previousProbability != null ? deal.previousProbability - deal.probability : 0;
    const hasProbabilityDrop = probabilityDrop >= PROBABILITY_DROP_THRESHOLD;

    if (!isOverdue && !hasProbabilityDrop) continue;

    const reasons = [];
    if (isOverdue) reasons.push(`${daysSinceActivity} روزه تماس نگرفتی`);
    if (hasProbabilityDrop) {
      reasons.push(
        `احتمال بسته‌شدن از ${formatPercent(deal.previousProbability)} به ${formatPercent(deal.probability)} افت کرده`
      );
    }

    alerts.push({
      dealId: deal.id,
      title: deal.title,
      customer: deal.contact.name,
      stage: deal.stage.name,
      value: deal.value,
      probability: deal.probability,
      daysSinceActivity,
      probabilityDrop: hasProbabilityDrop ? probabilityDrop : 0,
      reason: reasons.join(" و "),
    });
  }

  // اولویت با معاملاتی که هم راکد مانده‌اند و هم افت امتیاز داشته‌اند،
  // بعد بر اساس شدت هر سیگنال (نسبت به آستانه‌ی خودش).
  alerts.sort((a, b) => {
    const scoreA = a.daysSinceActivity / MAX_THRESHOLD_DAYS + a.probabilityDrop * 5;
    const scoreB = b.daysSinceActivity / MAX_THRESHOLD_DAYS + b.probabilityDrop * 5;
    return scoreB - scoreA;
  });

  return alerts;
}
