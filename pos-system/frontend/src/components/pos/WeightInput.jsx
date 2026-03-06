import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { ScaleIcon } from '@heroicons/react/24/outline';

const WeightInput = ({ isOpen, onClose, product, onSubmit }) => {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('kg');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (weight && !isNaN(weight) && weight > 0) {
      onSubmit({
        weight: parseFloat(weight),
        unit,
        totalPrice: product.pricePerKg * parseFloat(weight)
      });
      onClose();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <ScaleIcon className="w-8 h-8 text-primary-500" />
              <Dialog.Title className="text-xl font-bold">
                Enter Weight
              </Dialog.Title>
            </div>

            <div className="mb-6">
              <p className="text-lg font-semibold mb-2">{product.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Price: ${product.pricePerKg.toFixed(2)} per kg
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Weight
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    step="0.01"
                    min="0.01"
                    className="input-primary flex-1"
                    placeholder="0.00"
                    autoFocus
                    required
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="input-primary w-24"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>

              {weight && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Price:
                  </p>
                  <p className="text-2xl font-bold text-primary-600">
                    ${(product.pricePerKg * parseFloat(weight)).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={!weight || parseFloat(weight) <= 0}
                >
                  Add to Cart
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default WeightInput;