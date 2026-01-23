import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/check')
      .then(res => setIsAdmin(res.data.isAdmin))
      .finally(() => setLoading(false));
  }, []);

  const login = async (password) => {
    const res = await api.post('/admin/login', { password });
    if (res.data.success) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await api.post('/admin/logout');
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
