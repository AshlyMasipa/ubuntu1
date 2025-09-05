import React, { useState } from 'react';
import { Car, Plus, MapPin } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export const TaxiDataLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const johannesburgTaxiData = {
    areas: [
      {
        name: "Braamfontein",
        taxi_ranks: [
          {
            name: "Bree Taxi Rank",
            coordinates: { lat: -26.200583, lng: 28.035722 },
            description: "Major hub serving Soweto, Alexandra, and other routes",
            common_pickup_points: [
              "Corner of Eloff and Plein Streets",
              "Wits Station"
            ],
            fare_estimates: [
              { destination: "Parktown", fare: "R19-R24" },
              { destination: "Hillbrow", fare: "R22-R27" }
            ]
          },
          {
            name: "Jorrissen St / Henri St",
            coordinates: { lat: -26.1913, lng: 28.0375 },
            description: "Served by routes 88A and 89",
            common_pickup_points: ["Jorrissen Street near Station"],
            fare_estimates: [{ destination: "Parktown", fare: "R20-R25" }]
          }
        ]
      },
      {
        name: "Parktown",
        taxi_ranks: [
          {
            name: "Parktown Taxi Rank",
            coordinates: { lat: -26.1880, lng: 28.0350 },
            description: "Located on Empire Road, near SAPS Provincial Head Office",
            common_pickup_points: ["Constitution Hill", "Empire Road corner"],
            fare_estimates: [
              { destination: "Braamfontein", fare: "R19-R24" },
              { destination: "Hillbrow", fare: "R22-R27" }
            ]
          },
          {
            name: "Gautrain Park Station",
            coordinates: { lat: -26.1885, lng: 28.0353 },
            description: "Hub for Gautrain bus routes",
            common_pickup_points: ["Gautrain Station Entrance"],
            fare_estimates: [{ destination: "Hillbrow", fare: "R22-R27" }]
          }
        ]
      },
      {
        name: "Hillbrow",
        taxi_ranks: [
          {
            name: "Hillbrow Taxi Rank",
            coordinates: { lat: -26.1900, lng: 28.0460 },
            description: "Located at 77 Nugget Street, central Hillbrow",
            common_pickup_points: ["Corner of Nugget and Kerk Streets"],
            fare_estimates: [
              { destination: "Braamfontein", fare: "R22-R27" },
              { destination: "Parktown", fare: "R19-R24" }
            ]
          },
          {
            name: "Hillbrow Bath House Bus Station",
            coordinates: { lat: -26.19064, lng: 28.04658 },
            description: "Located on Edith Cavell Street, serves inner city routes",
            common_pickup_points: ["Edith Cavell Street Entrance"],
            fare_estimates: [{ destination: "Braamfontein", fare: "R22-R27" }]
          }
        ]
      },
      {
        name: "Newtown",
        taxi_ranks: [
          {
            name: "Newtown Taxi Rank",
            coordinates: { lat: -26.2040, lng: 28.0340 },
            description: "Located near the Nelson Mandela Bridge, serving various routes",
            common_pickup_points: ["Metro Mall", "Mary Fitzgerald Square"],
            fare_estimates: [
              { destination: "Braamfontein", fare: "R15-R20" },
              { destination: "Hillbrow", fare: "R20-R25" }
            ]
          }
        ]
      },
      {
        name: "Joubert Park",
        taxi_ranks: [
          {
            name: "Joubert Park Taxi Rank",
            coordinates: { lat: -26.1990, lng: 28.0450 },
            description: "Located near the Johannesburg Art Gallery, serving various routes",
            common_pickup_points: ["Joubert Park Entrance", "Joubert Street"],
            fare_estimates: [
              { destination: "Braamfontein", fare: "R15-R20" },
              { destination: "Parktown", fare: "R20-R25" }
            ]
          }
        ]
      },
      {
        name: "Parkview",
        taxi_ranks: [
          {
            name: "Parkview Taxi Rank",
            coordinates: { lat: -26.1790, lng: 28.0300 },
            description: "Located near Zoo Lake, serving various routes",
            common_pickup_points: ["Parkview Corner", "Zoo Lake Entrance"],
            fare_estimates: [
              { destination: "Braamfontein", fare: "R25-R30" },
              { destination: "Hillbrow", fare: "R30-R35" }
            ]
          }
        ]
      }
    ]
  };

  const loadTaxiData = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // First, store areas
      for (const area of johannesburgTaxiData.areas) {
        const areaRef = await addDoc(collection(db, 'TaxiAreas'), {
          name: area.name,
          createdAt: new Date()
        });

        // Then store each taxi rank in this area
        for (const rank of area.taxi_ranks) {
          await addDoc(collection(db, 'TaxiRanks'), {
            name: rank.name,
            coordinates: rank.coordinates,
            description: rank.description,
            common_pickup_points: rank.common_pickup_points,
            fare_estimates: rank.fare_estimates,
            area: area.name,
            areaId: areaRef.id,
            createdAt: new Date()
          });
        }
      }
      setMessage('Taxi rank data loaded successfully!');
    } catch (error) {
      console.error('Error loading taxi data:', error);
      setMessage('Error loading data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <h4 className="font-semibold text-green-800 mb-2 flex items-center">
        <Car className="w-5 h-5 mr-2" />
        Taxi Data Tools
      </h4>
      <p className="text-sm text-green-700 mb-3">
        Load sample taxi rank and fare data for testing:
      </p>
      <button
        onClick={loadTaxiData}
        disabled={loading}
        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-green-400"
      >
        <Plus className="w-4 h-4" />
        <span>{loading ? 'Loading...' : 'Load Taxi Rank Data'}</span>
      </button>
      {message && (
        <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};