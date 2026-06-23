import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface Player {
  id: string;
  ruid: string;
  auth: string;
  conn: string;
  name: string;
  rating: number;
  totals: number;
  disconns: number;
  wins: number;
  goals: number;
  assists: number;
  ogs: number;
  losePoints: number;
  balltouch: number;
  passed: number;
  mute: boolean;
  muteExpire: number;
  banned: boolean;
  banExpire: number;
  banReason?: string;
  malActCount: number;
  rejoinCount: number;
  joinDate: number;
  leftDate: number;
  createdAt: string;
  updatedAt: string;
}

interface ServerImage {
  id: string;
  name: string;
  ruid?: string;
  status: 'running' | 'stopped' | 'error';
  createdAt: string;
}

interface PlayerStats {
  totalPlayers: number;
  totalGames: number;
  totalGoals: number;
  totalAssists: number;
  averageRating: number;
  topPlayers: Array<{
    name: string;
    rating: number;
    goals: number;
    assists: number;
    wins: number;
    totals: number;
  }>;
}

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [selectedRuid, setSelectedRuid] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [serverImages, setServerImages] = useState<ServerImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [playerDetails, setPlayerDetails] = useState<any>(null);
  
  // Load server images on component mount
  useEffect(() => {
    fetchServerImages();
  }, []);

  const fetchServerImages = async () => {
    try {
      const response = await fetch('/api/server-images');
      if (response.ok) {
        const data = await response.json();
        setServerImages(data.images || []);
      }
    } catch (err) {
      console.error('Failed to fetch server images:', err);
    }
  };

  const handleImageSelect = (imageId: string) => {
    const image = serverImages.find(img => img.id === imageId);
    if (image && image.ruid) {
      setSelectedImage(imageId);
      setSelectedRuid(image.ruid);
      fetchPlayers(image.ruid);
    }
  };

  const fetchPlayers = async (ruid: string) => {
    if (!ruid) return;
    
    console.log('🔍 Fetching players for RUID:', ruid);
    setLoading(true);
    setError(null);
    
    try {
      const playersUrl = `/api/rooms/${encodeURIComponent(ruid)}/players`;
      const statsUrl = `/api/rooms/${encodeURIComponent(ruid)}/players/stats`;
      
      console.log('📡 Making requests to:', { playersUrl, statsUrl });
      
      const [playersResponse, statsResponse] = await Promise.all([
        fetch(playersUrl),
        fetch(statsUrl)
      ]);
      
      console.log('📡 Response status:', { 
        players: playersResponse.status, 
        stats: statsResponse.status 
      });
      
      if (!playersResponse.ok || !statsResponse.ok) {
        const playersError = !playersResponse.ok ? await playersResponse.text() : null;
        const statsError = !statsResponse.ok ? await statsResponse.text() : null;
        console.error('❌ API Error:', { playersError, statsError });
        throw new Error('Failed to fetch player data');
      }
      
      const playersData = await playersResponse.json();
      const statsData = await statsResponse.json();
      
      console.log('📊 Received data:', { 
        playersCount: playersData.data?.length || 0,
        hasStats: !!statsData.data,
        debug: playersData.debug
      });
      
      // Transform API data to match Player interface
      const transformedPlayers = (playersData.data || []).map((p: any) => ({
        id: p.id,
        ruid: selectedRuid,
        auth: p.auth || 'unknown',
        conn: p.conn || 'unknown', 
        name: p.name || 'Unknown',
        rating: p.rating || 1000,
        totals: 0,
        disconns: 0,
        wins: 0,
        goals: p.goals || 0,
        assists: p.assists || 0,
        ogs: 0,
        losePoints: 0,
        balltouch: 0,
        passed: 0,
        mute: false,
        muteExpire: 0,
        banned: false,
        banExpire: 0,
        malActCount: 0,
        rejoinCount: 0,
        joinDate: p.firstSeen ? Math.floor(new Date(p.firstSeen).getTime() / 1000) : 0,
        leftDate: p.lastSeen ? Math.floor(new Date(p.lastSeen).getTime() / 1000) : 0,
        createdAt: p.firstSeen || new Date().toISOString(),
        updatedAt: p.lastSeen || new Date().toISOString()
      }));
      
      setPlayers(transformedPlayers);
      setStats(statsData.data || null);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerDetails = async (playerId: string) => {
    try {
      console.log('Fetching details for player:', playerId);
      const response = await fetch(`/api/player/${playerId}/details`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Player details:', data);
        setPlayerDetails(data.data);
      } else {
        console.error('Failed to fetch player details, status:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch player details:', err);
    }
  };

  const togglePlayerDetails = async (playerId: string) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
      setPlayerDetails(null);
    } else {
      setExpandedPlayer(playerId);
      await fetchPlayerDetails(playerId);
    }
  };

  const fetchDebugPlayers = async () => {
    console.log('🔍 Fetching debug players from database...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/players');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Debug API Error:', errorText);
        throw new Error('Failed to fetch debug players');
      }
      
      const data = await response.json();
      console.log('📊 Debug players data:', data);
      
      // Transform debug data to match player interface
      const debugPlayers = data.players?.map((p: any) => ({
        id: p.id,
        ruid: 'debug',
        auth: p.primaryAuth || 'unknown',
        conn: p.primaryConn || 'unknown',
        name: p.lastSession?.name || p.names?.[0] || 'Unknown',
        rating: p.lastSession?.rating || 1000,
        totals: p.lastSession?.totals || 0,
        disconns: p.lastSession?.disconns || 0,
        wins: p.lastSession?.wins || 0,
        goals: p.lastSession?.goals || 0,
        assists: p.lastSession?.assists || 0,
        ogs: p.lastSession?.ogs || 0,
        losePoints: p.lastSession?.losePoints || 0,
        balltouch: p.lastSession?.balltouch || 0,
        passed: p.lastSession?.passed || 0,
        mute: false,
        muteExpire: 0,
        banned: false,
        banExpire: 0,
        malActCount: 0,
        rejoinCount: 0,
        joinDate: Math.floor(new Date(p.firstSeen).getTime() / 1000),
        leftDate: Math.floor(new Date(p.lastSeen).getTime() / 1000),
        createdAt: p.firstSeen,
        updatedAt: p.lastSeen
      })) || [];
      
      setPlayers(debugPlayers);
      setSelectedRuid('debug-mode');
      
      // Create basic stats
      setStats({
        totalPlayers: debugPlayers.length,
        totalGames: debugPlayers.reduce((sum: number, p: any) => sum + p.totals, 0),
        totalGoals: debugPlayers.reduce((sum: number, p: any) => sum + p.goals, 0),
        totalAssists: debugPlayers.reduce((sum: number, p: any) => sum + p.assists, 0),
        averageRating: debugPlayers.length > 0 ? 
          Math.round(debugPlayers.reduce((sum: number, p: any) => sum + p.rating, 0) / debugPlayers.length) : 1000,
        topPlayers: debugPlayers
          .sort((a: any, b: any) => b.rating - a.rating)
          .slice(0, 10)
          .map((p: any) => ({
            name: p.name,
            rating: p.rating,
            goals: p.goals,
            assists: p.assists,
            wins: p.wins,
            totals: p.totals
          }))
      });
      
    } catch (err) {
      console.error('❌ Debug fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatWinRate = (wins: number, totals: number) => {
    if (totals === 0) return '0%';
    return `${Math.round((wins / totals) * 100)}%`;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Navigation */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <nav className="flex space-x-6">
            <a href="/server-images" className="text-gray-600 hover:text-blue-600 font-medium pb-2 transition-colors">
              Server Images
            </a>
            <a href="/players" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
              Players
            </a>
            <a href="/teams" className="text-gray-600 hover:text-blue-600 font-medium pb-2 transition-colors">
              Teams & Matches
            </a>
            <a href="/global-config" className="text-gray-600 hover:text-blue-600 font-medium pb-2 transition-colors">
              Global Config
            </a>
          </nav>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Player Management</h1>
        
        <div className="flex gap-4 mb-6">
          <select
            value={selectedImage}
            onChange={(e) => handleImageSelect(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select a Server Image</option>
            {serverImages.map((image) => (
              <option key={image.id} value={image.id}>
                {image.name} {image.status === 'running' ? '🟢' : image.status === 'stopped' ? '🔴' : '⚠️'}
                {image.ruid ? ` (${image.ruid.substring(0, 20)}...)` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedRuid && fetchPlayers(selectedRuid)}
            disabled={!selectedRuid || loading}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            🔄 Refresh
          </button>
          <button
            onClick={fetchDebugPlayers}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'All Players'}
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">💡 How to view players:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Select a server image from the dropdown above</li>
            <li>2. Players will show: 🟢 Currently online + Recently connected (24h)</li>
            <li>3. Use "All Players" button to see everyone in the database</li>
            <li>4. Each server image has its own player statistics and data</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-blue-700">
              📊 <strong>Player Data:</strong> Global identity + Per-image statistics
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGames}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGoals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && stats.topPlayers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topPlayers.map((player, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Rating: {player.rating}</span>
                    <span>Goals: {player.goals}</span>
                    <span>Assists: {player.assists}</span>
                    <span>Win Rate: {formatWinRate(player.wins, player.totals)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {players.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedRuid === 'debug-mode' ? 'All Players in Database' : 'Room Players'} ({players.length})
              {selectedRuid === 'debug-mode' && (
                <span className="ml-2 text-sm font-normal text-gray-500">(Debug Mode)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Rating</th>
                    <th className="text-left p-2">Games</th>
                    <th className="text-left p-2">Win Rate</th>
                    <th className="text-left p-2">Goals</th>
                    <th className="text-left p-2">Assists</th>
                    <th className="text-left p-2">Rejoins</th>
                    <th className="text-left p-2">First Join</th>
                    <th className="text-left p-2">Last Seen</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr 
                      key={player.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => togglePlayerDetails(player.id)}
                    >
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-gray-500">
                            Auth: {player.auth.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={player.rating >= 1200 ? 'default' : 'secondary'}>
                          {player.rating}
                        </Badge>
                      </td>
                      <td className="p-2">{player.totals}</td>
                      <td className="p-2">{formatWinRate(player.wins, player.totals)}</td>
                      <td className="p-2">{player.goals}</td>
                      <td className="p-2">{player.assists}</td>
                      <td className="p-2">{player.rejoinCount}</td>
                      <td className="p-2">{formatDate(player.joinDate)}</td>
                      <td className="p-2">{formatDate(player.leftDate)}</td>
                      <td className="p-2">
                        <div className="flex gap-1 flex-wrap">
                          {player.banned && (
                            <Badge variant="destructive" className="text-xs">
                              {player.banExpire === 0 ? 'Banned' : `Banned (${Math.ceil((player.banExpire * 1000 - Date.now()) / (1000 * 60 * 60 * 24))}d)`}
                            </Badge>
                          )}
                          {player.mute && (
                            <Badge variant="destructive" className="text-xs">Muted</Badge>
                          )}
                          {player.malActCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Warnings: {player.malActCount}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="text-xs text-gray-500">
                          {expandedPlayer === player.id ? '▼' : '▶'} Click to expand
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded Player Details */}
      {expandedPlayer && playerDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Player Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Identity Info */}
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">🆔 Identity</h4>
                <div className="text-sm space-y-1">
                  <div><strong>ID:</strong> {playerDetails.id}</div>
                  <div><strong>Primary Auth:</strong> {playerDetails.primaryAuth || 'None'}</div>
                  <div><strong>Primary Conn:</strong> {playerDetails.primaryConn}</div>
                  <div><strong>First Seen:</strong> {new Date(playerDetails.firstSeen).toLocaleString()}</div>
                  <div><strong>Last Seen:</strong> {new Date(playerDetails.lastSeen).toLocaleString()}</div>
                </div>
              </div>
              
              {/* All Names */}
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">📝 All Names</h4>
                <div className="text-sm">
                  {playerDetails.allNames?.length > 0 ? (
                    <ul className="space-y-1">
                      {playerDetails.allNames.map((name: string, idx: number) => (
                        <li key={idx} className="bg-white px-2 py-1 rounded">{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No names recorded</span>
                  )}
                </div>
              </div>
              
              {/* All Auths */}
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">🔑 All Auths</h4>
                <div className="text-sm">
                  {playerDetails.allAuths?.length > 0 ? (
                    <ul className="space-y-1">
                      {playerDetails.allAuths.map((auth: string, idx: number) => (
                        <li key={idx} className="bg-white px-2 py-1 rounded font-mono text-xs">
                          {auth.substring(0, 20)}...
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No auths recorded</span>
                  )}
                </div>
              </div>
              
              {/* All Connections */}
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">🌐 All Connections</h4>
                <div className="text-sm">
                  {playerDetails.connectionDetails?.length > 0 ? (
                    <ul className="space-y-2">
                      {playerDetails.connectionDetails.map((connDetail: any, idx: number) => {
                        // Decode hex connection to IP
                        const decodeHexConn = (hexConn: string) => {
                          try {
                            // Convert hex string to ASCII first, then parse as IP
                            let ascii = '';
                            for (let i = 0; i < hexConn.length; i += 2) {
                              ascii += String.fromCharCode(parseInt(hexConn.substr(i, 2), 16));
                            }
                            return ascii; // This should give us something like "181.117.80.30"
                          } catch {
                            return hexConn;
                          }
                        };
                        
                        return (
                          <li key={idx} className="bg-white px-3 py-2 rounded border">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-blue-600">
                                  {connDetail.ipAddress || decodeHexConn(connDetail.conn)}
                                </div>
                                {connDetail.threatLevel && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    connDetail.threatLevel === 'high' ? 'bg-red-100 text-red-800' :
                                    connDetail.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {connDetail.threatLevel.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              
                              {/* Location Info */}
                              {(connDetail.country || connDetail.city) && (
                                <div className="text-sm text-gray-700">
                                  🌍 {connDetail.city && `${connDetail.city}, `}{connDetail.region && `${connDetail.region}, `}{connDetail.country}
                                  {connDetail.timezone && ` (${connDetail.timezone})`}
                                </div>
                              )}
                              
                              {/* Security Flags */}
                              <div className="flex gap-1 flex-wrap">
                                {connDetail.isVpn && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                    VPN
                                  </span>
                                )}
                                {connDetail.isProxy && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                    PROXY
                                  </span>
                                )}
                                {connDetail.isTor && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                    TOR
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-600 space-y-1">
                                <div><strong>ISP:</strong> {connDetail.isp || 'Unknown'}</div>
                                <div><strong>Conn:</strong> <span className="font-mono">{connDetail.conn}</span></div>
                                <div><strong>Use Count:</strong> {connDetail.useCount}</div>
                                <div><strong>First:</strong> {new Date(connDetail.firstSeen).toLocaleString()}</div>
                                <div><strong>Last:</strong> {new Date(connDetail.lastSeen).toLocaleString()}</div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No connections recorded</span>
                  )}
                </div>
              </div>
              
              {/* Current Session */}
              {playerDetails.currentSession && (
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">🎮 Current Session</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Haxball ID:</strong> {playerDetails.currentSession.haxballId}</div>
                    <div><strong>Rating:</strong> {playerDetails.currentSession.rating}</div>
                    <div><strong>Goals:</strong> {playerDetails.currentSession.goals}</div>
                    <div><strong>Assists:</strong> {playerDetails.currentSession.assists}</div>
                    <div><strong>Ball Touch:</strong> {playerDetails.currentSession.balltouch}</div>
                    <div><strong>Joined:</strong> {new Date(playerDetails.currentSession.joinedAt).toLocaleString()}</div>
                    {playerDetails.currentSession.leftAt && (
                      <div><strong>Left:</strong> {new Date(playerDetails.currentSession.leftAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Sanctions */}
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">⚖️ Sanctions</h4>
                <div className="text-sm">
                  {playerDetails.sanctions?.length > 0 ? (
                    <ul className="space-y-1">
                      {playerDetails.sanctions.map((sanction: any, idx: number) => (
                        <li key={idx} className={`bg-white px-2 py-1 rounded ${
                          sanction.isActive ? 'border-l-4 border-red-500' : 'opacity-60'
                        }`}>
                          <div className="font-medium">{sanction.type.toUpperCase()}</div>
                          <div className="text-xs text-gray-600">
                            {sanction.reason && <div>Reason: {sanction.reason}</div>}
                            <div>By: {sanction.adminName || 'System'}</div>
                            <div>Date: {new Date(sanction.createdAt).toLocaleDateString()}</div>
                            {sanction.expiresAt && (
                              <div>Expires: {new Date(sanction.expiresAt).toLocaleDateString()}</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No sanctions recorded</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedImage && players.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              No players found for {serverImages.find(img => img.id === selectedImage)?.name || 'selected server'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Players will appear here once they join the Haxball room or have connected recently
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}