import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../types/user';
import { MOCK_USERS, loginUser as doLogin, logoutUser as doLogout, setCurrentUserFromAuth } from '../data/mockUsers';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  switchUser: (user: User) => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('riskLens_currentUser');
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = MOCK_USERS.find(u => u.id === parsed.id);
        if (found && found.role !== 'disabled') return found;
      }
    } catch (_) {}
    return null;
  });

  const login = useCallback((email: string, password: string) => {
    const user = doLogin(email, password);
    if (user) {
      setCurrentUser(user);
      setCurrentUserFromAuth(user);
      localStorage.setItem('riskLens_currentUser', JSON.stringify({ id: user.id }));
    }
    return user;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setCurrentUser(null);
    setCurrentUserFromAuth(null);
    localStorage.removeItem('riskLens_currentUser');
  }, []);

  const switchUser = useCallback((user: User) => {
    if (user.role === 'disabled') return;
    setCurrentUser(user);
    setCurrentUserFromAuth(user);
    localStorage.setItem('riskLens_currentUser', JSON.stringify({ id: user.id }));
  }, []);

  useEffect(() => {
    setCurrentUserFromAuth(currentUser);
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    login,
    logout,
    switchUser,
    allUsers: MOCK_USERS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
