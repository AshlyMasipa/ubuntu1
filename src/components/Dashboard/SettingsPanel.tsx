import React, { useState } from 'react';
import { Settings, Bell, MapPin, Shield, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';

export const SettingsPanel: React.FC = () => {
  const { user } = useAuth();
  const { locationPermission, startLocationTracking, stopLocationTracking } = useLocation();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLocationToggle = () => {
    if (locationPermission) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-6 h-6 text-gray-600" />
        <h3 className="text-lg font-semibold">Settings</h3>
      </div>

      {/* User Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Account Information</h4>
        <p className="text-sm text-gray-600">{user?.email}</p>
        <p className="text-xs text-gray-500 mt-1">User ID: {user?.uid}</p>
      </div>




      {/* App Info */}
      <div className="mt-8 pt-4 border-t">
        <p className="text-center text-xs text-gray-500">
          Ubuntu v1.0.0
        </p>
      </div>
    </div>
  );
};