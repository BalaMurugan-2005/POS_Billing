import api from './api';

export const paymentRequestService = {
    createRequest: async (customerId, amount, method) => {
        const response = await api.post('/payment-requests', {
            customerId,
            amount,
            method
        });
        return response.data;
    },

    getActiveRequests: async (customerId) => {
        const response = await api.get(`/payment-requests/active/${customerId}`);
        return response.data;
    },

    updateStatus: async (requestId, status) => {
        const response = await api.post(`/payment-requests/${requestId}/status`, {
            status
        });
        return response.data;
    },

    waitForPayment: async (requestId) => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const response = await api.get(`/payment-requests/${requestId}`);
                    if (response.data.status === 'COMPLETED') {
                        clearInterval(interval);
                        resolve(response.data);
                    } else if (response.data.status === 'DECLINED') {
                        clearInterval(interval);
                        reject(new Error('Payment declined by customer'));
                    }
                } catch (e) {
                    // Keep polling unless explicit failure or timeout
                }
            }, 2000);

            // Auto-timeout after 5 minutes
            const timeout = setTimeout(() => {
                clearInterval(interval);
                reject(new Error('Payment request timed out'));
            }, 300000);

            // Store timeout on the promise to clear if needed (optional)
        });
    }
};
