import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc, collection, query, getDocs } from 'firebase/firestore'; // Changed import
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { User, NearbyUser } from '../types';

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  nearbyUsers: NearbyUser[];
  locationPermission: boolean;
  locationAccuracy: number | null;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setUserLocation(location);
        setLocationAccuracy(accuracy);
        setLocationPermission(true);

        // Update user location in Firestore - FIXED
        if (user) {
          try {
            await setDoc(doc(db, 'users', user.uid), {
              location: {
                lat: latitude,
                lng: longitude,
                timestamp: new Date(),
                accuracy: accuracy
              },
              // You might want to add other user fields too
              displayName: user.displayName || null,
              email: user.email || null,
              lastUpdated: new Date()
            }, { merge: true }); // This is the key fix
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationPermission(false);
        setLocationAccuracy(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationAccuracy(null);
    }
  };

  // Fetch nearby users
  useEffect(() => {
    if (!user || !userLocation) return;

    const fetchNearbyUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);
        
        const users: NearbyUser[] = snapshot.docs
          .filter(doc => doc.id !== user.uid)
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              lat: data.location?.lat || 0,
              lng: data.location?.lng || 0,
              displayName: data.displayName,
              lastUpdated: data.location?.timestamp
            };
          })
          .filter(userData => userData.lat !== 0 && userData.lng !== 0);
        
        setNearbyUsers(users);
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      }
    };

    fetchNearbyUsers();
  }, [user, userLocation]);

  const value = {
    userLocation,
    nearbyUsers,
    locationPermission,
    locationAccuracy,
    startLocationTracking,
    stopLocationTracking
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};