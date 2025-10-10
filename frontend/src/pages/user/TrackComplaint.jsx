import React, { useState } from 'react';
import IntroTour from '../../components/IntroTour.jsx';
import startTour from '../../utils/tour';
import { Search, MapPin, Clock, User, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function TrackComplaint() {
  const [complaintId, setComplaintId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSearching(true);
    setSearchResult(null);

    try {
      // Call your backend API
      const response = await fetch(`https://nagarseva-backend.onrender.com/complaint/${complaintId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch complaint');
      }

      if (result.success && result.data) {
        setSearchResult(result.data);
        setError('');
      } else {
        setSearchResult(null);
        setError('शिकायत नहीं मिली। कृपया सही ID दर्ज करें। | Complaint not found. Please enter correct ID.');
      }
    } catch (err) {
      console.error('Error fetching complaint:', err);
      setSearchResult(null);
      setError(err.message || 'शिकायत लाने में त्रुटि। कृपया पुनः प्रयास करें। | Error fetching complaint. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-300';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'पूर्ण':
        return 'bg-green text-green border-green';
      case 'in-progress':
      case 'in progress':
      case 'प्रगति में':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'assigned':
      case 'असाइन किया गया':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending':
      case 'लंबित':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <AlertCircle className="w-5 h-5" />;
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'पूर्ण':
        return <CheckCircle className="w-5 h-5" />;
      case 'in-progress':
      case 'in progress':
      case 'प्रगति में':
        return <Loader className="w-5 h-5 animate-spin" />;
      case 'assigned':
      case 'असाइन किया गया':
      case 'pending':
      case 'लंबित':
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDepartmentName = (deptId) => {
    const departments = {
     'DPT_W': { name: 'Water Supply', hindi: 'जल आपूर्ति' },
    'DPT_E': { name: 'Electrical', hindi: 'बिजली' },
    'DPT_PI': { name: 'Public Infrastructure', hindi: 'सार्वजनिक बुनियादी ढांचा' },
    'DPT_C': { name: 'Cleanliness', hindi: 'स्वच्छता' }
    };
    return departments[deptId] || { name: 'Unknown', hindi: 'अज्ञात' };
  };

  return (
    <div className="min-h-screen bg-gray-100">
    
      {/* Top Flag */}
      <div className="bg-gradient-to-r from-orange-500 via-white to-green">
        <div className="max-w-7xl mx-auto mt-1 mb-1 px-4 relative z-10">
          <div className="flex items-center justify-center space-x-4 text-center">
            <span className="text-xs text-blue-700 md:text-xs font-medium tracking-wide">
              भारत सरकार | Government of India | Digital India 
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 bg-orange-500 rounded-full flex items-center justify-center">
                <FileText className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-green opacity-80 bg-clip-text text-transparent mb-3">
              शिकायत ट्रैक करें
            </h1>
            <p className="text-xl text-gray-600 mb-2">Track Your Complaint</p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              अपनी शिकायत का स्टेटस देखने के लिए नीचे Complaint ID दर्ज करें
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                <FileText className="inline-block w-5 h-5 mr-2 mb-1" />
                शिकायत ID दर्ज करें | Enter Complaint ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="track-search-input"
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  placeholder="उदाहरण: 1001"
                  className="w-full px-6 py-4 pr-14 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                />
                <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              </div>
            </div>

                <div className="flex items-center gap-3">
                <button
              id="track-search-btn"
              type="submit"
              disabled={searching}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {searching ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>खोज रहे हैं...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>शिकायत खोजें | Search Complaint</span>
                </>
              )}
            </button>
           
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Search Result */}
        {searchResult && (
          <div id="track-result" className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-orange-500 via-white to-green"></div>
            
            {/* Header Section */}
            <div className="p-6 bg-gradient-to-r from-orange-50 to-green border-b">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    शिकायत ID: {complaintId}
                  </h2>
                  <p className="text-gray-600">Complaint ID: {complaintId}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className={`px-4 py-2 rounded-lg font-semibold text-sm border-2 flex items-center space-x-2 ${getStatusColor(searchResult.WorkStatus)}`}>
                    {getStatusIcon(searchResult.WorkStatus)}
                    <span>{searchResult.WorkStatus || 'N/A'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">पता | Address</p>
                    <p className="text-lg font-medium text-gray-900">{searchResult.Address || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">सबमिट की तारीख | Submitted</p>
                    <p className="text-lg font-medium text-gray-900">{formatDate(searchResult.CreatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">कर्मचारी | Employee</p>
                    <p className="text-lg font-medium text-gray-900">{searchResult.EmployeeName || 'Not Assigned'}</p>
                    <p className="text-sm text-gray-600">ID: {searchResult.Eid || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">विभाग | Department</p>
                    {searchResult.Department ? (
                      <>
                        <p className="text-lg font-medium text-gray-900">{getDepartmentName(searchResult.Department).hindi}</p>
                        <p className="text-sm text-gray-600">{getDepartmentName(searchResult.Department).name}</p>
                      </>
                    ) : (
                      <p className="text-lg font-medium text-gray-900">N/A</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="px-6 pb-6">
              <div className="bg-gradient-to-r from-orange-50 to-green-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-orange-600" />
                  वर्तमान स्थिति | Current Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="text-xl font-bold text-gray-900">{searchResult.WorkStatus || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Employee</p>
                    <p className="text-xl font-bold text-gray-900">{searchResult.EmployeeName || 'Not Assigned'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="text-xl font-bold text-gray-900">{formatDate(searchResult.CreatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="px-6 pb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 text-center">
                  💡 <strong>नोट:</strong> यदि आपको कोई समस्या है, तो कृपया हमसे संपर्क करें।
                  <br />
                  <em>If you have any issues, please contact us.</em>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
