import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface CarpoolGroup {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  members: string[];
  pendingRequests: string[];
  isPrivate: boolean;
  destination: string;
  meetingPoint: string;
  departureTime: string;
  createdAt: any;
  description?: string;
}

const DiscoverCarpools: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [carpools, setCarpools] = useState<CarpoolGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDiscoverableCarpools = async () => {
      if (!user) return;
      
      try {
        const carpoolsRef = collection(db, "carpools");
        const q = query(carpoolsRef);
        
        const querySnapshot = await getDocs(q);
        const groups: CarpoolGroup[] = [];
        
        querySnapshot.forEach((doc) => {
          const group = { id: doc.id, ...doc.data() } as CarpoolGroup;
          // Only show groups the user isn't already a member of and hasn't requested to join
          if (!group.members.includes(user.uid) && !group.pendingRequests.includes(user.uid)) {
            groups.push(group);
          }
        });
        
        setCarpools(groups);
      } catch (error) {
        console.error("Error fetching discoverable carpool groups:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscoverableCarpools();
  }, [user]);

  const joinCarpoolGroup = async (carpool: CarpoolGroup) => {
    if (!user) return;
    
    try {
      const carpoolRef = doc(db, "carpools", carpool.id);
      
      if (carpool.isPrivate) {
        // Request to join private carpool
        await updateDoc(carpoolRef, {
          pendingRequests: arrayUnion(user.uid)
        });
        alert("Join request sent to the group creator");
      } else {
        // Directly join public carpool
        await updateDoc(carpoolRef, {
          members: arrayUnion(user.uid)
        });
        alert("Successfully joined the carpool group");
      }
      
      // Remove the carpool from the list after joining/requesting
      setCarpools(prev => prev.filter(c => c.id !== carpool.id));
    } catch (error) {
      console.error("Error joining carpool:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <h3 style={{ marginBottom: '20px' }}>Available Carpool Groups</h3>
      
      {carpools.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          color: '#666' 
        }}>
          <p>No carpool groups available to join at the moment.</p>
          <p>Check back later or create your own carpool group!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {carpools.map(carpool => (
            <div
              key={carpool.id}
              style={{
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}
            >
              <div style={{ 
                fontWeight: '600', 
                fontSize: '1.1rem',
                marginBottom: '10px',
                color: '#333'
              }}>
                {carpool.name}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666',
                marginBottom: '8px'
              }}>
                <strong>Destination:</strong> {carpool.destination}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666',
                marginBottom: '8px'
              }}>
                <strong>Meeting Point:</strong> {carpool.meetingPoint}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666',
                marginBottom: '8px'
              }}>
                <strong>Departure:</strong> {carpool.departureTime}
              </div>
              {carpool.description && (
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#666',
                  marginBottom: '10px',
                  fontStyle: 'italic'
                }}>
                  {carpool.description}
                </div>
              )}
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#888',
                marginBottom: '10px'
              }}>
                Created by {carpool.creatorName} • {carpool.members.length} members
                {carpool.isPrivate && ' • Private Group'}
              </div>
              <button
                onClick={() => joinCarpoolGroup(carpool)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {carpool.isPrivate ? 'Request to Join' : 'Join Carpool'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverCarpools;