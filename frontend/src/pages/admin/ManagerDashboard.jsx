import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { FaBell, FaUser, FaTrash, FaMapMarkedAlt } from 'react-icons/fa';
import { Megaphone, AlertTriangle, SearchCheck } from "lucide-react";
import Caffiene from '../../assets/Caffiene.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ComplaintsHeatmap from '../../components/ComplaintsHeatmap';

const API_BASE_URL = 'https://nagarseva-backend.onrender.com';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const userId = user?.id;  
  const [profile, setProfile] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [complaintToDeleteData, setComplaintToDeleteData] = useState(null);
  const [slaViolations, setSlaViolations] = useState({
    pendingViolations: [],
    inProgressViolations: [],
    warnings: []
  });
  const [stats, setStats] = useState({
    totalWorkers: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    completedComplaints: 0,
    sla: {
      violations: 0,
      warnings: 0,
      onTrack: 0,
      complianceRate: '0.0'
    }
   });
  

  useEffect(() => {
    if (userId) {
      loadDashboardData();
      const refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing manager dashboard...');
        loadDashboardData();
      }, 300000);
      return () => clearInterval(refreshInterval);
    }
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      if (!userId) {
        navigate('/admin/login');
        return;
      }

      setLoading(true);

      // Fetch manager profile
      const profileRes = await axios.get(`${API_BASE_URL}/manager/${userId}/profile`);
      if (!profileRes.data.success) {
        toast.error('Failed to load manager profile');
        await signOut();
        navigate('/admin/login');
        return;
      }
      setProfile(profileRes.data.data);

      // Fetch workers
      const workersRes = await axios.get(`${API_BASE_URL}/manager/${userId}/workers`);
      setWorkers(workersRes.data.data || []);

      // Fetch complaints
      const complaintsRes = await axios.get(`${API_BASE_URL}/manager/${userId}/complaints`);
      setComplaints(complaintsRes.data.data || []);

      // Fetch stats
      const statsRes = await axios.get(`${API_BASE_URL}/manager/${userId}/stats`);
      setStats(statsRes.data.data);
      toast.success('Dashboard refreshed successfully');

      // Fetch SLA violations
      const slaRes = await axios.get(`${API_BASE_URL}/manager/${userId}/sla-violations`);
      setSlaViolations(slaRes.data.data || {
        pendingViolations: [],
        inProgressViolations: [],
        warnings: []
      });

      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
      navigate('/admin/login');
    }
  };


  const handleDeleteComplaint = async () => {
    try {
      // Verify complaint status one more time before deletion
      if (complaintToDeleteData.WorkStatus === 'Completed') {
        toast.error('Cannot delete completed complaints');
        setDeleteModalOpen(false);
        return;
      }

      const response = await axios.delete(
        `${API_BASE_URL}/manager/complaint/${complaintToDelete}?managerId=${userId}`
      );

      if (response.data.success) {
        toast.success('Complaint deleted successfully');
        await loadDashboardData(); // Refresh all data
        setDeleteModalOpen(false);
        setComplaintToDelete(null);
        setComplaintToDeleteData(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete complaint';
      toast.error(errorMessage);
    }
  };

  const openDeleteModal = (complaint) => {
    // Check if complaint can be deleted
    if (complaint.WorkStatus === 'Completed') {
      toast.error('Cannot delete completed complaints');
      return;
    }
    
    setComplaintToDelete(complaint.Cid);
    setComplaintToDeleteData(complaint);
    setDeleteModalOpen(true);
  };

  const tabsData = [
    { id: 'overview', name: 'Overview', count: null },
    { id: 'sla-violations', name: 'SLA Alerts', count: (slaViolations.pendingViolations?.length || 0) + (slaViolations.inProgressViolations?.length || 0) + (slaViolations.warnings?.length || 0) },
    { id: 'workers', name: 'My Workers', count: workers.length },
    { id: 'complaints', name: 'Department Complaints', count: complaints.length },
    { id: 'heatmap', name: 'Heatmap', count: null }
  ];

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <> 
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
      <aside className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0">
        <div className="p-5 px-4 border-b border-gray-700 flex flex-row">
          <img src={Caffiene} className='h-20 w-20' alt="Logo" />
          <div className='py-4 px-3'>
            <h1 className="text-2xl font-bold text-white">NagarSeva</h1>
            <p className="text-xs text-gray-400 capitalize">Manager Portal</p>
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
              }`}
            >
              <span className="flex-grow text-left">{tab.name}</span>
              {tab.count !== null && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white text-orange-600' : 'bg-gray-600 text-gray-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-center items-center space-x-3 bg-black opacity-70 px-3 py-1 rounded-md border border-gray-200 hover:shadow-lg transition-all duration-300">
            <p className="px-2 py-1 rounded-md text-md font-medium text-white">{profile?.Name || 'Manager'}</p>
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
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h2>
            
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                loadDashboardData();
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

        <div className="p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Workers */}
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-500">My Workers</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalWorkers}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Complaints */}
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-500">Total Complaints</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalComplaints}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Complaints */}
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-red-600">{stats.pendingComplaints}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* In Progress */}
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-500">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.inProgressComplaints}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed */}
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-500">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{stats.completedComplaints}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                {/* SLA Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {/* SLA Violations */}
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-red-200">
                  <div className="p-6">
                    <div className="flex items-center">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-500">SLA Violations</p>
                        <p className="text-2xl font-bold text-red-600">{stats.sla?.violations || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLA Warnings */}
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-yellow-200">
                  <div className="p-6">
                    <div className="flex items-center">
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-500">SLA Warnings</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.sla?.warnings || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLA Compliance Rate */}
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-blue-200">
                  <div className="p-6">
                    <div className="flex items-center">
                      <SearchCheck className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-md font-medium text-gray-500">SLA Compliance</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.sla?.complianceRate || '0.0'}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Complaints</h3>
                <div className="space-y-3">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div key={complaint.Cid} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium text-gray-900">{complaint.Name}</p>
                        <p className="text-sm text-gray-600">{complaint.Description?.substring(0, 60)}...</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        complaint.WorkStatus === 'Pending' 
                          ? 'bg-red-100 text-red-800' 
                          : complaint.WorkStatus === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {complaint.WorkStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Workers Tab */}
          {activeTab === 'workers' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  My Workers - {profile?.DeptId || 'Department'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Manage your department workers</p>
              </div>
              <div className="p-6">
                {workers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workers.map((worker) => {
                      const assignedCount = Array.isArray(worker.AssignCid) 
                        ? worker.AssignCid.length 
                        : 0;
                      
                      return (
                        <div key={worker.Eid} className="border rounded-lg p-4 bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {worker.Name?.charAt(0) || 'W'}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{worker.Name}</h3>
                              <p className="text-sm text-gray-600">{worker.role || 'Worker'}</p>
                              <p className="text-xs text-gray-500 mt-1">Assigned: {assignedCount} tasks</p>
                              <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                active
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">👥</div>
                    <p className="text-gray-600">No workers found in your department</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === 'complaints' && (
            <div className="bg-white shadow-sm border rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Department Complaints
                </h2>
                <p className="text-sm text-gray-600 mt-1">View, assign, and manage complaints</p>
              </div>
              <div className="p-6">
                {complaints.length > 0 ? (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <div key={complaint.Cid} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">{complaint.Name}</h3>
                              <span className="text-xs text-gray-500">#{complaint.Cid}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{complaint.Description}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              <span>📍 {complaint.Address}</span>
                              <span>📞 {complaint.Phone}</span>
                              {complaint.EmployeeProfile?.Name && (
                                <span>👷 Assigned to: {complaint.EmployeeProfile.Name}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              Created: {new Date(complaint.CreatedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                              complaint.WorkStatus === 'Pending' 
                                ? 'bg-red-100 text-red-800' 
                                : complaint.WorkStatus === 'In Progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {complaint.WorkStatus}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openDeleteModal(complaint)}
                                className={`px-3 py-1 text-white text-xs rounded transition-colors flex items-center space-x-1 ${
                                  complaint.WorkStatus === 'Completed' 
                                    ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                                disabled={complaint.WorkStatus === 'Completed'}
                                title={complaint.WorkStatus === 'Completed' ? 'Cannot delete completed complaints' : 'Delete complaint'}
                              >
                                <FaTrash className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        {complaint.PhotoUrl && (
                          <div className="mt-3">
                            <img 
                              src={complaint.PhotoUrl} 
                              alt="Complaint" 
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-5xl mb-4">📋</div>
                    <p className="text-gray-600 text-lg">No complaints found for your department</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SLA Violations Tab */}
          {activeTab === 'sla-violations' && (
            <div className="space-y-6">
              {/* Pending Violations */}
              {slaViolations.pendingViolations && slaViolations.pendingViolations.length > 0 && (
                <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6">
                  <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Pending Complaints - SLA Violated ({slaViolations.pendingViolations.length})
                  </h3>
                  <div className="space-y-3">
                    {slaViolations.pendingViolations.map((complaint) => (
                      <div key={complaint.Cid} className="bg-white border border-red-300 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{complaint.Name}</h4>
                              <span className="text-xs text-gray-500">#{complaint.Cid}</span>
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">
                                VIOLATED
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{complaint.Description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                              <span>📍 {complaint.Address}</span>
                              <span>📞 {complaint.Phone}</span>
                              <span className="text-red-600 font-medium">
                                ⏰ Deadline: {new Date(complaint.Deadline).toLocaleString()}
                              </span>
                              {complaint.SLAViolatedAt && (
                                <span className="text-red-600 font-medium">
                                  🚨 Violated: {new Date(complaint.SLAViolatedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {complaint.PhotoUrl && (
                          <div className="mt-3">
                            <img 
                              src={complaint.PhotoUrl} 
                              alt="Complaint" 
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Violations */}
              {slaViolations.inProgressViolations && slaViolations.inProgressViolations.length > 0 && (
                <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-6">
                  <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    In Progress - SLA Violated ({slaViolations.inProgressViolations.length})
                  </h3>
                  <div className="space-y-3">
                    {slaViolations.inProgressViolations.map((complaint) => (
                      <div key={complaint.Cid} className="bg-white border border-orange-300 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{complaint.Name}</h4>
                              <span className="text-xs text-gray-500">#{complaint.Cid}</span>
                              <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 font-medium">
                                VIOLATED
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{complaint.Description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                              <span>📍 {complaint.Address}</span>
                              {complaint.EmployeeProfile?.Name && (
                                <span>👷 Assigned: {complaint.EmployeeProfile.Name}</span>
                              )}
                              <span className="text-orange-600 font-medium">
                                ⏰ Deadline: {new Date(complaint.Deadline).toLocaleString()}
                              </span>
                              {complaint.SLAViolatedAt && (
                                <span className="text-orange-600 font-medium">
                                  🚨 Violated: {new Date(complaint.SLAViolatedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {complaint.PhotoUrl && (
                          <div className="mt-3">
                            <img 
                              src={complaint.PhotoUrl} 
                              alt="Complaint" 
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {slaViolations.warnings && slaViolations.warnings.length > 0 && (
                <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-6">
                  <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Approaching Deadline - Warnings ({slaViolations.warnings.length})
                  </h3>
                  <div className="space-y-3">
                    {slaViolations.warnings.map((complaint) => (
                      <div key={complaint.Cid} className="bg-white border border-yellow-300 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{complaint.Name}</h4>
                              <span className="text-xs text-gray-500">#{complaint.Cid}</span>
                              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium">
                                WARNING
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{complaint.Description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                              <span>📍 {complaint.Address}</span>
                              {complaint.EmployeeProfile?.Name && (
                                <span>👷 Assigned: {complaint.EmployeeProfile.Name}</span>
                              )}
                              <span className="text-yellow-600 font-medium">
                                ⏰ Deadline: {new Date(complaint.Deadline).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {complaint.PhotoUrl && (
                          <div className="mt-3">
                            <img 
                              src={complaint.PhotoUrl} 
                              alt="Complaint" 
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No SLA Issues */}
              {(!slaViolations.pendingViolations || slaViolations.pendingViolations.length === 0) &&
               (!slaViolations.inProgressViolations || slaViolations.inProgressViolations.length === 0) &&
               (!slaViolations.warnings || slaViolations.warnings.length === 0) && (
                <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-12 text-center">
                  <SearchCheck className="mx-auto h-16 w-16 text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold text-green-900 mb-2">All Clear!</h3>
                  <p className="text-green-700">No SLA violations or warnings at this time.</p>
                  <p className="text-sm text-green-600 mt-2">All complaints are on track.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Heatmap Tab */}
          {activeTab === 'heatmap' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <FaMapMarkedAlt />
                  <span>Complaints Heatmap</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">Visual representation of complaint locations</p>
              </div>
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <ComplaintsHeatmap/>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Assign Modal */}
      {assignModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Complaint to Worker</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded border">
              <p className="text-xs text-gray-500 mb-1">Complaint #{selectedComplaint.Cid}</p>
              <p className="text-sm font-medium text-gray-900">{selectedComplaint.Name}</p>
              <p className="text-sm text-gray-700 mt-1">{selectedComplaint.Description}</p>
              <p className="text-xs text-gray-600 mt-2">📍 {selectedComplaint.Address}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Select Worker:</p>
              {workers.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {workers.map((worker) => {
                    const assignedCount = Array.isArray(worker.AssignCid) 
                      ? worker.AssignCid.length 
                      : 0;
                    
                    return (
                      <button
                        key={worker.Eid}
                        onClick={() => handleAssignTask(selectedComplaint.Cid, worker.Eid)}
                        className="w-full text-left p-3 border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{worker.Name}</div>
                            <div className="text-sm text-gray-600">{worker.role || 'Worker'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Current tasks</div>
                            <div className={`text-sm font-bold ${
                              assignedCount >= 5 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {assignedCount}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">No workers available</p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedComplaint(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && complaintToDeleteData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <FaTrash className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Complaint</h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete this complaint?
              </p>
              
              {/* Show complaint details */}
              <div className="mt-4 p-3 bg-gray-50 rounded border text-left">
                <p className="text-xs text-gray-500 mb-1">Complaint #{complaintToDeleteData.Cid}</p>
                <p className="text-sm font-medium text-gray-900">{complaintToDeleteData.Name}</p>
                <p className="text-sm text-gray-700 mt-1">
                  {complaintToDeleteData.Description?.substring(0, 80)}...
                </p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    complaintToDeleteData.WorkStatus === 'Pending' 
                      ? 'bg-red-100 text-red-800' 
                      : complaintToDeleteData.WorkStatus === 'In Progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {complaintToDeleteData.WorkStatus}
                  </span>
                </div>
                {complaintToDeleteData.EmployeeProfile?.Name && (
                  <p className="text-xs text-gray-600 mt-2">
                    👷 Assigned to: {complaintToDeleteData.EmployeeProfile.Name}
                  </p>
                )}
              </div>
              
              <p className="text-xs text-red-600 mt-3 font-medium">
                ⚠️ This action cannot be undone. The complaint will be removed from the employee's assignment history.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setComplaintToDelete(null);
                  setComplaintToDeleteData(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteComplaint}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}