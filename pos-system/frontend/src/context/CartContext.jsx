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
    if (cart.items.length > 0 || cart.customer || cart.total > 0 || cart.discount > 0 || cart.paymentMethod) {
      offlineService.saveCart(cart);
    }
  }, [cart]);

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
      return { ...prev, items: newItems, subtotal, tax, total };
    });
    toast.success(`${product.name} added to cart`);
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
      return { ...prev, items: newItems, subtotal, tax, total };
    });
  };

  const removeItem = (productId) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => item.productId !== productId);
      const { subtotal, tax, total } = calculateTotals(newItems, prev.discount);
      return { ...prev, items: newItems, subtotal, tax, total };
    });
    toast.success('Item removed from cart');
  };

  const applyDiscount = (discount) => {
    setCart(prev => {
      const { subtotal, tax, total } = calculateTotals(prev.items, discount);
      return { ...prev, discount, total };
    });
  };

  const setCustomer = (customer) => {
    setCart(prev => ({ ...prev, customer }));
    if (customer) {
      toast.success(`Customer verified: ${customer.name || customer.username || customer.email}`);
    }
  };

  const removeCustomer = () => {
    setCart(prev => ({ ...prev, customer: null }));
    toast('Customer removed', { icon: 'ℹ️' });
  };

  const processPayment = (paymentMethod, paidAmount) => {
    setCart(prev => {
      const change = paidAmount - prev.total;
      return { ...prev, paymentMethod, paidAmount, change };
    });
  };

  const importVerifiedCart = (customer, items) => {
    const newItems = items.map(item => {
      const price = item.weight ? item.product.pricePerKg * item.weight : item.product.price;
      return {
        productId: item.product.id,
        name: item.product.name,
        price,
        quantity: item.quantity,
        weight: item.weight,
        taxRate: item.product.taxRate,
        barcode: item.product.barcode
      };
    });

    const { subtotal, tax, total } = calculateTotals(newItems, 0);

    setCart({
      items: newItems,
      subtotal,
      tax,
      discount: 0,
      total,
      customer,
      paymentMethod: null,
      paidAmount: 0,
      change: 0
    });

    toast.success(`Imported verified cart for ${customer.name || customer.email}`);
  };

  const clearCart = () => {
    setCart({
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
    importVerifiedCart,
    processPayment,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};