import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true); // true while verifying stored token

  // Verify token on first load
  useEffect(() => {
    const token = localStorage.getItem('ls_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setAdmin(res.data.admin))
      .catch(() => {
        localStorage.removeItem('ls_admin_token');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, admin: adminData } = res.data;
    localStorage.setItem('ls_admin_token', token);
    setAdmin(adminData);
    return adminData;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('ls_admin_token');
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
