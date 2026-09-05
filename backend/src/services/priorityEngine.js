import { prisma } from "../config/prisma.js";
import { recalculateOpenDealProbabilities } from "./forecastEngine.js";

// اولویت‌بندی لیدها (بخش ۳.۳ SPEC): «کدام لید را الان پیگیری کنم؟»
// سه عامل با وزن‌های زیر ترکیب می‌شوند. امتیاز پیش‌بینی بیشترین وزن را دارد
// چون تازه‌ترین سیگنال (مرحله + تازگی تعامل + سرعت پیشرفت) از forecastEngine
// می‌آید؛ شباهت به معاملات موفق قبلی و ارزش ریالی مکمل آن هستند.
const PROBABILITY_WEIGHT = 0.45;
const SIMILARITY_WEIGHT = 0.3;
const VALUE_WEIGHT = 0.25;

// حداقل تعداد معامله‌ی بسته‌شده‌ی تاریخی در یک بخش/نوع کسب‌وکار تا نرخ برد
// آن قابل اتکا باشد؛ کمتر از این، نرخ برد کلی (baseline) جایگزین می‌شود تا
// با داده‌ی کم به مدیر گمراه‌کننده نمایش داده نشود.
const MIN_INDUSTRY_SAMPLE = 2;

// آستانه‌ای که بالاتر از آن یک عامل «قابل ذکر در دلیل کوتاه» شمرده می‌شود.
const NOTABLE_THRESHOLD = 0.6;

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

// نرخ برد هر بخش/نوع کسب‌وکار از معاملات بسته‌شده‌ی تاریخی (برد و باخت)،
// به‌علاوه‌ی نرخ برد کلی به‌عنوان baseline برای بخش‌هایی که داده‌ی کافی ندارند.
async function getIndustryWinRates() {
  const closedDeals = await prisma.deal.findMany({
    where: { status: { in: ["won", "lost"] } },
    select: { industry: true, status: true },
  });

  const byIndustry = new Map();
  let totalWon = 0;
  for (const deal of closedDeals) {
    if (deal.status === "won") totalWon++;
    if (!deal.industry) continue;
    const stats = byIndustry.get(deal.industry) ?? { won: 0, total: 0 };
    stats.total++;
    if (deal.status === "won") stats.won++;
    byIndustry.set(deal.industry, stats);
  }

  const baseline = closedDeals.length > 0 ? totalWon / closedDeals.length : 0;
  const winRates = new Map();
  for (const [industry, stats] of byIndustry) {
    winRates.set(industry, { winRate: stats.won / stats.total, sampleSize: stats.total });
  }
  return { winRates, baseline };
}

function similarityFor(industry, { winRates, baseline }) {
  const stats = industry ? winRates.get(industry) : undefined;
  if (stats && stats.sampleSize >= MIN_INDUSTRY_SAMPLE) {
    return { score: stats.winRate, industry, sampleSize: stats.sampleSize, isBaseline: false };
  }
  return { score: baseline, industry, sampleSize: stats?.sampleSize ?? 0, isBaseline: true };
}

// نرمال‌سازی ارزش هر معامله نسبت به بقیه‌ی فرصت‌های باز فعلی (min-max) — چون
// هدف مقایسه‌ی نسبی «کدام لید را الان پیگیری کنم» است، نه یک آستانه‌ی مطلق.
function normalizeValues(deals) {
  const values = deals.map((deal) => deal.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return deals.map(() => 1);
  return deals.map((deal) => (deal.value - min) / (max - min));
}

// دلیل کوتاه فارسی: عامل‌هایی که از آستانه‌ی «قابل توجه» عبور کرده‌اند را
// بر اساس سهم واقعی‌شان در امتیاز نهایی مرتب می‌کند و دو تای برتر را برمی‌گرداند.
// شباهت به بخش مشابه فقط وقتی ذکر می‌شود که از baseline استفاده نشده باشد
// (یعنی واقعاً داده‌ی کافی برای آن بخش داشتیم).
function buildReason({ probabilityScore, similarity, valueScore, value }) {
  const reasons = [];
  if (probabilityScore >= NOTABLE_THRESHOLD) {
    reasons.push({
      weight: probabilityScore * PROBABILITY_WEIGHT,
      text: `احتمال بسته‌شدن بالا (${formatPercent(probabilityScore)})`,
    });
  }
  if (!similarity.isBaseline && similarity.score >= NOTABLE_THRESHOLD) {
    reasons.push({
      weight: similarity.score * SIMILARITY_WEIGHT,
      text: `بخش «${similarity.industry}» نرخ برد بالایی داره (${formatPercent(similarity.score)})`,
    });
  }
  if (valueScore >= NOTABLE_THRESHOLD) {
    reasons.push({ weight: valueScore * VALUE_WEIGHT, text: `ارزش بالا (${formatCompactToman(value)})` });
  }

  if (reasons.length === 0) {
    return "ترکیب امتیاز پیش‌بینی، سابقه‌ی بخش مشابه و ارزش این فرصت را نسبت به بقیه بالاتر برده";
  }

  reasons.sort((a, b) => b.weight - a.weight);
  return reasons
    .slice(0, 2)
    .map((r) => r.text)
    .join(" + ");
}

// رتبه‌بندی فرصت‌های باز بر اساس امتیاز پیش‌بینی + شباهت به معاملات موفق
// قبلی + ارزش ریالی (بخش ۳.۳ SPEC). قبل از رتبه‌بندی، احتمال هر معامله را
// تازه می‌کند (همان مسئولیت forecastEngine) تا عدد همیشه به‌روز باشد.
export async function getDealPriorityRanking() {
  await recalculateOpenDealProbabilities();

  const deals = await prisma.deal.findMany({
    where: { status: "open" },
    include: { contact: true, stage: true },
  });
  if (deals.length === 0) return [];

  const industryStats = await getIndustryWinRates();
  const valueScores = normalizeValues(deals);

  const ranked = deals.map((deal, index) => {
    const probabilityScore = deal.probability;
    const similarity = similarityFor(deal.industry, industryStats);
    const valueScore = valueScores[index];

    const finalScore =
      PROBABILITY_WEIGHT * probabilityScore + SIMILARITY_WEIGHT * similarity.score + VALUE_WEIGHT * valueScore;

    return {
      dealId: deal.id,
      title: deal.title,
      customer: deal.contact.name,
      stage: deal.stage.name,
      industry: deal.industry,
      value: deal.value,
      probability: probabilityScore,
      similarityScore: similarity.score,
      score: Math.round(finalScore * 100),
      reason: buildReason({ probabilityScore, similarity, valueScore, value: deal.value }),
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}
