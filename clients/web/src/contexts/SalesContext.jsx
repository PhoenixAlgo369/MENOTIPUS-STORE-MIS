import React, { createContext, useContext, useState, useEffect } from 'react';
import { useInventory } from './InventoryContext';
import { useAppSettings } from './AppSettingsContext';
import { useAuth } from './AuthContext';

const SalesContext = createContext();

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export const SalesProvider = ({ children }) => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [allSales, setAllSales] = useState([]); // Store all sales for cross-store view
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heldOrders, setHeldOrders] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const { products, updateStock } = useInventory();
  const { settings } = useAppSettings();

  useEffect(() => {
    const savedHeld = localStorage.getItem('heldOrders');
    if (savedHeld) {
      try {
        setHeldOrders(JSON.parse(savedHeld));
      } catch (e) {
        console.error('Failed to parse held orders');
      }
    }
    setTimeout(() => {
      setSales([
        {
          id: 'sale1',
          date: '2025-04-10',
          time: '14:30:00',
          items: [{ productId: 'p1', name: 'iPhone 15', quantity: 1, price: 999, total: 999 }],
          subtotal: 999,
          tax: 99.9,
          total: 1098.9,
          paymentMethod: 'cash',
          cashierId: 1,
          cashierName: 'Administrator',
          customerId: null,
          customerName: 'Walk-in Customer',
          status: 'completed'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const saveHeldOrders = (orders) => {
    setHeldOrders(orders);
    localStorage.setItem('heldOrders', JSON.stringify(orders));
  };

  const handleUnholdOrder = (order) => {
    setCart(order.cart);
    saveHeldOrders(heldOrders.filter(o => o.id !== order.id));
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQuantity = existing.quantity + 1;
        if (newQuantity > product.stock) {
          alert(`Cannot add more than ${product.stock} units of ${product.name}`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
      }
      if (product.stock <= 0) {
        alert(`${product.name} is out of stock`);
        return prev;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const product = prev.find(item => item.id === productId);
      if (!product) return prev;
      if (quantity > product.stock) {
        alert(`Cannot add more than ${product.stock} units of ${product.name}`);
        return prev;
      }
      return prev.map(item => item.id === productId ? { ...item, quantity } : item);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
  };

  const getCartTax = (subtotal) => {
    const taxRate = parseFloat(settings.taxRate) || 10;
    return (subtotal * taxRate) / 100;
  };

  const processSale = async (paymentMethod, cashier, customerId = null, customerName = 'Walk-in Customer', isCredit = false) => {
    const subtotal = getCartTotal();
    const tax = getCartTax(subtotal);
    const total = subtotal + tax;

    const newSale = {
      id: `sale${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.sellingPrice,
        total: item.sellingPrice * item.quantity
      })),
      subtotal,
      tax,
      total,
      paymentMethod,
      cashierId: cashier.id,
      cashierName: cashier.name,
      customerId,
      customerName,
      status: isCredit ? 'credit' : 'completed',
      storeId: selectedStoreId // Associate sale with current store
    };

    try {
      for (const item of cart) {
        const newStock = item.stock - item.quantity;
        await updateStock(item.id, newStock);
      }
      setAllSales(prev => [...prev, newSale]);
      setSales(prev => [newSale, ...prev]);
      clearCart();
      return { success: true, sale: newSale };
    } catch (error) {
      console.error('Error processing sale:', error);
      return { success: false, message: error.message || 'Network error' };
    }
  };

  const getSalesStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisMonth = new Date().getMonth();

    const todaySales = sales.filter(sale => sale.date === today);
    const thisWeekSales = sales.filter(sale => new Date(sale.date) >= thisWeekStart);
    const thisMonthSales = sales.filter(sale => new Date(sale.date).getMonth() === thisMonth);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdaySales = sales.filter(sale => sale.date === yesterdayStr);

    return {
      today: {
        count: todaySales.length,
        total: todaySales.reduce((sum, sale) => sum + sale.total, 0),
        change: yesterdaySales.length > 0 ? Math.round(((todaySales.length - yesterdaySales.length) / yesterdaySales.length) * 100) : 0
      },
      yesterday: {
        count: yesterdaySales.length,
        total: yesterdaySales.reduce((sum, sale) => sum + sale.total, 0)
      },
      week: {
        count: thisWeekSales.length,
        total: thisWeekSales.reduce((sum, sale) => sum + sale.total, 0)
      },
      month: {
        count: thisMonthSales.length,
        total: thisMonthSales.reduce((sum, sale) => sum + sale.total, 0)
      }
    };
  };

  return (
    <SalesContext.Provider value={{
      sales,
      allSales,
      cart,
      loading,
      heldOrders,
      selectedStoreId,
      setSelectedStoreId,
      saveHeldOrders,
      handleUnholdOrder,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      getCartTotal,
      getCartTax,
      processSale,
      getSalesStats
    }}>
      {children}
    </SalesContext.Provider>
  );
};