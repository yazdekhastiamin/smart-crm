# Smart CRM

مینی ERP — ماژول CRM و فروش برای SME ها. جزئیات کامل محصول در [SPEC.md](./SPEC.md).

## ساختار پروژه

```
backend/    Node.js + Express + Prisma (SQLite برای دمو محلی)
frontend/   React + Vite + PWA
```

## اجرای محلی

```bash
# بک‌اند
cd backend
cp .env.example .env
npm install
npm run prisma:migrate   # ساخت دیتابیس SQLite + seed مراحل قیف فروش
npm run dev               # http://localhost:4000

# فرانت‌اند (در یک ترمینال جدا)
cd frontend
npm install
npm run dev               # http://localhost:5173 (پروکسی /api به بک‌اند)
```
