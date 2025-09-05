import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Report } from '../types';

export interface Incident {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number;
  type: string;
  severity: number;
}

export const fetchIncidents = async (): Promise<Incident[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef);
    const snapshot = await getDocs(q);
    
    const incidents: Incident[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore timestamp to milliseconds if needed
      let timestamp: number;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        timestamp = data.timestamp.toDate().getTime();
      } else if (data.timestamp && typeof data.timestamp === 'number') {
        timestamp = data.timestamp;
      } else {
        timestamp = Date.now();
      }
      
      // Assign severity based on report type
      const severityMap: {[key: string]: number} = {
        'theft': 3,
        'harassment': 4,
        'suspicious': 2,
        'accident': 5,
        'unsafe': 3,
        'other': 1
      };
      
      incidents.push({
        id: doc.id,
        location: data.location,
        timestamp: timestamp,
        type: data.type,
        severity: severityMap[data.type] || 1
      } as Incident);
    });
    
    return incidents;
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return [];
  }
};

export const fetchIncidentsInArea = async (
  centerLat: number, 
  centerLng: number, 
  radiusKm: number
): Promise<Incident[]> => {
  try {
    const allIncidents = await fetchIncidents();
    
    return allIncidents.filter(incident => {
      const distance = calculateDistance(
        centerLat,
        centerLng,
        incident.location.lat,
        incident.location.lng
      );
      return distance <= radiusKm;
    });
  } catch (error) {
    console.error('Error fetching incidents in area:', error);
    return [];
  }
};

// Helper function to calculate distance between two points
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