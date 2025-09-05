export interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  location?: {
    lat: number;
    lng: number;
    timestamp: number;
    accuracy?: number; 
  };
  fcmToken: string;
  emergencyStatus?: 'normal' | 'sos-active';
}

export interface Report {
  id: string;
  userId: string;
  userEmail?: string; // Made optional as it might not always be available
  type: 'theft' | 'harassment' | 'suspicious' | 'accident' | 'unsafe' | 'other';
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number; // Use number for consistency
  isTracking: boolean;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface SOSAlert {
  id: string;
  userId: string;
  userEmail?: string; // Made optional
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number; // Use number for consistency
  status: 'active' | 'resolved';
}

export interface BusStop {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  routes: string[];
  details?: string; // Added optional details field
}

export interface TaxiFare {
  id: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedFare: number; // Or use just 'fare' if you prefer
  duration?: string; // Added optional duration
}

export interface SafetyTip {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'transport' | 'emergency' | 'prevention';
  createdAt?: number; // Added optional creation timestamp
}

export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface NearbyUser {
  id: string;
  lat: number;
  lng: number;
  displayName?: string;
  distance?: number;
  lastUpdated?: number; // Added optional last updated timestamp
}

export interface FareEstimate {
  destination: string;
  fare: string;
}

export interface TaxiRank {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  common_pickup_points: string[];
  fare_estimates: FareEstimate[];
  area: string;
  distance?: number; 
}

export interface TaxiArea {
  id: string;
  name: string;
  taxi_ranks: TaxiRank[];
}

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