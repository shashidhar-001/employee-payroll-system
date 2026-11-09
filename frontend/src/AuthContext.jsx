import { createContext, useContext, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export const homePath = (role) =>
  ({ ADMIN: '/admin', HR: '/hr', EMPLOYEE: '/employee' }[role] || '/login');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    const u = { email: data.email, role: data.role, employeeId: data.employeeId };
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);