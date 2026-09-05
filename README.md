# Smart CRM

مینی ERP — ماژول CRM و فروش برای SME ها. جزئیات کامل محصول در [SPEC.md](./SPEC.md).

## ساختار پروژه

```
backend/    Node.js + Express + Prisma (PostgreSQL)
frontend/   React + Vite + PWA
```

## اجرای محلی

نیاز به یک دیتابیس PostgreSQL محلی دارید (مثلاً `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`).

```bash
# بک‌اند
cd backend
cp .env.example .env   # DATABASE_URL را به دیتابیس Postgres خودتان اشاره بدهید
npm install
npm run prisma:migrate   # اجرای migration ها + seed مراحل قیف فروش
npm run dev               # http://localhost:4000

# فرانت‌اند (در یک ترمینال جدا)
cd frontend
npm install
npm run dev               # http://localhost:5173 (پروکسی /api به بک‌اند)
```

## دیپلوی روی Railway

راهنمای کامل قدم‌به‌قدم در [DEPLOY.md](./DEPLOY.md).
