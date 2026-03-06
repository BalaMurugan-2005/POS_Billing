import { format } from 'date-fns';

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  return format(new Date(date), formatStr);
};

export const calculateTax = (amount, taxRate) => {
  return (amount * taxRate) / 100;
};

export const calculateDiscount = (amount, discount) => {
  if (discount.type === 'percentage') {
    return (amount * discount.value) / 100;
  }
  return discount.value;
};

export const generateReceiptNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `RCP-${timestamp}-${random}`.toUpperCase();
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, order = 'asc') => {
  return array.sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};