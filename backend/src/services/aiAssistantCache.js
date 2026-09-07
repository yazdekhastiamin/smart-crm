// چون در سطح رایگان Gemini سقف روزانه‌ی خیلی محدودی داریم (برای دمو، نه
// production نهایی)، این ماژول دو چیز را مدیریت می‌کند:
// ۱. کش پاسخ‌ها در حافظه (بدون نیاز به دیتابیس جدا) — اگر سوالی دقیقاً یا
//    خیلی شبیه قبلاً پرسیده شده، پاسخ ذخیره‌شده برمی‌گردد، بدون فراخوانی Gemini.
// ۲. شمارنده‌ی داخلی درخواست‌های واقعی به Gemini در روز جاری (به وقت ایران)
//    — با یک سقف محافظه‌کارانه‌تر از سقف واقعی گوگل، تا حاشیه‌ی امن داشته باشیم.
import { SEED_QA } from "./aiAssistantSeedData.js";

const DAILY_LIMIT = 15;
const SIMILARITY_THRESHOLD = 0.6;

const cache = []; // { normalized, question, reply, chart, seeded }
for (const qa of SEED_QA) {
  cache.push({ normalized: normalize(qa.question), question: qa.question, reply: qa.reply, chart: qa.chart, seeded: true });
}
let dailyCount = 0;
let dailyKey = todayKey();

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
}

function normalize(text) {
  return text
    .trim()
    .replace(/[؟?!.،,]/g, "")
    .replace(/\s+/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLowerCase();
}

function tokenSet(text) {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

function similarity(a, b) {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let intersect = 0;
  for (const w of sa) if (sb.has(w)) intersect++;
  const union = sa.size + sb.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

export function findCached(question) {
  const normalized = normalize(question);
  const exact = cache.find((c) => c.normalized === normalized);
  if (exact) return exact;

  let best = null;
  let bestScore = 0;
  for (const entry of cache) {
    const score = similarity(question, entry.question);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= SIMILARITY_THRESHOLD ? best : null;
}

export function storeInCache(question, reply, chart, { seeded = false } = {}) {
  cache.push({ normalized: normalize(question), question, reply, chart, seeded });
}

function resetIfNewDay() {
  const key = todayKey();
  if (key !== dailyKey) {
    dailyKey = key;
    dailyCount = 0;
  }
}

export function hasQuotaLeft() {
  resetIfNewDay();
  return dailyCount < DAILY_LIMIT;
}

export function recordRealCall() {
  resetIfNewDay();
  dailyCount += 1;
}

export function quotaStatus() {
  resetIfNewDay();
  return { used: dailyCount, limit: DAILY_LIMIT, day: dailyKey };
}

// فقط برای seed اولیه/تست از بیرون این ماژول لازم است کش را خالی کنیم.
export function _clearCacheForTests() {
  cache.length = 0;
}
