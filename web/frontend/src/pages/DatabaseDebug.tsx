import { useState, useEffect } from 'react';
import { RefreshCw, Database, Users, Shield, Trophy, Webhook } from 'lucide-react';

interface DatabaseData {
  summary: Record<string, number>;
  tables: Record<string, any[]>;
  timestamp: string;
}

export default function DatabaseDebug() {
  const [data, setData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/database');
      if (!response.ok) throw new Error('Failed to fetch database data');
      const result = await response.json();
      setData(result);
      if (!activeTab && Object.keys(result.tables).length > 0) {
        setActiveTab(Object.keys(result.tables)[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTableIcon = (tableName: string) => {
    if (tableName.includes('player')) return <Users className="h-4 w-4" />;
    if (tableName.includes('sanction')) return <Shield className="h-4 w-4" />;
    if (tableName.includes('team') || tableName.includes('match')) return <Trophy className="h-4 w-4" />;
    if (tableName.includes('webhook')) return <Webhook className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const renderTable = (tableName: string, tableData: any[]) => {
    if (!tableData || tableData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data in {tableName}
        </div>
      );
    }

    const columns = Object.keys(tableData[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.slice(0, 50).map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof row[column] === 'object' && row[column] !== null
                      ? JSON.stringify(row[column])
                      : String(row[column] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {tableData.length > 50 && (
          <div className="text-center py-4 text-gray-500">
            Showing first 50 of {tableData.length} records
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <button 
              onClick={fetchData} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Database Debug</h1>
          <p className="text-gray-600">View all database tables and their data</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            {Object.entries(data.summary).map(([table, count]) => (
              <div key={table} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-2">
                  {getTableIcon(table)}
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {table.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Database Tables</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Last updated: {formatDate(data.timestamp)}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {Object.keys(data.tables).map((tableName) => (
                    <button
                      key={tableName}
                      onClick={() => setActiveTab(tableName)}
                      className={`px-3 py-2 text-xs rounded flex items-center space-x-1 ${
                        activeTab === tableName
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getTableIcon(tableName)}
                      <span className="hidden sm:inline">
                        {tableName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {Object.entries(data.tables).map(([tableName, tableData]) => (
                activeTab === tableName && (
                  <div key={tableName}>
                    <div className="bg-white rounded-lg border">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getTableIcon(tableName)}
                            <span className="font-semibold">{tableName}</span>
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {tableData.length} records
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        {renderTable(tableName, tableData)}
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading database data...</span>
        </div>
      )}
    </div>
  );
}