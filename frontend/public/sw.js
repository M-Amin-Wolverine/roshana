// ⚡ Ultimate PWA Service Worker - نسخه فوق‌حرفه‌ای
const CACHE_VERSION = 'v4.2.0';
const STATIC_CACHE = `admin-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `admin-dynamic-${CACHE_VERSION}`;
const API_CACHE = `admin-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `admin-images-${CACHE_VERSION}`;

// 🎯 استراتژی‌های کش ترکیبی
const CACHE_STRATEGIES = {
  // کش اول، شبکه fallback - مناسب برای فایل‌های استاتیک
  CACHE_FIRST: 'cache-first',
  // شبکه اول، کش fallback - مناسب برای API calls
  NETWORK_FIRST: 'network-first', 
  // کش اول، بعد بروزرسانی در بک‌گراند - بهترین UI/UX
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  // فقط شبکه - برای عملیات حساس مثل پرداخت
  NETWORK_ONLY: 'network-only',
  // فقط کش - برای آفلاین کامل
  CACHE_ONLY: 'cache-only'
};

// 📋 تنظیمات پیشرفته
const CONFIG = {
  // لیست صفحات و منابع اصلی
  PRECACHE_URLS: [
    '/',
    '/admin/dashboard',
    '/admin/login',
    '/offline.html',
    '/css/app.css',
    '/js/app.js',
    '/images/logo.png'
  ],
  
  // الگوهای URL برای استراتژی‌های مختلف
  STRATEGY_MAP: {
    '/api/': CACHE_STRATEGIES.NETWORK_FIRST,
    '/images/': CACHE_STRATEGIES.CACHE_FIRST,
    '/fonts/': CACHE_STRATEGIES.CACHE_FIRST,
    '/admin/': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    'socket.io': CACHE_STRATEGIES.NETWORK_ONLY
  },
  
  // محدودیت‌های کش
  MAX_ITEMS: {
    [DYNAMIC_CACHE]: 50,
    [API_CACHE]: 100,
    [IMAGE_CACHE]: 200
  },
  
  // زمان انقضای پیش‌فرض (میلی‌ثانیه)
  DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24 ساعت
  API_TTL: 5 * 60 * 1000, // ۵ دقیقه برای API
  
  // تنظیمات آفلاین
  OFFLINE_PAGE: '/offline.html',
  BACKGROUND_SYNC_TAG: 'admin-sync',
  SYNC_INTERVAL: 30 * 60 * 1000 // ۳۰ دقیقه
};

// 🚀 نصب و فعال‌سازی اولیه
self.addEventListener('install', (event) => {
  console.log('🔥 Service Worker در حال نصب...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Pre-caching resources...');
        return cache.addAll(CONFIG.PRECACHE_URLS);
      })
      .then(() => {
        console.log('✅ Pre-caching complete!');
        return self.skipWaiting(); // فعال‌سازی فوری
      })
      .catch(error => {
        console.error('❌ Pre-caching failed:', error);
      })
  );
});

// 🔄 فعال‌سازی و پاکسازی کش‌های قدیمی
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker فعال شد');
  
  event.waitUntil(
    Promise.all([
      // پاکسازی کش‌های قدیمی
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => {
              return name.startsWith('admin-') && 
                     !name.includes(CACHE_VERSION);
            })
            .map(name => {
              console.log('🗑️ Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      
      // فعال‌سازی بلافاصله برای تمام کلاینت‌ها
      self.clients.claim(),
      
      // ثبت sync در بک‌گراند
      self.registration.sync?.register(CONFIG.BACKGROUND_SYNC_TAG)
        .catch(() => console.log('Background Sync not supported'))
    ])
  );
});

// 🎯 مدیریت هوشمند درخواست‌ها
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // نادیده گرفتن درخواست‌های غیر GET
  if (request.method !== 'GET') {
    // ذخیره درخواست‌های POST برای sync بعدی
    if (request.method === 'POST' && !navigator.onLine) {
      event.respondWith(handleOfflinePost(request));
    }
    return;
  }
  
  // تعیین استراتژی بر اساس URL
  const strategy = getStrategy(url);
  
  switch(strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirstStrategy(request));
      break;
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirstStrategy(request));
      break;
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidateStrategy(request));
      break;
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
      event.respondWith(networkOnlyStrategy(request));
      break;
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      event.respondWith(cacheOnlyStrategy(request));
      break;
      
    default:
      event.respondWith(networkFirstStrategy(request));
  }
});

// 🛠️ استراتژی‌های کش
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    // بروزرسانی در بک‌گراند
    updateCacheInBackground(request);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await putInCache(request, response.clone());
    }
    return response;
  } catch (error) {
    return handleOfflineFallback(request);
  }
}

async function networkFirstStrategy(request) {
  try {
    const response = await fetchWithTimeout(request, 5000);
    if (response.ok) {
      await putInCache(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return handleOfflineFallback(request);
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cachedPromise = caches.match(request);
  const networkPromise = fetchWithTimeout(request, 3000)
    .then(response => {
      if (response.ok) {
        putInCache(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  
  // نمایش نسخه کش شده سریع
  const cached = await cachedPromise;
  
  // آپدیت در بک‌گراند
  networkPromise.then(networkResponse => {
    if (networkResponse && (!cached || networkResponse.headers.get('etag') !== cached.headers.get('etag'))) {
      notifyClients('content-updated', { url: request.url });
    }
  });
  
  return cached || networkPromise;
}

// 🎨 توابع کمکی
function getStrategy(url) {
  for (const [pattern, strategy] of Object.entries(CONFIG.STRATEGY_MAP)) {
    if (url.pathname.includes(pattern)) {
      return strategy;
    }
  }
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

function getCacheName(request) {
  const url = new URL(request.url);
  if (url.pathname.includes('/api/')) return API_CACHE;
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return IMAGE_CACHE;
  if (url.pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/i)) return STATIC_CACHE;
  return DYNAMIC_CACHE;
}

async function putInCache(request, response) {
  const cache = await caches.open(getCacheName(request));
  
  // مدیریت محدودیت حجم کش
  await trimCacheIfNeeded(getCacheName(request));
  
  // ذخیره با متادیتا
  const enhancedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers),
      'sw-cached-at': new Date().toISOString(),
      'sw-cache-name': getCacheName(request)
    }
  });
  
  return cache.put(request, enhancedResponse);
}

async function trimCacheIfNeeded(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const maxItems = CONFIG.MAX_ITEMS[cacheName] || 50;
  
  if (keys.length >= maxItems) {
    // حذف قدیمی‌ترین آیتم‌ها
    const itemsToDelete = keys.slice(0, keys.length - maxItems + 1);
    await Promise.all(itemsToDelete.map(key => cache.delete(key)));
  }
  
  // پاکسازی آیتم‌های منقضی شده
  const now = Date.now();
  const ttl = cacheName === API_CACHE ? CONFIG.API_TTL : CONFIG.DEFAULT_TTL;
  
  for (const key of keys) {
    const response = await cache.match(key);
    const cachedAt = response?.headers.get('sw-cached-at');
    if (cachedAt && (now - new Date(cachedAt).getTime()) > ttl) {
      await cache.delete(key);
    }
  }
}

// ⏰ پشتیبانی از timeout برای fetch
function fetchWithTimeout(request, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(request, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

// 🚫 مدیریت آفلاین
async function handleOfflineFallback(request) {
  // برای صفحات HTML
  if (request.headers.get('Accept')?.includes('text/html')) {
    const cache = await caches.open(STATIC_CACHE);
    return cache.match(CONFIG.OFFLINE_PAGE);
  }
  
  // برای تصاویر
  if (request.destination === 'image') {
    const cache = await caches.open(IMAGE_CACHE);
    return cache.match('/images/offline-placeholder.png');
  }
  
  // برای API
  if (request.url.includes('/api/')) {
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'داده‌ها در دسترس نیست',
      cached: false,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Offline', { status: 503 });
}

// 📤 مدیریت POST در حالت آفلاین
async function handleOfflinePost(request) {
  const queue = await getSyncQueue();
  const body = await request.clone().text();
  
  queue.push({
    url: request.url,
    method: 'POST',
    body: body,
    timestamp: Date.now()
  });
  
  await saveSyncQueue(queue);
  
  return new Response(JSON.stringify({
    success: false,
    queued: true,
    message: 'درخواست ذخیره شد و پس از اتصال ارسال می‌شود'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 🔄 همگام‌سازی خودکار
self.addEventListener('sync', (event) => {
  if (event.tag === CONFIG.BACKGROUND_SYNC_TAG) {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const queue = await getSyncQueue();
  
  for (const item of queue) {
    try {
      await fetch(item.url, {
        method: item.method,
        body: item.body,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('Sync failed, will retry');
      return;
    }
  }
  
  await clearSyncQueue();
}

// 📦 مدیریت صف همگام‌سازی
function getSyncQueue() {
  return new Promise((resolve) => {
    const request = indexedDB.open('SyncQueue', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['queue'], 'readonly');
      const store = transaction.objectStore('queue');
      const getAll = store.getAll();
      
      getAll.onsuccess = () => resolve(getAll.result);
    };
  });
}

// 🔔 اطلاع‌رسانی به کلاینت‌ها
function notifyClients(type, data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: type,
        data: data,
        timestamp: Date.now()
      });
    });
  });
}

// 📊 گزارش‌گیری و مانیتورینگ
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
  
  if (event.data?.type === 'CLEAR_ALL_CACHES') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = keys.length;
  }
  
  return stats;
}