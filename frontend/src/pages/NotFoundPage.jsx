// src/pages/NotFoundPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Vazirmatn, sans-serif',
      direction: 'rtl',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '30px',
          padding: '60px 40px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* انیمیشن 404 */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 style={{
            fontSize: '120px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            lineHeight: 1
          }}>
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 style={{
            fontSize: '28px',
            color: '#333',
            marginTop: '20px',
            marginBottom: '10px'
          }}>
            صفحه‌ای که دنبالش هستی پیدا نشد! 😕
          </h2>
          
          <p style={{
            color: '#666',
            fontSize: '16px',
            marginBottom: '30px',
            lineHeight: 1.6
          }}>
            صفحه مورد نظر شما ممکن است حذف شده باشد،
            <br />
            نام آن تغییر کرده یا به طور موقت در دسترس نباشد.
          </p>
        </motion.div>

        {/* دکمه‌های اقدام */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '30px'
          }}
        >
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🏠 بازگشت به خانه
            </motion.button>
          </Link>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🔙 صفحه قبل
          </motion.button>
        </motion.div>

        {/* کانت‌دان اتوماتیک */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            paddingTop: '20px',
            borderTop: '1px solid #eee',
            color: '#999',
            fontSize: '14px'
          }}
        >
          <p>
            انتقال خودکار به صفحه اصلی در 
            <span style={{
              display: 'inline-block',
              minWidth: '30px',
              fontWeight: 'bold',
              color: '#667eea',
              fontSize: '18px',
              margin: '0 5px'
            }}>
              {countdown}
            </span>
            ثانیه...
          </p>
        </motion.div>

        {/* پیشنهادات مفید */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            marginTop: '30px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '16px',
            textAlign: 'right'
          }}
        >
          <p style={{
            color: '#666',
            fontSize: '13px',
            marginBottom: '10px',
            fontWeight: '600'
          }}>
            🔍 ممکن است مفید باشد:
          </p>
          <ul style={{
            color: '#888',
            fontSize: '12px',
            listStyle: 'none',
            padding: 0
          }}>
            <li style={{ marginBottom: '5px' }}>• آدرس صفحه را بررسی کنید</li>
            <li style={{ marginBottom: '5px' }}>• از جستجوی سایت استفاده کنید</li>
            <li style={{ marginBottom: '5px' }}>• با پشتیبانی تماس بگیرید</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;