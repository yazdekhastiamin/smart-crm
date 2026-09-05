import ExcelJS from "exceljs";
import { COMPANY_NAME } from "../config/company.js";

// شماره‌ی پیش‌فاکتور: چون هر Deal دقیقاً یک پیش‌فاکتور دارد، از همان id
// ترتیبی و یکتای Deal استفاده می‌شود — بدون نیاز به شمارنده‌ی جداگانه.
function invoiceNumberFor(dealId) {
  return `PF-${String(dealId).padStart(6, "0")}`;
}

const COLUMNS = [
  { key: "invoiceNumber", width: 18 },
  { key: "date", width: 14 },
  { key: "contactName", width: 22 },
  { key: "company", width: 24 },
  { key: "city", width: 14 },
  { key: "contact", width: 26 },
  { key: "itemDescription", width: 36 },
  { key: "amount", width: 18 },
  { key: "systemDate", width: 14 },
];

const HEADERS = {
  invoiceNumber: "شماره پیش‌فاکتور",
  date: "تاریخ",
  contactName: "نام مشتری",
  company: "نام شرکت",
  city: "شهر",
  contact: "تماس (تلفن/ایمیل)",
  itemDescription: "شرح کالا/خدمت",
  amount: "مبلغ (تومان)",
  systemDate: "تاریخ سیستمی",
};

// خروجی استاندارد و عمومی (نه مخصوص یک نرم‌افزار مالی خاص) برای import دستی
// به نرم‌افزار مالی موجود مشتری — بخش «لایه اتصال مالی» SPEC.
export async function buildDealInvoiceWorkbook(deal) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart CRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("پیش‌فاکتور", {
    views: [{ rightToLeft: true }],
  });

  // بدون `header` روی تعریف ستون‌ها تا ExcelJS خودکار یک ردیف هدر نسازد —
  // چون قبل از آن یک ردیف با نام شرکت فروشنده لازم داریم.
  sheet.columns = COLUMNS;

  const companyRow = sheet.addRow([COMPANY_NAME]);
  sheet.mergeCells(companyRow.number, 1, companyRow.number, COLUMNS.length);
  companyRow.font = { bold: true, size: 13 };
  companyRow.alignment = { horizontal: "center" };

  const headerRow = sheet.addRow(HEADERS);
  headerRow.font = { bold: true };

  const contact = deal.contact || {};
  const contactInfo = [contact.phone, contact.email].filter(Boolean).join(" / ");

  const today = new Date();
  const issueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // دو ستون تاریخ برای دو نیاز متفاوت:
  // - «تاریخ» رشته‌ی متنی شمسی (fa-IR) برای خوانایی مشتری ایرانی.
  // - «تاریخ سیستمی» سلول تاریخ واقعی اکسل (میلادی) در انتها، برای
  //   مرتب‌سازی/فیلتر/محاسبه در اکسل یا سیستم‌های دیگر — تقویم جلالی در
  //   فرمت سلول اکسل قابل اعتماد نیست (فقط در ویندوز/با تنظیم منطقه‌ای خاص
  //   کار می‌کند)، پس برای این ستون میلادی نگه داشته شده.
  const jalaliDateText = issueDate.toLocaleDateString("fa-IR");

  const dataRow = sheet.addRow({
    invoiceNumber: invoiceNumberFor(deal.id),
    date: jalaliDateText,
    contactName: contact.name || "",
    company: contact.company || "",
    city: contact.city || "",
    contact: contactInfo,
    itemDescription: deal.itemDescription || deal.title || "",
    amount: deal.value,
    systemDate: issueDate,
  });
  dataRow.getCell("date").alignment = { horizontal: "center" };
  dataRow.getCell("systemDate").numFmt = "yyyy-mm-dd";
  dataRow.getCell("amount").numFmt = "#,##0";

  return workbook;
}

export function invoiceFileName(dealId) {
  return `${invoiceNumberFor(dealId)}.xlsx`;
}
