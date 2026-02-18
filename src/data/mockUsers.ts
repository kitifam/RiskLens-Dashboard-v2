import { User, ScoreLog, calculateBadge } from '../types/user';

export const MOCK_USERS: User[] = [
  {
    id: 'admin1',
    email: 'admin@company.com',
    password: 'admin#123',
    name: 'Admin',
    role: 'admin',
    businessUnit: 'IT',
    score: 0,
    badge: 'none',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '1',
    email: 'ceo@company.com',
    password: 'ceo#123',
    name: 'CEO',
    role: 'ceo',
    businessUnit: 'IT',
    score: 999,
    badge: 'platinum',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-05-15T08:30:00Z',
  },
  {
    id: 'mgr1',
    email: 'itmgr@company.com',
    password: 'password123',
    name: 'IT Manager',
    role: 'manager',
    businessUnit: 'IT',
    score: 200,
    badge: 'gold',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'mgr2',
    email: 'hrmgr@company.com',
    password: 'password123',
    name: 'HR Manager',
    role: 'manager',
    businessUnit: 'HR',
    score: 180,
    badge: 'gold',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'john@company.com',
    password: 'password123',
    name: 'John (IT Staff)',
    role: 'user',
    businessUnit: 'IT',
    score: 125,
    badge: 'silver',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-05-10T14:30:00Z',
    lastLoginAt: '2024-05-14T16:45:00Z',
  },
  {
    id: 'user2',
    email: 'jane@company.com',
    password: 'password123',
    name: 'Jane (HR Staff)',
    role: 'user',
    businessUnit: 'HR',
    score: 80,
    badge: 'bronze',
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'sarah@company.com',
    password: 'password123',
    name: 'Sarah Johnson',
    role: 'pending',
    businessUnit: 'Finance',
    score: 0,
    badge: 'none',
    createdAt: '2024-05-15T09:00:00Z',
    updatedAt: '2024-05-15T09:00:00Z',
  },
  {
    id: '4',
    email: 'mike@company.com',
    password: 'password123',
    name: 'Mike Chen',
    role: 'disabled',
    businessUnit: 'Operations',
    score: 45,
    badge: 'none',
    createdAt: '2024-02-01T11:00:00Z',
    updatedAt: '2024-04-20T10:00:00Z',
  },
];

export const MOCK_SCORE_LOGS: ScoreLog[] = [
  {
    id: '1',
    userId: '2',
    action: 'create_risk',
    points: 5,
    description: 'Created risk: "Major Client Contract Renewal at Risk"',
    riskId: '1',
    createdAt: '2024-05-10T14:30:00Z',
  },
  {
    id: '2',
    userId: '2',
    action: 'early_warning',
    points: 10,
    description: 'Early warning: Detected server capacity issue 2 weeks in advance',
    createdAt: '2024-05-12T09:15:00Z',
  },
  {
    id: '3',
    userId: '2',
    action: 'update_risk',
    points: 2,
    description: 'Updated risk status to "mitigated"',
    riskId: '1',
    createdAt: '2024-05-14T16:45:00Z',
  },
];

// Current logged in user (mock)
export let CURRENT_USER: User | null = null;

export function loginUser(email: string, password: string): User | null {
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  if (user && user.role !== 'disabled') {
    CURRENT_USER = user;
    user.lastLoginAt = new Date().toISOString();
    return user;
  }
  return null;
}

export function logoutUser() {
  CURRENT_USER = null;
}

/** สำหรับ AuthContext ให้ sync กับ CURRENT_USER */
export function setCurrentUserFromAuth(user: User | null) {
  CURRENT_USER = user;
}

export function getUsernameById(userId: string): string {
  const u = MOCK_USERS.find(x => x.id === userId);
  return u ? u.name : '-';
}

export function registerUser(userData: Omit<User, 'id' | 'role' | 'score' | 'badge' | 'createdAt' | 'updatedAt'>): User {
  const newUser: User = {
    ...userData,
    id: Math.random().toString(36).substr(2, 9),
    role: 'pending',
    score: 0,
    badge: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_USERS.push(newUser);
  return newUser;
}

export function approveUser(userId: string): boolean {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (user && user.role === 'pending') {
    user.role = 'user';
    user.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export function disableUser(userId: string): boolean {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (user && user.role !== 'admin') {
    user.role = 'disabled';
    user.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export function enableUser(userId: string): boolean {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (user && user.role === 'disabled') {
    user.role = 'user';
    user.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export function deleteUser(userId: string): boolean {
  const index = MOCK_USERS.findIndex(u => u.id === userId);
  if (index !== -1 && MOCK_USERS[index].role !== 'admin') {
    MOCK_USERS.splice(index, 1);
    return true;
  }
  return false;
}

/** Admin ปรับแผนกผู้ใช้ (สำหรับ RBAC) */
export function updateUserDepartment(userId: string, department: string): boolean {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (user) {
    user.businessUnit = department as User['businessUnit'];
    user.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

/** Admin ปรับ Role ผู้ใช้ (สำหรับ RBAC) */
export function updateUserRole(userId: string, role: User['role']): boolean {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (!user || user.role === 'admin') return false;
  user.role = role;
  user.updatedAt = new Date().toISOString();
  return true;
}

export function addScore(userId: string, action: ScoreLog['action'], description: string, riskId?: string): number {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (!user) return 0;
  
  const pointsMap = {
    create_risk: 5,
    update_risk: 2,
    early_warning: 10,
    login_streak: 1,
    admin_bonus: 20
  };
  
  const points = pointsMap[action];
  user.score += points;
  user.badge = calculateBadge(user.score);
  user.updatedAt = new Date().toISOString();
  
  MOCK_SCORE_LOGS.push({
    id: Math.random().toString(36).substr(2, 9),
    userId,
    action,
    points,
    description,
    riskId,
    createdAt: new Date().toISOString(),
  });
  
  return user.score;
}