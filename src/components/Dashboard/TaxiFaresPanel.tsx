import React, { useState, useEffect } from 'react';
import { Car, DollarSign, MapPin, Clock, Navigation } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useLocation } from '../../contexts/LocationContext';
import { TaxiRank } from '../../types';


export const TaxiFaresPanel: React.FC = () => {
  const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
  const [loading, setLoading] = useState(true);
  const { userLocation } = useLocation();

  useEffect(() => {
    const fetchTaxiRanks = async () => {
      try {
        const q = query(collection(db, 'TaxiRanks'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const ranks: TaxiRank[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          let distance = undefined;
          
          if (userLocation) {
            distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              data.coordinates.lat,
              data.coordinates.lng
            );
          }
          
          ranks.push({
            id: doc.id,
            name: data.name,
            coordinates: data.coordinates,
            description: data.description,
            common_pickup_points: data.common_pickup_points,
            fare_estimates: data.fare_estimates,
            area: data.area,
            distance
          } as TaxiRank);
        });
        
        setTaxiRanks(ranks.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity)));
      } catch (error) {
        console.error('Error fetching taxi ranks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxiRanks();
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
    return <div className="text-center py-4">Loading taxi information...</div>;
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Car className="w-6 h-6 text-yellow-600" />
        <h3 className="text-lg font-semibold">Taxi Ranks & Fare Estimates</h3>
      </div>
      
      
      {taxiRanks.length === 0 ? (
        <p className="text-gray-500">No taxi rank information available.</p>
      ) : (
        <div className="space-y-4">
          {taxiRanks.map((rank) => (
            <div key={rank.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <h4 className="font-medium text-lg text-blue-800">{rank.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{rank.area}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                {rank.distance && (
                  <span className="flex items-center">
                    <Navigation className="w-3 h-3 mr-1" />
                    {rank.distance.toFixed(1)} km away
                  </span>
                )}
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {rank.coordinates.lat.toFixed(4)}, {rank.coordinates.lng.toFixed(4)}
                </span>
              </div>
              
              {rank.description && (
                <p className="text-sm text-gray-700 mt-2">{rank.description}</p>
              )}
              
              {rank.common_pickup_points && rank.common_pickup_points.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-600">Common pickup points:</p>
                  <ul className="text-xs text-gray-500 list-disc list-inside">
                    {rank.common_pickup_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {rank.fare_estimates && rank.fare_estimates.length > 0 && (
                <div className="mt-3 pt-2 border-t">
                  <p className="text-xs font-medium text-gray-600 mb-2">Fare estimates:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {rank.fare_estimates.map((fare, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <p className="text-xs font-medium">{fare.destination}</p>
                        <p className="text-sm font-bold text-green-600">{fare.fare}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      

    </div>
  );
};