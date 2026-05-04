import { formatDistance, format } from 'date-fns';

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  return format(new Date(date), formatStr);
};

export const formatDateRelative = (date) => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

export const maskApiKey = (key) => {
  if (!key || key.length < 8) return key;
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    revoked: 'bg-red-100 text-red-800',
    expired: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const calculatePercentage = (current, total) => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

export const getDaysLeft = (endDate) => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
