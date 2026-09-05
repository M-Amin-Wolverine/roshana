import React from 'react';
import { motion } from 'framer-motion';
import { FaToggleOn, FaToggleOff, FaKey, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Module } from '../types/modules';

interface Props {
  module: Module;
  onToggle: (moduleId: string) => void;
  isUpdating: boolean;
}

export const ModuleCard: React.FC<Props> = ({ module, onToggle, isUpdating }) => {
  const isExpired = module.expiryDate && new Date(module.expiryDate) < new Date();
  const isAvailable = !module.active && module.expiryDate && !isExpired;
  const needsPurchase = !module.active && !module.expiryDate;

  const getBadge = () => {
    if (module.required) {
      return { text: 'الزامی', className: 'bg-blue-100 text-blue-800', icon: FaExclamationTriangle };
    }
    if (module.active) {
      return { text: 'فعال', className: 'bg-green-100 text-green-800', icon: FaCheckCircle };
    }
    if (isAvailable) {
      return { text: 'قابل فعال‌سازی', className: 'bg-yellow-100 text-yellow-800' };
    }
    if (needsPurchase) {
      return { text: 'نیاز به خرید', className: 'bg-gray-100 text-gray-800', icon: FaKey };
    }
    return null;
  };

  const badge = getBadge();
  const BadgeIcon = badge?.icon;

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-md p-5 transition-all ${
        module.active ? 'border-2 border-green-500' : 
        module.required ? 'border-2 border-blue-300' : 'border border-gray-200'
      }`}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={module.name}>
            {module.icon}
          </span>
          <h4 className="font-semibold text-lg">{module.name}</h4>
        </div>
        
        <button
          onClick={() => onToggle(module.id)}
          disabled={module.required || isUpdating}
          className={`relative transition-colors ${
            module.required ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
          }`}
          title={module.required ? 'ماژول الزامی' : module.active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
        >
          {module.active ? (
            <FaToggleOn size={28} className="text-green-600" />
          ) : (
            <FaToggleOff size={28} className="text-gray-400" />
          )}
        </button>
      </div>

      {badge && (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${badge.className}`}>
          {BadgeIcon && <BadgeIcon size={10} />}
          {badge.text}
        </div>
      )}

      {module.expiryDate && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
          <FaCalendarAlt size={10} />
          <span>
            تاریخ انقضا: {new Date(module.expiryDate).toLocaleDateString('fa-IR')}
          </span>
        </div>
      )}
    </motion.div>
  );
};