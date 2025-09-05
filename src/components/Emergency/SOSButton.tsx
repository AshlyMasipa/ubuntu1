import React, { useState } from 'react';
import { AlertTriangle, Phone } from 'lucide-react';
import { doc, addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';

export const SOSButton: React.FC = () => {
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const { user } = useAuth();
  const { userLocation } = useLocation();

  const handleSOS = async () => {
    if (!user || !userLocation) {
      alert('Location access required for SOS functionality');
      return;
    }

    setActivating(true);

    try {
      // 1️⃣ Create SOS alert in Firestore
      const sosRef = await addDoc(collection(db, 'sosAlerts'), {
        userId: user.uid,
        userEmail: user.email || undefined, // Use undefined instead of 'anonymous'
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng
        },
        timestamp: Date.now(), // Use number timestamp
        status: 'active'
      });

      // 2️⃣ Update user emergency status
      await updateDoc(doc(db, 'users', user.uid), {
        emergencyStatus: 'sos-active',
        lastSOSTime: serverTimestamp()
      });

      setActivated(true);

      // 3️⃣ Optional: Auto-reset after 5 minutes
      setTimeout(async () => {
        setActivated(false);
        // Mark SOS as resolved
        await updateDoc(sosRef, { status: 'resolved' });
        await updateDoc(doc(db, 'users', user.uid), { emergencyStatus: 'normal' });
      }, 300000);

      // 4️⃣ Show confirmation
      alert('Nearby Users and Emergency Services have been notified.');

    } catch (error) {
      console.error('Error sending SOS:', error);
      alert('Failed to send SOS alert. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleSOS}
        disabled={activating}
        className={`
          w-20 h-20 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-95
          ${activated 
            ? 'bg-red-600 animate-pulse' 
            : 'bg-red-500 hover:bg-red-600'
          }
          text-white font-bold text-lg
          disabled:opacity-50 disabled:cursor-not-allowed
          flex flex-col items-center justify-center
        `}
      >
        {activating ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        ) : activated ? (
          <>
            <Phone className="w-6 h-6 animate-bounce" />
            <span className="text-xs">ACTIVE</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs">SOS</span>
          </>
        )}
      </button>

      {activated && (
        <div className="absolute -top-16 right-0 bg-red-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
          Emergency Alert Active
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
        </div>
      )}
    </div>
  );
};