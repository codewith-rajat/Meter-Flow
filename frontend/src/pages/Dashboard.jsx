import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { analyticsService } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/helpers';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Zap, DollarSign, Loader } from 'lucide-react';

export default function Dashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.getDashboard()
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader className="animate-spin text-primary-600" size={40} />
        </div>
      </Layout>
    );
  }

  const stats = dashboard?.stats || { totalRequests: 0, avgLatency: 0, errorRate: 0, requestsByDay: [] };
  const topEndpoints = dashboard?.topEndpoints || [];
  const statusDistribution = dashboard?.statusDistribution || [];
  const peakTimes = dashboard?.peakTimes || [];
  
  // Ensure requestsByDay is always an array
  const requestsByDay = stats?.requestsByDay || [];

  const StatCard = ({ icon: Icon, label, value, color = 'blue', bgGradient, textColor }) => (
    <div className={`rounded-xl shadow-lg p-6 flex items-start gap-4 border border-gray-100 ${bgGradient}`}>
      <div className={`p-3 rounded-lg ${color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : color === 'purple' ? 'bg-purple-100' : 'bg-yellow-100'}`}>
        <Icon className={`${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'purple' ? 'text-purple-600' : 'text-yellow-600'}`} size={24} />
      </div>
      <div className="flex-1">
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-2 ${textColor || 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back! Here's your API usage overview at a glance.</p>
        </div>

        {/* Stats Cards - Enhanced Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Zap}
            label="Total Requests"
            value={formatNumber(stats.totalRequests || 0)}
            color="blue"
            bgGradient="bg-gradient-to-br from-blue-50 to-white"
            textColor="text-primary-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Latency"
            value={`${(stats.avgLatency || 0).toFixed(0)}ms`}
            color="green"
            bgGradient="bg-gradient-to-br from-green-50 to-white"
            textColor="text-green-600"
          />
          <StatCard
            icon={Users}
            label="Error Rate"
            value={`${(stats.errorRate || 0).toFixed(1)}%`}
            color="purple"
            bgGradient="bg-gradient-to-br from-purple-50 to-white"
            textColor="text-purple-600"
          />
          <StatCard
            icon={Zap}
            label="Active APIs"
            value={dashboard?.stats?.activeApis || 0}
            color="yellow"
            bgGradient="bg-gradient-to-br from-yellow-50 to-white"
            textColor="text-yellow-600"
          />
        </div>

        {/* Charts Grid - Enhanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests by Day - Line Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded"></div>
              <h2 className="text-xl font-bold text-gray-900">📈 Requests Trend</h2>
            </div>
            {requestsByDay && requestsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={requestsByDay} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [formatNumber(value), 'Requests']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ fill: '#0ea5e9', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Requests"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>📭 No request data available yet</p>
              </div>
            )}
          </div>

          {/* Status Code Distribution - Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded"></div>
              <h2 className="text-xl font-bold text-gray-900">🎯 Response Status</h2>
            </div>
            {statusDistribution && statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    nameKey="statusCode"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ statusCode, count, percent }) => `${statusCode}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.statusCode >= 200 && entry.statusCode < 300
                            ? '#10b981'
                            : entry.statusCode >= 300 && entry.statusCode < 400
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [formatNumber(value), 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>📭 No status data available yet</p>
              </div>
            )}
          </div>

          {/* Top Endpoints - Horizontal Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-violet-600 rounded"></div>
              <h2 className="text-xl font-bold text-gray-900">🔝 Top Endpoints</h2>
            </div>
            {topEndpoints && topEndpoints.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEndpoints} layout="vertical" margin={{ top: 5, right: 30, left: 12, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis dataKey="_id" type="category" width={110} fontSize={11} stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [formatNumber(value), 'Requests']}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>📭 No endpoint data available yet</p>
              </div>
            )}
          </div>

          {/* Peak Usage Times - Area Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded"></div>
              <h2 className="text-xl font-bold text-gray-900">⏰ Peak Usage Hours</h2>
            </div>
            {peakTimes && peakTimes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakTimes} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="hour" 
                    label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
                    stroke="#9ca3af"
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [formatNumber(value), 'Requests']}
                  />
                  <Bar dataKey="requests" fill="#f97316" radius={[8, 8, 0, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <p>📭 No peak time data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
