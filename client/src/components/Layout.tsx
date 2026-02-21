import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X, Home } from 'lucide-react';
import ProfileBadge from './ProfileBadge';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <img src="/logo.png" alt="Town Hub" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Town Hub</h1>
                <p className="text-sm text-gray-500">CivicLab Control Center</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ProfileBadge user={user} size="md" />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{user.username}</span>
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                      {user.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {user && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-4 py-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-3 mb-2">
                      <ProfileBadge user={user} size="md" />
                      <span className="font-medium text-gray-900">{user.username}</span>
                    </div>
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium inline-block">
                      {user.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}

        {/* Frozen account overlay - blocks entire system for students with frozen accounts */}
        {user?.role === 'student' && user?.account_frozen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
              <div className="text-6xl mb-4">❄️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Account Temporarily Frozen</h2>
              <p className="text-gray-600 mb-6">
                Due to suspicious activity, your account is temporarily frozen. Please see a teacher.
              </p>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
