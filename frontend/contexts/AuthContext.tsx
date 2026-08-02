'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/services/api';

interface User {
  id: number;
  username: string;
  email: string;
  currency: string;
  monthly_budget_limit: number | null;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setUser(response.data);
    } catch (error) {
      // Clear tokens if profile fetch fails (e.g. expired or invalid)
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { access, refresh } = response.data;
      
      Cookies.set('access_token', access, { expires: 1 }); // 1 day
      Cookies.set('refresh_token', refresh, { expires: 7 }); // 7 days
      
      await fetchProfile();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register/', data);
      const { access, refresh, user: registeredUser } = response.data;
      
      Cookies.set('access_token', access, { expires: 1 });
      Cookies.set('refresh_token', refresh, { expires: 7 });
      
      setUser(registeredUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.put('/auth/profile/', data);
      setUser(response.data);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
