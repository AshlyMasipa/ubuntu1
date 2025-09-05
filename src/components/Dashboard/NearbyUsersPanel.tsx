import React, { useMemo } from 'react';
import { Users, MapPin, Clock } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext';
import { NearbyUser } from '../../types'; // Import your NearbyUser type

export const NearbyUsersPanel: React.FC = () => {
  const { nearbyUsers, userLocation } = useLocation();

  // Function to calculate distance between two points with validation
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number | null => {
    // Validate coordinates
    if (
      typeof lat1 !== 'number' || typeof lng1 !== 'number' ||
      typeof lat2 !== 'number' || typeof lng2 !== 'number' ||
      isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)
    ) {
      return null;
    }

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

  // Memoize the users with calculated distances to avoid recalculating on every render
  const usersWithDistances = useMemo(() => {
    return nearbyUsers.map((user: NearbyUser) => {
      const distance = userLocation && user.lat && user.lng
        ? calculateDistance(userLocation.lat, userLocation.lng, user.lat, user.lng)
        : null;

      return {
        ...user,
        calculatedDistance: distance
      };
    });
  }, [nearbyUsers, userLocation]);

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Users className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Nearby Users</h3>
      </div>
      
      {usersWithDistances.length === 0 ? (
        <p className="text-gray-500">No nearby users found.</p>
      ) : (
        <div className="space-y-3">
          {usersWithDistances.map((user) => (
            <div key={user.id} className="p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  {user.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.displayName || 'Anonymous User'}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {user.calculatedDistance !== null && (
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {user.calculatedDistance.toFixed(1)} km
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};