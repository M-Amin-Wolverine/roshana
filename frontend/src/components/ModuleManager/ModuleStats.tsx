// components/ModuleManager/ModuleStats.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  total: number;
  active: number;
  required: number;
}

export const ModuleStats: React.FC<Props> = ({ total, active, required }) => {
  const optional = total - required;
  
  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <p className="text-gray-600 text-sm">کل ماژول‌ها</p>
        <p className="text-2xl font-bold">{total}</p>
      </div>
      <div className="bg-green-50 rounded-lg p-4 shadow-sm">
        <p className="text-gray-600 text-sm">فعال</p>
        <p className="text-2xl font-bold text-green-600">{active}</p>
      </div>
      <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
        <p className="text-gray-600 text-sm">الزامی</p>
        <p className="text-2xl font-bold text-blue-600">{required}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
        <p className="text-gray-600 text-sm">اختیاری</p>
        <p className="text-2xl font-bold text-gray-600">{optional}</p>
      </div>
    </motion.div>
  );
};