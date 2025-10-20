import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GetLocationModal = ({ isOpen, onClose, onLocationSelect }) => {
  const [position, setPosition] = useState([51.5074, -0.1278]); // Default to London
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setPosition([51.5074, -0.1278]);
      setUserLocation(null);
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = [latitude, longitude];
        setPosition(newPosition);
        setUserLocation(newPosition);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied by user.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred.');
            break;
        }
      }
    );
  };

  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
      },
    });
    return null;
  };

  const handleSelectLocation = () => {
    onLocationSelect(position[0], position[1]);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '95vh', overflow: 'hidden' }}>
        <div className="modal-header">
          <h3 className="modal-title">Select Location</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body" style={{ maxHeight: 'calc(95vh - 120px)', overflowY: 'auto', padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
              Click "Get Current Location" to use your current position, or click anywhere on the map to select a different location.
            </p>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={getCurrentLocation}
                disabled={loading}
                style={{ 
                  padding: '10px 20px',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Getting Location...' : 'Get Current Location'}
              </button>
              
              {userLocation && (
                <div style={{ 
                  padding: '10px 15px', 
                  backgroundColor: '#e8f5e8', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#2e7d32',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Location Found
                </div>
              )}
            </div>

            {error && (
              <div style={{
                padding: '10px 15px',
                backgroundColor: '#ffe9e6',
                border: '1px solid #fcc',
                borderRadius: '6px',
                color: '#c33',
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                {error}
              </div>
            )}

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px 15px', 
              borderRadius: '6px',
              fontSize: '13px',
              color: '#666',
              marginBottom: '15px'
            }}>
              <strong>Selected Coordinates:</strong><br/>
              Latitude: {position[0].toFixed(6)}<br/>
              Longitude: {position[1].toFixed(6)}
            </div>
          </div>

          <div style={{ 
            height: '350px', 
            width: '100%', 
            border: '2px solid #d4a574', 
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <MapContainer
              center={position}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              key={`${position[0]}-${position[1]}`} // Force re-render when position changes
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position} />
              <MapEvents />
            </MapContainer>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #e0e0e0', marginTop: 'auto' }}>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '10px 20px' }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSelectLocation}
            style={{ background: 'var(--accent-orange)', color: '#fff' }}
          >
            Select Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default GetLocationModal;
