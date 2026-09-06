import { prisma } from "../config/prisma.js";
import { getProvinceId } from "../utils/provinceMap.js";

// چون تقویم جلالی برای گروه‌بندی ماهانه نیاز به محاسبه‌ی دقیق تبدیل تاریخ
// دارد و کتابخانه‌ای برای آن نصب نیست، این تابع فقط برای *نمایش* نام ماه
// از toLocaleDateString("fa-IR") استفاده می‌کند — کلید گروه‌بندی همچنان
// بر پایه‌ی سال/ماه میلادی (createdAt واقعی رکوردها) است، صرفاً برچسبش فارسی است.
function monthLabel(date) {
  return new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(date);
}

function monthShortLabel(date) {
  return new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(date);
}

// برای حالت نمایش انگلیسی صفحه (بدون تبدیل تقویم، چون تاریخ رکوردها خودش میلادی است).
function monthShortLabelEn(date) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// خلاصه‌ی جغرافیایی برای نقشه‌ی استان‌ها (بخش «پوشش جغرافیایی» داشبورد):
// - revenue: مجموع (ارزش × احتمال) معاملات باز آن استان — همان منطق forecastEngine.
// - openDeals: تعداد معاملات باز آن استان.
// - conversionRate: نرخ برد از بین معاملات بسته‌شده‌ی آن استان (null یعنی هنوز داده‌ی کافی نیست).
// به‌علاوه‌ی روند فروش ماهانه (معاملات برده‌شده، بر اساس آخرین تاریخ به‌روزرسانی/بسته‌شدن)
// برای نمودار میله‌ای — فقط تا جایی که داده‌ی واقعی وجود دارد (حداکثر ۱۲ ماه اخیر).
export async function getGeoAnalysis() {
  const deals = await prisma.deal.findMany({
    include: { contact: true },
  });

  const byProvince = new Map();
  function bucket(id) {
    if (!byProvince.has(id)) {
      byProvince.set(id, { openRevenue: 0, openDeals: 0, won: 0, lost: 0 });
    }
    return byProvince.get(id);
  }

  for (const deal of deals) {
    const province = getProvinceId(deal.contact?.city);
    if (!province) continue;
    const b = bucket(province);
    if (deal.status === "open") {
      b.openRevenue += deal.value * deal.probability;
      b.openDeals += 1;
    } else if (deal.status === "won") {
      b.won += 1;
    } else if (deal.status === "lost") {
      b.lost += 1;
    }
  }

  const provinces = Array.from(byProvince.entries()).map(([id, b]) => ({
    id,
    revenue: Math.round(b.openRevenue),
    openDeals: b.openDeals,
    conversionRate: b.won + b.lost > 0 ? b.won / (b.won + b.lost) : null,
  }));

  // فروش ماهانه = مجموع ارزش معاملات برده‌شده، بر اساس ماه به‌روزرسانی
  // (همان لحظه‌ای که معامله به مرحله‌ی «بسته - برد» منتقل شده) — هم در کل
  // کشور، هم به‌ازای هر استان (برای وقتی کاربر یک استان را فیلتر می‌کند).
  function buildMonthly(dealsSubset) {
    const map = new Map();
    for (const deal of dealsSubset) {
      if (deal.status !== "won") continue;
      const key = monthKey(deal.updatedAt);
      if (!map.has(key)) map.set(key, { key, date: deal.updatedAt, revenue: 0 });
      map.get(key).revenue += deal.value;
    }
    return Array.from(map.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12)
      .map((m) => ({
        month: m.key,
        label: monthLabel(m.date),
        shortLabel: monthShortLabel(m.date),
        shortLabelEn: monthShortLabelEn(m.date),
        revenue: Math.round(m.revenue),
      }));
  }

  const monthly = buildMonthly(deals);
  const monthlyByProvince = {};
  for (const id of byProvince.keys()) {
    monthlyByProvince[id] = buildMonthly(deals.filter((d) => getProvinceId(d.contact?.city) === id));
  }

  return { provinces, monthly, monthlyByProvince };
}
