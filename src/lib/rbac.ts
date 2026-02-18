import type { Risk } from '../types/risk';
import type { User } from '../types/user';
import { getRBACRole } from '../types/user';

/**
 * กรอง risks ตาม Role (RBAC)
 * - ADMIN/CEO: เห็นทั้งหมด
 * - MANAGER: เห็นเฉพาะแผนกตัวเอง (businessUnit = user.businessUnit)
 * - USER: เห็นเฉพาะหน่วยงานตัวเอง และเฉพาะที่ตัวเองสร้างหรือถูกมอบหมาย
 */
export function filterRisksByRole(risks: Risk[], user: User | null): Risk[] {
  if (!user) return [];
  const rbac = getRBACRole(user.role);
  if (rbac === 'ADMIN') return [...risks];
  if (rbac === 'MANAGER') {
    return risks.filter(r => r.businessUnit === user.businessUnit);
  }
  if (rbac === 'USER') {
    const sameDept = (r: Risk) => r.businessUnit === user.businessUnit;
    const createdBy = (r: Risk) => r.createdBy === user.id || r.reportedByUserId === user.id;
    const assignedTo = (r: Risk) => r.assignedTo === user.id;
    return risks.filter(r => sameDept(r) && (createdBy(r) || assignedTo(r)));
  }
  return []; // pending, disabled
}

/** USER แก้ไขได้เฉพาะรายการที่ตัวเองสร้างหรือถูกมอบหมาย */
export function canEditRisk(risk: Risk, user: User | null): boolean {
  if (!user) return false;
  const rbac = getRBACRole(user.role);
  if (rbac === 'ADMIN') return true;
  if (rbac === 'MANAGER') return risk.businessUnit === user.businessUnit;
  if (rbac === 'USER') {
    return risk.createdBy === user.id || risk.reportedByUserId === user.id || risk.assignedTo === user.id;
  }
  return false;
}

/** MANAGER/ADMIN ลบได้; USER ลบไม่ได้ */
export function canDeleteRisk(risk: Risk, user: User | null): boolean {
  if (!user) return false;
  const rbac = getRBACRole(user.role);
  if (rbac === 'ADMIN') return true;
  if (rbac === 'MANAGER') return risk.businessUnit === user.businessUnit;
  return false;
}
