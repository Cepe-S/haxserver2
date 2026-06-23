import { useState, useEffect } from 'react';
import { useAuthStore } from '../services/authStore';
import { TeamsAndMatchesManager } from '../components/Teams/TeamsAndMatchesManager';
import axios from 'axios';

/**
 * FASE 1.1: Dashboard básico para gestión de rooms
 */
function DashboardPage() {
  const { logout } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeSection, setActiveSection] = useState<'rooms' | 'teams'>('teams');
  
  console.log('DashboardPage rendered, activeSection:', activeSection);
  const [newRoomConfig, setNewRoomConfig] = useState({
    ruid: '',
    roomName: 'MikuServerPro',
    maxPlayers: 20,
    public: false
  });

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomConfig.ruid.trim()) {
      alert('RUID es requerido');
      return;
    }

    setCreating(true);
    try {
      await axios.post('/api/rooms', {
        ruid: newRoomConfig.ruid,
        config: {
          roomName: newRoomConfig.roomName,
          maxPlayers: newRoomConfig.maxPlayers,
          public: newRoomConfig.public
        }
      });
      
      setNewRoomConfig({
        ruid: '',
        roomName: 'MikuServerPro',
        maxPlayers: 20,
        public: false
      });
      
      await fetchRooms();
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Error al crear la sala');
    } finally {
      setCreating(false);
    }
  };

  const closeRoom = async (ruid: string) => {
    try {
      await axios.delete(`/api/rooms/${ruid}`);
      await fetchRooms();
    } catch (error) {
      console.error('Failed to close room:', error);
      alert('Error al cerrar la sala');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              MikuServerPro Dashboard
            </h1>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveSection('rooms')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'rooms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rooms Management
              </button>
              <button
                onClick={() => setActiveSection('teams')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'teams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Teams & Matches
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {activeSection === 'rooms' && (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Create Room Section */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Crear Nueva Sala
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    type="text"
                    placeholder="RUID (ej: sala1)"
                    value={newRoomConfig.ruid}
                    onChange={(e) => setNewRoomConfig({...newRoomConfig, ruid: e.target.value})}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Nombre de la sala"
                    value={newRoomConfig.roomName}
                    onChange={(e) => setNewRoomConfig({...newRoomConfig, roomName: e.target.value})}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Máx. jugadores"
                    value={newRoomConfig.maxPlayers}
                    onChange={(e) => setNewRoomConfig({...newRoomConfig, maxPlayers: parseInt(e.target.value)})}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  />
                  <button
                    onClick={createRoom}
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                  >
                    {creating ? 'Creando...' : 'Crear Sala'}
                  </button>
                </div>
              </div>
            </div>

            {/* Rooms List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Salas Activas
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {loading ? (
                  <li className="px-4 py-4">
                    <div className="text-center">Cargando...</div>
                  </li>
                ) : rooms.length === 0 ? (
                  <li className="px-4 py-4">
                    <div className="text-center text-gray-500">No hay salas activas</div>
                  </li>
                ) : (
                  rooms.map((room: any) => (
                    <li key={room.ruid} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            RUID: {room.ruid}
                          </p>
                          <p className="text-sm text-gray-500">
                            Estado: {room.status}
                          </p>
                        </div>
                        <button
                          onClick={() => closeRoom(room.ruid)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cerrar
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'teams' && (
          <TeamsAndMatchesManager />
        )}
      </main>
    </div>
  );
}

export default DashboardPage;