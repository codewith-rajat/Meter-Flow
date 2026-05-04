import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ApiKeys from './pages/ApiKeys';
import APIs from './pages/APIs';
import Billing from './pages/Billing';
import Testing from './pages/Testing';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1
    }
  }
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apis"
              element={
                <ProtectedRoute>
                  <APIs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/keys"
              element={
                <ProtectedRoute>
                  <ApiKeys />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/testing"
              element={
                <ProtectedRoute>
                  <Testing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
