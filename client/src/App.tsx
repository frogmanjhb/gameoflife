import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PluginProvider } from './contexts/PluginContext';
import { TownProvider } from './contexts/TownContext';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import BankPlugin from './components/plugins/BankPlugin';
import LandPlugin from './components/plugins/LandPlugin';
import JobsPlugin from './components/plugins/JobsPlugin';
import NewsPlugin from './components/plugins/NewsPlugin';
import GovernmentPlugin from './components/plugins/GovernmentPlugin';
import TendersPlugin from './components/plugins/TendersPlugin';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  console.log('AppContent - Current user:', user);

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PluginProvider>
              <TownProvider>
                {user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}
              </TownProvider>
            </PluginProvider>
          </ProtectedRoute>
        }
      />
          <Route
            path="/bank"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <BankPlugin />
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/land"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <LandPlugin />
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <JobsPlugin />
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <NewsPlugin />
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/government"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <GovernmentPlugin />
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenders"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <TendersPlugin />
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
