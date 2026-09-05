// src/utils/analytics.js

export const initAnalytics = (config) => {
  console.log('📊 Analytics initialized with config:', config);
  
  // این فقط یک placeholder هست
  // اگه میخواید واقعی کار کنه، باید سرویس analytics مثل Google Analytics اضافه کنید
  
  // مثال برای Google Analytics
  if (typeof window !== 'undefined' && import.meta.env.VITE_GA_ID) {
    // Google Analytics code here
  }
};

export const trackEvent = (eventName, eventParams = {}) => {
  console.log(`📊 Event: ${eventName}`, eventParams);
};

export const trackPageView = (pagePath, pageTitle) => {
  console.log(`📊 Page View: ${pagePath} - ${pageTitle}`);
};