import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PublicComplaintForm() {
  const { user } = useAuth();
  const userId = user?.id;
  
  const [formData, setFormData] = useState({
    Name: '',
    Phone: '',
    Address: '',
    Description: '',
    Department: '',
    Latitude: null,
    Longitude: null,
    photoData: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Replace with your actual API base URL
  const API_BASE_URL = 'https://nagarseva-backend.onrender.com';

  // Updated departments as dropdown options
  const departments = [
    { id: 'DPT_W', name: 'Water' },
    { id: 'DPT_E', name: 'Electrical' },
    { id: 'DPT_PI', name: 'Public Infrastructure' },
    { id: 'DPT_C', name: 'Cleanliness' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      // Create preview and convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData({
          ...formData,
          photoData: reader.result
        });
        toast.success('Photo loaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              Latitude: position.coords.latitude,
              Longitude: position.coords.longitude
            });
          },
          (error) => {
            console.warn('Location access denied:', error);
            resolve({ Latitude: null, Longitude: null });
          }
        );
      } else {
        resolve({ Latitude: null, Longitude: null });
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.Name || !formData.Phone || !formData.Address || 
        !formData.Description || !formData.Department) {
      toast.error('Please fill all required fields');
      return;
    }

    // Check if user is logged in
    if (!user || !user.id) {
      toast.error('You must be logged in to submit a complaint');
      return;
    }

    setSubmitting(true);
    
    try {
      // Get user location
      toast.info('Getting your location...');
      const location = await getLocation();

      // Prepare data for API (matching your backend structure)
      const apiData = {
        Name: formData.Name,
        Phone: formData.Phone,
        Address: formData.Address,
        Description: formData.Description,
        Department: formData.Department,
        Latitude: location.Latitude,
        Longitude: location.Longitude,
        photoData: formData.photoData,
        userId: user.id // Changed to userId (lowercase) to match backend
      };

      // Make API call to your backend
      const response = await axios.post(`${API_BASE_URL}/complaint`, apiData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Handle successful response
      if (response.data.success) {
        setComplaintId(response.data.data.Cid);
        setPhotoUrl(response.data.data.photoUrl);
        setSubmitted(true);
        toast.success('Complaint submitted successfully!');
        
        // Reset form
        setFormData({
          Name: '',
          Phone: '',
          Address: '',
          Description: '',
          Department: '',
          Latitude: null,
          Longitude: null,
          photoData: null
        });
        setPhotoPreview(null);
      } else {
        toast.error(response.data.message || 'Error submitting complaint');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      
      // Handle different types of errors
      if (error.response) {
        const errorMsg = error.response.data.error || error.response.data.message || 'Failed to submit complaint';
        toast.error(`Server Error: ${errorMsg}`);
      } else if (error.request) {
        toast.error('Network error. Cannot connect to server. Please check if backend is running.');
      } else {
        toast.error('Error submitting complaint. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Indian Flag Colors */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-green-600 mb-6"></div>
            
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully!</h2>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Complaint ID:</p>
              <p className="text-xl font-bold text-blue-600">{complaintId}</p>
              <p className="text-xs text-gray-500 mt-2">Save this ID for tracking your complaint</p>
            </div>

            {photoUrl && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Photo uploaded successfully</p>
                <img 
                  src={photoUrl} 
                  alt="Complaint" 
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <button
              onClick={() => {
                setSubmitted(false);
                setComplaintId(null);
                setPhotoUrl(null);
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Submit Another Complaint
            </button>
            <Link
             to="/"
              className="w-full bg-green top-10 text-white py-3 px-4 rounded-lg font-medium hover:opacity-80 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main complaint form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-green-600"></div>
          
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nagar Seva Portal</h1>
                <p className="text-sm text-gray-600">Submit Your Complaint Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Complaint Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Register Your Complaint</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="Name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="Name"
                  name="Name"
                  value={formData.Name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="Phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="Phone"
                  name="Phone"
                  value={formData.Phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                  required
                />
              </div>

              {/* Address Field */}
              <div>
                <label htmlFor="Address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  id="Address"
                  name="Address"
                  rows={2}
                  value={formData.Address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter complete address where the issue is"
                  required
                />
              </div>

              {/* Department Dropdown - ✅ TASK 2: Changed to dropdown */}
              <div>
                <label htmlFor="Department" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Department *
                </label>
                <select
                  id="Department"
                  name="Department"
                  value={formData.Department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="Description" className="block text-sm font-medium text-gray-700 mb-2">
                  Complaint Description *
                </label>
                <textarea
                  id="Description"
                  name="Description"
                  rows={4}
                  value={formData.Description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your complaint in detail..."
                  required
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photo (Optional)
                </label>
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {photoPreview && (
                  <div className="mt-3">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData({ ...formData, photoData: null });
                        document.getElementById('photo').value = '';
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              {/* Location Notice */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Your location will be automatically captured when you submit the complaint to help us serve you better. Please allow location access when prompted.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green hover:bg-green-700'
                  } text-white`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Complaint'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}