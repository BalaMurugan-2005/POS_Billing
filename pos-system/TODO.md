# Fix Plan for API Errors

## Tasks:
- [x] 1. Fix Transaction 409 Conflict - Change transaction number generation from timestamp to UUID
- [x] 2. Fix PaymentRequest 409 Conflict - Change requestId generation from timestamp to UUID  
- [x] 3. Fix Frontend Toast Error - Replace toast.info with toast() in CartContext
- [x] 4. Customer 404 - This is expected behavior (fallback already works)

## Implementation:

### 1. Transaction.java - Fixed transactionNumber generation to use UUID
### 2. TransactionService.java - Fixed transactionNumber generation to use UUID  
### 3. PaymentRequest.java - Fixed requestId generation to use UUID
### 4. CartContext.jsx - Replaced toast.info with toast() 
### 5. vite.config.js - Added react-hot-toast to separate chunk for better handling

