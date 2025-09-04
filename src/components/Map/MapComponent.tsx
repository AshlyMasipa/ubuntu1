import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useLocation } from '../../contexts/LocationContext';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
const defaultIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const sosIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const MapComponent: React.FC = () => {
  const { userLocation, nearbyUsers } = useLocation();
  const mapRef = useRef<any>(null);

  const defaultCenter = userLocation || { lat: -26.2041, lng: 28.0473 }; // Johannesburg, SA

  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation]);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-lg">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User's current location */}
        {userLocation && (
          <>
            <Marker 
              position={[userLocation.lat, userLocation.lng]} 
              icon={userIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                  <br />
                  <span className="text-sm text-gray-600">
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </span>
                </div>
              </Popup>
            </Marker>
            
            {/* Safety radius circle */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={1000} // 1km radius
              fillColor="blue"
              fillOpacity={0.1}
              color="blue"
              weight={2}
            />
          </>
        )}
        
        {/* Nearby users */}
        {nearbyUsers.map((user) => (
          <Marker
            key={user.id}
            position={[user.lat, user.lng]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>{user.displayName || 'Anonymous User'}</strong>
                <br />
                <span className="text-sm text-green-600">Online</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};