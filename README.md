# فرتاک (Fartak)

سامانه جامع دانشگاهی — فرانت‌اند React + Vite

## ساختار پروژه

```
roshana/
├── frontend/          # React + Vite (این بخش اصلی فعلی)
├── backend/           # (فعلاً خالی — باید ساخته شود)
├── .gitignore
└── README.md
```

## پیش‌نیازها

- Node.js 18+ (پیشنهاد: 20 LTS)
- npm یا pnpm یا yarn

## راه‌اندازی فرانت‌اند

```bash
cd frontend

# نصب وابستگی‌ها
npm install

# کپی فایل محیط
cp .env.example .env

# اجرای حالت توسعه
npm run dev
```

اپ روی `http://localhost:5173` باز می‌شود.

### اسکریپت‌های مفید

| دستور | توضیح |
|--------|--------|
| `npm run dev` | سرور توسعه |
| `npm run build` | بیلد پروداکشن |
| `npm run preview` | پیش‌نمایش بیلد |
| `npm run lint` | بررسی ESLint |

## بک‌اند

فعلاً بک‌اند وجود ندارد. فرانت به `http://localhost:5000` پروکسی می‌کند.

## ویژگی‌های فعلی فرانت

- احراز هویت (Login / Register / OTP / Forgot-Reset Password)
- پنل ادمین (Dashboard, Users, Courses, Requests, Reports, Settings, Support)
- Theme (روشن/تاریک) + RTL
- i18n (فارسی، انگلیسی، عربی، کردی)
- React Query + Context Auth
- Vite proxy به بک‌اند

## حذف node_modules از گیت

```bash
git rm -r --cached frontend/node_modules
git commit -m "chore: remove node_modules from git tracking"
```

---

### 3. `frontend/.env.example`

```env
# ===========================================
# Roshana / Fartak - Frontend Environment
# Copy this file to .env and fill the values
# ===========================================

# API
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000

# App
VITE_APP_VERSION=0.1.0
VITE_BUILD_TIME=
VITE_BUILD_NUMBER=1

# Feature flags (optional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PWA=true

# Development only
# VITE_BYPASS_AUTH=false
```

---

### How to apply

```bash
# In your local repo root
# 1. Create/overwrite .gitignore and README.md with the content above
# 2. Inside frontend:
cp .env.example .env   # after you create .env.example

# 3. Remove node_modules from git
git rm -r --cached frontend/node_modules
git add .gitignore README.md frontend/.env.example
git commit -m "chore: base files - gitignore, readme, env.example"
```
