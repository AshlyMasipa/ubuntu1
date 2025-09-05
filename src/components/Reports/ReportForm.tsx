import React, { useState } from 'react';
import { X, MapPin, AlertCircle, Camera } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';

interface ReportFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_TYPES = [
  { id: 'theft', label: 'Theft', color: 'red' },
  { id: 'harassment', label: 'Harassment', color: 'orange' },
  { id: 'suspicious', label: 'Suspicious Activity', color: 'yellow' },
  { id: 'accident', label: 'Accident', color: 'blue' },
  { id: 'unsafe', label: 'Unsafe Area', color: 'purple' },
  { id: 'other', label: 'Other', color: 'gray' }
];

export const ReportForm: React.FC<ReportFormProps> = ({ isOpen, onClose }) => {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const { user } = useAuth();
  const { userLocation } = useLocation();

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClose = () => {
    setReportType('');
    setDescription('');
    setIsTracking(false);
    setNotification(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showNotification('You must be logged in to submit a report', 'error');
      return;
    }

    if (!userLocation) {
      showNotification('Location access is required to submit a report', 'error');
      return;
    }

    if (!reportType) {
      showNotification('Please select an incident type', 'error');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'reports'), {
        userId: user.uid,
        userEmail: user.email || 'anonymous',
        type: reportType,
        description,
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng
        },
        timestamp: serverTimestamp(),
        isTracking,
        status: 'pending'
      });

      showNotification('Report submitted successfully! Thank you for helping keep the community safe.', 'success');
      
      // Close the form after a short delay to show the success message
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error submitting report:', error);
      if (error.code === 'permission-denied') {
        showNotification('You do not have permission to submit reports', 'error');
      } else {
        showNotification('Failed to submit report. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Report Incident</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close report form"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type of Incident *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setReportType(type.id)}
                  disabled={loading}
                  className={`
                    p-3 text-sm font-medium rounded-lg border-2 transition-all
                    ${reportType === type.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  aria-pressed={reportType === type.id}
                >
                  {type.label}
                </button>
              ))}
            </div>
            {!reportType && (
              <p className="text-sm text-red-600 mt-2">Please select an incident type</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
              placeholder="Describe what happened..."
              rows={4}
              required
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Current Location</p>
              <p className="text-xs text-gray-500">
                {userLocation 
                  ? `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`
                  : 'Location not available'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="tracking"
              checked={isTracking}
              onChange={(e) => setIsTracking(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              disabled={loading}
            />
            <div>
              <label htmlFor="tracking" className="text-sm font-medium text-gray-700">
                Enable location tracking
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Continuously update your location for this report (useful for ongoing incidents)
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !reportType || !description.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};