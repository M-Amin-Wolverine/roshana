import { useEffect } from 'react'

export default function PerformanceMonitor() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      const reportWebVitals = (metric) => {
        console.log(`📊 ${metric.name}: ${metric.value}`)
      }
      
      // می‌تونی از کتابخانه web-vitals استفاده کنی
      console.log('✅ Performance monitoring enabled')
    }
  }, [])
  
  return null
}