import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PluginProvider } from './contexts/PluginContext';
import { TownProvider } from './contexts/TownContext';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDetailView from './components/StudentDetailView';
import BankPlugin from './components/plugins/BankPlugin';
import LandPlugin from './components/plugins/LandPlugin';
import JobsPlugin from './components/plugins/JobsPlugin';
import MyJobDetails from './components/MyJobDetails';
import NewsPlugin from './components/plugins/NewsPlugin';
import GovernmentPlugin from './components/plugins/GovernmentPlugin';
import TendersPlugin from './components/plugins/TendersPlugin';
import TownRulesPlugin from './components/plugins/TownRulesPlugin';
import WinkelPlugin from './components/plugins/WinkelPlugin';
import PizzaTimePlugin from './components/plugins/PizzaTimePlugin';
import LeaderboardPlugin from './components/plugins/LeaderboardPlugin';
import SuggestionsBugsPlugin from './components/plugins/SuggestionsBugsPlugin';
import DisastersPlugin from './components/plugins/DisastersPlugin';
import ChoresPlugin from './components/plugins/ChoresPlugin';
import DoublesDayPlugin from './components/plugins/DoublesDayPlugin';
import AnalyticsPlugin from './components/plugins/AnalyticsPlugin';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import RequireRulesAgreed from './components/RequireRulesAgreed';
import ShowcasePage from './components/ShowcasePage';

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

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  console.log('AppContent - Current user:', user);

  return (
    <Routes>
      <Route path="/showcase" element={<ShowcasePage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/admin"
        element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PluginProvider>
              <TownProvider>
                {user?.role === 'super_admin' ? (
                  <SuperAdminDashboard />
                ) : user?.role === 'teacher' ? (
                  <TeacherDashboard />
                ) : (
                  <StudentDashboard />
                )}
              </TownProvider>
            </PluginProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/:username"
        element={
          <ProtectedRoute>
            <PluginProvider>
              <TownProvider>
                <StudentDetailView />
              </TownProvider>
            </PluginProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/:accountNumber"
        element={
          <ProtectedRoute>
            <PluginProvider>
              <TownProvider>
                <StudentDetailView />
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
                    <RequireRulesAgreed>
                      <BankPlugin />
                    </RequireRulesAgreed>
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
                    <RequireRulesAgreed>
                      <LandPlugin />
                    </RequireRulesAgreed>
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
                    <RequireRulesAgreed>
                      <JobsPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-job/:jobId"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <MyJobDetails />
                    </RequireRulesAgreed>
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
                    <RequireRulesAgreed>
                      <NewsPlugin />
                    </RequireRulesAgreed>
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
                    <RequireRulesAgreed>
                      <GovernmentPlugin />
                    </RequireRulesAgreed>
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
                    <RequireRulesAgreed>
                      <TendersPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/town-rules"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <TownRulesPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/winkel"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <WinkelPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pizza-time"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <PizzaTimePlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <LeaderboardPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suggestions-bugs"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <SuggestionsBugsPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/disasters"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <DisastersPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chores"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <ChoresPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doubles-day"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <RequireRulesAgreed>
                      <DoublesDayPlugin />
                    </RequireRulesAgreed>
                  </TownProvider>
                </PluginProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <PluginProvider>
                  <TownProvider>
                    <AnalyticsPlugin />
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
