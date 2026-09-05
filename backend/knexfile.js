module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '@Roko4766300',
      database: process.env.DB_NAME || 'fartak_university',
      // ↓↓↓ این دو خط رو اضافه کن ↓↓↓
      connectionTimeoutMillis: 10000,   // 10 ثانیه برای برقراری اتصال اولیه
      query_timeout: 30000,             // 30 ثانیه برای اجرای هر کوئری
    },
    pool: {
      min: 0,                           // بهتره 0 باشه تا وقتی بیکاره بسته بشه
      max: 10,
      acquireTimeoutMillis: 15000,      // ↓ این خط رو اضافه کن – حداکثر زمان برای گرفتن کانکشن از پول
      idleTimeoutMillis: 30000,         // بستن کانکشن‌های بیکار بعد 30 ثانیه
      createTimeoutMillis: 10000,
      destroyTimeoutMillis: 5000,
    },
    migrations: { tableName: 'knex_migrations' },
    debug: true,   // برای لوگ کوئری‌ها – می‌تونی نگه داری یا false کنی
  },
  
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    },
    migrations: { tableName: 'knex_migrations' }
  }
};