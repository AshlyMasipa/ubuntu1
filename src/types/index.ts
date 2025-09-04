export interface User {
  id: string;
  email?: string;
  displayName?: string;
  location?: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
  emergencyStatus?: 'normal' | 'sos-active';
}

export interface Report {
  id: string;
  userId: string;
  userEmail: string;
  type: 'theft' | 'harassment' | 'suspicious' | 'accident' | 'unsafe' | 'other';
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  isTracking: boolean;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface SOSAlert {
  id: string;
  userId: string;
  userEmail: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
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
}

export interface TaxiFare {
  id: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedFare: number;
}

export interface SafetyTip {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'transport' | 'emergency' | 'prevention';
}