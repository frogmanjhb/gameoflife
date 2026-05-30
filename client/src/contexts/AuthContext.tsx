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
      const profileUser = {
        ...response.data.user,
        impersonated_by: response.data.impersonated_by ?? null,
        impersonated_by_username: response.data.impersonated_by_username ?? null,
        allow_teacher_impersonation: response.data.allow_teacher_impersonation ?? false,
      };
      setUser(profileUser);
      setAccount(response.data.account);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchProfile();
    }
  };

  const login = async (username: string, password: string, schoolId?: number | null) => {
    try {
      console.log('Attempting login for:', username, 'school:', schoolId);
      const response = await api.post('/auth/login', { 
        username, 
        password, 
        ...(schoolId && { school_id: schoolId }) // Only include school_id if provided
      });
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

  const register = async (username: string, password: string, role: 'student' | 'teacher', schoolId: number, first_name?: string, last_name?: string, studentClass?: string, email?: string) => {
    try {
      console.log('Attempting registration for:', username, role, 'school:', schoolId);
      const response = await api.post('/auth/register', { 
        username, 
        password,
        confirmPassword: password, // Backend requires this for validation
        role, 
        school_id: schoolId,
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
    sessionStorage.removeItem('teacherToken');
    sessionStorage.removeItem('student_header_color_index'); // Reset random header color for next login
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setAccount(null);
  };

  const impersonateStudent = async (studentId: number) => {
    const teacherToken = localStorage.getItem('token');
    if (teacherToken) {
      sessionStorage.setItem('teacherToken', teacherToken);
    }
    const response = await api.post('/auth/impersonate', { student_id: studentId });
    const { token, user: studentUser, account: studentAccount } = response.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({
      ...studentUser,
      impersonated_by: response.data.impersonated_by ?? null,
      impersonated_by_username: response.data.impersonated_by_username ?? null,
    });
    setAccount(studentAccount);
    window.location.href = '/';
  };

  const stopImpersonating = () => {
    const teacherToken = sessionStorage.getItem('teacherToken');
    if (!teacherToken) return;
    sessionStorage.removeItem('teacherToken');
    localStorage.setItem('token', teacherToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${teacherToken}`;
    window.location.href = '/';
  };

  const isImpersonating = Boolean(user?.impersonated_by);

  const value: AuthContextType = {
    user,
    account,
    login,
    register,
    logout,
    refreshProfile,
    impersonateStudent,
    stopImpersonating,
    isImpersonating,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
