import React, { useEffect, useRef, useState } from 'react';

const ComplaintsHeatmap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaintsData, setComplaintsData] = useState([]);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Fetch complaints data from API
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://nagarseva-backend.onrender.com/leaflet');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success && result.data) {
        console.log('Complaints Data:', result.data);
        console.log('Number of complaints:', result.data.length);
        
        // Validate the data format
        const validData = result.data.filter(point => {
          if (Array.isArray(point) && point.length >= 2) {
            const [lat, lng] = point;
            return !isNaN(lat) && !isNaN(lng) && 
                   lat >= -90 && lat <= 90 && 
                   lng >= -180 && lng <= 180;
          }
          return false;
        });
        
        console.log('Valid data points:', validData.length);
        setComplaintsData(validData);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      setError('Failed to load complaints data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Leaflet library
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (window.L) {
      setLibrariesLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;

    script.onload = () => {
      console.log('Leaflet loaded successfully');
      setLibrariesLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Leaflet library');
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (librariesLoaded && mapRef.current && !mapInstanceRef.current && complaintsData.length > 0) {
      initializeMap();
    }
  }, [librariesLoaded, complaintsData]);

  const initializeMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    try {
      console.log('Initializing map with data points:', complaintsData.length);
      
      // Calculate center from data points or use default
      let centerLat = 25.4358;
      let centerLng = 81.8463;
      
      if (complaintsData.length > 0) {
        centerLat = complaintsData.reduce((sum, [lat]) => sum + lat, 0) / complaintsData.length;
        centerLng = complaintsData.reduce((sum, [, lng]) => sum + lng, 0) / complaintsData.length;
      }
      
      console.log('Map center:', centerLat, centerLng);
      
      const map = window.L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 5
      }).addTo(map);

      mapInstanceRef.current = map;
      
      // Wait for map to be ready
      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
        setLoading(false);
        
        // Add markers after map is ready
        if (complaintsData.length > 0) {
          addMarkers();
        }
      }, 500);
      
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map: ' + err.message);
      setLoading(false);
    }
  };

  const addMarkers = () => {
    if (!mapInstanceRef.current || !window.L || complaintsData.length === 0) {
      console.log('Cannot add markers - missing requirements');
      return;
    }

    try {
      console.log('Adding markers for', complaintsData.length, 'points');

      // Remove existing markers
      if (markersLayerRef.current) {
        mapInstanceRef.current.removeLayer(markersLayerRef.current);
      }

      const layerGroup = window.L.layerGroup();
      const bounds = [];

      complaintsData.forEach(([lat, lng], index) => {
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Invalid coordinates at index ${index}:`, lat, lng);
          return;
        }

        const color = '#ef4444'; // Red color for all markers
        const radius = 10;
        
        console.log(`Creating marker ${index} at [${lat}, ${lng}]`);
        
        // Create circle marker with better visibility
        const circle = window.L.circleMarker([lat, lng], {
          radius: radius,
          fillColor: color,
          color: '#ffffff', // White border for better visibility
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7
        });

        // Add popup
        circle.bindPopup(`
          <div style="font-family: Arial, sans-serif; min-width: 180px;">
            <h4 style="margin: 0 0 8px 0; color: ${color};">📍 Complaint #${index + 1}</h4>
            <div style="font-size: 13px; line-height: 1.5;">
              <strong>Location:</strong><br/>
              Lat: ${lat.toFixed(5)}<br/>
              Lng: ${lng.toFixed(5)}
            </div>
          </div>
        `);

        layerGroup.addLayer(circle);
        bounds.push([lat, lng]);
      });

      // Add the layer group to map
      layerGroup.addTo(mapInstanceRef.current);
      markersLayerRef.current = layerGroup;
      
      console.log('All markers added successfully');
      
      // Fit map to show all markers
      if (bounds.length > 0) {
        const leafletBounds = window.L.latLngBounds(bounds);
        mapInstanceRef.current.fitBounds(leafletBounds, { 
          padding: [50, 50],
          maxZoom: 15
        });
        console.log('Map bounds adjusted to show all markers');
      }
      
    } catch (err) {
      console.error('Error adding markers:', err);
      setError('Failed to display markers: ' + err.message);
    }
  };

  // Recalculate and update markers when data changes
  useEffect(() => {
    if (mapReady && complaintsData.length > 0) {
      addMarkers();
    }
  }, [mapReady, complaintsData]);

  const handleRefresh = () => {
    setError(null);
    setComplaintsData([]);
    setMapReady(false);
    fetchComplaints();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md shadow-lg">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <strong className="font-bold text-lg">Error!</strong>
          </div>
          <span className="block mb-4">{error}</span>
          <button 
            onClick={handleRefresh}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 border-t-4 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-800 text-lg font-bold">Loading Map...</p>
            <p className="text-gray-600 text-sm mt-2">Fetching complaint data</p>
          </div>
        </div>
      )}
      
      {/* Info Card */}
      <div className="absolute top-4 right-4 z-40 bg-white p-5 rounded-xl shadow-2xl  max-w-sm backdrop-blur-sm bg-opacity-95">
        <h2 className="text-2xl font-bold mb-3 text-gray-800 flex items-center">
          Complaints Overview
        </h2>
        <div className="space-y-2 text-sm">
          <p className="text-gray-700">
            <span className="font-semibold">Location:</span> Prayagraj, UP
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Total Complaints:</span> 
            <span className="ml-2 py-1 text-red-800 font-bold">
              {complaintsData.length}
            </span>
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {/* Data Points Counter */}
      {complaintsData.length > 0 && !loading && (
        <div className="absolute bottom-4 left-4 z-40 bg-white p-3 rounded-lg shadow-lg">
          <p className="text-sm text-gray-700 font-semibold flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
            {complaintsData.length} Active Complaints
          </p>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
    </div>
  );
};

export default ComplaintsHeatmap;