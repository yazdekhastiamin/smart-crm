// یک معامله را نسبت به نرخ تبدیل تاریخی (میانگین) همان مرحله می‌سنجد،
// نه نسبت به یک آستانه‌ی ثابت — چون «خوب بودن» هر مرحله معنای متفاوتی دارد.
const CLOSE_TO_AVERAGE_BAND = 0.05;

export function riskLevel(probability, stageAverage) {
  if (probability > stageAverage + CLOSE_TO_AVERAGE_BAND) return "low";
  if (probability < stageAverage - CLOSE_TO_AVERAGE_BAND) return "high";
  return "medium";
}

export const RISK_LABELS = {
  low: "بهتر از میانگین",
  medium: "نزدیک میانگین",
  high: "پایین‌تر از میانگین",
};
