import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

const LoginForm: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student' as 'student' | 'teacher',
    first_name: '',
    last_name: '',
    class: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        await register(
          formData.username, 
          formData.password, 
          formData.role,
          formData.first_name,
          formData.last_name,
          formData.class,
          formData.email
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto bg-primary-600 rounded-full flex items-center justify-center" style={{ width: '216px', height: '216px' }}>
            <img src="/logo.png" alt="Game of Life Bank" className="h-15 w-15" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isLogin ? 'Game of Life Bank' : 'Join the Game!'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create your classroom account'}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="label">
                <User className="h-4 w-4 inline mr-1" />
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                <Lock className="h-4 w-4 inline mr-1" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="role" className="label">
                    I am a...
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="input-field"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="student">🎓 Student</option>
                    <option value="teacher">👨‍🏫 Teacher</option>
                  </select>
                </div>

                {formData.role === 'student' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first_name" className="label">
                          First Name
                        </label>
                        <input
                          id="first_name"
                          name="first_name"
                          type="text"
                          required
                          className="input-field"
                          placeholder="Enter first name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="last_name" className="label">
                          Last Name
                        </label>
                        <input
                          id="last_name"
                          name="last_name"
                          type="text"
                          required
                          className="input-field"
                          placeholder="Enter last name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="class" className="label">
                        Class
                      </label>
                      <select
                        id="class"
                        name="class"
                        required
                        className="input-field"
                        value={formData.class}
                        onChange={handleInputChange}
                      >
                        <option value="">Select your class</option>
                        <option value="6A">6A</option>
                        <option value="6B">6B</option>
                        <option value="6C">6C</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="email" className="label">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="input-field"
                        placeholder="yourname@stpeters.co.za"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-gray-500 mt-1">Must end with @stpeters.co.za</p>
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>🎮 Learn financial literacy through interactive gameplay!</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
