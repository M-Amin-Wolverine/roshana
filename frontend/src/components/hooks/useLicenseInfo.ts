// hooks/useLicenseInfo.ts
import { useState } from 'react';
import { LicenseInfo } from '../types/modules';

export const useLicenseInfo = () => {
  const [licenseInfo] = useState<LicenseInfo>({
    key: 'FRTK-2024-XXXX-XXXX',
    type: 'Enterprise',
    expiryDate: '2025-12-31',
    daysRemaining: 245,
    maxUsers: 1000,
    activeUsers: 847,
    status: 'active'
  });

  const getStatusDetails = () => {
    switch (licenseInfo.status) {
      case 'active': return { text: 'فعال', icon: '✅', className: 'active' };
      case 'expiring': return { text: 'در حال انقضا', icon: '⚠️', className: 'expiring' };
      case 'expired': return { text: 'منقضی', icon: '❌', className: 'expired' };
    }
  };

  const handleCopyLicense = async () => {
    try {
      await navigator.clipboard.writeText(licenseInfo.key);
      return true;
    } catch {
      return false;
    }
  };

  const handleRenewLicense = async () => {
    // In production: implement license renewal logic
    console.log('Renewing license...');
  };

  return {
    licenseInfo,
    getStatusDetails,
    handleCopyLicense,
    handleRenewLicense
  };
};