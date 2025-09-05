import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Clock, Navigation } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useLocation } from '../../contexts/LocationContext';

interface BusStop {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  routes: string[];
  distance?: number;
}

export const BusStopsPanel: React.FC = () => {
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const { userLocation } = useLocation();

  useEffect(() => {
    const fetchBusStops = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'BusStops'));
        const stops: BusStop[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          let distance = undefined;
          
          if (userLocation) {
            distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              data.location.lat,
              data.location.lng
            );
          }
          
          stops.push({
            id: doc.id,
            ...data,
            distance
          } as BusStop);
        });
        
        setBusStops(stops.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity)));
      } catch (error) {
        console.error('Error fetching bus stops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusStops();
  }, [userLocation]);

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

  if (loading) {
    return <div className="text-center py-4">Loading bus stops...</div>;
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Bus className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold">Nearby Bus Stops</h3>
      </div>
      
      {busStops.length === 0 ? (
        <p className="text-gray-500">No bus stops found.</p>
      ) : (
        <div className="space-y-3">
          {busStops.slice(0, 10).map((stop) => (
            <div key={stop.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{stop.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    {stop.distance && (
                      <span className="flex items-center">
                        <Navigation className="w-3 h-3 mr-1" />
                        {stop.distance.toFixed(1)} km
                      </span>
                    )}
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {stop.routes.slice(0, 2).join(', ')}
                      {stop.routes.length > 2 && ` +${stop.routes.length - 2} more`}
                    </span>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium">
                  
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};