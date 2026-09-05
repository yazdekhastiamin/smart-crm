# دیپلوی روی Railway

این پروژه به‌صورت **یک سرویس واحد** روی Railway دیپلوی می‌شود: بک‌اند
Express هم API را سرو می‌کند و هم فایل‌های build شده‌ی فرانت‌اند (React) را —
یعنی در پایان **یک لینک واحد** دارید که همه‌چیز رویش کار می‌کند. جزئیات فنی
این تصمیم و بقیه‌ی تغییرات آماده‌سازی در کد، در ادامه‌ی همین فایل توضیح
داده شده.

## پیش‌نیاز

- ریپازیتوری روی GitHub باشد (`yazdekhastiamin/smart-crm`) — همین الان هست.
- یک حساب Railway (railway.com) متصل به همان حساب GitHub.

## مراحل (در داشبورد Railway)

### ۱. ساخت پروژه و اتصال ریپو
۱. وارد [railway.com](https://railway.com) شوید → **New Project**.
۲. گزینه‌ی **Deploy from GitHub repo** را بزنید و دسترسی به ریپازیتوری
   `smart-crm` را تأیید کنید (اگر اولین‌بار است، باید GitHub App مربوط به
   Railway را روی این ریپو یا کل اکانت نصب کنید).
۳. ریپازیتوری `smart-crm` را انتخاب کنید.
۴. بعد از ساخته‌شدن سرویس، وارد تنظیمات آن سرویس شوید (**Settings**) و در
   بخش **Source** مطمئن شوید بِرنچ درست انتخاب شده — چون کار روی برنچ
   `claude/mini-erp-crm-sales-mvp-8it2wl` انجام شده، یا این برنچ را در Railway
   انتخاب کنید یا قبلش آن را به `main` مرج/push کنید.

> Railway به‌صورت خودکار فایل `railway.json` را در ریشه‌ی ریپو پیدا و از آن
> پیروی می‌کند — یعنی دستورهای build و start از قبل تنظیم شده‌اند و نیازی به
> وارد کردن دستی نیست.

### ۲. اضافه‌کردن دیتابیس PostgreSQL
۱. داخل همان پروژه (نه یک پروژه‌ی جدید)، روی **+ New** کلیک کنید.
۲. **Database → Add PostgreSQL** را انتخاب کنید. Railway یک سرویس Postgres
   می‌سازد و به‌صورت خودکار متغیرهایی مثل `DATABASE_URL` را داخل خودش نگه
   می‌دارد.

### ۳. تنظیم متغیرهای محیطی سرویس بک‌اند/فرانت‌اند
وارد سرویس اصلی (همان که از GitHub ساختید، نه سرویس Postgres) شوید →
تب **Variables** → این‌ها را اضافه کنید:

| نام متغیر | مقدار |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (از منوی reference variable، سرویس Postgres را انتخاب کنید تا خودکار وصل شود) |
| `COMPANY_NAME` | نام شرکت شما — همان‌طور که باید روی پیش‌فاکتور چاپ شود |

نیازی به تنظیم دستی `PORT` نیست — Railway خودش این متغیر را می‌سازد و
سرور از قبل با `process.env.PORT` به آن گوش می‌دهد.

### ۴. دیپلوی
با ذخیره‌ی متغیرها، Railway خودکار یک دیپلوی جدید اجرا می‌کند. اگر نه، از
تب **Deployments** روی **Deploy** بزنید. در لاگ‌ها باید این ترتیب را ببینید:

1. مرحله‌ی build: نصب و build فرانت‌اند، سپس نصب بک‌اند (و `prisma generate`)
2. مرحله‌ی start: `prisma migrate deploy` (ساخت جدول‌ها روی Postgres) → seed
   پایه (مراحل قیف فروش + یک کاربر مدیر دمو) → بالا آمدن سرور

اگر لاگ‌ها پیام مشابه `Smart CRM API listening on ...` را نشان دادند،
دیپلوی موفق بوده.

### ۵. گرفتن لینک نهایی
وارد **Settings → Networking** همان سرویس شوید → روی **Generate Domain**
بزنید. Railway یک آدرس `https://<something>.up.railway.app` می‌سازد —
همین را مستقیم در مرورگر باز کنید؛ چون بک‌اند خودش فرانت‌اند را هم سرو
می‌کند، همان یک لینک، کل برنامه (رابط کاربری + API) را نشان می‌دهد.

### ۶. (اختیاری) داده‌ی نمونه برای دمو
seed پایه به‌صورت خودکار روی هر دیپلوی اجرا می‌شود (idempotent است، مشکلی
در تکرار ندارد) و فقط مراحل قیف فروش و یک کاربر می‌سازد — بدون داده‌ی نمونه.
اگر می‌خواهید مخاطب/معامله‌ی نمونه هم داشته باشید، یک‌بار (نه هر دیپلوی،
چون این‌ها idempotent نیستند) با [Railway CLI](https://docs.railway.com/guides/cli)
از روی سیستم خودتان اجرا کنید:

```bash
railway login
railway link          # پروژه‌ی smart-crm را انتخاب کنید
railway run npm run seed:open-deals --prefix backend
railway run npm run seed:forecast-history --prefix backend
```

---

## تغییرات سمت ریپو برای این دیپلوی

- **`backend/prisma/schema.prisma`**: `provider` از `sqlite` به `postgresql`
  تغییر کرد؛ `Deal.value` و `ForecastSnapshot.totalForecast` (تنها دو فیلد
  پولی) از `Float` به `Decimal(14,2)`/`Decimal(16,2)` تبدیل شدند تا محاسبات
  مالی روی Postgres دچار خطای گرد‌کردن اعشار نشوند.
- **`backend/src/config/prisma.js`**: چون Prisma مقدار `Decimal` را به‌صورت
  یک شیء (نه عدد ساده‌ی جاوااسکریپت) برمی‌گرداند و کل کد فعلی پروژه
  (forecastEngine، priorityEngine، خروجی اکسل) مستقیم با این دو فیلد جمع/ضرب
  می‌کند، یک Prisma Client Extension اضافه شد که همین دو فیلد را در لحظه‌ی
  خواندن از دیتابیس به عدد معمولی تبدیل می‌کند — بدون نیاز به تغییر بقیه‌ی کد.
- **`backend/prisma/migrations/`**: چون migration های قبلی SQL مخصوص SQLite
  بودند و روی Postgres قابل اجرا نیستند، تاریخچه‌شان با یک migration واحد و
  تازه (مخصوص Postgres) جایگزین شد.
- **`backend/package.json`**: پکیج `prisma` از devDependencies به dependencies
  منتقل شد (چون دستور `start` در production به CLI آن نیاز دارد، نه فقط در
  زمان توسعه)؛ اسکریپت `start` حالا `prisma migrate deploy` و seed پایه را
  قبل از بالا آمدن سرور اجرا می‌کند؛ `postinstall` اضافه شد تا `prisma
  generate` بعد از هر `npm install` خودکار اجرا شود.
- **`backend/src/app.js`**: در صورت وجود build فرانت‌اند (`frontend/dist`)،
  همان‌جا به‌عنوان static file سرو می‌شود و برای مسیرهای غیر `/api` (مثل
  `/contacts` بعد از رفرش صفحه) به `index.html` بازمی‌گردد، تا React Router
  درست کار کند. اگر build وجود نداشته باشد (مثل حالت توسعه‌ی محلی که
  فرانت‌اند جدا با `vite dev` اجرا می‌شود)، این بخش کاملاً نادیده گرفته
  می‌شود و رفتار قبلی دست‌نخورده می‌ماند.
- **`package.json`** (ریشه‌ی ریپو، جدید): اسکریپت `build` هم فرانت‌اند را
  build می‌کند هم وابستگی‌های بک‌اند را نصب می‌کند؛ اسکریپت `start` بک‌اند
  را اجرا می‌کند.
- **`railway.json`** (جدید): دستورهای build/start و مسیر health-check
  (`/api/health`) را برای Railway مشخص می‌کند تا نیازی به تنظیم دستی در
  داشبورد نباشد.
- **`backend/.env.example`**: نمونه‌ی `DATABASE_URL` به فرمت Postgres تغییر
  کرد.

`DATABASE_URL` در هیچ‌کجای کد hardcode نشده — همیشه از `process.env` /
`env("DATABASE_URL")` خوانده می‌شود، چه در Prisma و چه در بقیه‌ی سرویس‌ها.
