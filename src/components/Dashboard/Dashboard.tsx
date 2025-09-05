import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Bus, 
  Car, 
  Shield,
  Settings,
  LogOut,
  X,
  MessageCircle // NEW: Import chat icon
} from 'lucide-react';
import { MapComponent } from '../Map/MapComponent';
import { SOSButton } from '../Emergency/SOSButton';
import { ReportForm } from '../Reports/ReportForm';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { NearbyUsersPanel } from './NearbyUsersPanel';
import { BusStopsPanel } from './BusStopsPanel';
import { TaxiFaresPanel } from './TaxiFaresPanel';
import { SafetyTipsPanel } from './SafetyTipsPanel';
import { SettingsPanel } from './SettingsPanel';

export const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { userLocation, nearbyUsers, locationPermission, startLocationTracking } = useLocation();
  const navigate = useNavigate(); // MOVE: useNavigate inside component

  const handleLocationToggle = () => {
    if (!locationPermission) startLocationTracking();
  };

  const handlePanelToggle = (panelName: string) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  // NEW: Function to navigate to chat page
  const handleChatNavigation = () => {
    navigate('/chat');
  };

  const menuItems = [
    { icon: MapPin, label: 'My Location', action: handleLocationToggle },
    { icon: Users, label: `Nearby (${nearbyUsers.length})`, action: () => handlePanelToggle('nearby') },
    { icon: AlertTriangle, label: 'Report Incident', action: () => setReportFormOpen(true) },
    { icon: Bus, label: 'Bus Stops', action: () => handlePanelToggle('busStops') },
    { icon: Car, label: 'Taxi Fares', action: () => handlePanelToggle('taxiFares') },
    { icon: Shield, label: 'Safety Tips', action: () => handlePanelToggle('safetyTips') },
    { icon: MessageCircle, label: 'Chat with Locals', action: handleChatNavigation } // UPDATED: Now navigates to chat page
  ];

  const closePanel = () => setActivePanel(null);

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-40 w-64 lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600 text-white">
          <Shield className="w-8 h-8 mr-2" />
          <h1 className="text-xl font-bold">Ubuntu</h1>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.email?.[0].toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.email || 'Anonymous'}</p>
              <p className="text-xs text-gray-500">
                {locationPermission ? 'Location enabled' : 'Location disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => handlePanelToggle('settings')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mb-2"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0 relative z-10">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 lg:px-6 relative z-20">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${locationPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="hidden sm:inline">
                  {locationPermission ? 'Location Active' : 'Location Disabled'}
                </span>
              </div>
              
              {!locationPermission && (
                <button
                  onClick={handleLocationToggle}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Enable Location
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Map Area */}
        <main className="flex-1 p-4 lg:p-6 relative z-0">
          <div className="h-full">
            <MapComponent />
          </div>
        </main>
      </div>

      {/* Floating Action Buttons */}
      <SOSButton />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Report Form Modal */}
      <ReportForm 
        isOpen={reportFormOpen} 
        onClose={() => setReportFormOpen(false)} 
      />

      {/* Slide-in Panels */}
      {activePanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closePanel}
          />
          <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {activePanel === 'nearby' && 'Nearby Users'}
                {activePanel === 'busStops' && 'Bus Stops'}
                {activePanel === 'taxiFares' && 'Taxi Fares'}
                {activePanel === 'safetyTips' && 'Safety Tips'}
                {activePanel === 'settings' && 'Settings'}
              </h2>
              <button
                onClick={closePanel}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 h-full">
              {activePanel === 'nearby' && <NearbyUsersPanel />}
              {activePanel === 'busStops' && <BusStopsPanel />}
              {activePanel === 'taxiFares' && <TaxiFaresPanel />}
              {activePanel === 'safetyTips' && <SafetyTipsPanel />}
              {activePanel === 'settings' && <SettingsPanel />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};