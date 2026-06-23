import { useState, useEffect } from 'react';
import axios from 'axios';
import { ServerImageConfigForm } from '../components/ServerImageConfigForm';

interface ServerImageConfig {
  ruid: string;
  _config: {
    roomName: string;
    playerName: string;
    password: string;
    maxPlayers: number;
    public: boolean;
    token: string;
    noPlayer: boolean;
  };
  settings: any;
  rules: any;
}

interface ServerImage {
  id: string;
  name: string;
  description?: string;
  config: string | ServerImageConfig;
  status: string;
  ruid?: string;
  roomLink?: string;
  token?: string;
  createdAt: string;
}

export function ServerImagesPage() {
  const [images, setImages] = useState<ServerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ServerImage | null>(null);
  const [haxballToken, setHaxballToken] = useState('');
  const [executing, setExecuting] = useState(false);
  const [lastUsedToken, setLastUsedToken] = useState('');

  // Function to check new RUID availability for creation
  const checkNewRuidAvailability = async (ruid: string) => {
    if (!ruid.trim()) {
      setNewRuidAvailable(null);
      return;
    }
    
    setCheckingNewRuid(true);
    try {
      const response = await axios.get(`/api/server-images/check-ruid/${encodeURIComponent(ruid)}`);
      setNewRuidAvailable(response.data.available);
    } catch (error) {
      console.error('Failed to check RUID availability:', error);
      setNewRuidAvailable(null);
    } finally {
      setCheckingNewRuid(false);
    }
  };

  // Cargar último token usado al inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('lastHaxballToken');
    if (savedToken) {
      setLastUsedToken(savedToken);
    }
  }, []);
  const [newImageName, setNewImageName] = useState('');
  const [newImageRuid, setNewImageRuid] = useState('');
  const [newRuidAvailable, setNewRuidAvailable] = useState<boolean | null>(null);
  const [checkingNewRuid, setCheckingNewRuid] = useState(false);
  const [editingImage, setEditingImage] = useState<ServerImage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get('/api/server-images');
      setImages(response.data.images);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (image: ServerImage) => {
    try {
      const response = await axios.get(`/api/server-images/${image.id}`);
      setEditingImage(response.data.image);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to fetch image config:', error);
    }
  };

  const updateImage = async () => {
    if (!editingImage) return;
    
    try {
      await axios.put(`/api/server-images/${editingImage.id}`, {
        name: editingImage.name,
        description: editingImage.description,
        config: editingImage.config
      });
      
      setEditingImage(null);
      setShowEditModal(false);
      fetchImages();
    } catch (error) {
      console.error('Failed to update image:', error);
    }
  };

  const executeImage = async () => {
    if (!selectedImage || !haxballToken.trim() || executing) return;
    
    setExecuting(true);
    try {
      const tokenToUse = haxballToken.trim();
      
      await axios.post(`/api/server-images/${selectedImage.id}/execute`, {
        token: tokenToUse
      }, {
        timeout: 60000
      });
      
      // Guardar token exitoso en localStorage
      localStorage.setItem('lastHaxballToken', tokenToUse);
      setLastUsedToken(tokenToUse);
      
      setHaxballToken('');
      setShowTokenModal(false);
      setSelectedImage(null);
      fetchImages();
    } catch (error) {
      console.error('Failed to execute image:', error);
    } finally {
      setExecuting(false);
    }
  };

  const deleteImage = async (id: string) => {
    try {
      await axios.delete(`/api/server-images/${id}`);
      setDeleteConfirm(null);
      fetchImages();
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const stopImage = async (id: string) => {
    try {
      await axios.post(`/api/server-images/${id}/stop`);
      fetchImages();
    } catch (error) {
      console.error('Failed to stop image:', error);
    }
  };

  const createImage = async () => {
    if (!newImageName.trim() || !newImageRuid.trim() || newRuidAvailable !== true) return;
    
    try {
      const response = await fetch('/api/server-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newImageName,
          description: '',
          config: {
            ruid: newImageRuid.trim(),
            _config: {
              roomName: '🟦🟦🟦 new miku server *in progress...* 🟦🟦🟦',
              playerName: '🤖',
              password: '',
              maxPlayers: 40,
              public: true,
              token: '',
              noPlayer: true
            },
            settings: {},
            rules: {}
          }
        })
      });

      if (response.ok) {
        setNewImageName('');
        setNewImageRuid('');
        setNewRuidAvailable(null);
        setShowCreateModal(false);
        fetchImages();
      }
    } catch (error) {
      console.error('Failed to create image:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Navigation */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <nav className="flex space-x-6">
              <a href="/server-images" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
                Server Images
              </a>
              <a href="/players" className="text-gray-600 hover:text-blue-600 font-medium pb-2">
                Players
              </a>
              <a href="/teams" className="text-gray-600 hover:text-blue-600 font-medium pb-2">
                Teams & Matches
              </a>
              <a href="/global-config" className="text-gray-600 hover:text-blue-600 font-medium pb-2">
                Global Config
              </a>
            </nav>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Server Images</h1>
                <p className="text-gray-600 mt-1">Manage your Haxball server configurations</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create Image
              </button>
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{image.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    image.status === 'running' ? 'bg-green-100 text-green-800' :
                    image.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {image.status === 'running' ? 'Running' :
                     image.status === 'error' ? 'Error' : 'Inactive'}
                  </span>
                </div>
                
                {image.description && (
                  <p className="text-gray-600 text-sm mb-4">{image.description}</p>
                )}
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Status: <span className="font-medium text-gray-900">{image.status}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                  {image.roomLink && (
                    <p className="text-sm text-blue-600">
                      <a href={image.roomLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        🎮 Join Room
                      </a>
                    </p>
                  )}
                  
                  {/* Debug Info */}
                  {image.status === 'running' && (
                    <div className="mt-3 p-2 bg-gray-50 rounded border text-xs">
                      <div className="font-medium text-gray-700 mb-1">🔍 Debug Info:</div>
                      <div className="space-y-1 text-gray-600">
                        <div>👥 Players: {typeof image.config === 'object' ? `0/${image.config._config?.maxPlayers || 'N/A'}` : 'N/A'}</div>
                        <div>🗺️ Map: {typeof image.config === 'object' ? image.config.rules?.defaultMapName || 'futx4' : 'N/A'}</div>
                        <div>🔒 Public: {typeof image.config === 'object' ? (image.config._config?.public ? 'Yes' : 'No') : 'N/A'}</div>
                        <div>⚖️ Balance: {typeof image.config === 'object' ? (image.config.settings?.balanceEnabled ? 'On' : 'Off') : 'N/A'}</div>
                        <div>🤖 Bot: {typeof image.config === 'object' ? image.config._config?.playerName || '🤖' : 'N/A'}</div>
                        <div className="mt-2">
                          <a 
                            href={`/players?ruid=${encodeURIComponent(image.ruid || '')}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            👥 View Players →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {image.status === 'inactive' && typeof image.config === 'object' && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border text-xs">
                      <div className="font-medium text-blue-700 mb-1">⚙️ Config Preview:</div>
                      <div className="space-y-1 text-blue-600">
                        <div>👥 Max Players: {image.config._config?.maxPlayers || 40}</div>
                        <div>🗺️ Default Map: {image.config.rules?.defaultMapName || 'futx4'}</div>
                        <div>🔒 Public Room: {image.config._config?.public ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}
                  
                  {image.status === 'error' && (
                    <div className="mt-3 p-2 bg-red-50 rounded border text-xs">
                      <div className="font-medium text-red-700 mb-1">❌ Error Info:</div>
                      <div className="text-red-600">
                        <div>Last attempt failed</div>
                        <div>Check server logs for details</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {image.status === 'inactive' || image.status === 'error' ? (
                    <button
                      onClick={() => {
                        setSelectedImage(image);
                        setShowTokenModal(true);
                      }}
                      disabled={executing}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      {executing && selectedImage?.id === image.id ? 'Starting...' : 'Start'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => stopImage(image.id)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        Stop
                      </button>
                      <a
                        href={`/players?ruid=${encodeURIComponent(image.ruid || '')}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center"
                      >
                        👥
                      </a>
                      <a
                        href={`/balance-debug?ruid=${encodeURIComponent(image.ruid || '')}`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center"
                        title="Balance Debug"
                      >
                        ⚖️
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => openEditModal(image)}
                    disabled={image.status === 'running'}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 py-2 rounded text-sm font-medium transition-colors"
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(image.id)}
                    disabled={image.status === 'running'}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🖼️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No server images yet</h3>
            <p className="text-gray-600 mb-4">Create your first server image to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Create First Image
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create Server Image</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Name</label>
              <input
                type="text"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Server Configuration"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">RUID (Room Unique ID)</label>
              <input
                type="text"
                value={newImageRuid}
                onChange={(e) => {
                  setNewImageRuid(e.target.value);
                  if (e.target.value.trim()) {
                    checkNewRuidAvailability(e.target.value.trim());
                  } else {
                    setNewRuidAvailable(null);
                  }
                }}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  newRuidAvailable === false ? 'border-red-300 focus:ring-red-500' :
                  newRuidAvailable === true ? 'border-green-300 focus:ring-green-500' :
                  'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="mi-servidor-unico"
              />
              {checkingNewRuid && (
                <p className="text-xs text-gray-500 mt-1">Verificando disponibilidad...</p>
              )}
              {newRuidAvailable === true && (
                <p className="text-xs text-green-600 mt-1">✅ RUID disponible</p>
              )}
              {newRuidAvailable === false && (
                <p className="text-xs text-red-600 mt-1">❌ RUID ya está en uso</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Identificador único para la sala (no se podrá cambiar después)
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewImageName('');
                  setNewImageRuid('');
                  setNewRuidAvailable(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createImage}
                disabled={!newImageName.trim() || !newImageRuid.trim() || newRuidAvailable !== true}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Modal */}
      {showTokenModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Execute Server Image</h2>
            <p className="text-gray-600 mb-4">
              Enter your Haxball token to execute <strong>{selectedImage.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Haxball Token</label>
              <input
                type="text"
                value={haxballToken}
                onChange={(e) => setHaxballToken(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={lastUsedToken || "thr1.AAAAAxxxxxxxxxxxxxxxxxxxxxxxxx"}
              />
              {lastUsedToken && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Último token: {lastUsedToken.substring(0, 15)}...
                  </p>
                  <button
                    type="button"
                    onClick={() => setHaxballToken(lastUsedToken)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Usar último
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Get your token from <a href="https://www.haxball.com/headlesstoken" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">haxball.com/headlesstoken</a>
              </p>
            </div>
            

            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setSelectedImage(null);
                  setHaxballToken('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeImage}
                disabled={!haxballToken.trim() || executing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {executing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Execute'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Edit Server Image</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image Name</label>
                  <input
                    type="text"
                    value={editingImage.name}
                    onChange={(e) => setEditingImage({ ...editingImage, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingImage.description || ''}
                    onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Server Configuration</label>
                  <ServerImageConfigForm
                    config={editingImage.config as ServerImageConfig}
                    onChange={(config) => setEditingImage({ ...editingImage, config })}
                    isEditing={true}
                    serverImageId={editingImage.id}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingImage(null);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateImage}
                  disabled={!editingImage.name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Server Image</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this server image? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteImage(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}