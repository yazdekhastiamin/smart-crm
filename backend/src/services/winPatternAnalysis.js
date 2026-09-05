import { prisma } from "../config/prisma.js";
import { getIndustryWinRates } from "./priorityEngine.js";

// حداقل تعداد معامله‌ی بسته‌شده در یک بخش تا نرخ برد آن قابل نمایش باشد؛
// کمتر از این، به‌جای عدد گمراه‌کننده «داده کافی نیست» نشان داده می‌شود.
const MIN_SEGMENT_SAMPLE = 3;

// طبق بخش ۳.۴ SPEC: تا این تعداد معامله‌ی بسته‌شده در کل جمع نشده، نتیجه
// باید «روند اولیه» معرفی شود، نه یافته‌ی قطعی.
const CONFIDENT_TOTAL_SAMPLE = 20;

function formatPercent(value) {
  return `${Math.round(value * 100)}٪`;
}

function formatCompactToman(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000)
    return `${(value / 1_000_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} میلیارد تومان`;
  if (abs >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} میلیون تومان`;
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

function average(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function buildSummary({ totalClosedDeals, hasEnoughData, topSegment, bottomSegment, highGroup, lowGroup }) {
  const opener = hasEnoughData
    ? "روند اولیه نشان می‌دهد"
    : `روند اولیه نشان می‌دهد (فقط بر اساس ${totalClosedDeals} معامله‌ی بسته‌شده — هنوز به حجم داده‌ی قابل‌اطمینان نرسیده‌ایم)`;

  const parts = [opener];

  if (!topSegment) {
    return `${opener}؛ اما هنوز هیچ بخش/نوع کسب‌وکاری به حداقل ${MIN_SEGMENT_SAMPLE} معامله‌ی بسته‌شده برای مقایسه نرسیده است.`;
  }

  parts.push(`بخش «${topSegment.industry}» با نرخ برد ${formatPercent(topSegment.winRate)} بهترین عملکرد را دارد`);
  if (bottomSegment && bottomSegment.industry !== topSegment.industry) {
    parts.push(`و بخش «${bottomSegment.industry}» با ${formatPercent(bottomSegment.winRate)} پایین‌ترین را`);
  }

  let sentence = parts.join(" ");
  if (highGroup.count > 0 && lowGroup.count > 0) {
    sentence += `. میانگین ارزش معامله در بخش‌های با نرخ برد بالا ${formatCompactToman(
      highGroup.avgValue
    )} است، در برابر ${formatCompactToman(lowGroup.avgValue)} در بخش‌های با نرخ برد پایین`;
  }

  return sentence + ".";
}

// تحلیل الگوی موفقیت (بخش ۳.۴ SPEC): نرخ برد به تفکیک بخش/نوع کسب‌وکار،
// به‌علاوه‌ی مقایسه‌ی میانگین ارزش معامله بین بخش‌های با نرخ برد بالا و پایین.
// همان getIndustryWinRates که priorityEngine برای امتیازدهی داخلی می‌سازد
// اینجا مستقیماً برای نمایش به مدیر استفاده می‌شود، نه یک محاسبه‌ی موازی.
export async function getWinPatternAnalysis() {
  const closedDeals = await prisma.deal.findMany({
    where: { status: { in: ["won", "lost"] } },
    select: { industry: true, status: true, value: true },
  });

  const { winRates, baseline } = await getIndustryWinRates();

  const byIndustry = new Map();
  for (const deal of closedDeals) {
    const key = deal.industry || "(نامشخص)";
    const bucket = byIndustry.get(key) ?? { values: [] };
    bucket.values.push(deal.value);
    byIndustry.set(key, bucket);
  }

  const segments = [...byIndustry.entries()].map(([industry, bucket]) => {
    const stats = winRates.get(industry);
    const sampleSize = bucket.values.length;
    const insufficientData = !stats || sampleSize < MIN_SEGMENT_SAMPLE;

    return {
      industry,
      sampleSize,
      winRate: insufficientData ? null : stats.winRate,
      avgValue: insufficientData ? null : Math.round(average(bucket.values)),
      insufficientData,
      insufficientDataMessage: insufficientData ? "داده کافی نیست" : null,
    };
  });

  const reliableSegments = segments.filter((s) => !s.insufficientData);
  reliableSegments.sort((a, b) => b.winRate - a.winRate);

  const highSegments = reliableSegments.filter((s) => s.winRate >= baseline);
  const lowSegments = reliableSegments.filter((s) => s.winRate < baseline);

  const highValues = highSegments.flatMap((s) => byIndustry.get(s.industry).values);
  const lowValues = lowSegments.flatMap((s) => byIndustry.get(s.industry).values);

  const highGroup = {
    industries: highSegments.map((s) => s.industry),
    count: highValues.length,
    avgValue: highValues.length > 0 ? Math.round(average(highValues)) : null,
  };
  const lowGroup = {
    industries: lowSegments.map((s) => s.industry),
    count: lowValues.length,
    avgValue: lowValues.length > 0 ? Math.round(average(lowValues)) : null,
  };

  const hasEnoughData = closedDeals.length >= CONFIDENT_TOTAL_SAMPLE;

  const summary = buildSummary({
    totalClosedDeals: closedDeals.length,
    hasEnoughData,
    topSegment: reliableSegments[0],
    bottomSegment: reliableSegments[reliableSegments.length - 1],
    highGroup,
    lowGroup,
  });

  // مرتب: بخش‌های قابل‌اتکا اول (به ترتیب نرخ برد)، بعد بخش‌های کم‌داده.
  segments.sort((a, b) => {
    if (a.insufficientData !== b.insufficientData) return a.insufficientData ? 1 : -1;
    return (b.winRate ?? 0) - (a.winRate ?? 0);
  });

  return {
    totalClosedDeals: closedDeals.length,
    hasEnoughData,
    overallWinRate: closedDeals.length > 0 ? baseline : null,
    segments,
    highWinRateGroup: highGroup,
    lowWinRateGroup: lowGroup,
    summary,
  };
}
