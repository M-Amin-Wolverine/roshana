// hooks/useModuleManager.ts
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Module } from '../types/modules';

export const useModuleManager = (initialModules: Module[]) => {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleModule = useCallback(async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    // Validation checks
    if (module.required) {
      toast.error('این ماژول الزامی است و نمی‌توان غیرفعال کرد');
      return false;
    }

    if (!module.active && !module.expiryDate) {
      toast('این ماژول نیاز به خرید لایسنس جداگانه دارد', { icon: '🔑' });
      return false;
    }

    if (!module.active && module.expiryDate && new Date(module.expiryDate) < new Date()) {
      toast.error('لایسنس این ماژول منقضی شده است');
      return false;
    }

    // Simulate API call
    setIsUpdating(true);
    try {
      // In production: await api.toggleModule(moduleId);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setModules(prev => prev.map(m =>
        m.id === moduleId ? { ...m, active: !m.active } : m
      ));
      
      toast.success(`${module.active ? 'غیرفعال' : 'فعال'}‌سازی "${module.name}" با موفقیت انجام شد`);
      return true;
    } catch {
      toast.error('خطا در تغییر وضعیت ماژول');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [modules]);

  const activeCount = useMemo(() => 
    modules.filter(m => m.active).length, [modules]
  );

  const requiredCount = useMemo(() => 
    modules.filter(m => m.required).length, [modules]
  );

  return {
    modules,
    toggleModule,
    isUpdating,
    stats: { activeCount, requiredCount, total: modules.length }
  };
};
