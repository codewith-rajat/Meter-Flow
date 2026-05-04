import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, billingService, analyticsService } from '../services/api';

// Custom hook for API key operations
export const useApiKeys = () => {
  const queryClient = useQueryClient();

  const keys = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiService.getKeys
  });

  const createKey = useMutation({
    mutationFn: (data) => apiService.createKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const revokeKey = useMutation({
    mutationFn: (id) => apiService.revokeKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const rotateKey = useMutation({
    mutationFn: (id) => apiService.rotateKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  return { keys, createKey, revokeKey, rotateKey };
};

// Custom hook for API management
export const useAPIs = () => {
  const queryClient = useQueryClient();

  const apis = useQuery({
    queryKey: ['apis'],
    queryFn: apiService.getAPIs
  });

  const createAPI = useMutation({
    mutationFn: (data) => apiService.createAPI(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
    }
  });

  const updateAPI = useMutation({
    mutationFn: ({ id, data }) => apiService.updateAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
    }
  });

  const deleteAPI = useMutation({
    mutationFn: (id) => apiService.deleteAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis'] });
    }
  });

  return { apis, createAPI, updateAPI, deleteAPI };
};

// Custom hook for billing
export const useBilling = () => {
  const billing = useQuery({
    queryKey: ['billing'],
    queryFn: billingService.getBilling
  });

  const history = useQuery({
    queryKey: ['billing-history'],
    queryFn: () => billingService.getBillingHistory(12)
  });

  const stats = useQuery({
    queryKey: ['billing-stats'],
    queryFn: billingService.getUsageStats
  });

  return { billing, history, stats };
};

// Custom hook for analytics
export const useAnalytics = () => {
  const dashboard = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: analyticsService.getDashboard
  });

  const detailed = useQuery({
    queryKey: ['analytics-detailed'],
    queryFn: () => analyticsService.getDetailedAnalytics(30, 'day')
  });

  return { dashboard, detailed };
};
