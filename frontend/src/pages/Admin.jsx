import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { adminService } from '../services/api';
import { formatCurrency, formatNumber, formatDate } from '../utils/helpers';
import { Users, BarChart3, TrendingUp, Loader } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Admin() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getSystemStats
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminService.getRevenueStats(12)
  });

  if (statsLoading || revenueLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-primary-600" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats?.users?.total || 0)}</p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats?.requests?.total || 0)}</p>
              </div>
              <BarChart3 className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(revenue?.total || 0)}</p>
              </div>
              <TrendingUp className="text-purple-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active API Keys</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats?.apiKeys?.active || 0)}</p>
              </div>
              <Users className="text-yellow-600" size={32} />
            </div>
          </div>
        </div>

        {/* User Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Admins</span>
                  <span className="font-semibold">{stats?.users?.admins || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((stats?.users?.admins || 0) / (stats?.users?.total || 1)) * 100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">API Owners</span>
                  <span className="font-semibold">{stats?.users?.owners || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((stats?.users?.owners || 0) / (stats?.users?.total || 1)) * 100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Consumers</span>
                  <span className="font-semibold">{stats?.users?.consumers || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((stats?.users?.consumers || 0) / (stats?.users?.total || 1)) * 100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-800">Paid Invoices</span>
                <span className="font-semibold text-green-900">{formatCurrency(stats?.billing?.totalPaid || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-800">Pending Invoices</span>
                <span className="font-semibold text-yellow-900">{stats?.billing?.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-800">Unpaid Invoices</span>
                <span className="font-semibold text-red-900">{stats?.billing?.unpaid || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend (Last 12 Months)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenue?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                name="Revenue"
                dot={{ fill: '#8b5cf6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Request Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Requests (Today)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">Total Requests Today</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{formatNumber(stats?.requests?.today || 0)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 text-sm">Active API Keys</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{formatNumber(stats?.apiKeys?.active || 0)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-800 text-sm">Total APIs</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{formatNumber(stats?.apiKeys?.active || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
