import React, { useState, useEffect } from 'react';
import { Shield, Lightbulb, Clock, Plus } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { SafetyTip } from '../../types'; // Updated import

export const SafetyTipsPanel: React.FC = () => {
  const [safetyTips, setSafetyTips] = useState<SafetyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [devLoading, setDevLoading] = useState(false);
  const [devMessage, setDevMessage] = useState('');

  // Fetch the latest safety tips
  useEffect(() => {
    const fetchSafetyTips = async () => {
      try {
        const q = query(
          collection(db, 'Tips'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const tips: SafetyTip[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          tips.push({
            id: doc.id,
            title: data.title,
            content: data.content,
            category: data.category,
            createdAt: data.createdAt
          });
        });

        setSafetyTips(tips);
      } catch (error) {
        console.error('Error fetching safety tips:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSafetyTips();
  }, []);


  if (loading) {
    return <div className="text-center py-4">Loading safety tips...</div>;
  }

  return (
    <div>
      {/* Panel header */}
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold">Safety Tips</h3>
      </div>



      {/* Tips list */}
      {safetyTips.length === 0 ? (
        <p className="text-gray-500">No safety tips available.</p>
      ) : (
        <div className="space-y-4">
          {safetyTips.map((tip) => (
            <div key={tip.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-700">{tip.content}</p>
                  {tip.createdAt && (
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(tip.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
