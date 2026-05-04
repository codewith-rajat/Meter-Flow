import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import { formatDateRelative, formatNumber } from '../utils/helpers';
import { Plus, Trash2, Edit, Loader, AlertCircle, Check } from 'lucide-react';

export default function APIs() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseUrl: '',
    plan: 'free'
  });
  const [message, setMessage] = useState('');

  const { data: apis = [], isLoading } = useQuery({
    queryKey: ['apis'],
    queryFn: apiService.getAPIs
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiService.createAPI(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      setFormData({ name: '', description: '', baseUrl: '', plan: 'free' });
      setShowForm(false);
      setMessage({ type: 'success', text: 'API created successfully!' });
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.error || 'Failed to create API' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiService.updateAPI(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      setFormData({ name: '', description: '', baseUrl: '', plan: 'free' });
      setEditingId(null);
      setShowForm(false);
      setMessage({ type: 'success', text: 'API updated successfully!' });
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.error || 'Failed to update API' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiService.deleteAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
      setMessage({ type: 'success', text: 'API deleted successfully!' });
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.error || 'Failed to delete API' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (api) => {
    setEditingId(api._id);
    setFormData({
      name: api.name,
      description: api.description || '',
      baseUrl: api.baseUrl,
      plan: api.plan
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', baseUrl: '', plan: 'free' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">APIs</h1>
            <p className="text-gray-600">Manage your APIs and access them through the gateway</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create API
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
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit API' : 'Create New API'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="My API"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="API description"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="https://api.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader className="animate-spin" size={18} />
                  ) : null}
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
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
        ) : apis.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No APIs yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Create your first API
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apis.map((api) => (
              <div key={api._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{api.name}</h3>
                    <p className="text-sm text-gray-600">{api.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                    {api.plan}
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-xs text-gray-600">Base URL</p>
                  <p className="text-sm font-mono text-gray-800 truncate">{api.baseUrl}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Requests</p>
                    <p className="font-semibold">{formatNumber(api.totalRequests || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Billed</p>
                    <p className="font-semibold">${(api.totalBilled || 0).toFixed(2)}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Created {formatDateRelative(api.createdAt)}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(api)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(api._id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Delete
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
