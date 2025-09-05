import React, { useState, useEffect } from 'react';
import { Car, DollarSign, MapPin, Clock } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface TaxiFare {
  id: string;
  routeName: string;
  from: string;
  to: string;
  distance: number;
  price: number;
  duration: string;
}

export const TaxiFaresPanel: React.FC = () => {
  const [taxiFares, setTaxiFares] = useState<TaxiFare[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaxiFares = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'TaxiFares'));
        const fares: TaxiFare[] = [];
        
        querySnapshot.forEach((doc) => {
          fares.push({
            id: doc.id,
            ...doc.data()
          } as TaxiFare);
        });
        
        setTaxiFares(fares);
      } catch (error) {
        console.error('Error fetching taxi fares:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxiFares();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading taxi fares...</div>;
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Car className="w-6 h-6 text-yellow-600" />
        <h3 className="text-lg font-semibold">Taxi Fare Estimates</h3>
      </div>
      
      {taxiFares.length === 0 ? (
        <p className="text-gray-500">No fare information available.</p>
      ) : (
        <div className="space-y-3">
          {taxiFares.map((fare) => (
            <div key={fare.id} className="p-3 border rounded-lg">
              <h4 className="font-medium text-lg">{fare.routeName}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {fare.from} → {fare.to}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {fare.duration}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">{fare.distance} km</span>
                <span className="text-lg font-bold text-green-600">
                  R{fare.price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">💡 Fare Sharing Tip</h4>
        <p className="text-sm text-gray-700">
          Connect with nearby users going the same direction to share taxi fares and save money!
        </p>
      </div>
    </div>
  );
};