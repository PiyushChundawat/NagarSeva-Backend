// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const [authorized, setAuthorized] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setAuthorized(false);
        setCheckingRole(false);
        return;
      }

      // If no specific roles required, just check if user is authenticated
      if (allowedRoles.length === 0) {
        setAuthorized(true);
        setCheckingRole(false);
        return;
      }

      try {
        // Fetch user profile from EmployeeProfile table
        const { data: profile, error } = await supabase
          .from('EmployeeProfile')
          .select('role')
          .eq('Eid', user.id)
          .single();

        if (error || !profile) {
          console.error('Error fetching profile:', error);
          setAuthorized(false);
          setCheckingRole(false);
          return;
        }

        console.log('✅ User authenticated, Role:', profile.role);
        setUserRole(profile.role);

        // Check if user's role is in allowed roles
        const isAllowed = allowedRoles.includes(profile.role);
        setAuthorized(isAllowed);
        setCheckingRole(false);

        if (!isAllowed) {
          console.log(`❌ Access denied - user role '${profile.role}' not in allowed roles:`, allowedRoles);
        }
      } catch (err) {
        console.error('Role check error:', err);
        setAuthorized(false);
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [user, allowedRoles]);

  // Show loading spinner while checking authentication
  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log('❌ Redirecting to login - user not authenticated');
    return <Navigate to="/" replace />;
  }

  // If authenticated but not authorized for this route
  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          {userRole && (
            <p className="text-sm text-gray-500">
              Required role: {allowedRoles.join(' or ')} | Your role: {userRole}
            </p>
          )}
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If authorized, render the protected content
  console.log('✅ Access granted to protected route');
  return children;
};

export default ProtectedRoute;