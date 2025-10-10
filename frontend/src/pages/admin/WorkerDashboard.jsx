import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import axios from 'axios';
import Caffiene from '../../assets/Caffiene.png';

// API Configuration - Updated to hosted backend
const API_BASE_URL = 'https://nagarseva-backend.onrender.com';

// API Helper Functions using axios
const fetchComplaintsByEmployee = async (employeeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/employee/${employeeId}/complaints`);
    
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

const fetchSLAViolations = async (employeeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/employee/${employeeId}/sla-violations`);
    
    if (response.data.success) {
      return response.data;
    }
    return { violations: [], warnings: [], counts: { violations: 0, warnings: 0, total: 0 } };
  } catch (error) {
    console.error('Error fetching SLA violations:', error);
    throw error;
  }
};

const toggleComplaintStatus = async (complaintId) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/complaint/toggle/${complaintId}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update complaint status');
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
};

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const userId = user?.id;  
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inprogress');
  const [updatingComplaint, setUpdatingComplaint] = useState(null);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    inProgressComplaints: 0,
    completedComplaints: 0
  });
  const [slaData, setSLAData] = useState({
    violations: [],
    warnings: [],
    counts: { violations: 0, warnings: 0, total: 0 }
  });

  useEffect(() => {
    loadWorkerData();
  }, []);

  const loadWorkerData = async () => {
    try {
      setLoading(true);

      console.log("==========================================");
      console.log("🔄 Loading worker data...");
      console.log("User object:", user);
      console.log("User ID:", user?.id);
      console.log("==========================================");

      if (!user) {
        console.log("❌ No user found, redirecting to login");
        navigate('/admin/login');
        return;
      }

      // Fetch user profile from EmployeeProfile table
      console.log("📋 Fetching employee profile for:", user.id);
      const { data: userProfile, error: profileError } = await supabase
        .from('EmployeeProfile')
        .select('*')
        .eq('Eid', user.id)
        .single();

      console.log("Profile data:", userProfile);
      console.log("Profile error:", profileError);

      if (profileError || !userProfile) {
        console.error('❌ Error fetching profile:', profileError);
        alert('Employee profile not found. Please contact administrator.');
        await signOut();
        navigate('/admin/login');
        return;
      }
      
      console.log("✅ Profile loaded:", {
        Eid: userProfile.Eid,
        Name: userProfile.Name,
        DeptId: userProfile.DeptId,
        AssignCid: userProfile.AssignCid
      });
      
      setProfile(userProfile);

      // Fetch complaints assigned to this employee using API
      console.log("📞 Calling API: /employee/" + userProfile.Eid + "/complaints");
      console.log("Full URL:", `${API_BASE_URL}/employee/${userProfile.Eid}/complaints`);
      
      try {
        const complaintsData = await fetchComplaintsByEmployee(userProfile.Eid);
        console.log("✅ API Response - Complaints data:", complaintsData);
        console.log("Number of complaints:", complaintsData?.length || 0);
        
        setComplaints(complaintsData || []);

        // Calculate stats
        const inProgressCount = complaintsData?.filter(c => c.WorkStatus === 'In Progress').length || 0;
        const completedCount = complaintsData?.filter(c => c.WorkStatus === 'Complete').length || 0;

        console.log("📊 Stats:", {
          total: complaintsData?.length || 0,
          inProgress: inProgressCount,
          completed: completedCount
        });

        setStats({
          totalComplaints: complaintsData?.length || 0,
          inProgressComplaints: inProgressCount,
          completedComplaints: completedCount
        });

        // Fetch SLA violations and warnings
        console.log("📅 Fetching SLA data for employee:", userProfile.Eid);
        const slaViolations = await fetchSLAViolations(userProfile.Eid);
        console.log("✅ SLA Data:", slaViolations);
        setSLAData(slaViolations);

      } catch (apiError) {
        console.error("❌ API Error:", apiError);
        console.error("Error details:", apiError.response?.data);
        console.error("Error status:", apiError.response?.status);
        alert('Failed to load complaints: ' + (apiError.response?.data?.message || apiError.message));
      }

      console.log("==========================================");

    } catch (error) {
      console.error('❌ Error loading worker data:', error);
      alert('Error loading dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/admin/login');
    }
  };

  const handleToggleComplaintStatus = async (complaintId, currentStatus) => {
    try {
      setUpdatingComplaint(complaintId);
      
      // Call the API to toggle status
      const updatedComplaint = await toggleComplaintStatus(complaintId);
      
      // Reload data to get fresh state
      await loadWorkerData();
      
      const newStatus = currentStatus === 'In Progress' ? 'Complete' : 'In Progress';
      const statusMessages = {
        'Complete': 'Complaint marked as completed! Great work!',
        'In Progress': 'Complaint moved back to in progress status.'
      };
      
      alert(statusMessages[newStatus] || `Complaint status updated successfully.`);
    } catch (error) {
      alert('Error updating complaint status. Please try again.');
      console.error('Error:', error);
    } finally {
      setUpdatingComplaint(null);
    }
  };

  const getFilteredComplaints = () => {
    switch (activeTab) {
      case 'inprogress':
        return complaints.filter(complaint => complaint.WorkStatus === 'In Progress');
      case 'completed':
        return complaints.filter(complaint => complaint.WorkStatus === 'Complete');
      case 'slaviolations':
        return slaData.violations || [];
      case 'slawarnings':
        return slaData.warnings || [];
      default:
        return complaints;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Complete':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAStatusColor = (slaStatus) => {
    switch (slaStatus) {
      case 'Violated':
        return 'bg-red-100 text-red-800';
      case 'Warning':
        return 'bg-orange-100 text-orange-800';
      case 'On Track':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentColor = (department) => {
    // Handle both department codes and full names
    const deptMap = {
      'DPT_W': { name: 'Water', color: 'bg-blue-100 text-blue-800' },
      'DPT_E': { name: 'Electricity', color: 'bg-orange-100 text-orange-800' },
      'DPT_PI': { name: 'Public Infrastructure', color: 'bg-purple-100 text-purple-800' },
      'DPT_C': { name: 'Cleanliness', color: 'bg-green-100 text-green-800' },
      'Water': { name: 'Water', color: 'bg-blue-100 text-blue-800' },
      'Electricity': { name: 'Electricity', color: 'bg-orange-100 text-orange-800' },
      'Electrical': { name: 'Electricity', color: 'bg-orange-100 text-orange-800' },
      'Public Infrastructure': { name: 'Public Infrastructure', color: 'bg-purple-100 text-purple-800' },
      'Cleanliness': { name: 'Cleanliness', color: 'bg-green-100 text-green-800' }
    };
    
    return deptMap[department]?.color || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentName = (department) => {
    const deptMap = {
      'DPT_W': 'Water',
      'DPT_E': 'Electricity',
      'DPT_PI': 'Public Infrastructure',
      'DPT_C': 'Cleanliness',
      'Electrical': 'Electricity'
    };
    
    return deptMap[department] || department;
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'N/A';
    const date = new Date(deadline);
    const now = new Date();
    const diffMs = date - now;
    
    if (diffMs < 0) {
      const absDiffHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      return `${absDiffHours}h overdue`;
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  const tabsData = [
    { id: 'inprogress', name: 'In Progress', count: stats.inProgressComplaints },
    { id: 'completed', name: 'Completed', count: stats.completedComplaints },
    { id: 'slaviolations', name: 'SLA Violations', count: slaData.counts.violations, highlight: true },
    { id: 'slawarnings', name: 'SLA Warnings', count: slaData.counts.warnings, highlight: true }
  ];

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-orange-500 via-white to-green text-white py-0 md:py-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="max-w-7xl mx-auto mt-1 mb-1 px-4 relative z-10">
          <div className="flex items-center justify-center space-x-4 text-center">
            <span className="text-xs text-blue-700 md:text-xs font-medium tracking-wide">
              भारत सरकार | Government of India | Digital India 
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="p-5 px-4 border-b border-gray-700 flex flex-row">
            <img src={Caffiene} className='h-20 w-20' alt="Logo" />
            <div className='py-4 px-3'>
              <h1 className="text-2xl font-bold text-white">NagarSeva</h1>
              <p className="text-xs text-gray-400 capitalize">{getDepartmentName(profile?.DeptId) || 'Department'} Dept.</p>
            </div>
          </div>

          <nav className="flex-grow p-4 space-y-2">
            {tabsData.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center p-2 py-3 rounded-md font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-400 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } ${tab.highlight && (slaData.counts.violations > 0 || slaData.counts.warnings > 0) ? 'border-l-4 border-red-500' : ''}`}
              >
                <span className="flex-grow text-left">{tab.name}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-white text-orange-600' : 'bg-gray-600 text-gray-200'
                  } ${tab.highlight && tab.count > 0 ? 'bg-red-500 text-white' : ''}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="flex justify-center items-center space-x-3 bg-black opacity-70 px-3 py-1 rounded-md border border-gray-200 hover:shadow-lg transition-all duration-300">
              <p className="px-2 py-1 rounded-md text-md font-medium text-white">{profile?.Name || 'Worker'}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-grow flex flex-col overflow-y-auto">
          {/* Header */}
          <header className="bg-white shadow-sm border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 capitalize">
                {activeTab === 'inprogress' && 'In Progress Tasks'}
                {activeTab === 'completed' && 'Completed Tasks'}
                {activeTab === 'slaviolations' && 'SLA Violations'}
                {activeTab === 'slawarnings' && 'SLA Warnings'}
              </h2>
              
              <button
                onClick={() => {
                  console.log('Manual refresh triggered');
                  loadWorkerData();
                }}
                className="bg-orange-400 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-md font-medium text-gray-500">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalComplaints}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-md font-medium text-gray-500">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.inProgressComplaints}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-md font-medium text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedComplaints}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`overflow-hidden shadow-sm rounded-lg border ${slaData.counts.total > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${slaData.counts.total > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <svg className={`h-6 w-6 ${slaData.counts.total > 0 ? 'text-red-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2v-2m0 " />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-md font-medium text-gray-500">SLA Issues</p>
                      <p className={`text-2xl font-bold ${slaData.counts.total > 0 ? 'text-red-600' : 'text-gray-900'}`}>{slaData.counts.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Complaints List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {activeTab === 'inprogress' && 'In Progress Complaints'}
                  {activeTab === 'completed' && 'Completed Complaints'}
                  {activeTab === 'slaviolations' && 'SLA Violated Complaints'}
                  {activeTab === 'slawarnings' && 'SLA Warning Complaints'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Manage your assigned complaints</p>
              </div>
              
              <div className="p-6">
                {getFilteredComplaints().length > 0 ? (
                  <div className="space-y-4">
                    {getFilteredComplaints().map((complaint) => (
                      <div key={complaint.Cid} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${activeTab === 'slaviolations' ? 'border-red-300 bg-red-50' : activeTab === 'slawarnings' ? 'border-orange-300 bg-orange-50' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-bold text-lg text-gray-900">Complaint #{complaint.Cid}</h3>
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${getDepartmentColor(complaint.Department)}`}>
                                {getDepartmentName(complaint.Department)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3 font-medium">{complaint.Description}</p>
                            
                            <div className="space-y-2 mb-3 bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start">
                                <svg className="w-4 h-4 text-gray-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <p className="text-xs text-gray-600"><strong>Citizen:</strong> {complaint.Name}</p>
                              </div>
                              <div className="flex items-start">
                                <svg className="w-4 h-4 text-gray-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <p className="text-xs text-gray-600"><strong>Phone:</strong> {complaint.Phone}</p>
                              </div>
                              <div className="flex items-start">
                                <svg className="w-4 h-4 text-gray-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-xs text-gray-600"><strong>Address:</strong> {complaint.Address}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(complaint.WorkStatus)}`}>
                                {complaint.WorkStatus}
                              </span>
                              {(activeTab === 'slaviolations' || activeTab === 'slawarnings' || complaint.SLAStatus) && (
                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${getSLAStatusColor(complaint.SLAStatus)}`}>
                                  SLA: {complaint.SLAStatus}
                                </span>
                              )}
                              {complaint.Deadline && (
                                <div className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                                  {formatDeadline(complaint.Deadline)}
                                </div>
                              )}
                              <p className="text-xs text-gray-500">
                                {new Date(complaint.CreatedAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            
                            {complaint.PhotoUrl && (
                              <div className="mt-3">
                                <img 
                                  src={complaint.PhotoUrl} 
                                  alt="Complaint" 
                                  className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(complaint.PhotoUrl, '_blank')}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4">
                            {activeTab !== 'slaviolations' && activeTab !== 'slawarnings' && (
                              <button
                                onClick={() => handleToggleComplaintStatus(complaint.Cid, complaint.WorkStatus)}
                                disabled={updatingComplaint === complaint.Cid}
                                className={`px-4 py-2 text-white text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                                  complaint.WorkStatus === 'In Progress' 
                                    ? 'bg-green hover:bg-green' 
                                    : 'bg-orange-400 hover:bg-orange-700'
                                }`}
                              >
                                {updatingComplaint === complaint.Cid ? (
                                  <span className="flex items-center">
                                    <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating...
                                  </span>
                                ) : (
                                  complaint.WorkStatus === 'In Progress' ? 'Mark Complete' : 'Reopen'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 mt-2">
                      {activeTab === 'inprogress' && 'No in progress complaints found'}
                      {activeTab === 'completed' && 'No completed complaints found'}
                      {activeTab === 'slaviolations' && 'No SLA violations - Great work!'}
                      {activeTab === 'slawarnings' && 'No SLA warnings'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
