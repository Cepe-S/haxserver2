import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

interface DebugData {
  loop: {
    active: string;
    state: string;
    uptime: string;
    isTransitioning: boolean;
  };
  players: {
    total: number;
    red: number;
    blue: number;
    spectators: number;
    minRequired: number;
  };
  balance: {
    mode: string;
    enabled: boolean;
    maxPlayersPerTeam: number;
    queue: Array<{
      playerId: number;
      playerAuth: string;
      playerName: string;
      joinTime: number;
      rating: number;
    }>;
    queueLength: number;
    isProcessing: boolean;
    recentActions: Array<{
      timestamp: number;
      action: string;
      playerId: number;
      playerName: string;
      fromTeam: number;
      toTeam: number;
      reason: string;
      mode: string;
      redCount: number;
      blueCount: number;
      queueLength?: number;
    }>;
  } | null;
  currentMatch: {
    stadium: string;
    settings: {
      timeLimit: number;
      scoreLimit: number;
      teamLock: boolean;
    };
    teams: {
      home: string;
      away: string;
    } | null;
  } | null;
  transitions?: {
    total: number;
    recent: Array<{
      timestamp: number;
      from: string;
      to: string;
      reason: string;
    }>;
  };
  stats?: {
    training: {
      activations: number;
      totalTime: number;
    };
    match: {
      activations: number;
      totalTime: number;
      matchesPlayed: number;
    };
  };
  timestamp: string;
}

export function BalanceDebugPage() {
  const [searchParams] = useSearchParams();
  const ruid = searchParams.get('ruid') || '';
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDebugData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDebugData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, ruid]);

  const normalizeBalanceDebug = (data: any): DebugData => ({
    loop: {
      active: data.gameLoop?.activeLoop || 'none',
      state: data.gameLoop?.state || 'IDLE',
      uptime: data.gameLoop?.uptime
        ? `${Math.floor(data.gameLoop.uptime / 3600000).toString().padStart(2, '0')}:${Math.floor((data.gameLoop.uptime % 3600000) / 60000).toString().padStart(2, '0')}:${Math.floor((data.gameLoop.uptime % 60000) / 1000).toString().padStart(2, '0')}`
        : '00:00:00',
      isTransitioning: data.gameLoop?.isTransitioning ?? false
    },
    players: {
      total: data.players?.total ?? 0,
      red: data.players?.red ?? 0,
      blue: data.players?.blue ?? 0,
      spectators: data.players?.spectators ?? 0,
      minRequired: 0
    },
    balance: data.status ? {
      mode: data.status.mode,
      enabled: data.status.enabled,
      maxPlayersPerTeam: data.status.maxPlayersPerTeam ?? 0,
      queue: [],
      queueLength: 0,
      isProcessing: false,
      recentActions: data.debugActions || []
    } : null,
    currentMatch: data.currentMatch ? {
      stadium: data.currentMatch.stadium,
      settings: {
        timeLimit: data.currentMatch.settings?.timeLimit ?? 0,
        scoreLimit: data.currentMatch.settings?.scoreLimit ?? 0,
        teamLock: true
      },
      teams: data.currentMatch.teams
    } : null,
    transitions: {
      total: data.gameLoop?.transitions?.length ?? 0,
      recent: data.gameLoop?.transitions ?? []
    },
    stats: data.gameLoop?.stats ?? undefined,
    timestamp: data.timestamp || new Date().toISOString()
  });

  const fetchDebugData = async () => {
    try {
      const response = ruid
        ? await axios.get(`/api/rooms/${encodeURIComponent(ruid)}/balance-debug`)
        : await axios.get('/api/debug/gameloop');

      const payload = ruid ? normalizeBalanceDebug(response.data) : response.data;
      setDebugData(payload);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch debug data');
      console.error('Debug error:', err);
    } finally {
      setLoading(false);
    }
  };

  const forceTransition = async (loop: string) => {
    try {
      await axios.post('/api/debug/gameloop/transition', { loop, reason: 'manual (UI debug)' });
      fetchDebugData();
    } catch (err) {
      console.error('Failed to transition:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!debugData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Data</h2>
          <p className="text-gray-600">No debug data available</p>
        </div>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'JT_ASSIGN': return 'bg-blue-100 text-blue-800';
      case 'PRO_ASSIGN': return 'bg-green-100 text-green-800';
      case 'PRO_QUEUE': return 'bg-yellow-100 text-yellow-800';
      case 'PRO_REBALANCE': return 'bg-purple-100 text-purple-800';
      case 'TEAM_CHANGE_BLOCKED': return 'bg-red-100 text-red-800';
      case 'CONFIG_CHANGE': return 'bg-gray-100 text-gray-800';
      case 'STADIUM_CHANGE': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTeamName = (teamId: number) => {
    switch (teamId) {
      case 0: return 'SPEC';
      case 1: return 'RED';
      case 2: return 'BLUE';
      default: return 'UNK';
    }
  };

  const getLoopStatusColor = () => {
    if (debugData.loop.isTransitioning) return 'text-yellow-600 bg-yellow-50';
    if (debugData.loop.active === 'training') return 'text-blue-600 bg-blue-50';
    if (debugData.loop.active === 'match') return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getBalanceStatusColor = () => {
    if (!debugData.balance) return 'text-gray-600 bg-gray-50';
    if (!debugData.balance.enabled) return 'text-gray-600 bg-gray-50';
    if (debugData.balance.isProcessing) return 'text-blue-600 bg-blue-50';
    const diff = Math.abs(debugData.players.red - debugData.players.blue);
    if (diff <= 1) return 'text-green-600 bg-green-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Debug Panel</h1>
                <p className="text-gray-600 mt-1">
                  {ruid ? `Sala: ${ruid}` : 'Sin ruid — vista global (arrancá una Server Image)'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Auto (2s)</span>
                </label>
                <button onClick={fetchDebugData} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">🔄</button>
                <button onClick={() => window.history.back()} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">←</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className={`rounded-lg shadow p-6 ${getLoopStatusColor()}`}>
            <div className="text-center">
              <p className="text-sm font-medium mb-2">🔄 Game Loop</p>
              <p className="text-2xl font-bold">{debugData.loop.active.toUpperCase()}</p>
              <p className="text-xs mt-1">{debugData.loop.state}</p>
              <p className="text-xs mt-1 font-mono">{debugData.loop.uptime}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">👥 Players</p>
              <p className="text-2xl font-bold text-gray-900">{debugData.players.total}</p>
              <p className="text-xs text-gray-500 mt-1">Min: {debugData.players.minRequired}</p>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">🔴 Red</p>
              <p className="text-2xl font-bold text-red-600">{debugData.players.red}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-center">
              <p className="text-sm text-blue-600 mb-2">🔵 Blue</p>
              <p className="text-2xl font-bold text-blue-600">{debugData.players.blue}</p>
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 ${getBalanceStatusColor()}`}>
            <div className="text-center">
              <p className="text-sm font-medium mb-2">⚖️ Balance</p>
              <p className="text-lg font-bold">{debugData.balance?.mode.toUpperCase() || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎮 Manual Controls</h2>
          <div className="flex space-x-4">
            <button onClick={() => forceTransition('training')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">⏪ Training</button>
            <button onClick={() => forceTransition('match')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg">⏩ Match</button>
          </div>
        </div>

        {debugData.currentMatch && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b bg-green-50">
              <h2 className="text-lg font-bold text-green-600">⚽ Current Match</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Stadium: {debugData.currentMatch.stadium}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time: {debugData.currentMatch.settings.timeLimit}m | Score: {debugData.currentMatch.settings.scoreLimit}</p>
                </div>
                {debugData.currentMatch.teams && (
                  <div>
                    <p className="text-sm text-gray-900">{debugData.currentMatch.teams.home} vs {debugData.currentMatch.teams.away}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {debugData.stats && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">📊 Statistics</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-600 mb-2">Training Loop</h3>
                <p className="text-sm">Activations: {debugData.stats.training?.activations || 0}</p>
                <p className="text-sm">Time: {Math.floor((debugData.stats.training?.totalTime || 0) / 60000)}m</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-bold text-green-600 mb-2">Match Loop</h3>
                <p className="text-sm">Activations: {debugData.stats.match?.activations || 0}</p>
                <p className="text-sm">Matches: {debugData.stats.match?.matchesPlayed || 0}</p>
              </div>
            </div>
          </div>
        )}

        {debugData.balance && debugData.balance.recentActions.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">📝 Balance Actions</h2>
            </div>
            <div className="p-6 space-y-2">
              {debugData.balance.recentActions.slice(0, 10).map((action, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono">{formatTime(action.timestamp)}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getActionColor(action.action)}`}>{action.action}</span>
                    <span className="text-sm">{action.playerName}</span>
                    <span className="text-xs">{getTeamName(action.fromTeam)} → {getTeamName(action.toTeam)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {debugData.transitions && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">🔄 Transitions ({debugData.transitions.total || 0})</h2>
            </div>
            <div className="p-6">
              {!debugData.transitions.recent || debugData.transitions.recent.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transitions yet</p>
              ) : (
                <div className="space-y-2">
                  {debugData.transitions.recent.map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono">{formatTimestamp(t.timestamp)}</span>
                      <span className="font-bold text-blue-600">{t.from.toUpperCase()}</span>
                      <span>→</span>
                      <span className="font-bold text-green-600">{t.to.toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-600">{t.reason}</span>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-800 text-white rounded-lg p-4 text-center">
          <p className="text-xs">Updated: {new Date(debugData.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
