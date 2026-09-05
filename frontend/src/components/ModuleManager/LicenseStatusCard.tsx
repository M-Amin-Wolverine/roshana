// components/ModuleManager/LicenseStatusCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaKey, FaUsers, FaSync, FaCopy } from 'react-icons/fa';
import { LicenseInfo } from '../types/modules';
import { toast } from 'react-hot-toast';
interface Props {
  licenseInfo: LicenseInfo;
  onCopy: () => Promise<boolean>;
  onRenew: () => void;
}

export const LicenseStatusCard: React.FC<Props> = ({ licenseInfo, onCopy, onRenew }) => {
  const getStatusConfig = () => {
    switch (licenseInfo.status) {
      case 'active': return { text: 'فعال', className: 'bg-green-100 text-green-800' };
      case 'expiring': return { text: 'در حال انقضا', className: 'bg-yellow-100 text-yellow-800' };
      case 'expired': return { text: 'منقضی', className: 'bg-red-100 text-red-800' };
    }
  };

  const statusConfig = getStatusConfig();

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      toast.success('کلید لایسنس کپی شد');
    } else {
      toast.error('خطا در کپی کردن');
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6 mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">وضعیت لایسنس</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}>
          {statusConfig.text}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <span className="text-gray-600">کلید لایسنس:</span>
          <div className="flex items-center gap-2">
            <code className="bg-gray-200 px-2 py-1 rounded text-sm">{licenseInfo.key}</code>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="کپی کلید"
            >
              <FaCopy size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
            <FaCalendarAlt className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">روز باقی‌مانده</p>
              <p className="font-bold text-lg">{licenseInfo.daysRemaining}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg">
            <FaKey className="text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">نوع لایسنس</p>
              <p className="font-bold text-lg">{licenseInfo.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
            <FaUsers className="text-green-600" />
            <div>
              <p className="text-sm text-gray-600">کاربران فعال</p>
              <p className="font-bold text-lg">
                {licenseInfo.activeUsers}/{licenseInfo.maxUsers}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onRenew}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaSync className={licenseInfo.status === 'expiring' ? 'animate-spin' : ''} />
          تمدید لایسنس
        </button>
      </div>
    </motion.div>
  );
};