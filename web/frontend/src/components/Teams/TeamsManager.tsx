import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { KitVisualizer } from './KitVisualizer';
import { TeamEditor } from './TeamEditor';

interface TeamKit {
  angle: number;
  textColour: number;
  teamColour1: number;
  teamColour2?: number | null;
  teamColour3?: number | null;
}

interface Team {
  tit?: TeamKit;
  alt?: TeamKit;
}

interface TeamsData {
  [teamName: string]: Team;
}

export const TeamsManager: React.FC = () => {
  const [teams, setTeams] = useState<TeamsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<{ name: string; team: Team } | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/teams');
      
      if (response.data.success) {
        setTeams(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch teams');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeam = async (teamName: string, team: Team) => {
    try {
      const response = await axios.put(`/api/teams/${encodeURIComponent(teamName)}`, { team });
      
      if (response.data.success) {
        setTeams(prev => ({ ...prev, [teamName]: team }));
        setEditingTeam(null);
      } else {
        setError(response.data.error || 'Failed to save team');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleEditTeam = (teamName: string, team: Team) => {
    setEditingTeam({ name: teamName, team });
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading teams...</div>
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
        <h1 className="text-2xl font-bold">Teams Manager</h1>
        <button 
          onClick={fetchTeams}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(teams).map(([teamName, team]) => (
          <div key={teamName} className="bg-white rounded-lg shadow-md p-4 border">
            <h3 className="text-lg font-semibold mb-3 text-center">{teamName}</h3>
            
            <div className="flex justify-around items-center">
              {team.tit && (
                <div className="text-center">
                  <div className="mb-2">
                    <KitVisualizer kit={team.tit} size={80} showText={true} />
                  </div>
                  <span className="text-sm text-gray-600">Titular</span>
                </div>
              )}
              
              {team.alt && (
                <div className="text-center">
                  <div className="mb-2">
                    <KitVisualizer kit={team.alt} size={80} showText={true} />
                  </div>
                  <span className="text-sm text-gray-600">Alternativa</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-center">
              <button 
                onClick={() => handleEditTeam(teamName, team)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(teams).length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No teams found
        </div>
      )}

      {editingTeam && (
        <TeamEditor
          teamName={editingTeam.name}
          team={editingTeam.team}
          onSave={handleSaveTeam}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
};