// types/modules.ts
export interface Module {
  id: string;
  name: string;
  icon: string;
  required?: boolean;
  active: boolean;
  expiryDate: string | null;
}

export interface LicenseInfo {
  key: string;
  type: string;
  expiryDate: string;
  daysRemaining: number;
  maxUsers: number;
  activeUsers: number;
  status: 'active' | 'expiring' | 'expired';
}
