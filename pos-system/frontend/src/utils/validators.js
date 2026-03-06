export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^\+?[\d\s-]{10,}$/;
  return re.test(phone);
};

export const validateBarcode = (barcode) => {
  // EAN-13 or UPC format
  const re = /^\d{8,13}$/;
  return re.test(barcode);
};

export const validatePrice = (price) => {
  return !isNaN(price) && price >= 0;
};

export const validateQuantity = (quantity) => {
  return Number.isInteger(quantity) && quantity >= 0;
};

export const validateWeight = (weight) => {
  return !isNaN(weight) && weight > 0;
};

export const validateTransaction = (transaction) => {
  const errors = [];

  if (!transaction.items || transaction.items.length === 0) {
    errors.push('Transaction must have at least one item');
  }

  if (!validatePrice(transaction.total)) {
    errors.push('Invalid total amount');
  }

  if (!transaction.paymentMethod) {
    errors.push('Payment method is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};