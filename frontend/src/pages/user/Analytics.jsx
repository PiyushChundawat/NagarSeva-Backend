import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Activity, CheckCircle, 
  Clock, AlertCircle, BarChart3, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CSVLink } from 'react-csv';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API = "https://nagarseva-backend.onrender.com";

const Analytics = () => {
  // Single state object for all analytics data
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Main fetch function
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Make HTTP request to backend API
      const response = await fetch(`${API}/analytics`);
      
      // Check if request was successful
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      // Parse JSON response
      const result = await response.json();
      
      // Check if backend returned success
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch analytics');
      }

      // Transform API data into UI structure
      const transformedData = {
        // Overview statistics
        overview: {
          totalComplaints: result.total.complaints || 0,
          pendingComplaints: result.total.pending || 0,
          assignedComplaints: 0, // Not provided by API
          completedComplaints: result.total.complete || 0,
          completionRate: result.total.complaints > 0 
            ? Math.round((result.total.complete / result.total.complaints) * 100) 
            : 0
        },
        
        // Department-wise statistics array
        departmentStats: [
          {
            id: 'water',
            name: 'Water',
            totalComplaints: result.byDepartment.water.total || 0,
            pending: result.byDepartment.water.pending || 0,
            assigned: 0,
            completed: result.byDepartment.water.complete || 0
          },
          {
            id: 'electricity',
            name: 'Electricity',
            totalComplaints: result.byDepartment.electricity.total || 0,
            pending: result.byDepartment.electricity.pending || 0,
            assigned: 0,
            completed: result.byDepartment.electricity.complete || 0
          },
          {
            id: 'publicInfra',
            name: 'Public Infrastructure',
            totalComplaints: result.byDepartment.publicInfrastructure.total || 0,
            pending: result.byDepartment.publicInfrastructure.pending || 0,
            assigned: 0,
            completed: result.byDepartment.publicInfrastructure.complete || 0
          },
          {
            id: 'cleanliness',
            name: 'Cleanliness',
            totalComplaints: result.byDepartment.cleanliness.total || 0,
            pending: result.byDepartment.cleanliness.pending || 0,
            assigned: 0,
            completed: result.byDepartment.cleanliness.complete || 0
          }
        ],
        
        // Status distribution for pie chart
        statusDistribution: [
          {
            name: 'Pending',
            value: result.total.pending || 0,
            color: '#f59e0b'
          },
          {
            name: 'Completed',
            value: result.total.complete || 0,
            color: '#10b981'
          }
        ],
        
        // Department distribution for pie chart
        departmentDistribution: [
          {
            name: 'Water',
            value: result.byDepartment.water.total || 0
          },
          {
            name: 'Electricity',
            value: result.byDepartment.electricity.total || 0
          },
          {
            name: 'Public Infrastructure',
            value: result.byDepartment.publicInfrastructure.total || 0
          },
          {
            name: 'Cleanliness',
            value: result.byDepartment.cleanliness.total || 0
          }
        ],
        
        // Generate mock trend data (7 days)
        trendData: generateMockTrendData(result.total.complaints, result.total.complete),
        
        // Priority statistics (estimated from pending)
        priorityStats: {
          high: Math.floor(result.total.pending * 0.3),
          medium: Math.floor(result.total.pending * 0.5),
          low: Math.floor(result.total.pending * 0.2)
        }
      };

      // Update state with transformed data
      setAnalytics(transformedData);
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data. Please try again.');
      setError(error.message);
    } finally {
      // Always stop loading, even if error occurred
      setLoading(false);
    }
  };

  // Generate mock trend data based on totals
  const generateMockTrendData = (totalComplaints, totalComplete) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const avgDaily = Math.floor(totalComplaints / 7);
    const avgCompleted = Math.floor(totalComplete / 7);
    
    return days.map(day => ({
      date: day,
      complaints: Math.max(0, avgDaily + Math.floor(Math.random() * 10) - 5),
      completed: Math.max(0, avgCompleted + Math.floor(Math.random() * 5) - 2)
    }));
  };

  // ============ EXPORT FUNCTIONS ============
  
  // PDF Export Function
  const handleExportPdf = () => {
    if (!analytics) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Analytics Report", 14, 20);
    
    // Overall Statistics
    doc.setFontSize(14);
    doc.text("Overall Statistics", 14, 35);
    
    const overallData = [
      ['Total Complaints', analytics.overview.totalComplaints],
      ['Pending Complaints', analytics.overview.pendingComplaints],
      ['Completed Complaints', analytics.overview.completedComplaints],
      ['Completion Rate', `${analytics.overview.completionRate}%`]
    ];
    
    autoTable(doc, {
      startY: 40,
      head: [['Statistic', 'Value']],
      body: overallData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 245] }
    });
    
    // Department-wise Statistics
    doc.setFontSize(14);
    doc.text("Department-wise Statistics", 14, doc.lastAutoTable.finalY + 15);
    
    const departmentData = analytics.departmentStats.map(dept => [
      dept.name,
      dept.totalComplaints,
      dept.pending,
      dept.completed
    ]);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Department', 'Total', 'Pending', 'Completed']],
      body: departmentData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 245] }
    });
    
    doc.save('analytics-report.pdf');
  };

  // CSV Export Data Preparation
  const prepareCSVData = () => {
    if (!analytics) return [];
    
    const csvData = [
      // Overall Statistics Section
      { category: 'Overall Statistics', statistic: 'Total Complaints', value: analytics.overview.totalComplaints },
      { category: 'Overall Statistics', statistic: 'Pending Complaints', value: analytics.overview.pendingComplaints },
      { category: 'Overall Statistics', statistic: 'Completed Complaints', value: analytics.overview.completedComplaints },
      { category: 'Overall Statistics', statistic: 'Completion Rate', value: `${analytics.overview.completionRate}%` },
      { category: '', statistic: '', value: '' }, // Empty row for separation
      
      // Department Statistics
      ...analytics.departmentStats.flatMap(dept => [
        { category: `${dept.name} Department`, statistic: 'Total Complaints', value: dept.totalComplaints },
        { category: `${dept.name} Department`, statistic: 'Pending Complaints', value: dept.pending },
        { category: `${dept.name} Department`, statistic: 'Completed Complaints', value: dept.completed },
        { category: '', statistic: '', value: '' } // Empty row for separation
      ])
    ];
    
    return csvData;
  };

  const csvHeaders = [
    { label: 'Category', key: 'category' },
    { label: 'Statistic', key: 'statistic' },
    { label: 'Value', key: 'value' }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-xl text-gray-800 font-medium">Error loading analytics</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
 
  // Destructure analytics data for easier access
  const { overview, departmentStats, statusDistribution, departmentDistribution, trendData, priorityStats } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
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
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive insights and statistics</p>
            </div>
            
            {/* Export Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={handleExportPdf}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              
              <CSVLink
                data={prepareCSVData()}
                headers={csvHeaders}
                filename="analytics-report.csv"
                className="px-4 py-2 bg-green opacity-85 text-white rounded-lg hover:opacity-100 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </CSVLink>
              
              <button 
                onClick={fetchAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('departments')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'departments'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setSelectedView('trends')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'trends'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Trends
          </button>
        </div>

        {/* Overview View */}
        {selectedView === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Complaints"
                value={overview.totalComplaints}
                icon={<Activity className="w-8 h-8" />}
                color="bg-blue-500"
                trend={`${overview.totalComplaints} total`}
              />
              <StatCard
                title="Pending"
                value={overview.pendingComplaints}
                icon={<Clock className="w-8 h-8" />}
                color="bg-yellow-500"
                trend={`${overview.pendingComplaints} waiting`}
              />
              <StatCard
                title="Assigned"
                value={overview.assignedComplaints}
                icon={<AlertCircle className="w-8 h-8" />}
                color="bg-purple-500"
                trend={`${overview.assignedComplaints} in progress`}
              />
              <StatCard
                title="Completed"
                value={overview.completedComplaints}
                icon={<CheckCircle className="w-8 h-8" />}
                color="bg-green-500"
                trend={`${overview.completionRate}% completion rate`}
              />
            </div>

            {/* Pie Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Status Distribution */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Department Distribution */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Department-wise Complaints
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trend Line Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                7-Day Complaint Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="complaints" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Total Complaints"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Task Priority Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="text-3xl font-bold text-red-600">{priorityStats.high}</div>
                  <div className="text-sm text-gray-600 mt-1">High Priority</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-600">{priorityStats.medium}</div>
                  <div className="text-sm text-gray-600 mt-1">Medium Priority</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="text-3xl font-bold text-green-600">{priorityStats.low}</div>
                  <div className="text-sm text-gray-600 mt-1">Low Priority</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Departments View */}
        {selectedView === 'departments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Department Performance</h3>
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <DepartmentCard 
                    key={dept.id} 
                    department={dept} 
                    color={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} 
                  />
                ))}
              </div>
            </div>

            {/* Department Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Department Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="assigned" fill="#3b82f6" name="Assigned" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trends View */}
        {selectedView === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Complaint Trends Analysis</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="complaints" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Total Complaints"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">
                  {trendData.reduce((acc, day) => acc + day.complaints, 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total This Week</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">
                  {trendData.reduce((acc, day) => acc + day.completed, 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Completed This Week</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Activity className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round((trendData.reduce((acc, day) => acc + day.complaints, 0)) / 7)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg. Daily Complaints</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{trend}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Department Card Component
const DepartmentCard = ({ department, color }) => {
  const total = department.totalComplaints;
  const completionRate = total > 0 ? Math.round((department.completed / total) * 100) : 0;

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center" 
            style={{ backgroundColor: color }}
          >
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{department.name}</h4>
            <p className="text-sm text-gray-600">{total} total complaints</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
          <div className="text-xs text-gray-600">Completion</div>
        </div>
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Pending</span>
            <span className="font-semibold text-yellow-600">{department.pending}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${total > 0 ? (department.pending / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Assigned</span>
            <span className="font-semibold text-blue-600">{department.assigned}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${total > 0 ? (department.assigned / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Completed</span>
            <span className="font-semibold text-green-600">{department.completed}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${total > 0 ? (department.completed / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Department color palette
const DEPARTMENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default Analytics;