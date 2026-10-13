import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { authApi } from '../api';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: User | null;
  role: 'ADMIN' | 'EDITOR';
  switchRole: (newRole: 'ADMIN' | 'EDITOR') => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'EDITOR'>(
    (localStorage.getItem('syncsphere_role') as 'ADMIN' | 'EDITOR') || 'ADMIN'
  );
  const roleRef = useRef(role);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error, info } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function initUser() {
      const initialRole = roleRef.current;
      try {
        const token = localStorage.getItem('syncsphere_token');
        if (token) {
          const res = await authApi.getMe();
          if (cancelled || roleRef.current !== initialRole) return;
          if (res?.user) {
            setUser(res.user);
            setRole(res.user.role);
            roleRef.current = res.user.role;
            localStorage.setItem('syncsphere_role', res.user.role);
            return;
          }
        }
        const res = await authApi.demoLogin(initialRole);
        if (cancelled || roleRef.current !== initialRole) return;
        setUser(res.user);
        localStorage.setItem('syncsphere_token', res.token);
      } catch (err: any) {
        if (cancelled || roleRef.current !== initialRole) return;
        console.warn('Auth init failed, loading demo user offline:', err.message);
        localStorage.removeItem('syncsphere_token');
        setUser({
          id: initialRole === 'ADMIN' ? 'demo-admin-id' : 'demo-editor-id',
          email: `${initialRole.toLowerCase()}@syncsphere.io`,
          name: initialRole === 'ADMIN' ? 'Sanaya Gaonkar' : 'Catalog Editor',
          role: initialRole,
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    initUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const switchRole = async (newRole: 'ADMIN' | 'EDITOR') => {
    roleRef.current = newRole;
    setRole(newRole);
    localStorage.setItem('syncsphere_role', newRole);
    localStorage.removeItem('syncsphere_token');
    setUser({
      id: newRole === 'ADMIN' ? 'demo-admin-id' : 'demo-editor-id',
      email: `${newRole.toLowerCase()}@syncsphere.io`,
      name: newRole === 'ADMIN' ? 'Sanaya Gaonkar' : 'Catalog Editor',
      role: newRole,
    });

    try {
      const res = await authApi.demoLogin(newRole);
      setUser(res.user);
      roleRef.current = res.user.role;
      setRole(res.user.role);
      localStorage.setItem('syncsphere_token', res.token);
      success(`Switched role to ${newRole === 'ADMIN' ? 'Administrator' : 'Catalog Editor'}`);
    } catch (err: any) {
      info('Demo role switched', `API login was unavailable; continuing with the ${newRole} demo role.`);
      console.warn('Demo role login unavailable:', err.message);
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await authApi.login(email, pass);
      setUser(res.user);
      roleRef.current = res.user.role;
      setRole(res.user.role);
      localStorage.setItem('syncsphere_token', res.token);
      localStorage.setItem('syncsphere_role', res.user.role);
      success(`Welcome back, ${res.user.name}`);
    } catch (err: any) {
      error('Login failed', err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('syncsphere_token');
    switchRole('ADMIN');
  };

  return (
    <AuthContext.Provider value={{ user, role, switchRole, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
