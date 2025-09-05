import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { useLocation } from '../../contexts/LocationContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { BusStop, TaxiRank } from '../../types';
import { fetchIncidents, Incident } from '../../services/incidentService';
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

// Magenta bus stop icon
const busStopIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Yellow taxi rank icon
const taxiRankIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Incident heatmap icon (small dot)
const incidentIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNiIgY3k9IjYiIHI9IjMiIGZpbGw9InJlZCIgZmlsbC1vcGFjaXR5PSIwLjciLz4KPC9zdmc+',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// Component to handle map view updates - ONLY on initial load
const MapInitializer: React.FC<{ center: LatLng; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // Only set the view on initial load, not on subsequent updates
    if (!initializedRef.current) {
      map.setView(center, zoom);
      initializedRef.current = true;
    }
  }, [center, zoom, map]);

  return null;
};

const RecenterButton: React.FC<{ 
  userLocation: { lat: number; lng: number } | null;
  zoomLevel: number;
  onRecenter: () => void;
}> = ({ userLocation, zoomLevel, onRecenter }) => {
  const map = useMap();
  const [isPressed, setIsPressed] = useState(false);
  
  const handleClick = () => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], zoomLevel, { animate: true });
      onRecenter();
    }
  };

  if (!userLocation) return null;

  return (
    <button
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`absolute bottom-4 left-4 bg-white text-blue-600 p-3 rounded-full shadow-lg hover:bg-blue-100 z-[1000] border border-gray-300 transition-all duration-200 ${
        isPressed ? 'scale-90 bg-blue-200' : 'scale-100'
      } mobile-friendly-recenter-button`}
      title="Recenter to my location"
      aria-label="Recenter map to my location"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="w-6 h-6"
      >
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z" clipRule="evenodd" />
      </svg>
    </button>
  );
};

// Add CSS for mobile optimization
const mobileStyles = `
  .mobile-friendly-recenter-button {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  @media (max-width: 768px) {
    .mobile-friendly-recenter-button {
      bottom: 70px !important; /* Move above mobile browser UI */
      left: 12px;
      background-color: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
  }
  
  @media (max-width: 480px) {
    .mobile-friendly-recenter-button {
      bottom: 60px !important;
      padding: 2.5px;
    }
    
    .mobile-friendly-recenter-button svg {
      width: 20px;
      height: 20px;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.innerText = mobileStyles;
document.head.appendChild(styleSheet);


export const MapComponent: React.FC = () => {
  const { userLocation, nearbyUsers, locationAccuracy } = useLocation();
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingBusStops, setLoadingBusStops] = useState(false);
  const [loadingTaxiRanks, setLoadingTaxiRanks] = useState(false);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const mapRef = useRef<any>(null);

  const defaultCenter = userLocation || { lat: -26.2041, lng: 28.0473 }; // Johannesburg, SA

  // Fetch bus stops from Firestore
  useEffect(() => {
    const fetchBusStops = async () => {
      setLoadingBusStops(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'BusStops'));
        const stops: BusStop[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          stops.push({
            id: doc.id,
            name: data.name,
            location: data.location,
            routes: data.routes,
            details: data.details
          } as BusStop);
        });
        
        setBusStops(stops);
      } catch (error) {
        console.error('Error fetching bus stops:', error);
      } finally {
        setLoadingBusStops(false);
      }
    };

    fetchBusStops();
  }, []);

  // Fetch taxi ranks from Firestore
  useEffect(() => {
    const fetchTaxiRanks = async () => {
      setLoadingTaxiRanks(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'TaxiRanks'));
        const ranks: TaxiRank[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ranks.push({
            id: doc.id,
            name: data.name,
            coordinates: data.coordinates,
            description: data.description,
            common_pickup_points: data.common_pickup_points,
            fare_estimates: data.fare_estimates,
            area: data.area
          } as TaxiRank);
        });
        
        setTaxiRanks(ranks);
      } catch (error) {
        console.error('Error fetching taxi ranks:', error);
      } finally {
        setLoadingTaxiRanks(false);
      }
    };

    fetchTaxiRanks();
  }, []);

  // Fetch incidents
  useEffect(() => {
    const fetchAndProcessIncidents = async () => {
      setLoadingIncidents(true);
      try {
        const incidentData = await fetchIncidents();
        setIncidents(incidentData);
      } catch (error) {
        console.error('Error fetching incidents:', error);
      } finally {
        setLoadingIncidents(false);
      }
    };

    fetchAndProcessIncidents();
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get color based on incident severity (yellow to red gradient)
  const getHeatmapColor = (severity: number): string => {
    // Normalize severity (assuming max severity is 5)
    const normalizedSeverity = Math.min(severity / 5, 1);
    
    if (normalizedSeverity < 0.2) {
      return 'rgba(255, 255, 0, 0.7)'; // Yellow - more opaque
    } else if (normalizedSeverity < 0.5) {
      return 'rgba(255, 165, 0, 0.8)'; // Orange - more opaque
    } else {
      return 'rgba(255, 0, 0, 0.9)'; // Red - more opaque
    }
  };

  // Get radius based on incident severity - fixed at 10m for all incidents
  const getHeatmapRadius = (): number => {
    return 10; // Fixed 10m radius for all incidents
  };

  // Get popup content for incidents
  const getIncidentPopupContent = (incident: Incident) => {
    const typeLabels: {[key: string]: string} = {
      'theft': 'Theft',
      'harassment': 'Harassment',
      'suspicious': 'Suspicious Activity',
      'accident': 'Accident',
      'unsafe': 'Unsafe Area',
      'other': 'Other Incident'
    };
    
    const severityLabels: {[key: number]: string} = {
      1: 'Low',
      2: 'Moderate',
      3: 'Medium',
      4: 'High',
      5: 'Critical'
    };
    
    return `
      <div class="p-2">
        <strong>${typeLabels[incident.type] || 'Incident'}</strong>
        <div class="text-sm">Severity: ${severityLabels[incident.severity] || incident.severity}</div>
        <div class="text-xs text-gray-500">
          ${new Date(incident.timestamp).toLocaleDateString()}
        </div>
      </div>
    `;
  };

  // Calculate appropriate zoom level based on accuracy - accepts null
  const getZoomLevel = (accuracy: number | null | undefined): number => {
    if (accuracy === null || accuracy === undefined) return 16;
    
    // Convert accuracy meters to appropriate zoom level
    if (accuracy > 1000) return 10;
    if (accuracy > 500) return 11;
    if (accuracy > 200) return 12;
    if (accuracy > 100) return 13;
    if (accuracy > 50) return 14;
    if (accuracy > 20) return 15;
    return 16;
  };

  // Handle map interaction
  const handleMapInteraction = () => {
    if (!userInteracted) {
      setUserInteracted(true);
    }
  };

  // Handle recenter action
  const handleRecenter = () => {
    setUserInteracted(false);
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-lg relative">
      {/* Accuracy indicator */}
      {userLocation && locationAccuracy && (
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md z-[1000]">
          <div className="text-sm font-medium text-gray-700">
            Accuracy: ±{locationAccuracy.toFixed(0)} meters
          </div>
        </div>
      )}

      {/* Heatmap toggle */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md z-[1000]">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={() => setShowHeatmap(!showHeatmap)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Heatmap</span>
        </label>
      </div>

      {/* Loading indicators */}
      {(loadingBusStops || loadingTaxiRanks || loadingIncidents) && (
        <div className="absolute top-16 right-4 bg-white px-3 py-2 rounded-lg shadow-md z-[1000]">
          <div className="text-sm font-medium text-gray-700">
            {loadingIncidents 
              ? 'Loading incident data...' 
              : loadingBusStops && loadingTaxiRanks 
                ? 'Loading bus stops and taxi ranks...' 
                : loadingBusStops 
                  ? 'Loading bus stops...' 
                  : 'Loading taxi ranks...'}
          </div>
        </div>
      )}

      {/* Incident count indicator */}
      {incidents.length > 0 && (
        <div className="absolute top-16 left-4 bg-white px-3 py-2 rounded-lg shadow-md z-[1000]">
          <div className="text-sm font-medium text-gray-700">
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''} reported
          </div>
        </div>
      )}

      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={getZoomLevel(locationAccuracy)}
        className="h-full w-full"
        ref={mapRef}
        zoomControl={true}
        trackResize={true}
        // Add event listeners for user interaction
        whenReady={(map) => {
          map.target.on('dragstart', handleMapInteraction);
          map.target.on('zoomstart', handleMapInteraction);
          map.target.on('click', handleMapInteraction);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* Initialize map only once */}
        <MapInitializer 
          center={new LatLng(defaultCenter.lat, defaultCenter.lng)} 
          zoom={getZoomLevel(locationAccuracy)} 
        />

        {/* Simple Recenter Button - Always visible when user location is available */}
        <RecenterButton 
          userLocation={userLocation} 
          zoomLevel={getZoomLevel(locationAccuracy)}
          onRecenter={handleRecenter}
        />

        {/* Heatmap overlay - Circles around each incident */}
        {showHeatmap && incidents.map((incident, index) => (
          <React.Fragment key={index}>
            <Circle
              center={[incident.location.lat, incident.location.lng]}
              radius={getHeatmapRadius()} // Fixed 10m radius
              fillColor={getHeatmapColor(incident.severity)}
              fillOpacity={0.6} // Increased opacity for better visibility
              color={getHeatmapColor(incident.severity).replace('rgba', 'rgb').replace(/,[^)]+\)/, ',1)')}
              weight={2}
            />
            <Marker
              position={[incident.location.lat, incident.location.lng]}
              icon={incidentIcon}
            >
              <Popup>
                <div dangerouslySetInnerHTML={{ __html: getIncidentPopupContent(incident) }} />
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
        
        {/* User's current location with accuracy circle */}
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
                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </span>
                  {locationAccuracy && (
                    <>
                      <br />
                      <span className="text-xs text-gray-500">
                        Accuracy: ±{locationAccuracy.toFixed(0)}m
                      </span>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Accuracy circle - shows the actual GPS accuracy area */}
            {locationAccuracy && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={locationAccuracy} // Actual accuracy radius
                fillColor="#007bff"
                fillOpacity={0.2}
                color="#007bff"
                weight={1}
                dashArray="5, 5"
              />
            )}
            
            {/* Safety radius circle */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={1000} // 1km radius
              fillColor="blue"
              fillOpacity={0.1}
              color="blue"
              weight={2}
              dashArray="5, 5"
            />
          </>
        )}
        
        {/* Nearby users with distance calculation */}
        {nearbyUsers.map((user) => {
          const distance = userLocation 
            ? calculateDistance(userLocation.lat, userLocation.lng, user.lat, user.lng)
            : null;

          return (
            <Marker
              key={`user-${user.id}`}
              position={[user.lat, user.lng]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="text-center min-w-[120px]">
                  <strong className="block text-sm">{user.displayName || 'Anonymous User'}</strong>
                  {distance !== null && (
                    <span className="text-xs text-green-600 block mt-1">
                      {distance.toFixed(1)} km away
                    </span>
                  )}
                  <span className="text-xs text-gray-500 block mt-1">Online</span>
                  <div className="text-xs text-gray-400 mt-1">
                    {user.lat.toFixed(4)}, {user.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Bus stops with magenta markers */}
        {busStops.map((stop) => {
          const distance = userLocation 
            ? calculateDistance(userLocation.lat, userLocation.lng, stop.location.lat, stop.location.lng)
            : null;

          return (
            <Marker
              key={`busstop-${stop.id}`}
              position={[stop.location.lat, stop.location.lng]}
              icon={busStopIcon}
            >
              <Popup>
                <div className="text-center min-w-[150px]">
                  <strong className="block text-sm text-purple-700">{stop.name}</strong>
                  {distance !== null && (
                    <span className="text-xs text-green-600 block mt-1">
                      {distance.toFixed(1)} km away
                    </span>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    <strong>Routes:</strong> {stop.routes.join(', ')}
                  </div>
                  {stop.details && (
                    <p className="text-xs text-gray-600 mt-2">{stop.details}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {stop.location.lat.toFixed(4)}, {stop.location.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Taxi ranks with yellow markers */}
        {taxiRanks.map((rank) => {
          const distance = userLocation 
            ? calculateDistance(userLocation.lat, userLocation.lng, rank.coordinates.lat, rank.coordinates.lng)
            : null;

          return (
            <Marker
              key={`taxirank-${rank.id}`}
              position={[rank.coordinates.lat, rank.coordinates.lng]}
              icon={taxiRankIcon}
            >
              <Popup>
                <div className="text-center min-w-[180px]">
                  <strong className="block text-sm text-yellow-700">{rank.name}</strong>
                  <span className="text-xs text-gray-500 block">{rank.area}</span>
                  
                  {distance !== null && (
                    <span className="text-xs text-green-600 block mt-1">
                      {distance.toFixed(1)} km away
                    </span>
                  )}
                  
                  {rank.description && (
                    <p className="text-xs text-gray-600 mt-2">{rank.description}</p>
                  )}
                  
                  {rank.common_pickup_points && rank.common_pickup_points.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600">Pickup points:</p>
                      <ul className="text-xs text-gray-500 list-disc list-inside">
                        {rank.common_pickup_points.slice(0, 3).map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                        {rank.common_pickup_points.length > 3 && (
                          <li>+{rank.common_pickup_points.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {rank.fare_estimates && rank.fare_estimates.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium text-gray-600">Sample fares:</p>
                      <div className="text-xs text-gray-500">
                        {rank.fare_estimates.slice(0, 2).map((fare, index) => (
                          <div key={index}>
                            {fare.destination}: <span className="font-semibold text-green-600">{fare.fare}</span>
                          </div>
                        ))}
                        {rank.fare_estimates.length > 2 && (
                          <div>+{rank.fare_estimates.length - 2} more destinations</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {rank.coordinates.lat.toFixed(4)}, {rank.coordinates.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};