import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Navigation } from '../components/Navigation';

export function AgentDebugReportPage() {
  const [report, setReport] = useState('');
  const [ruid, setRuid] = useState('');
  const [lines, setLines] = useState(40);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (ruid.trim()) params.set('ruid', ruid.trim());
      params.set('lines', String(lines));
      const url = `/api/debug/report?${params.toString()}`;
      const response = await axios.get(url, { responseType: 'text' });
      setReport(typeof response.data === 'string' ? response.data : String(response.data));
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load report');
      setReport('');
    } finally {
      setLoading(false);
    }
  }, [ruid, lines]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const copyReport = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const alertCount = (report.match(/\[FAIL\]/g) || []).length;
  const warnCount = (report.match(/\[WARN\]/g) || []).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <Navigation currentPage="debug" />

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">Agent Debug Report</h1>
          <p className="text-gray-600 mt-1">
            Texto plano para agentes — buscá <code className="bg-gray-100 px-1 rounded">@SECTION</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">[FAIL]</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">[WARN]</code>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            API: <code className="bg-gray-100 px-1 rounded">GET /api/debug/report?ruid=...&amp;lines=40</code>
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ruid (opcional)</label>
            <input
              type="text"
              value={ruid}
              onChange={(e) => setRuid(e.target.value)}
              placeholder="auto = imagen running"
              className="border rounded px-3 py-2 w-48"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">líneas de log</label>
            <input
              type="number"
              min={10}
              max={200}
              value={lines}
              onChange={(e) => setLines(Number(e.target.value) || 40)}
              className="border rounded px-3 py-2 w-24"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded"
          >
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
          <button
            onClick={copyReport}
            disabled={!report}
            className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white px-4 py-2 rounded"
          >
            {copied ? 'Copiado' : 'Copiar todo'}
          </button>
          {report && (
            <span className="text-sm text-gray-600 ml-auto">
              {alertCount > 0 && <span className="text-red-600 font-medium mr-3">{alertCount} FAIL</span>}
              {warnCount > 0 && <span className="text-amber-600 font-medium">{warnCount} WARN</span>}
              {alertCount === 0 && warnCount === 0 && (
                <span className="text-green-600 font-medium">Sin alertas críticas</span>
              )}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">{error}</div>
        )}

        <div className="bg-gray-900 shadow rounded-lg p-4 overflow-auto max-h-[70vh]">
          <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-words">
            {report || (loading ? 'Generando reporte…' : 'Sin datos')}
          </pre>
        </div>
      </div>
    </div>
  );
}
