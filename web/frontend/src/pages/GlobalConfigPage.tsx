import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigation } from '../components/Navigation';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  levels: ('error' | 'warn' | 'critical')[];
  rateLimit: number;
  format: 'compact' | 'detailed';
  services?: string[];
}

export function GlobalConfigPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Form state for new/edit webhook
  const [formData, setFormData] = useState<Partial<WebhookConfig>>({
    name: '',
    url: '',
    enabled: true,
    levels: ['error', 'critical'],
    rateLimit: 5,
    format: 'compact',
    services: []
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await axios.get('/api/webhooks');
      setWebhooks(response.data.webhooks || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    try {
      await axios.post('/api/webhooks', formData);
      setShowCreateModal(false);
      resetForm();
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const updateWebhook = async () => {
    if (!editingWebhook) return;
    
    try {
      await axios.put(`/api/webhooks/${editingWebhook.id}`, formData);
      setEditingWebhook(null);
      resetForm();
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to update webhook:', error);
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      await axios.delete(`/api/webhooks/${id}`);
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const testWebhook = async (id: string) => {
    setTestingWebhook(id);
    try {
      await axios.post(`/api/webhooks/${id}/test`);
      alert('Test message sent successfully!');
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to send test message');
    } finally {
      setTestingWebhook(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      enabled: true,
      levels: ['error', 'critical'],
      rateLimit: 5,
      format: 'compact',
      services: []
    });
  };

  const openEditModal = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({ ...webhook });
  };

  const handleLevelChange = (level: string, checked: boolean) => {
    const currentLevels = formData.levels || [];
    if (checked) {
      setFormData({ ...formData, levels: [...currentLevels, level as any] });
    } else {
      setFormData({ ...formData, levels: currentLevels.filter(l => l !== level) });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Navigation */}
        <Navigation currentPage="global-config" />

        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Global Configuration</h1>
                <p className="text-gray-600 mt-1">Manage system-wide settings and webhooks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Error Webhooks</h2>
                <p className="text-gray-600 mt-1">Configure Discord webhooks for automatic error notifications</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Add Webhook
              </button>
            </div>
          </div>

          <div className="p-6">
            {webhooks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">🔗</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
                <p className="text-gray-600 mb-4">Add a Discord webhook to receive error notifications</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Add First Webhook
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{webhook.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            webhook.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {webhook.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {webhook.url.substring(0, 50)}...
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Levels: {webhook.levels.join(', ')}</span>
                          <span>Rate: {webhook.rateLimit}/min</span>
                          <span>Format: {webhook.format}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => testWebhook(webhook.id)}
                          disabled={testingWebhook === webhook.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          {testingWebhook === webhook.id ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => openEditModal(webhook)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteWebhook(webhook.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingWebhook) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Discord Errors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discord Webhook URL</label>
                <input
                  type="url"
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://discord.com/api/webhooks/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get webhook URL from Discord: Server Settings → Integrations → Webhooks
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (per minute)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.rateLimit || 5}
                    onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select
                    value={formData.format || 'compact'}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="compact">Compact</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Error Levels</label>
                <div className="space-y-2">
                  {['error', 'warn', 'critical'].map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.levels?.includes(level as any) || false}
                        onChange={(e) => handleLevelChange(level, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enabled || false}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable webhook</span>
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingWebhook(null);
                  resetForm();
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingWebhook ? updateWebhook : createWebhook}
                disabled={!formData.name?.trim() || !formData.url?.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
              >
                {editingWebhook ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}