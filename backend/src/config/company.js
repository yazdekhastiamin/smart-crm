// نام شرکت فروشنده که روی خروجی پیش‌فاکتور درج می‌شود — از env قابل تنظیم
// است تا هر استقرار بدون تغییر کد، نام خودش را بگذارد.
export const COMPANY_NAME = process.env.COMPANY_NAME || "Smart CRM Demo";

// هدف درآمد دوره (تومان) برای نوار پیشرفت داشبورد — عددی قراردادی که هر
// استقرار باید مطابق مقیاس واقعی خودش از env تنظیم کند.
export const SALES_TARGET = Number(process.env.SALES_TARGET) || 1_500_000_000;
