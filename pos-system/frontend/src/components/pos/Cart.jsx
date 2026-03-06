import React from 'react';
import { useCart } from '../../hooks/useCart';
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = ({ onCheckout }) => {
  const { cart, updateQuantity, removeItem } = useCart();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Current Cart</h2>
          {cart.customer && (
            <div className="text-right">
              <span className="text-sm font-medium text-primary-600 block">
                {cart.customer.name || cart.customer.email}
              </span>
              <span className="text-xs text-gray-500">
                #{cart.customer.loyaltyNumber || 'Member'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {cart.items.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
              No items in cart
            </p>
          ) : (
            cart.items.map((item) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ${item.price.toFixed(2)}
                    {item.weight && ` • ${item.weight}kg`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>

                  <span className="w-8 text-center">{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded ml-2"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>${cart.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax:</span>
            <span>${cart.tax.toFixed(2)}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span>-${cart.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={cart.items.length === 0}
          className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;