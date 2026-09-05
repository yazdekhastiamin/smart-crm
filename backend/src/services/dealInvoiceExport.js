import ExcelJS from "exceljs";

// شماره‌ی پیش‌فاکتور: چون هر Deal دقیقاً یک پیش‌فاکتور دارد، از همان id
// ترتیبی و یکتای Deal استفاده می‌شود — بدون نیاز به شمارنده‌ی جداگانه.
function invoiceNumberFor(dealId) {
  return `PF-${String(dealId).padStart(6, "0")}`;
}

// خروجی استاندارد و عمومی (نه مخصوص یک نرم‌افزار مالی خاص) برای import دستی
// به نرم‌افزار مالی موجود مشتری — بخش «لایه اتصال مالی» SPEC.
export async function buildDealInvoiceWorkbook(deal) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart CRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("پیش‌فاکتور", {
    views: [{ rightToLeft: true }],
  });

  sheet.columns = [
    { header: "شماره پیش‌فاکتور", key: "invoiceNumber", width: 18 },
    { header: "تاریخ", key: "date", width: 14 },
    { header: "نام مشتری", key: "contactName", width: 22 },
    { header: "نام شرکت", key: "company", width: 24 },
    { header: "شهر", key: "city", width: 14 },
    { header: "تماس (تلفن/ایمیل)", key: "contact", width: 26 },
    { header: "شرح کالا/خدمت", key: "itemDescription", width: 36 },
    { header: "مبلغ (تومان)", key: "amount", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  const contact = deal.contact || {};
  const contactInfo = [contact.phone, contact.email].filter(Boolean).join(" / ");

  sheet.addRow({
    invoiceNumber: invoiceNumberFor(deal.id),
    date: new Date().toLocaleDateString("fa-IR"),
    contactName: contact.name || "",
    company: contact.company || "",
    city: contact.city || "",
    contact: contactInfo,
    itemDescription: deal.itemDescription || deal.title || "",
    amount: deal.value,
  });

  sheet.getColumn("amount").numFmt = "#,##0";

  return workbook;
}

export function invoiceFileName(dealId) {
  return `${invoiceNumberFor(dealId)}.xlsx`;
}
