# SafeTravel - Safety & Transportation App

A comprehensive React + Firebase application focused on personal safety and transportation assistance.

## Features

### 🔐 Authentication
- Email/password authentication
- Anonymous login option
- Secure Firebase Auth integration

### 📍 Real-time Location Services
- Live location tracking
- Nearby user detection
- Interactive map with custom markers
- Safety radius visualization

### 🚨 Emergency Features
- One-tap SOS button
- Instant emergency alerts
- Real-time location sharing during emergencies
- Automated notifications to nearby users

### 📊 Incident Reporting
- Comprehensive report submission
- Multiple incident categories
- Location-based reporting
- Optional real-time tracking for ongoing incidents

### 🗺️ Interactive Map
- Leaflet-based mapping
- Custom markers for different user types
- Safety zones and hotspot visualization
- Real-time updates

### 🚌 Transportation Features
- Bus stop information
- Taxi fare estimates
- Route planning assistance
- Ride-sharing capabilities

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Leaflet & React-Leaflet
- **Backend**: Firebase
  - Authentication
  - Firestore Database
  - Cloud Functions
  - Cloud Messaging
- **Icons**: Lucide React

## Firebase Setup Required

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Anonymous)
3. Create Firestore Database
4. Update `src/config/firebase.ts` with your configuration
5. Set up security rules for Firestore collections

### Required Firestore Collections

```javascript
// users collection
{
  location: { lat: number, lng: number, timestamp: Date },
  emergencyStatus: string,
  displayName?: string
}

// reports collection
{
  userId: string,
  type: string,
  description: string,
  location: { lat: number, lng: number },
  timestamp: Date,
  isTracking: boolean,
  status: string
}

// sosAlerts collection
{
  userId: string,
  location: { lat: number, lng: number },
  timestamp: Date,
  status: string,
  userEmail: string
}
```

## Development

```bash
npm install
npm run dev
```

## Production Deployment

```bash
npm run build
# Deploy to Firebase Hosting or your preferred platform
```

## Security Features

- Row Level Security (RLS) ready
- Location-based privacy controls
- Anonymous reporting options
- Secure emergency communication

## Mobile Optimized

- Responsive design for all screen sizes
- Touch-friendly interface
- Mobile-first approach
- PWA capabilities ready

## Future Enhancements

- Push notifications via FCM
- Offline functionality
- Advanced route optimization
- Integration with local emergency services
- Multi-language support