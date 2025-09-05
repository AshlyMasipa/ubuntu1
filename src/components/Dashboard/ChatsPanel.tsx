import React, { useState } from "react";
import UnifiedChat from "./UnifiedChat"; // Path to your UnifiedChat.tsx

interface ChatsPanelProps {
  onClose?: () => void;
}

export const ChatsPanel: React.FC<ChatsPanelProps> = ({ onClose }) => {
  const [collectionName, setCollectionName] = useState<string>("Areas"); // Default collection

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chats</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          Close
        </button>
      </div>

      {/* Tabs to switch chat collections */}
      <div className="flex space-x-2 p-2 border-b border-gray-200">
        <button
          onClick={() => setCollectionName("Areas")}
          className={`px-3 py-1 rounded ${
            collectionName === "Areas" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Areas
        </button>
        <button
          onClick={() => setCollectionName("carpools")}
          className={`px-3 py-1 rounded ${
            collectionName === "carpools" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Carpools
        </button>
      </div>

      {/* Chat component */}
      <div className="flex-1 h-full">
        <UnifiedChat groupCollectionName={collectionName} />
      </div>
    </div>
  );
};
