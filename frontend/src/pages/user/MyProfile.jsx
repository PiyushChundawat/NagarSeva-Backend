import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import UserNavbar from '../../components/user/UserNavbar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API Configuration
const API_BASE_URL =  'https://nagarseva-backend.onrender.com';

export default function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!user) {
        if (mounted) setError('Not authenticated');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch EmployeeProfile from Supabase (authentication remains intact)
        const { data: empProfile, error: empError } = await supabase
          .from('EmployeeProfile')
          .select('*')
          .eq('Eid', user.id)
          .maybeSingle();

        if (empError) console.warn('EmployeeProfile fetch warning:', empError.message || empError);

        const profileData = empProfile ?? { 
          id: user.id, 
          name: user.user_metadata?.full_name ?? user.email 
        };

        // Fetch complaints from external API using axios
        try {
          const response = await axios.get(`${API_BASE_URL}/complaints/user/${user.id}`);
          
          if (response.data.success && mounted) {
            setProfile(profileData);
            setComplaints(Array.isArray(response.data.data) ? response.data.data : []);
            console.log(`✅ Successfully loaded ${response.data.data.length} complaints`);
          } else {
            throw new Error(response.data.message || 'Failed to fetch complaints');
          }
        } catch (apiError) {
          console.error('API fetch error:', apiError);
          toast.error('Unable to load complaints from server');
          if (mounted) {
            // If API fails, set empty complaints array but keep profile
            setProfile(profileData);
            setComplaints([]);
            setError('Unable to load complaints from server');
          }
        }
      } catch (err) {
        console.error('MyProfile load error', err);
        if (mounted) setError('Unable to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => { mounted = false; };
  }, [user]);

  const totalComplaints = Array.isArray(complaints) ? complaints.length : 0;
  
// NAYA CODE (CORRECT)
  const complaintsByStatus = (Array.isArray(complaints) ? complaints : []).reduce((acc, c) => {
  const status = c?.WorkStatus ?? 'unknown';
  // Normalize status to match our keys
  let normalizedStatus = 'unknown';
  if (status === 'Pending') normalizedStatus = 'pending';
  else if (status === 'In Progress') normalizedStatus = 'in-progress';
  else if (status === 'Complete') normalizedStatus = 'complete';
  
  acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
  return acc;
}, {});

  return (
    <div className="min-h-screen bg-gray-50">
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
      <UserNavbar />

      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          {/* Profile Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(profile?.Name || profile?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{profile?.Name || profile?.name || 'Unknown User'}</h3>
                <p className="text-sm text-gray-500">User ID: {profile?.Eid || profile?.id || 'N/A'}</p>
                {profile?.DeptId && (
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      Department: {profile.DeptId}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="text-right bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium">Total Complaints</p>
              <p className="text-4xl font-bold text-orange-600">{totalComplaints}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Pending</p>
                  <p className="text-3xl font-bold text-yellow-700">{complaintsByStatus['pending'] ?? 0}</p>
                </div>
                <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">In Progress</p>
                  <p className="text-3xl font-bold text-blue-700">{complaintsByStatus['in-progress'] ?? 0}</p>
                </div>
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Complete</p>
                  <p className="text-3xl font-bold text-green-700">{complaintsByStatus['complete'] ?? 0}</p>
                </div>
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            {/* <div className="p-4 border-2 border-gray-200 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Other</p>
                  <p className="text-3xl font-bold text-gray-700">{complaintsByStatus['unknown'] ?? 0}</p>
                </div>
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div> */}
          </div>

          {/* Complaints List */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-800">My Complaints</h4>
              {loading && (
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading complaints...
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {!loading && !error && Array.isArray(complaints) && complaints.length > 0 ? (
              <ul className="space-y-3">
                {complaints.map((c) => (
                  <li key={c.Cid} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-bold text-lg text-gray-800">
                            Complaint #{c.Cid}
                          </h5>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            c.WorkStatus === 'Complete' 
                            ? 'bg-green-100 text-green-800' 
                            : c.WorkStatus === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : c.WorkStatus === 'In Progress'
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                            {c.WorkStatus || 'Unknown'}
                          </span>
                          {c.Department && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {c.Department}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">{c.Description || c.detail || 'No description provided'}</p>
                        
                        {c.Address && (
                          <div className="flex items-start text-xs text-gray-600 mb-2">
                            <svg className="w-4 h-4 mr-1 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{c.Address}</span>
                          </div>
                        )}

                        {c.PhotoUrl && (
                          <div className="mt-2">
                            <img 
                              src={c.PhotoUrl} 
                              alt="Complaint" 
                              className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(c.PhotoUrl, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(c.CreatedAt || c.created_at || Date.now()).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(c.CreatedAt || c.created_at || Date.now()).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : !loading && !error ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 font-medium">No complaints to show</p>
                <p className="text-sm text-gray-400 mt-1">Your submitted complaints will appear here</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
