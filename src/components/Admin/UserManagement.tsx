import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  UserCheck,
  UserX,
  Search,
  Shield,
  Award
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  MOCK_USERS, 
  approveUser, 
  disableUser, 
  enableUser,
  deleteUser,
  updateUserDepartment,
  updateUserRole
} from '../../data/mockUsers';
import { User, UserRole, UserBadge } from '../../types/user';
import { notifyUserApproved } from '../../lib/notifications';
import { useLanguage } from '../../contexts/LanguageContext';

const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  admin: { label: 'Admin', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  ceo: { label: 'CEO', color: 'text-purple-300', bgColor: 'bg-purple-500/20' },
  manager: { label: 'Manager', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  user: { label: 'User', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  pending: { label: 'Pending', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  disabled: { label: 'Disabled', color: 'text-red-400', bgColor: 'bg-red-500/20' }
};

const badgeConfig: Record<UserBadge, { icon: string; color: string }> = {
  none: { icon: '', color: 'text-slate-500' },
  bronze: { icon: '🥉', color: 'text-orange-400' },
  silver: { icon: '🥈', color: 'text-slate-300' },
  gold: { icon: '🥇', color: 'text-yellow-400' },
  platinum: { icon: '💎', color: 'text-cyan-400' }
};

export function UserManagement() {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.businessUnit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleApprove = async (userId: string) => {
    if (approveUser(userId)) {
      const user = users.find(u => u.id === userId);
      if (user) {
        await notifyUserApproved(user);
      }
      setUsers([...MOCK_USERS]);
    }
  };

  const handleDisable = (userId: string) => {
    if (disableUser(userId)) {
      setUsers([...MOCK_USERS]);
    }
  };

  const handleEnable = (userId: string) => {
    if (enableUser(userId)) {
      setUsers([...MOCK_USERS]);
    }
  };

  const handleDelete = (userId: string) => {
    if (confirm(language === 'th' ? 'คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?' : 'Are you sure you want to delete this user?')) {
      if (deleteUser(userId)) {
        setUsers([...MOCK_USERS]);
      }
    }
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    if (updateUserRole(userId, role)) setUsers([...MOCK_USERS]);
  };

  const handleDepartmentChange = (userId: string, department: string) => {
    if (updateUserDepartment(userId, department)) setUsers([...MOCK_USERS]);
  };

  const DEPARTMENTS = ['IT', 'Sales', 'Finance', 'Operations', 'HR'] as const;
  const EDITABLE_ROLES: UserRole[] = ['user', 'manager', 'ceo', 'disabled', 'pending'];

  const stats = {
    total: users.length,
    pending: users.filter(u => u.role === 'pending').length,
    active: users.filter(u => u.role === 'user').length,
    admin: users.filter(u => u.role === 'admin').length,
    disabled: users.filter(u => u.role === 'disabled').length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
            <div className="text-xs text-slate-500">Total Users</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-xs text-slate-500">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
            <div className="text-xs text-slate-500">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.admin}</div>
            <div className="text-xs text-slate-500">Admins</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.disabled}</div>
            <div className="text-xs text-slate-500">Disabled</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'user', 'admin', 'disabled'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-all border",
                    filterRole === role
                      ? "bg-cyan-600 text-white border-cyan-500"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                  )}
                >
                  {role === 'all' ? 'All' : roleConfig[role as UserRole].label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">BU</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Score</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Joined</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.role === 'admin' ? (
                        <span className="text-sm text-slate-300">{user.businessUnit}</span>
                      ) : (
                        <select
                          value={user.businessUnit}
                          onChange={(e) => handleDepartmentChange(user.id, e.target.value)}
                          className="text-sm bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200"
                        >
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.role === 'admin' ? (
                        <Badge className={cn(roleConfig[user.role].bgColor, roleConfig[user.role].color, "border-transparent")}>
                          {roleConfig[user.role].label}
                        </Badge>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="text-sm bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200"
                        >
                          {EDITABLE_ROLES.map(r => (
                            <option key={r} value={r}>{roleConfig[r].label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{user.score}</span>
                        {user.badge !== 'none' && (
                          <span className={badgeConfig[user.badge].color} title={user.badge}>
                            {badgeConfig[user.badge].icon}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {user.role === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(user.id)}
                              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30"
                              title={language === 'th' ? 'อนุมัติ' : 'Approve'}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisable(user.id)}
                              className="text-amber-400 border-amber-500/30 hover:bg-amber-950/30"
                              title={language === 'th' ? 'ปิดการใช้งาน' : 'Disable'}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        {(user.role === 'user' || user.role === 'manager') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisable(user.id)}
                            className="text-amber-400 border-amber-500/30 hover:bg-amber-950/30"
                            title={language === 'th' ? 'ปิดการใช้งาน' : 'Disable'}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {user.role === 'disabled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEnable(user.id)}
                            className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30"
                            title={language === 'th' ? 'เปิดการใช้งาน' : 'Enable'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-400 border-red-500/30 hover:bg-red-950/30"
                            title={language === 'th' ? 'ลบ' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}