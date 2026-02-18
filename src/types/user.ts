export type UserRole = 'pending' | 'user' | 'admin' | 'disabled' | 'manager' | 'ceo';

/** สำหรับ RBAC แสดงเป็น 3 ระดับ (CEO เห็นข้อมูลเทียบเท่า ADMIN) */
export type RBACRole = 'ADMIN' | 'MANAGER' | 'USER';

export function getRBACRole(role: UserRole): RBACRole | null {
  if (role === 'admin' || role === 'ceo') return 'ADMIN';
  if (role === 'manager') return 'MANAGER';
  if (role === 'user') return 'USER';
  return null; // pending, disabled
}
export type UserBadge = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface User {
  id: string;
  email: string;
  password: string; // ใน production ต้อง hash
  name: string;
  role: UserRole;
  businessUnit: string;
  score: number;
  badge: UserBadge;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  avatar?: string;
}

export interface ScoreLog {
  id: string;
  userId: string;
  action: 'create_risk' | 'update_risk' | 'early_warning' | 'login_streak' | 'admin_bonus';
  points: number;
  description: string;
  riskId?: string;
  createdAt: string;
}

export const BADGE_THRESHOLDS = {
  bronze: 50,
  silver: 150,
  gold: 300,
  platinum: 500
};

export function calculateBadge(score: number): UserBadge {
  if (score >= BADGE_THRESHOLDS.platinum) return 'platinum';
  if (score >= BADGE_THRESHOLDS.gold) return 'gold';
  if (score >= BADGE_THRESHOLDS.silver) return 'silver';
  if (score >= BADGE_THRESHOLDS.bronze) return 'bronze';
  return 'none';
}