import React, { useState } from 'react';
import { TeamsManager } from './TeamsManager';
import { MatchesManager } from './MatchesManager';

export const TeamsAndMatchesManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'teams' | 'matches'>('teams');
  
  console.log('TeamsAndMatchesManager rendered, activeTab:', activeTab);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teams & Kits
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Matches
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'teams' && <TeamsManager />}
        {activeTab === 'matches' && <MatchesManager />}
      </div>
    </div>
  );
};