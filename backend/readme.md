```markdown
<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:11a8ff,100:0dffb3&height=300&section=header&text=PROJECT%20NAME&fontSize=90&animation=fadeIn&fontAlignY=35" width="100%"/>
  
  <h1>🚀 Project Name</h1>
  
  <p>
    A short, punchy description of what your project does. Keep it under 2 lines.
  </p>

  <p>
    <img src="https://img.shields.io/badge/node-%3E%3D18-blue" alt="node version">
    <img src="https://img.shields.io/badge/npm-%3E%3D9-blue" alt="npm version">
    <img src="https://img.shields.io/github/license/username/repo" alt="license">
    <img src="https://img.shields.io/github/v/release/username/repo" alt="release">
    <img src="https://img.shields.io/github/actions/workflow/status/username/repo/ci.yml" alt="ci">
  </p>

  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>

</div>

---

## ✨ Features

- ⚡ **Fast** – Lightning-fast performance with optimized algorithms
- 🔒 **Secure** – Built-in security best practices
- 🎯 **TypeScript** – Full type safety out of the box
- 🧪 **Tested** – 100% test coverage with Jest
- 📖 **Documented** – Comprehensive docs and examples
- 🔄 **RESTful** – Clean API design
- 🎨 **Modern** – Built with latest tech stack

---

## 🏁 Quick Start

```bash
# Clone the repo
git clone https://github.com/username/repo.git

# Navigate to directory
cd repo

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Installation

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥18.0.0 |
| npm | ≥9.0.0 |

### Steps

```bash
# 1. Clone repository
git clone https://github.com/username/repo.git

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env

# 4. Run database migrations
npm run db:migrate

# 5. Start the server
npm run dev
```

---

## 🔧 Configuration

Create a `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# External Services
API_KEY=your-api-key
```

---

## 📖 Usage

### Basic Example

```typescript
import { AwesomeClass } from 'awesome-lib';

const awesome = new AwesomeClass({
  apiKey: process.env.API_KEY,
});

const result = await awesome.doSomethingAmazing();
console.log(result);
```

### CLI Usage

```bash
# Run the CLI
npx my-cli command --option value

# Build for production
npm run build

# Start production server
npm start
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

---

## 📂 Project Structure

```
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── index.ts         # Entry point
├── tests/               # Test files
├── docs/                # Documentation
├── scripts/             # Build & deploy scripts
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── README.md            # This file
```

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | Get all users |
| `GET` | `/api/users/:id` | Get user by ID |
| `POST` | `/api/users` | Create new user |
| `PUT` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user |

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "User fetched successfully"
}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Coding Standards

- Use **TypeScript** for everything
- Follow **ESLint** and **Prettier** rules
- Write **tests** for new features
- Update **documentation** for changes

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

---

## 🔒 Security

If you discover a security vulnerability, please send an e-mail to security@example.com. All security vulnerabilities will be promptly addressed.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Awesome Contributors](https://github.com/username/repo/graphs/contributors)
- [Inspiration](https://example.com)
- [Resources](https://example.com)

---

<div align="center">
  <br/>
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:11a8ff,100:0dffb3&height=100&section=footer" width="100%"/>
  
  <p>Made with ❤️ by <a href="https://github.com/username">Your Name</a></p>
</div>
```

---

## 🚀 Quick Generator

For auto-generated READMEs:

```bash
# Using npm
npx readme-md-generator

# Or use
https://readme.so/
```

---

## Pro Tips

| Tip | Description |
|-----|-------------|
| **Badges** | Use [shields.io](https://shields.io) for custom badges |
| **Demo** | Add a GIF with [LiceCap](https://licecap.en.softonic.com) |
| **Logo** | Add your project logo in `docs/logo.png` |
| **Dark mode** | Use [markdown-badges](https://github.com/Ileriayo/markdown-badges) |

-----------------
بر اساس کد سرورت، مشکل اصلی **CORS** است. سرور اکسپرس فقط به originهای `localhost` و `127.0.0.1` اجازه درخواست می‌دهد، اما در موبایل origin مرورگر `http://192.168.169.160:5173` است که در لیست مجاز نیست. در لپ‌تاپ هم وقتی از `localhost:5173` استفاده می‌کنید، در لیست مجاز هست و کار می‌کند.

اما نگران نباشید – راه‌حل درست این است که درخواست‌ها را از طریق پروکسی Vite بفرستید (مسیر نسبی) تا اصلاً درگیر CORS نشوید. در این صورت چه در توسعه و چه در تولید، بدون مشکل کار می‌کند.

---

## راه‌حل قطعی: استفاده از مسیرهای نسبی

کد فرانت‌اند را بررسی کنید. هرجا که آدرس مستقیم بک‌اند را نوشته‌اید (مثلاً `http://192.168.169.160:5000/api/...` یا `http://localhost:5000/api/...`) باید به مسیر نسبی تغییر دهید.

**قبل (غلط):**
```javascript
axios.post('http://192.168.169.160:5000/api/v1/auth/login', data)
// یا
fetch('http://localhost:5000/api/v1/auth/login', ...)
```

**بعد (درست):**
```javascript
axios.post('/api/v1/auth/login', data)
// یا
fetch('/api/v1/auth/login', ...)
```

دقت کنید که `/api/v1` همان پیشوندی است که در vite.config.js برای پروکسی تعریف کرده‌اید. در این حالت:

- درخواست از موبایل به `http://192.168.169.160:5173/api/v1/auth/login` می‌رود (همان origin خود Vite)  
- Vite آن را طبق تنظیمات پروکسی به `http://192.168.169.160:5000/api/v1/auth/login` هدایت می‌کند  
- مرورگر هیچ خطای CORS نمی‌گیرد چون درخواست به یک origin زده شده (Vite)

و همین کد در محیط production (که فرانت و بک روی یک پورت سرو می‌شوند) بدون هیچ تغییری کار می‌کند.

---

## اگر فوراً نیاز به تست دارید (موقت)

می‌توانید origin موبایل را به لیست CORS اضافه کنید:

در فایل سرور، قسمت `allowedOrigins` را اینطور تغییر دهید:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.169.160:5173',   // ← اضافه کنید
  ...(process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [])
];
```

اما **این راه‌حل موقت است** و به محض تغییر IP شبکه، دوباره خراب می‌شود. روش نسبی بهترین است.

---

## تنظیمات Vite که درست کار می‌کند

اطمینان حاصل کنید که در `vite.config.js` پروکسی شما شبیه زیر باشد:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://192.168.169.160:5000',
      changeOrigin: true,
      // secure: false
    }
  }
}
```

علامت `changeOrigin: true` بسیار مهم است تا هدر `Host` به‌درستی به بک‌اند منتقل شود و بک‌اند درخواست را از یک منبع خارجی رد نکند.

---

## تست سریع سلامت پروکسی

از همان موبایل، آدرس زیر را در مرورگر وارد کنید:

```
http://192.168.169.160:5173/api/ping
```

اگر پاسخ `{"success":true,"message":"pong"}` را دیدید، یعنی پروکسی کار می‌کند و مشکل از آدرس‌دهی مستقیم در کد فرانت‌اند شماست.

---

**خلاصه:**  
- مشکل: درخواست‌های موبایل به دلیل CORS رد می‌شوند چون origin جدید مجاز نیست.  
- راه حل اصلی: همه درخواست‌های API را با مسیر نسبی بنویسید تا از پروکسی Vite عبور کنند.  
- با این کار هم در محیط توسعه با هر IP و هم در محیط production بدون هیچ تغییری کار خواهید کرد.