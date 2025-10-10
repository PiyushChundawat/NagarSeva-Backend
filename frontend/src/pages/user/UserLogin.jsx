import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Caffiene from '../../assets/Caffiene.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserLogin = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const { session, signIn, signUp } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    if (session) {
      console.log('Session detected, redirecting to user dashboard');
      navigate('/user/Dashboard', { replace: true });
    }
  }, [session, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };
    const notify = () => toast("All fields are required");
    const SignUp=()=>toast("Signup failed. Please try again.")

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password);
      
      if (error) {
        toast.error(error.message || 'Signup failed. Please try again.');
        setError(error.message || 'Signup failed. Please try again.');
        setIsLoading(false);
        return;
      }

      toast.success('Account created successfully! Please check your email to verify.');
      setSuccess('Account created successfully! Please check your email to verify.');
      setIsLoading(false);
      
      // Switch to login form after 2 seconds
      setTimeout(() => {
        setIsSignup(false);
        setFormData({
          email: formData.email,
          password: ''
        });
        setSuccess('');
      }, 2000);
    } catch (err) {
      toast.error(err.message || 'Signup failed. Please try again.');
      setError(err.message || 'Signup failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast.error(error.message || 'Login failed. Please check your credentials.');
        setError(error.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Navigation handled by useEffect when session updates
      toast.success('Login successful! Redirecting...');
      setSuccess('Login successful! Redirecting...');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex flex-col justify-center relative">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      {/* Top Flag */}
      <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-orange-500 via-white to-green-500">
        <div className="max-w-7xl mx-auto mt-1 mb-1 px-4 relative z-10">
          <div className="flex items-center justify-center space-x-4 text-center">
            <span className="text-xs text-blue-700 md:text-xs font-medium tracking-wide">
              भारत सरकार | Government of India | Digital India 
            </span>
          </div>
        </div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo and Header */}
        <div className="text-center mt-10 mb-8">
          <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4">
            <img src={Caffiene} className='h-20 w-20' alt="NagarSeva Logo" />
          </div>
          
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              NagarSeva Portal
            </h1>
            <h2 className="text-lg text-orange-600 mb-2">
              {isSignup ? 'Citizen Registration' : 'Citizen Login'}
            </h2>
            <p className="text-sm text-gray-500">नागरिक सेवा पोर्टल</p>
          </div>
        </div>

        {/* Login/Signup Form */}
        <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-orange-500">
          {/* Tab Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setIsSignup(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                !isSignup
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsSignup(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                isSignup
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {isSignup ? 'Create New Account' : 'Welcome Back'}
            </h3>
            <p className="text-gray-600">
              {isSignup ? 'Register to access citizen services' : 'Login to access your dashboard'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          {!isSignup && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                } transition-all duration-200`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                    Forgot password?
                  </a>
                </div>
              </div>
            </form>
          )}

          {/* Signup Form */}
          {isSignup && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Create a password (min 6 characters)"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                } transition-all duration-200`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {isSignup 
                ? 'By signing up, you agree to our Terms of Service and Privacy Policy'
                : 'Need help? Contact support at support@nagarseva.gov.in'
              }
            </p>
          </div>

          {/* Badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure Citizen Portal
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 mb-8">
          <p className="text-xs text-gray-500">
            © 2025 Government of India. All rights reserved.<br />
            नागरिक सेवा पोर्टल | Citizen Services Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;