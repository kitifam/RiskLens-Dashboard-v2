import React, { useState } from 'react';
import { UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRBACRole } from '../types/user';
import { cn } from '../lib/utils';
import type { User } from '../types/user';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  CEO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  MANAGER: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  USER: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

function getDisplayRole(user: User): string {
  if (user.role === 'ceo') return 'CEO';
  const rbac = getRBACRole(user.role);
  return rbac || user.role;
}

function getRoleBadgeClass(user: User): string {
  const display = getDisplayRole(user);
  return ROLE_COLORS[display] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

/** เฉพาะ Admin เท่านั้นที่อนุญาตให้กดเปลี่ยน user (Switch User RBAC) */
function canSwitchUser(role: string): boolean {
  return role === 'admin';
}

export function RoleSwitcher() {
  const { currentUser, switchUser, allUsers } = useAuth();
  const [open, setOpen] = useState(false);

  const allowedUsers = allUsers.filter(u => u.role !== 'disabled' && u.role !== 'pending');
  if (!currentUser) return null;

  const showSwitcher = canSwitchUser(currentUser.role);

  return (
    <div className="relative">
      {showSwitcher ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
              getRoleBadgeClass(currentUser)
            )}
            title="Switch User (RBAC)"
          >
            <UserCircle className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
            <span className="text-[10px] uppercase opacity-90">{getDisplayRole(currentUser)}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
              <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-500">
                  Switch User (RBAC)
                </div>
                {allowedUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      switchUser(u);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      currentUser.id === u.id
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        u.role === 'ceo' && 'bg-purple-500',
                        u.role === 'admin' && 'bg-red-500',
                        getRBACRole(u.role) === 'MANAGER' && 'bg-orange-500',
                        getRBACRole(u.role) === 'USER' && 'bg-cyan-500'
                      )}
                    />
                    <span className="truncate">{u.name}</span>
                    <span className="ml-auto text-[10px] uppercase text-slate-500">{getDisplayRole(u)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium cursor-default',
            getRoleBadgeClass(currentUser)
          )}
          title={currentUser.role === 'manager' ? 'Manager' : 'User'}
        >
          <UserCircle className="w-4 h-4" />
          <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
          <span className="text-[10px] uppercase opacity-90">{getDisplayRole(currentUser)}</span>
        </div>
      )}
    </div>
  );
}
