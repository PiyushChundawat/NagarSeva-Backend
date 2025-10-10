import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import Caffiene from '../../assets/Caffiene.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn, signOut, user } = useAuth();


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Sign in using Supabase Auth
      const { data: loginData, error: signInError } = await signIn(
        formData.email,
        formData.password
      );

      if (signInError) {
        toast.error(signInError.message || 'Login failed. Please check your credentials.');
        setError(signInError.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      if (!loginData?.user) {
        toast.error('Authentication failed. Please try again.');
        setError('Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Fetch user profile from EmployeeProfile table
      const { data: profile, error: profileError } = await supabase
        .from('EmployeeProfile')
        .select('role')
        .eq('Eid', loginData.user.id)
        .single();

      if (profileError || !profile) {
        toast.error('User profile not found. Please contact administrator.');
        setError('User profile not found. Please contact administrator.');
        await signOut();
        setIsLoading(false);
        return;
      }

      // Navigate based on role
      if (profile.role === 'manager') {
        toast.success('Login successful! Redirecting to Manager Dashboard...');
        navigate('/admin/manager');
      } else if (profile.role === 'employee') {
        toast.success('Login successful! Redirecting to Employee Dashboard...');
        navigate('/admin/employee');
      } else {
        toast.error('You do not have permission to access this portal.');
        setError('You do not have permission to access this portal.');
        await signOut();
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred. Please try again.');
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center relative">
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
      <div className="absolute py- top-0 left-0 w-full bg-gradient-to-r from-orange-500 via-white to-green">
        <div className="max-w-7xl mx-auto mt-1 mb-1 px-4 relative z-10">
          <div className="flex items-center justify-center space-x-4 text-center">
            <span className="text-xs text-blue-700 md:text-xs font-medium tracking-wide">
              भारत सरकार | Government of India | Digital India
            </span>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mt-10 mb-8">
          {/* Logo */}
          <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4">
            <img src={Caffiene} className="h-20 w-20" alt="Logo" />
          </div>

          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              NagarSeva Portal
            </h1>
            <h2 className="text-lg text-gray-600 mb-2">Administrative Dashboard</h2>
            <p className="text-sm text-gray-500">
              Government of India | Ministry of Urban Development
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <p className="text-gray-600">Authorized Personnel Only</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-colors`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Authorized Government Portal
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2025 Government of India. All rights reserved.
            <br />
            Developed for internal government use only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;