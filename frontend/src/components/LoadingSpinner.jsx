// src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ fullScreen = false, text = 'در حال بارگذاری...' }) => {
  const spinner = (
    <div className="loading-spinner-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      <div className="spinner" style={{
        width: '48px',
        height: '48px',
        border: '4px solid rgba(0, 0, 0, 0.1)',
        borderTopColor: '#3b82f6',
        borderRightColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      {text && <p style={{ color: '#666', fontSize: '14px' }}>{text}</p>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;