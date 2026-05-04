import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { apiService } from '../services/api';
import { Loader, Play, Copy, Check } from 'lucide-react';

export default function Testing() {
  const [apiName, setApiName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [numRequests, setNumRequests] = useState('20');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Fetch APIs
  const { data: apis = [] } = useQuery({
    queryKey: ['apis'],
    queryFn: () => apiService.getAPIs()
  });

  // Fetch API Keys
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => apiService.getKeys()
  });

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!apiName || !apiKey || !numRequests) {
      alert('❌ Please fill all fields');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem("token");
      console.log("TOKEN:", token); // 🔥 debug

      const response = await fetch('http://localhost:5000/test/gateway-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          apiName,
          apiKey,
          numRequests: parseInt(numRequests)
        })
      });

      // 🔥 SAFE PARSING (fix for "<!DOCTYPE" error)
      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("❌ Not JSON response:", text);
        alert("❌ Backend returned HTML. Check console.");
        return;
      }

      // 🔥 Handle API error response
      if (!response.ok) {
        alert(`❌ Error: ${data.error || "Request failed"}`);
        return;
      }

      setResults(data);

      if (data.success) {
        alert(`✅ Sent ${data.totalRequests} requests successfully!`);
      } else {
        alert('⚠️ Some requests failed.');
      }

    } catch (error) {
      console.error(error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gateway Testing</h1>
          <p className="text-gray-600 mt-2">
            Send test requests to your API and generate usage data
          </p>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* API Name */}
            <div>
              <label className="block text-sm font-medium mb-2">API Name</label>
              <select
                value={apiName}
                onChange={(e) => setApiName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select API --</option>
                {apis.map((api) => (
                  <option key={api._id} value={api.name}>
                    {api.name} ({api.plan})
                  </option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <select
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select API Key --</option>
                {apiKeys.map((key) => (
                  <option key={key._id} value={key.key}>
                    {key.name} ({key.key?.substring(0, 10)}...)
                  </option>
                ))}
              </select>
            </div>

            {/* Requests */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Requests
              </label>
              <input
                type="number"
                value={numRequests}
                onChange={(e) => setNumRequests(e.target.value)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-2 rounded-lg flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Send Test Requests
                </>
              )}
            </button>
          </form>
        </div>

        {/* RESULTS */}
        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 text-center">
                <p>Requests</p>
                <p className="text-xl font-bold">{results.totalRequests}</p>
              </div>

              <div className="bg-blue-50 p-4 text-center">
                <p>Free Used</p>
                <p className="text-xl font-bold">{results.freeAdded}</p>
              </div>

              <div className="bg-red-50 p-4 text-center">
                <p>Paid Used</p>
                <p className="text-xl font-bold">{results.paidAdded}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              💡 Refresh Billing page to see updated usage
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}