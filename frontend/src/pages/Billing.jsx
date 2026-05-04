import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { billingService } from '../services/api';
import { formatCurrency, formatDate, formatNumber } from '../utils/helpers';
import { Download, Loader, Eye, Plus, CreditCard, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function Billing() {
  const queryClient = useQueryClient();

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvc: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // ✅ FIX: aggressive refetch + no stale cache
  const { data: billing, isLoading: billingLoading, refetch: refetchBilling } = useQuery({
    queryKey: ['billing'],
    queryFn: billingService.getBilling,
    refetchInterval: 3000,
    staleTime: 0,
    cacheTime: 0
  });

  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['billing-history'],
    queryFn: () => billingService.getBillingHistory(12),
    staleTime: 0
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => billingService.generateInvoice({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['billing-history']);
      refetchHistory();
    }
  });

  // ✅ FIX: payment handler with instant UI sync
  const handlePayment = async () => {
    setPaymentLoading(true);

    try {
      const response = await fetch('http://localhost:5000/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          invoiceId: selectedInvoice._id,
          amount: selectedInvoice.amount
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Payment successful!');

        // 🔥 IMPORTANT FIXES
        await queryClient.invalidateQueries(['billing']);
        await queryClient.invalidateQueries(['billing-history']);

        await refetchBilling();
        await refetchHistory();

        // close modal
        setShowPaymentForm(false);
        setSelectedInvoice(null);
      } else {
        alert('❌ Payment failed: ' + (data.error || data.message));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (billingLoading) {
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

        {/* HEADER - Beautiful gradient card */}
        <div className="bg-primary-600 rounded-2xl shadow-2xl p-8 text-white overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">💳 Billing</h1>
              <p className="text-blue-100 text-lg">Track your API usage & payments</p>
            </div>

            <button
              onClick={() => {
                queryClient.invalidateQueries(['billing']);
                refetchBilling();
              }}
              className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition"
              title="Refresh data"
            >
              <RefreshCw size={24} />
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-8 pt-8 border-t border-blue-300 border-opacity-30 grid grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm uppercase tracking-wider">This Month</p>
              <p className="text-5xl font-bold mt-2">{formatNumber(billing?.totalRequests || 0)}</p>
              <p className="text-blue-200 text-sm mt-1">requests</p>
            </div>
            
            <div>
              <p className="text-blue-100 text-sm uppercase tracking-wider">Free Tier</p>
              <p className="text-4xl font-bold mt-2 text-yellow-300">{formatNumber(billing?.freeRequests || 0)}</p>
              <p className="text-blue-200 text-sm mt-1">no charge</p>
            </div>
            
            <div>
              <p className="text-blue-100 text-sm uppercase tracking-wider">Amount Due</p>
              {(billing?.amount || 0) === 0 ? (
                <>
                  <p className="text-5xl font-bold mt-2 text-yellow-300">$0.00</p>
                </>
              ) : (
                <>
                  <p className="text-5xl font-bold mt-2 text-yellow-300">${(billing?.amount || 0).toFixed(2)}</p>
                  <p className="text-blue-200 text-sm mt-1">this month</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        {billing?.totalRequests > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pie Chart - Request Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">📊 Request Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Free Tier', value: billing?.freeRequests || 0, fill: '#10b981' },
                      { name: 'Billable', value: billing?.paidRequests || 0, fill: '#f59e0b' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent }) => `${name}: ${formatNumber(value)} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Usage by API */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">🔌 Usage by API</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={billing?.apis || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="apiName" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => formatNumber(value)}
                  />
                  <Legend />
                  <Bar dataKey="requests" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Total Requests" />
                  <Bar dataKey="paidRequests" fill="#ef4444" radius={[8, 8, 0, 0]} name="Paid Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
            <p className="text-2xl text-gray-400 mb-2">📭 No API usage yet</p>
            <p className="text-gray-500">Start making API requests to see usage analytics here</p>
          </div>
        )}

        {/* USAGE BREAKDOWN TABLE */}
        {billing?.apis && billing.apis.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">📋 API Usage Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">API Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Plan</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total Requests</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Free Requests</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Paid Requests</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.apis.map((api, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{api.apiName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {api.plan || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700 font-medium">{formatNumber(api.requests || 0)}</td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">{formatNumber(api.freeRequests || 0)}</td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">{formatNumber(api.paidRequests || 0)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 font-bold">${(api.amount || 0).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVOICES */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">📄 Invoice History</h2>

            <button
              onClick={() => generateInvoiceMutation.mutate()}
              disabled={generateInvoiceMutation.isPending || (billing?.amount || 0) === 0}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={(billing?.amount || 0) === 0 ? "No unpaid amount. Invoice already paid or no usage." : "Generate invoice for current month"}
            >
              <Plus size={18} /> Generate Invoice
            </button>
          </div>

          {history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((invoice) => (
                <div key={invoice._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">{formatDate(invoice.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status?.toUpperCase()}
                    </span>
                    <p className="font-bold text-gray-900 w-24 text-right">{formatCurrency(invoice.amount)}</p>
                    <button 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No invoices yet</p>
          )}
        </div>

        {/* MODAL */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl w-[500px] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-primary-500 p-6 text-white">
                <h2 className="text-2xl font-bold">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-white text-sm mt-1">Amount Due: {formatCurrency(selectedInvoice.amount)}</p>
              </div>

              <div className="p-8">
                {/* Invoice Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Amount</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedInvoice.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Status</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                        selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedInvoice.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Form */}
                {selectedInvoice.status !== 'paid' ? (
                  <>
                    {!showPaymentForm ? (
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="w-full bg-primary-500 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <CreditCard size={20} /> Pay Now
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Card Number</label>
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            maxLength="19"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={cardDetails.cardNumber}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\s/g, '');
                              value = value.replace(/(\d{4})/g, '$1 ').trim();
                              setCardDetails({ ...cardDetails, cardNumber: value });
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-1">Demo: Use any 16 digits</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              placeholder="12/25"
                              maxLength="5"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={cardDetails.expiry}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                }
                                setCardDetails({ ...cardDetails, expiry: value });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">CVC</label>
                            <input
                              type="password"
                              placeholder="123"
                              maxLength="4"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={cardDetails.cvc}
                              onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/\D/g, '') })}
                            />
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                          <p className="text-xs text-blue-800">
                            💳 <strong>Demo Mode:</strong> Use any valid card format. No real charges will be made.
                          </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => setShowPaymentForm(false)}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handlePayment}
                            disabled={paymentLoading || !cardDetails.cardNumber || !cardDetails.expiry || !cardDetails.cvc}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {paymentLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </span>
                            ) : (
                              'Confirm Payment'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-semibold">✅ Invoice Paid</p>
                    <p className="text-green-700 text-sm mt-1">Thank you for your payment!</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedInvoice(null);
                    setShowPaymentForm(false);
                  }}
                  className="w-full mt-6 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}