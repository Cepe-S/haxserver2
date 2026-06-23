import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { KitVisualizer } from './KitVisualizer';

interface MatchCategory {
  name: string;
  rate: number;
  classics: Array<[[string, 'tit' | 'alt'], [string, 'tit' | 'alt']]>;
}

interface MatchesData {
  [categoryId: string]: MatchCategory;
}

interface TeamsData {
  [teamName: string]: {
    tit?: any;
    alt?: any;
  };
}

export const MatchesManager: React.FC = () => {
  const [matches, setMatches] = useState<MatchesData>({});
  const [teams, setTeams] = useState<TeamsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch matches and teams in parallel
      const [matchesResponse, teamsResponse] = await Promise.all([
        axios.get('/api/matches'),
        axios.get('/api/teams')
      ]);
      
      const matchesResult = matchesResponse.data;
      const teamsResult = teamsResponse.data;
      
      if (matchesResult.success) {
        setMatches(matchesResult.data);
      }
      
      if (teamsResult.success) {
        setTeams(teamsResult.data);
      }
      
      if (!matchesResult.success || !teamsResult.success) {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getRandomMatch = async () => {
    try {
      const response = await axios.get('/api/matches/random');
      
      if (response.data.success) {
        alert(`Random match: ${response.data.data.homeTeam} vs ${response.data.data.awayTeam}`);
      } else {
        setError(response.data.error || 'Failed to get random match');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const renderMatchPreview = (match: [[string, 'tit' | 'alt'], [string, 'tit' | 'alt']]) => {
    const [home, away] = match;
    const [homeTeam, homeKit] = home;
    const [awayTeam, awayKit] = away;
    
    const homeKitData = teams[homeTeam]?.[homeKit];
    const awayKitData = teams[awayTeam]?.[awayKit];

    return (
      <div className="flex items-center justify-center gap-4 p-2 bg-gray-50 rounded">
        <div className="text-center">
          {homeKitData ? (
            <KitVisualizer kit={homeKitData} size={40} />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          )}
          <div className="text-xs mt-1">{homeTeam}</div>
          <div className="text-xs text-gray-500">({homeKit})</div>
        </div>
        
        <div className="text-lg font-bold">VS</div>
        
        <div className="text-center">
          {awayKitData ? (
            <KitVisualizer kit={awayKitData} size={40} />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          )}
          <div className="text-xs mt-1">{awayTeam}</div>
          <div className="text-xs text-gray-500">({awayKit})</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Matches Manager</h1>
        <div className="flex gap-2">
          <button 
            onClick={getRandomMatch}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Random Match
          </button>
          <button 
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(matches).map(([categoryId, category]) => (
          <div key={categoryId} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{category.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rate: {category.rate}%</span>
                <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm">
                  Edit
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {category.classics.map((match, index) => (
                <div key={index}>
                  {renderMatchPreview(match)}
                </div>
              ))}
            </div>

            {category.classics.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No matches configured
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(matches).length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No match categories found
        </div>
      )}
    </div>
  );
};