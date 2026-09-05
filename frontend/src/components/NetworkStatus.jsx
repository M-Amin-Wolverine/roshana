import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('اتصال به اینترنت برقرار شد', { duration: 2000 })
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      toast.error('اتصال به اینترنت قطع شد! برخی امکانات غیرفعال هستند.', { duration: 5000 })
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}