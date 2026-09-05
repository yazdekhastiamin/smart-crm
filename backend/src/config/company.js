// نام شرکت فروشنده که روی خروجی پیش‌فاکتور درج می‌شود — از env قابل تنظیم
// است تا هر استقرار بدون تغییر کد، نام خودش را بگذارد.
export const COMPANY_NAME = process.env.COMPANY_NAME || "Smart CRM Demo";
