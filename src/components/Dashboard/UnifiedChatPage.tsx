import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UnifiedChat from './UnifiedChat';

const UnifiedChatPage: React.FC = () => {
  const { area } = useParams<{ area?: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with back button */}
      <div style={{
        padding: '15px 20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        alignItems: 'center'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginRight: '15px',
            fontSize: '1.5rem'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, color: '#333' }}>Area Chat</h2>
      </div>
      
      {/* Chat component */}
      <div style={{ flex: 1 }}>
        <UnifiedChat groupCollectionName="areas" />
      </div>
    </div>
  );
};

export default UnifiedChatPage;