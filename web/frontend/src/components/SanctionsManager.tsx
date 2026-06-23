import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface Player {
  identityId: string;
  haxballId: number;
  name: string;
  auth?: string;
  joinedAt: string;
  leftAt?: string;
  isConnected: boolean;
  primaryAuth?: string;
}

interface Sanction {
  id: string;
  type: 'ban' | 'mute';
  reason?: string;
  duration: number;
  adminName?: string;
  createdAt: string;
  expiresAt?: string;
  playerName: string;
}

interface SanctionsManagerProps {
  ruid: string;
}

export function SanctionsManager({ ruid }: SanctionsManagerProps) {
  const [players, setPlayers] = useState<{ connected: Player[]; recent: Player[] }>({ connected: [], recent: [] });
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [sanctionForm, setSanctionForm] = useState({
    type: 'mute' as 'ban' | 'mute',
    duration: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, [ruid]);

  const fetchData = async () => {
    try {
      const [playersRes, sanctionsRes] = await Promise.all([
        fetch(`/api/rooms/${ruid}/players/sanctions`),
        fetch(`/api/rooms/${ruid}/sanctions`)
      ]);

      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData);
      }

      if (sanctionsRes.ok) {
        const sanctionsData = await sanctionsRes.json();
        setSanctions(sanctionsData.sanctions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSanction = async () => {
    if (!selectedPlayer || !sanctionForm.duration) {
      alert('Selecciona un jugador y especifica la duración');
      return;
    }

    try {
      // Parsear duración (permitir expresiones como 60*24)
      const duration = Function(`"use strict"; return (${sanctionForm.duration})`)();
      
      const response = await fetch(`/api/rooms/${ruid}/sanctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityId: selectedPlayer.identityId,
          type: sanctionForm.type,
          duration: duration,
          reason: sanctionForm.reason || 'Sanción desde web',
          adminName: 'Web Admin'
        })
      });

      if (response.ok) {
        setSanctionForm({ type: 'mute', duration: '', reason: '' });
        setSelectedPlayer(null);
        fetchData();
      } else {
        alert('Error al crear sanción');
      }
    } catch (error) {
      alert('Duración inválida. Usa números o expresiones como 60*24');
    }
  };

  const removeSanction = async (sanctionId: string) => {
    if (!confirm('¿Remover esta sanción?')) return;

    try {
      const response = await fetch(`/api/sanctions/${sanctionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Error al remover sanción');
      }
    } catch (error) {
      alert('Error al remover sanción');
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} días`;
    if (hours > 0) return `${hours} horas`;
    return `${minutes} minutos`;
  };

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestión de Sanciones</h2>
      
      {/* Crear sanción */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Crear Sanción</h3>
        
        {selectedPlayer && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <strong>Jugador seleccionado:</strong> {selectedPlayer.name} 
            {selectedPlayer.isConnected ? (
              <Badge className="ml-2" variant="default">Conectado</Badge>
            ) : (
              <Badge className="ml-2" variant="secondary">Desconectado</Badge>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Tipo</Label>
            <select
              value={sanctionForm.type}
              onChange={(e) => setSanctionForm(prev => ({ ...prev, type: e.target.value as 'ban' | 'mute' }))}
              className="w-full p-2 border rounded"
            >
              <option value="mute">Mute</option>
              <option value="ban">Ban</option>
            </select>
          </div>
          <div>
            <Label>Duración (minutos)</Label>
            <Input
              value={sanctionForm.duration}
              onChange={(e) => setSanctionForm(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="60*24 (1 día)"
            />
          </div>
          <div>
            <Label>Razón</Label>
            <Input
              value={sanctionForm.reason}
              onChange={(e) => setSanctionForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Spam, insultos..."
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={createSanction}
              disabled={!selectedPlayer}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300"
            >
              Sancionar
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jugadores conectados */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Jugadores Conectados ({players.connected.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {players.connected.map((player) => (
              <div
                key={player.identityId}
                onClick={() => setSelectedPlayer(player)}
                className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedPlayer?.identityId === player.identityId ? 'bg-blue-100 border-blue-300' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <strong>#{player.haxballId} {player.name}</strong>
                    {player.auth && <div className="text-xs text-gray-500">Auth: {player.auth.substring(0, 10)}...</div>}
                  </div>
                  <Badge variant="default">Online</Badge>
                </div>
              </div>
            ))}
            {players.connected.length === 0 && (
              <div className="text-center text-gray-500 py-4">No hay jugadores conectados</div>
            )}
          </div>
        </Card>

        {/* Jugadores recientes */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Jugadores Recientes ({players.recent.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {players.recent.map((player) => (
              <div
                key={`${player.identityId}-${player.leftAt}`}
                onClick={() => setSelectedPlayer(player)}
                className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedPlayer?.identityId === player.identityId ? 'bg-blue-100 border-blue-300' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <strong>#{player.haxballId} {player.name}</strong>
                    {player.auth && <div className="text-xs text-gray-500">Auth: {player.auth.substring(0, 10)}...</div>}
                    <div className="text-xs text-gray-400">
                      Salió: {new Date(player.leftAt!).toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge variant="secondary">Offline</Badge>
                </div>
              </div>
            ))}
            {players.recent.length === 0 && (
              <div className="text-center text-gray-500 py-4">No hay jugadores recientes</div>
            )}
          </div>
        </Card>
      </div>

      {/* Sanciones activas */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Sanciones Activas ({sanctions.length})</h3>
        <div className="space-y-2">
          {sanctions.map((sanction) => (
            <div key={sanction.id} className="p-3 border rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sanction.type === 'ban' ? 'destructive' : 'secondary'}>
                      {sanction.type.toUpperCase()}
                    </Badge>
                    <strong>{sanction.playerName}</strong>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Razón: {sanction.reason || 'No especificada'}
                  </div>
                  <div className="text-xs text-gray-400">
                    Por: {sanction.adminName} • {new Date(sanction.createdAt).toLocaleString()}
                    {sanction.expiresAt && ` • Expira en: ${formatTimeRemaining(sanction.expiresAt)}`}
                    {sanction.duration === 0 && ' • PERMANENTE'}
                  </div>
                </div>
                <button
                  onClick={() => removeSanction(sanction.id)}
                  className="text-red-500 hover:text-red-700 px-3 py-1 text-sm"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          {sanctions.length === 0 && (
            <div className="text-center text-gray-500 py-4">No hay sanciones activas</div>
          )}
        </div>
      </Card>
    </div>
  );
}