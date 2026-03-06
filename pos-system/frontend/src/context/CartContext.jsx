import React, { createContext, useState, useEffect } from 'react';
import { offlineService } from '../services/offlineService';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    customer: null,
    paymentMethod: null,
    paidAmount: 0,
    change: 0
  });

  useEffect(() => {
    loadSavedCart();
  }, []);

  const loadSavedCart = async () => {
    const savedCart = await offlineService.getCart();
    if (savedCart) {
      setCart(savedCart);
    }
  };

  const calculateTotals = (items, discount = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = items.reduce((sum, item) => {
      const itemTax = item.taxRate ? (item.price * item.quantity * item.taxRate) / 100 : 0;
      return sum + itemTax;
    }, 0);
    const total = subtotal + tax - discount;

    return { subtotal, tax, total };
  };

  const addItem = (product, quantity = 1, weight = null) => {
    setCart(prev => {
      const existingItem = prev.items.find(item => item.productId === product.id);
      let newItems;

      if (existingItem) {
        newItems = prev.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const price = weight ? product.pricePerKg * weight : product.price;
        newItems = [...prev.items, {
          productId: product.id,
          name: product.name,
          price,
          quantity,
          weight,
          taxRate: product.taxRate,
          barcode: product.barcode
        }];
      }

      const { subtotal, tax, total } = calculateTotals(newItems, prev.discount);
      const newCart = { ...prev, items: newItems, subtotal, tax, total };

      // Save to offline storage
      offlineService.saveCart(newCart);

      toast.success(`${product.name} added to cart`);
      return newCart;
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }

    setCart(prev => {
      const newItems = prev.items.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      );

      const { subtotal, tax, total } = calculateTotals(newItems, prev.discount);
      const newCart = { ...prev, items: newItems, subtotal, tax, total };

      offlineService.saveCart(newCart);
      return newCart;
    });
  };

  const removeItem = (productId) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => item.productId !== productId);
      const { subtotal, tax, total } = calculateTotals(newItems, prev.discount);
      const newCart = { ...prev, items: newItems, subtotal, tax, total };

      offlineService.saveCart(newCart);
      toast.success('Item removed from cart');
      return newCart;
    });
  };

  const applyDiscount = (discount) => {
    setCart(prev => {
      const { subtotal, tax, total } = calculateTotals(prev.items, discount);
      const newCart = { ...prev, discount, total };

      offlineService.saveCart(newCart);
      return newCart;
    });
  };

  const setCustomer = (customer) => {
    setCart(prev => {
      const newCart = { ...prev, customer };
      offlineService.saveCart(newCart);
      return newCart;
    });
    if (customer) {
      toast.success(`Customer verified: ${customer.name || customer.username || customer.email}`);
    }
  };

  const removeCustomer = () => {
    setCart(prev => {
      const newCart = { ...prev, customer: null };
      offlineService.saveCart(newCart);
      return newCart;
    });
    toast.info('Customer removed');
  };

  const processPayment = (paymentMethod, paidAmount) => {
    const change = paidAmount - cart.total;
    setCart(prev => {
      const newCart = { ...prev, paymentMethod, paidAmount, change };
      offlineService.saveCart(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    const emptyCart = {
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      customer: null,
      paymentMethod: null,
      paidAmount: 0,
      change: 0
    };
    setCart(emptyCart);
    offlineService.clearCart();
  };

  const value = {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    applyDiscount,
    setCustomer,
    removeCustomer,
    processPayment,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};