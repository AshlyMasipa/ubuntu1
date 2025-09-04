import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  nearbyUsers: Array<{ id: string; lat: number; lng: number; displayName?: string }>;
  locationPermission: boolean;
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
  const [nearbyUsers, setNearbyUsers] = useState<Array<{ id: string; lat: number; lng: number; displayName?: string }>>([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setUserLocation(location);
        setLocationPermission(true);

        // Update user location in Firestore
        if (user) {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              location: {
                lat: latitude,
                lng: longitude,
                timestamp: new Date()
              }
            });
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationPermission(false);
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
    }
  };

  // Fetch nearby users (simplified - in production, use geohashing)
  useEffect(() => {
    if (!user || !userLocation) return;

    const fetchNearbyUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);
        
        const users = snapshot.docs
          .filter(doc => doc.id !== user.uid)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(userData => userData.location)
          .map(userData => ({
            id: userData.id,
            lat: userData.location.lat,
            lng: userData.location.lng,
            displayName: userData.displayName
          }));
        
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
    startLocationTracking,
    stopLocationTracking
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};