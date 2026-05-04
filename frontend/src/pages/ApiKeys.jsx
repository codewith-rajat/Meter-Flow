import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import { formatDateRelative, maskApiKey, copyToClipboard, getStatusColor } from '../utils/helpers';
import { Copy, Trash2, RotateCw, Plus, Loader, Check, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function ApiKeys() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', environment: 'dev' });
  const [message, setMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiService.getKeys
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiService.createKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setFormData({ name: '', environment: 'dev' });
      setShowForm(false);
      setMessage({ type: 'success', text: 'API key created successfully!' });
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.error || 'Failed to create API key' });
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => apiService.revokeKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setMessage({ type: 'success', text: 'API key revoked successfully!' });
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.error || 'Failed to revoke API key' });
    }
  });

  const rotateMutation = useMutation({
    mutationFn: (id) => apiService.rotateKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setMessage({ type: 'success', text: 'API key rotated successfully!' });
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.error || 'Failed to rotate API key' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted with:", formData);
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Key Name is required' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCopy = async (key) => {
    const success = await copyToClipboard(key);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
            <p className="text-gray-600">Manage your API keys</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Key
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg flex gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="text-green-600 flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Create New API Key</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Production API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="dev">Development</option>
                  <option value="prod">Production</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending ? <Loader className="animate-spin" size={18} /> : null}
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-primary-600" size={40} />
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No API keys yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Create your first key
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {keys.map((key) => (
              <div key={key._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                    <p className="text-sm text-gray-600">
                      Created {formatDateRelative(key.createdAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(key.status)}`}>
                    {key.status}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4 flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-800">
                    {maskApiKey(key.key)}
                  </code>
                  <button
                    onClick={() => handleCopy(key.key)}
                    className="text-primary-600 hover:text-primary-700 transition"
                  >
                    {copiedKey === key.key ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Environment</p>
                    <p className="font-medium">{key.metadata?.environment || 'dev'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rate Limit</p>
                    <p className="font-medium">{key.rateLimit || 'Unlimited'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Used</p>
                    <p className="font-medium">
                      {key.lastUsed ? formatDateRelative(key.lastUsed) : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Requests</p>
                    <p className="font-medium">{key.requestCount || 0}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => rotateMutation.mutate(key._id)}
                    disabled={rotateMutation.isPending || key.status !== 'active'}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                  >
                    <RotateCw size={16} />
                    Rotate
                  </button>
                  <button
                    onClick={() => revokeMutation.mutate(key._id)}
                    disabled={revokeMutation.isPending || key.status !== 'active'}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
