import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Account, AuthContextType } from '../types';
import api from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.user);
      setAccount(response.data.account);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login for:', username);
      const response = await api.post('/auth/login', { username, password });
      console.log('Login response:', response.data);
      const { token, user, account } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Setting user state:', user);
      setUser(user);
      setAccount(account);
      console.log('User state set, should redirect to dashboard');
      
      // Force a page reload to ensure the state is properly set
      window.location.href = '/';
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (username: string, password: string, role: 'student' | 'teacher', first_name?: string, last_name?: string, studentClass?: string, email?: string) => {
    try {
      console.log('Attempting registration for:', username, role);
      const response = await api.post('/auth/register', { 
        username, 
        password,
        confirmPassword: password, // Backend requires this for validation
        role, 
        first_name, 
        last_name, 
        class: studentClass, 
        email 
      });
      console.log('Registration response:', response.data);
      
      // Check if registration requires approval
      if (response.data.requires_approval) {
        return response.data; // Return the response so LoginForm can handle it
      }
      
      const { token, user, account } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setAccount(account);
      
      // Force a page reload to ensure the state is properly set
      window.location.href = '/';
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response data:', error.response?.data);
      
      // Handle validation errors array from express-validator
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const firstError = error.response.data.errors[0];
        throw new Error(firstError.msg || firstError.message || 'Validation failed');
      }
      
      // Handle single error message
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('student_header_color_index'); // Reset random header color for next login
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setAccount(null);
  };

  const value: AuthContextType = {
    user,
    account,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
