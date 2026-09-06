// اعداد این صفحه (برخلاف بقیه‌ی برنامه) با ارقام لاتین/فونت Inter نمایش داده
// می‌شوند — دقیقاً همان قراردادی که در طراحی اصلی برای تراز عددی (tabular
// nums) استفاده شده؛ فقط متن‌های غیرعددی فارسی‌اند.
export function n(v, d) {
  return Number(v).toLocaleString("en-US", {
    minimumFractionDigits: d || 0,
    maximumFractionDigits: d === undefined ? 0 : d,
  });
}

export function toBillions(tomanValue) {
  return tomanValue / 1_000_000_000;
}
