import React from 'react';
import { LicenseStatusCard } from './LicenseStatusCard';
import { ModuleCard } from './ModuleCard';
import { ModuleStats } from './ModuleStats';
import { useModuleManager } from '../hooks/useModuleManager';
import { useLicenseInfo } from '../hooks/useLicenseInfo';
import { DEFAULT_MODULES } from '../constants/modules';

const ModuleManager: React.FC = () => {
  const { modules, toggleModule, isUpdating, stats } = useModuleManager(DEFAULT_MODULES);
  const { licenseInfo, handleCopyLicense, handleRenewLicense } = useLicenseInfo();

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">مدیریت ماژول‌ها</h1>
        
        <LicenseStatusCard 
          licenseInfo={licenseInfo}
          onCopy={handleCopyLicense}
          onRenew={handleRenewLicense}
        />
        
        <ModuleStats {...stats} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={toggleModule}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleManager;