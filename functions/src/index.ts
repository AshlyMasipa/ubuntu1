import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();
const db = admin.firestore();

interface User {
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
  fcmToken?: string;
  emergencyStatus?: 'normal' | 'sos-active';
}

interface SOSAlert {
  id: string;
  userId: string;
  userEmail?: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number;
  status: 'active' | 'resolved';
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const notifyNearbyUsers = onDocumentCreated('sosAlerts/{alertId}', async (event) => {
  try {
    const alertId = event.params.alertId;
    const alertData = event.data?.data() as SOSAlert | undefined;

    if (!alertData) {
      console.log('No alert data found');
      return null;
    }

    if (alertData.status !== 'active') {
      console.log('Skipping non-active alert');
      return null;
    }

    console.log(`Processing new SOS alert: ${alertId}`);

    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      console.log('No users found in database');
      return null;
    }

    const nearbyUsers: User[] = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data() as User;

      if (userData.id === alertData.userId) return; // Skip sender
      if (!userData.location || !userData.fcmToken) return; // Skip if missing location or token

      const distance = calculateDistance(
        alertData.location.lat,
        alertData.location.lng,
        userData.location.lat,
        userData.location.lng
      );

      if (distance <= 1) nearbyUsers.push(userData);
    });

    if (!nearbyUsers.length) {
      console.log('No nearby users found');
      return null;
    }

    console.log(`Found ${nearbyUsers.length} nearby users`);

    const payload = {
      notification: {
        title: '🚨 SOS Alert Nearby!',
        body: 'A user has activated an emergency alert in your vicinity. Please check if you can assist.',
      },
      data: {
        type: 'sos_alert',
        alertId,
        userId: alertData.userId,
        latitude: String(alertData.location.lat),
        longitude: String(alertData.location.lng),
        timestamp: String(alertData.timestamp)
      }
    };

    const promises = nearbyUsers.map(user =>
      admin.messaging().sendToDevice(user.fcmToken!, payload)
        .then(() => console.log(`Notification sent to user ${user.id}`))
        .catch(err => console.error(`Error sending notification to user ${user.id}:`, err))
    );

    await Promise.all(promises);
    console.log(`Sent ${promises.length} SOS notifications`);

    return null;

  } catch (error) {
    console.error('Error in notifyNearbyUsers:', error);
    return null;
  }
});
