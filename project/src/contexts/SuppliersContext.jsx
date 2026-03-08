import React, { createContext, useContext, useState, useEffect } from 'react';

const SuppliersContext = createContext();

export const useSuppliers = () => {
  const context = useContext(SuppliersContext);
  if (!context) {
    throw new Error('useSuppliers must be used within a SuppliersProvider');
  }
  return context;
};

export const SuppliersProvider = ({ children }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
    fetchPurchaseOrders();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:3001/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch('http://localhost:3001/purchaseOrders');
      const data = await response.json();
      setPurchaseOrders(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
    }
  };

  const addSupplier = async (supplier) => {
    try {
      const response = await fetch('http://localhost:3001/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...supplier,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0]
        }),
      });
      
      if (response.ok) {
        const newSupplier = await response.json();
        setSuppliers(prev => [...prev, newSupplier]);
        return { success: true, supplier: newSupplier };
      } else {
        return { success: false, message: 'Failed to add supplier' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const updateSupplier = async (id, updates) => {
    try {
      const response = await fetch(`http://localhost:3001/suppliers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedSupplier = await response.json();
        setSuppliers(prev => 
          prev.map(supplier => 
            supplier.id === id ? updatedSupplier : supplier
          )
        );
        return { success: true, supplier: updatedSupplier };
      } else {
        return { success: false, message: 'Failed to update supplier' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const deleteSupplier = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
        return { success: true };
      } else {
        return { success: false, message: 'Failed to delete supplier' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const createPurchaseOrder = async (order) => {
    const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
    
    try {
      const response = await fetch('http://localhost:3001/purchaseOrders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...order,
          poNumber,
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        }),
      });
      
      if (response.ok) {
        const newOrder = await response.json();
        setPurchaseOrders(prev => [newOrder, ...prev]);
        return { success: true, order: newOrder };
      } else {
        return { success: false, message: 'Failed to create purchase order' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const updatePurchaseOrderStatus = async (id, status) => {
    const updates = { status };
    if (status === 'delivered') {
      updates.deliveryDate = new Date().toISOString().split('T')[0];
    }

    try {
      const response = await fetch(`http://localhost:3001/purchaseOrders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setPurchaseOrders(prev => 
          prev.map(order => 
            order.id === id ? updatedOrder : order
          )
        );
        return { success: true, order: updatedOrder };
      } else {
        return { success: false, message: 'Failed to update purchase order' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  return (
    <SuppliersContext.Provider value={{
      suppliers,
      purchaseOrders,
      loading,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      createPurchaseOrder,
      updatePurchaseOrderStatus,
      fetchSuppliers,
      fetchPurchaseOrders
    }}>
      {children}
    </SuppliersContext.Provider>
  );
};