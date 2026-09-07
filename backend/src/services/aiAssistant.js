import { GoogleGenAI, Type } from "@google/genai";
import { TOOL_IMPLEMENTATIONS } from "./aiAssistantTools.js";
import { findCached, storeInCache, hasQuotaLeft, recordRealCall } from "./aiAssistantCache.js";

const QUOTA_EXCEEDED_MESSAGE =
  "سقف پرسش‌های امروز پر شده — فردا دوباره امتحان کنید. (این محدودیت داخلی برای دمو است تا در سهمیه‌ی رایگان Gemini بمانیم.)";

const MODEL = "gemini-3.6-flash";
const MAX_TOOL_ROUNDS = 5;

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY تنظیم نشده است.");
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

// نسخه‌ی اولیه — فقط ۳ تابع داده‌ای (برای تست function calling قبل از
// اضافه‌کردن بقیه‌ی توابع طبق SPEC). presentChart یک «تابع مجازی» است:
// هیچ داده‌ای از دیتابیس نمی‌خواند، فقط ساختار نموداری که مدل پیشنهاد
// می‌دهد را برای فرانت‌اند ضبط می‌کند.
const FUNCTION_DECLARATIONS = [
  {
    name: "getRevenueByPeriod",
    description: "مجموع درآمد معاملات برده‌شده (won) در یک ماه مشخص، به‌صورت اختیاری فیلترشده بر اساس استان.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        month: { type: Type.STRING, description: "ماه به فرمت YYYY-MM (میلادی). اگر ذکر نشود، ماه جاری در نظر گرفته می‌شود." },
        province: { type: Type.STRING, description: "کد استان مثل IR.TH برای تهران، IR.ES برای اصفهان و غیره. اگر کاربر نام فارسی استان را گفت، آن را به این کدها تبدیل کن." },
      },
    },
  },
  {
    name: "getConversionRate",
    description: "نرخ تبدیل فعلی (درصد پیش‌فاکتور به فاکتور) و روند آن در چند روز اخیر.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        days: { type: Type.NUMBER, description: "تعداد روزهای اخیر برای روند (پیش‌فرض ۳۰)." },
      },
    },
  },
  {
    name: "getFollowUpLeads",
    description: "لیست سرنخ‌ها/معاملاتی که امروز نیاز به پیگیری دارند (راکد مانده یا افت احتمال داشته‌اند).",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "getDealsByStage",
    description: "معاملات باز در یک مرحله‌ی مشخص از قیف فروش (مثل «سرنخ»، «مذاکره»، «پیش‌فاکتور ارسال‌شده»، «چانه‌زنی نهایی»)؛ اگر مرحله ذکر نشود، خلاصه‌ی تعداد و ارزش هر مرحله برمی‌گردد.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        stage: { type: Type.STRING, description: "نام مرحله به فارسی، دقیقاً یا بخشی از آن." },
      },
    },
  },
  {
    name: "getTopProvinces",
    description: "رتبه‌بندی استان‌ها بر اساس یکی از معیارهای: revenue (درآمد پیش‌بینی‌شده)، openDeals (تعداد فرصت باز)، conversionRate (نرخ برد).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        metric: { type: Type.STRING, description: "یکی از: revenue, openDeals, conversionRate. پیش‌فرض revenue." },
      },
    },
  },
  {
    name: "presentChart",
    description: "وقتی نمایش یک نمودار یا عدد بزرگ به کاربر کمک می‌کند (روند زمانی، مقایسه‌ی چند دسته، یا یک KPI تکی)، این تابع را با داده‌ی آماده‌شده صدا بزن. اختیاری است — برای پاسخ‌های صرفاً متنی لازم نیست.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        chartType: { type: Type.STRING, description: "یکی از: line, bar, number" },
        title: { type: Type.STRING, description: "عنوان کوتاه فارسی نمودار" },
        unit: { type: Type.STRING, description: "واحد نمایش، مثل تومان یا درصد (اختیاری)" },
        points: {
          type: Type.ARRAY,
          description: "برای line/bar: نقاط داده",
          items: {
            type: Type.OBJECT,
            properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } },
          },
        },
        value: { type: Type.NUMBER, description: "برای chartType=number: مقدار تکی" },
      },
      required: ["chartType", "title"],
    },
  },
];

const SYSTEM_INSTRUCTION = `تو دستیار هوشمند یک نرم‌افزار CRM فروش B2B ایرانی هستی. همیشه به فارسی
و کوتاه و مستقیم جواب بده. هر عددی که نیاز داری فقط از طریق توابعی که در
اختیارت گذاشته شده به‌دست بیار — هرگز عدد را حدس نزن یا از خودت نساز.
اگر سوال به داده‌ای نیاز دارد که هیچ‌کدام از توابع نمی‌توانند تأمین کنند،
صادقانه بگو این اطلاعات در دسترس نیست. وقتی نمایش یک نمودار یا عدد بزرگ
به فهم پاسخ کمک می‌کند (مثلاً روند ماهانه یا مقایسه‌ی استان‌ها)، تابع
presentChart را هم صدا بزن؛ برای سوال‌های ساده‌ی متنی لازم نیست. ارزش‌های
تومانی معمولاً برای کاربر خیلی بزرگ‌اند — در متن پاسخ آن‌ها را به میلیون
یا میلیارد تومان گرد کن تا خوانا باشد.`;

function toGeminiHistory(history) {
  return (history || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

export async function runAssistantChat({ message, history = [] }) {
  // کش فقط برای سوال‌های مستقل (شروع تازه‌ی مکالمه) چک می‌شود — اگر
  // کاربر وسط یک مکالمه‌ی چندمرحله‌ای است، پاسخ کش‌شده ممکن است متن آن
  // مکالمه را نادیده بگیرد، پس فقط history خالی از کش استفاده می‌کند.
  if (history.length === 0) {
    const cached = findCached(message);
    if (cached) {
      return { reply: cached.reply, chart: cached.chart, cached: true };
    }
  }

  if (!hasQuotaLeft()) {
    return { reply: QUOTA_EXCEEDED_MESSAGE, chart: null, quotaExceeded: true };
  }

  try {
    const result = await runLoop({ message, history });
    if (history.length === 0 && !result.quotaExceeded) storeInCache(message, result.reply, result.chart);
    return { ...result, cached: false };
  } catch (err) {
    return { reply: friendlyErrorMessage(err), chart: null };
  }
}

async function runLoop({ message, history }) {
  const ai = getClient();
  const contents = [...toGeminiHistory(history), { role: "user", parts: [{ text: message }] }];

  let chart = null;
  let lastResponse = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // سهمیه هر بار قبل از یک فراخوانی *واقعی* به Gemini چک می‌شود — یک
    // سوال ممکن است چند دور تابع‌فراخوانی نیاز داشته باشد که هرکدام یک
    // درخواست واقعی است، نه فقط یکی به‌ازای کل سوال.
    if (!hasQuotaLeft()) {
      return { reply: lastResponse?.text || QUOTA_EXCEEDED_MESSAGE, chart, quotaExceeded: !lastResponse };
    }
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
      },
    });
    recordRealCall();
    lastResponse = response;

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      return { reply: response.text ?? "", chart };
    }

    contents.push(response.candidates[0].content);

    const responseParts = [];
    for (const call of calls) {
      if (call.name === "presentChart") {
        chart = normalizeChart(call.args);
        responseParts.push({ functionResponse: { name: call.name, response: { ok: true } } });
        continue;
      }

      const impl = TOOL_IMPLEMENTATIONS[call.name];
      if (!impl) {
        responseParts.push({
          functionResponse: { name: call.name, response: { error: "این تابع وجود ندارد." } },
        });
        continue;
      }
      try {
        const result = await impl(call.args || {});
        responseParts.push({ functionResponse: { name: call.name, response: { result } } });
      } catch (err) {
        responseParts.push({ functionResponse: { name: call.name, response: { error: err.message } } });
      }
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return { reply: lastResponse?.text ?? "متأسفم، نتوانستم به این سوال جواب بدهم.", chart };
}

// خطاهای Gemini (کوتاه شدن سهمیه، کلید نامعتبر، قطعی موقت و ...) به‌صورت
// یک رشته‌ی JSON خام در err.message می‌آیند — به‌جای نمایش آن خام به
// کاربر، پیام فارسی قابل‌فهم برمی‌گردانیم؛ ویجت چت آن را مثل یک پیام
// معمولی نشان می‌دهد، نه یک خطای شکسته‌ی رابط کاربری.
function friendlyErrorMessage(err) {
  let code = null;
  try {
    code = JSON.parse(err.message)?.error?.code;
  } catch {
    // پیام JSON نبود — نادیده گرفته می‌شود.
  }
  if (code === 429) return "سهمیه‌ی درخواست به Gemini برای این دقیقه تمام شده — چند لحظه دیگر دوباره امتحان کنید.";
  if (code === 401 || code === 403) return "کلید Gemini API معتبر نیست یا تنظیم نشده است.";
  if (err.message?.includes("GEMINI_API_KEY")) return err.message;
  return "دستیار هوشمند موقتاً در دسترس نیست. لطفاً دوباره امتحان کنید.";
}

function normalizeChart(args) {
  if (!args?.chartType) return null;
  return {
    type: args.chartType,
    title: args.title ?? "",
    unit: args.unit ?? "",
    points: Array.isArray(args.points) ? args.points : [],
    value: typeof args.value === "number" ? args.value : null,
  };
}
