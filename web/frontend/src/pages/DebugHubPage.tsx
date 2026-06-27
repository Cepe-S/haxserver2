import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigation } from '../components/Navigation';

interface LogFileInfo {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
}

interface EventListenerInfo {
  name: string;
  listenerCount: number;
}

export function DebugHubPage() {
  const [logs, setLogs] = useState<LogFileInfo[]>([]);
  const [logDir, setLogDir] = useState('');
  const [ruid, setRuid] = useState('');
  const [events, setEvents] = useState<EventListenerInfo[]>([]);
  const [statsDebug, setStatsDebug] = useState<any>(null);
  const [matchLog, setMatchLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/debug/logs/list');
      setLogs(response.data.files || []);
      setLogDir(response.data.directory || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to list logs');
    }
  };

  const fetchRuntimeDebug = async (targetRuid: string) => {
    if (!targetRuid.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, statsRes, matchRes] = await Promise.all([
        axios.get(`/api/rooms/${encodeURIComponent(targetRuid)}/events`),
        axios.get(`/api/rooms/${encodeURIComponent(targetRuid)}/stats-debug`),
        axios.get('/api/debug/match-log')
      ]);
      setEvents(eventsRes.data?.eventSystem?.events || []);
      setStatsDebug(statsRes.data);
      setMatchLog(matchRes.data?.entries || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load runtime debug (is the room running?)');
      setEvents([]);
      setStatsDebug(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const downloadAllLogs = () => {
    window.location.href = '/api/debug/logs/download';
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <Navigation currentPage="debug" />

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">Debug Hub</h1>
          <p className="text-gray-600 mt-1">Observabilidad del servidor — logs, loops, eventos y stats</p>
          <a
            href="/debug/report"
            className="inline-block mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            → Agent Debug Report (texto para deploys)
          </a>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Logs del sistema</h2>
          <p className="text-sm text-gray-500 mb-4">Directorio: <code className="bg-gray-100 px-1 rounded">{logDir || '…'}</code></p>
          <button
            onClick={downloadAllLogs}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Descargar todos los logs (.zip)
          </button>
          <button onClick={fetchLogs} className="ml-3 bg-gray-200 hover:bg-gray-300 px-4 py-3 rounded-lg text-sm">
            Actualizar lista
          </button>
          {logs.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {logs.map((file) => (
                <li key={file.name} className="flex justify-between border-b py-1">
                  <span className="font-mono">{file.name}</span>
                  <span>{formatBytes(file.sizeBytes)} · {new Date(file.modifiedAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Enlaces rápidos</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/balance-debug" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">GameLoop / Balance</a>
            <a href="/database-debug" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Database Debug</a>
            <a href="/server-images" className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">Server Images</a>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Runtime por sala (ruid)</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={ruid}
              onChange={(e) => setRuid(e.target.value)}
              placeholder="ej. pito"
              className="border rounded-lg px-3 py-2 flex-1"
            />
            <button
              onClick={() => fetchRuntimeDebug(ruid)}
              disabled={loading || !ruid.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {loading ? 'Cargando…' : 'Cargar'}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          {events.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">EventBus listeners</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {events.map((ev) => (
                  <div key={ev.name} className="flex justify-between bg-gray-50 p-2 rounded">
                    <span className="font-mono truncate">{ev.name}</span>
                    <span className="font-bold">{ev.listenerCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {statsDebug && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Match stats</h3>
              <p className="text-sm">Partido activo: <strong>{statsDebug.isMatchActive ? 'Sí' : 'No'}</strong></p>
              <p className="text-sm">Jugadores mapeados: {statsDebug.mapping?.length ?? 0}</p>
              {statsDebug.mapping?.length > 0 && (
                <ul className="mt-2 text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
                  {statsDebug.mapping.map((m: any) => (
                    <li key={m.haxballId}>{m.playerName} #{m.haxballId} → {m.identityId}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {matchLog.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Match log (reciente)</h3>
              <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                {matchLog.map((entry, i) => (
                  <li key={i} className="bg-gray-50 p-2 rounded">
                    <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    {' '}<strong>{entry.action}</strong> — {entry.playerName}: {entry.details}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
