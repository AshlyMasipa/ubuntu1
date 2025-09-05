import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, orderBy, query, getDocs, DocumentData } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { useParams } from 'react-router-dom';
import { User } from '../../types';

interface ChatGroup {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in kilometers
}

interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp?: any; // Firestore timestamp
}

// Predefined groups for Johannesburg areas
const PREDEFINED_GROUPS: ChatGroup[] = [
  {
    id: "braamfontein",
    name: "Braamfontein",
    coordinates: { latitude: -26.1937, longitude: 28.0337 },
    radius: 2.5
  },
  {
    id: "parktown",
    name: "Parktown",
    coordinates: { latitude: -26.1833, longitude: 28.0333 },
    radius: 2.0
  },
  {
    id: "hillbrow",
    name: "Hillbrow",
    coordinates: { latitude: -26.1885, longitude: 28.0432 },
    radius: 1.5
  },
  {
    id: "newtown",
    name: "Newtown",
    coordinates: { latitude: -26.2038, longitude: 28.0366 },
    radius: 1.5
  },
  {
    id: "joburg-cbd",
    name: "Johannesburg CBD",
    coordinates: { latitude: -26.2041, longitude: 28.0473 },
    radius: 3.0
  },
  {
    id: "melville",
    name: "Melville",
    coordinates: { latitude: -26.1745, longitude: 27.9975 },
    radius: 2.0
  }
];

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const UnifiedChat: React.FC = () => {
  const [availableGroups, setAvailableGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userCoordinates, setUserCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [isGroupListVisible, setIsGroupListVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const { userLocation } = useLocation();
  const { area } = useParams<{ area?: string }>();

  /** Scroll to bottom */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get user's location from context
  useEffect(() => {
    if (userLocation) {
      setUserCoordinates({
        latitude: userLocation.lat,
        longitude: userLocation.lng
      });
    } else {
      // Try to get location from browser if not available from context
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserCoordinates({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            // If we can't get location, show all groups
            setAvailableGroups(PREDEFINED_GROUPS);
          }
        );
      } else {
        // If geolocation is not supported, show all groups
        setAvailableGroups(PREDEFINED_GROUPS);
      }
    }
  }, [userLocation]);

  // If a specific area is provided in the URL, select it
  useEffect(() => {
    if (area && availableGroups.length > 0) {
      const group = availableGroups.find(g => g.id === area);
      if (group) {
        setSelectedGroup(group);
        setIsGroupListVisible(false); // Hide group list on mobile when a group is selected
      }
    }
  }, [area, availableGroups]);

  // Filter groups based on user's location
  useEffect(() => {
    if (userCoordinates) {
      const nearbyGroups = PREDEFINED_GROUPS.filter(group => {
        const distance = calculateDistance(
          userCoordinates.latitude, 
          userCoordinates.longitude,
          group.coordinates.latitude,
          group.coordinates.longitude
        );
        return distance <= group.radius;
      });
      
      setAvailableGroups(nearbyGroups);
      
      // Auto-select the first group if none is selected and no area in URL
      if (nearbyGroups.length > 0 && !selectedGroup && !area) {
        setSelectedGroup(nearbyGroups[0]);
      }
    }
  }, [userCoordinates, selectedGroup, area]);

  /** Listen to messages in selected group */
  useEffect(() => {
    if (!selectedGroup) return;

    const messagesRef = collection(db, "areas", selectedGroup.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || "",
          senderId: data.senderId || "",
          senderName: data.senderName || "Unknown",
          timestamp: data.timestamp
        };
      });
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedGroup]);

  /** Send message */
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !user) return;

    try {
      await addDoc(collection(db, "areas", selectedGroup.id, "messages"), {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || "User",
        timestamp: serverTimestamp()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Toggle group list visibility on mobile
  const toggleGroupList = () => {
    setIsGroupListVisible(!isGroupListVisible);
  };

  // Close group list when a group is selected (on mobile)
  const handleGroupSelect = (group: ChatGroup) => {
    setSelectedGroup(group);
    setIsGroupListVisible(false);
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      height: "100vh", 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#f5f5f5",
      position: "relative"
    }}>
      {/* Mobile header with back button and group name */}
      {selectedGroup && (
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "15px",
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "white",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          <button 
            onClick={toggleGroupList}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              marginRight: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ☰
          </button>
          <h2 style={{ 
            margin: "0", 
            fontSize: "1.2rem",
            color: "#333",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {selectedGroup.name}
          </h2>
        </div>
      )}

      <div style={{ 
        display: "flex", 
        flex: 1, 
        overflow: "hidden"
      }}>
        {/* Groups/Areas panel - hidden on mobile when in chat view */}
        <div 
          style={{ 
            width: isGroupListVisible ? "100%" : "0",
            position: isGroupListVisible ? "absolute" : "relative",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 20,
            backgroundColor: "white",
            overflowY: "auto",
            transition: "width 0.3s ease",
            borderRight: "1px solid #e0e0e0",
            boxShadow: isGroupListVisible ? "2px 0 5px rgba(0,0,0,0.1)" : "none"
          }}
        >
          <div style={{ 
            padding: "15px", 
            minWidth: "280px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px"
            }}>
              <h2 style={{ 
                margin: "0", 
                paddingBottom: "10px", 
                borderBottom: "2px solid #007bff",
                color: "#333"
              }}>
                Nearby Groups
              </h2>
              <button 
                onClick={() => setIsGroupListVisible(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ×
              </button>
            </div>
            {userCoordinates ? (
              <>
                <p style={{ 
                  fontSize: "0.85rem", 
                  color: "#666", 
                  marginBottom: "15px",
                  fontStyle: "italic"
                }}>
                  Groups near your location
                </p>
                {availableGroups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      backgroundColor: selectedGroup?.id === group.id ? "#e3f2fd" : "#f9f9f9",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      transition: "all 0.2s ease",
                      boxShadow: selectedGroup?.id === group.id ? "0 2px 5px rgba(0,0,0,0.1)" : "none"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = selectedGroup?.id === group.id ? "#d1e9ff" : "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedGroup?.id === group.id ? "#e3f2fd" : "#f9f9f9";
                    }}
                  >
                    <div style={{ 
                      fontWeight: "600", 
                      fontSize: "1rem",
                      marginBottom: "5px",
                      color: "#333",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {group.name}
                    </div>
                    <div style={{ 
                      fontSize: "0.8rem", 
                      color: "#666",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <span style={{ 
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#4caf50",
                        marginRight: "6px"
                      }}></span>
                      {Math.round(calculateDistance(
                        userCoordinates.latitude, 
                        userCoordinates.longitude,
                        group.coordinates.latitude,
                        group.coordinates.longitude
                      ) * 10) / 10} km away
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100px",
                color: "#666"
              }}>
                <div className="spinner-border text-primary" role="status" style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  marginRight: "10px"
                }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                Getting your location...
              </div>
            )}
          </div>
        </div>

        {/* Chat window */}
        <div style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          padding: "0",
          backgroundColor: "white",
          width: "100%"
        }}>
          {selectedGroup ? (
            <>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "15px",
                  display: "flex",
                  flexDirection: "column",
                  backgroundImage: "linear-gradient(to bottom, #f9f9f9, #f0f0f0)"
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ 
                    textAlign: "center", 
                    color: "#888", 
                    padding: "40px 20px",
                    fontStyle: "italic"
                  }}>
                    No messages yet. Be the first to start the conversation!
                  </div>
                ) : (
                  messages.map(msg => {
                    const isCurrentUser = msg.senderId === user?.uid;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                          backgroundColor: isCurrentUser ? "#007bff" : "white",
                          color: isCurrentUser ? "white" : "#333",
                          borderRadius: "18px",
                          padding: "10px 16px",
                          marginBottom: "12px",
                          maxWidth: "85%",
                          wordBreak: "break-word",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}
                      >
                        <div style={{ 
                          fontWeight: "600", 
                          fontSize: "0.9rem",
                          marginBottom: "4px",
                          opacity: 0.9
                        }}>
                          {msg.senderName}
                        </div>
                        <div style={{ marginBottom: "4px" }}>{msg.text}</div>
                        <div style={{ 
                          fontSize: "0.75em", 
                          opacity: 0.7,
                          textAlign: "right"
                        }}>
                          {msg.timestamp?.toDate?.().toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) || "Just now"}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ 
                display: "flex", 
                padding: "12px 15px",
                borderTop: "1px solid #e0e0e0",
                backgroundColor: "white"
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ 
                    flex: 1, 
                    padding: "12px 15px", 
                    borderRadius: "24px", 
                    border: "1px solid #e0e0e0", 
                    marginRight: "10px",
                    fontSize: "1rem",
                    outline: "none"
                  }}
                  onKeyPress={e => { if (e.key === "Enter") sendMessage(); }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{ 
                    padding: "12px 20px", 
                    backgroundColor: newMessage.trim() ? "#007bff" : "#ccc",
                    color: "white", 
                    border: "none", 
                    borderRadius: "24px", 
                    cursor: newMessage.trim() ? "pointer" : "not-allowed",
                    fontWeight: "600",
                    transition: "background-color 0.2s",
                    whiteSpace: "nowrap"
                  }}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center", 
              justifyContent: "center", 
              height: "100%",
              color: "#666",
              textAlign: "center",
              padding: "20px"
            }}>
              <div style={{
                fontSize: "4rem",
                marginBottom: "20px",
                opacity: 0.5
              }}>💬</div>
              <h3 style={{ marginBottom: "10px" }}>Welcome to Area Chat</h3>
              <p style={{ maxWidth: "400px" }}>
                {userCoordinates 
                  ? "Select a group from the menu to start chatting with people in that area"
                  : "Waiting for your location to show nearby groups..."
                }
              </p>
              <button
                onClick={toggleGroupList}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "24px",
                  cursor: "pointer",
                  fontWeight: "600",
                  marginTop: "20px"
                }}
              >
                View Groups
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedChat;