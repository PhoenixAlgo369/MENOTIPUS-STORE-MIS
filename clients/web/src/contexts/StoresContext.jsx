import React, { createContext, useContext, useState, useEffect } from 'react';

const StoresContext = createContext();

export const useStores = () => {
  const context = useContext(StoresContext);
  if (!context) {
    throw new Error('useStores must be used within a StoresProvider');
  }
  return context;
};

export const StoresProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    // Load stores from localStorage or fetch from API
    const loadStores = async () => {
      try {
        // Simulate API call to get stores
        const response = await fetch('http://localhost:3001/stores');
        if (response.ok) {
          let data = await response.json();

          // Filter stores based on user role
          // systems_admin and admin see ALL stores (god's view)
          // Engineers also see ALL stores
          // Owners only see their assigned stores
          if (currentUser?.role === 'owner' && currentUser?.stores?.length > 0) {
            // Owners only see their assigned stores
            data = data.filter(store => currentUser.stores.includes(store.id));
          }
          // managers, supervisors, cashiers only see stores they're assigned to
          if (['manager', 'supervisor', 'cashier'].includes(currentUser?.role) && currentUser?.stores?.length > 0) {
            data = data.filter(store => currentUser.stores.includes(store.id));
          }

          setStores(data);
        } else if (response.status === 404) {
          // If no stores exist in DB, initialize with empty array
          setStores([]);
        } else {
          // Handle other error statuses
          console.error('Error loading stores:', response.statusText);
          setStores([]);
        }
      } catch (error) {
        console.error('Error loading stores:', error);
        // Initialize with empty array if there's an error
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [currentUser]);

  const createStore = async (storeData) => {
    // Only admin and systems_admin can create stores
    if (!['admin', 'systems_admin'].includes(currentUser?.role)) {
      return { success: false, message: 'Only admin and systems administrators can create stores' };
    }

    try {
      const storeWithCompany = {
        ...storeData,
        companyId: currentUser?.companyId || currentUser?.email, // Associate store with user's company
        createdBy: currentUser?.id,
        createdAt: storeData.createdAt || new Date().toISOString()
      };

      const response = await fetch('http://localhost:3001/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storeWithCompany)
      });

      if (response.ok) {
        const newStore = await response.json();
        setStores(prev => [...prev, newStore]);

        // Initialize the new store with demo products
        await initializeStoreWithDemoProducts(newStore.id);

        return { success: true, store: newStore };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Failed to create store' };
      }
    } catch (error) {
      console.error('Create store error:', error);
      return { success: false, message: 'Connection error. Please try again.' };
    }
  };

  const initializeStoreWithDemoProducts = async (storeId) => {
    // Store-specific product catalogs - each store has unique inventory
    const STORE_PRODUCT_CATALOGS = {
      1: [ // Store 1: Electronics & Tech
        {
          name: "Wireless Earbuds Pro",
          category: "Electronics",
          sku: "ELEC-WE-001",
          barcode: "8901234567890",
          costPrice: 25.50,
          sellingPrice: 59.99,
          stock: 150,
          minStock: 15,
          supplierId: null,
          description: "Premium wireless earbuds with noise cancellation",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        },
        {
          name: "USB-C Fast Charger",
          category: "Electronics",
          sku: "ELEC-CH-002",
          barcode: "8901234567891",
          costPrice: 12.00,
          sellingPrice: 29.99,
          stock: 200,
          minStock: 20,
          supplierId: null,
          description: "65W fast charger with USB-C cable",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        },
        {
          name: "Bluetooth Speaker",
          category: "Electronics",
          sku: "ELEC-BS-003",
          barcode: "8901234567892",
          costPrice: 30.00,
          sellingPrice: 79.99,
          stock: 100,
          minStock: 10,
          supplierId: null,
          description: "Portable Bluetooth speaker with 360° sound",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        }
      ],
      2: [ // Store 2: Home & Kitchen
        {
          name: "Stainless Steel Cookware Set",
          category: "Kitchen",
          sku: "HOME-CW-001",
          barcode: "7801234567890",
          costPrice: 85.00,
          sellingPrice: 199.99,
          stock: 50,
          minStock: 5,
          supplierId: null,
          description: "10-piece stainless steel cookware set",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        },
        {
          name: "Coffee Maker Deluxe",
          category: "Kitchen",
          sku: "HOME-CM-002",
          barcode: "7801234567891",
          costPrice: 45.00,
          sellingPrice: 129.99,
          stock: 75,
          minStock: 8,
          supplierId: null,
          description: "Programmable coffee maker with thermal carafe",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        },
        {
          name: "Kitchen Knife Set",
          category: "Kitchen",
          sku: "HOME-KN-003",
          barcode: "7801234567892",
          costPrice: 35.00,
          sellingPrice: 89.99,
          stock: 60,
          minStock: 6,
          supplierId: null,
          description: "Professional 6-piece knife set with block",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        }
      ],
      3: [ // Store 3: Fashion & Accessories
        {
          name: "Leather Wallet Premium",
          category: "Accessories",
          sku: "FASH-LW-001",
          barcode: "6701234567890",
          costPrice: 18.00,
          sellingPrice: 49.99,
          stock: 120,
          minStock: 12,
          supplierId: null,
          description: "Genuine leather bifold wallet with RFID blocking",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        },
        {
          name: "Designer Sunglasses",
          category: "Accessories",
          sku: "FASH-SG-002",
          barcode: "6701234567891",
          costPrice: 25.00,
          sellingPrice: 79.99,
          stock: 80,
          minStock: 8,
          supplierId: null,
          description: "UV protection polarized sunglasses",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        },
        {
          name: "Canvas Backpack",
          category: "Bags",
          sku: "FASH-BP-003",
          barcode: "6701234567892",
          costPrice: 22.00,
          sellingPrice: 59.99,
          stock: 90,
          minStock: 10,
          supplierId: null,
          description: "Vintage canvas backpack with laptop compartment",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        }
      ],
      4: [ // Store 4: Sports & Fitness
        {
          name: "Yoga Mat Premium",
          category: "Fitness",
          sku: "SPRT-YM-001",
          barcode: "5601234567890",
          costPrice: 15.00,
          sellingPrice: 39.99,
          stock: 100,
          minStock: 10,
          supplierId: null,
          description: "Non-slip eco-friendly yoga mat with carrying strap",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        },
        {
          name: "Adjustable Dumbbells Set",
          category: "Fitness",
          sku: "SPRT-DB-002",
          barcode: "5601234567891",
          costPrice: 55.00,
          sellingPrice: 149.99,
          stock: 40,
          minStock: 5,
          supplierId: null,
          description: "Adjustable dumbbell set 5-25 lbs",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        },
        {
          name: "Sports Water Bottle",
          category: "Sports",
          sku: "SPRT-WB-003",
          barcode: "5601234567892",
          costPrice: 8.00,
          sellingPrice: 24.99,
          stock: 200,
          minStock: 20,
          supplierId: null,
          description: "Insulated stainless steel water bottle 32oz",
          baseUnit: "piece",
          sellUnits: ["piece"],
          conversionFactors: { "piece": 1 },
          status: "active",
          storeId: storeId,
          createdAt: new Date().toISOString().split('T')[0],
          currencyAtCreation: 'USD'
        }
      ]
    };

    // Get store-specific products or use default catalog for new stores
    const productsToCreate = STORE_PRODUCT_CATALOGS[storeId] || [
      {
        name: `Store ${storeId} Special Item 1`,
        category: "General",
        sku: `GEN-ST${storeId}-001`,
        barcode: `450123456789${storeId}`,
        costPrice: 15.00,
        sellingPrice: 34.99,
        stock: 75,
        minStock: 8,
        supplierId: null,
        description: `Exclusive product for Store ${storeId}`,
        baseUnit: "piece",
        sellUnits: ["piece"],
        conversionFactors: { "piece": 1 },
        status: "active",
        storeId: storeId,
        createdAt: new Date().toISOString().split('T')[0],
        currencyAtCreation: 'USD'
      },
      {
        name: `Store ${storeId} Special Item 2`,
        category: "General",
        sku: `GEN-ST${storeId}-002`,
        barcode: `450123456789${storeId + 10}`,
        costPrice: 22.00,
        sellingPrice: 49.99,
        stock: 50,
        minStock: 5,
        supplierId: null,
        description: `Another exclusive product for Store ${storeId}`,
        baseUnit: "piece",
        sellUnits: ["piece"],
        conversionFactors: { "piece": 1 },
        status: "active",
        storeId: storeId,
        createdAt: new Date().toISOString().split('T')[0],
        currencyAtCreation: 'USD'
      }
    ];

    try {
      for (const product of productsToCreate) {
        await fetch('http://localhost:3001/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        });
      }
      console.log(`Initialized store ${storeId} with ${productsToCreate.length} unique products`);
    } catch (error) {
      console.error('Failed to initialize store with demo products:', error);
    }
  };

  const updateStore = async (storeId, storeData) => {
    try {
      const response = await fetch(`http://localhost:3001/stores/${storeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storeData)
      });

      if (response.ok) {
        const updatedStore = await response.json();
        setStores(prev => prev.map(store => 
          store.id === storeId ? updatedStore : store
        ));
        return { success: true, store: updatedStore };
      } else {
        return { success: false, message: 'Failed to update store' };
      }
    } catch (error) {
      return { success: false, message: 'Connection error. Please try again.' };
    }
  };

  const deleteStore = async (storeId) => {
    try {
      const response = await fetch(`http://localhost:3001/stores/${storeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setStores(prev => prev.filter(store => store.id !== storeId));
        return { success: true };
      } else {
        return { success: false, message: 'Failed to delete store' };
      }
    } catch (error) {
      return { success: false, message: 'Connection error. Please try again.' };
    }
  };

  const assignStoreToUser = async (userId, storeId) => {
    try {
      // First get the current user data
      const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
      if (!userResponse.ok) {
        return { success: false, message: 'Failed to fetch user data' };
      }
      const userData = await userResponse.json();

      // Update user to include the store
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userData,
          stores: [...(userData.stores || []), storeId]
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, message: 'Failed to assign store to user' };
      }
    } catch (error) {
      return { success: false, message: 'Connection error. Please try again.' };
    }
  };

  const assignEngineerToStore = async (engineerId, storeId) => {
    try {
      const userResponse = await fetch(`http://localhost:3001/users/${engineerId}`);
      if (!userResponse.ok) {
        return { success: false, message: 'Failed to fetch user data' };
      }
      const userData = await userResponse.json();

      // Check if already assigned
      if (userData.stores?.includes(storeId)) {
        return { success: false, message: 'Engineer already assigned to this store' };
      }

      const response = await fetch(`http://localhost:3001/users/${engineerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userData,
          stores: [...(userData.stores || []), storeId]
        })
      });

      if (response.ok) {
        // Also update the current user in localStorage
        const updatedUser = { ...userData, stores: [...(userData.stores || []), storeId] };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, message: 'Successfully assigned to store' };
      } else {
        return { success: false, message: 'Failed to assign engineer to store' };
      }
    } catch (error) {
      return { success: false, message: 'Connection error. Please try again.' };
    }
  };

  const removeEngineerFromStore = async (engineerId, storeId) => {
    try {
      const userResponse = await fetch(`http://localhost:3001/users/${engineerId}`);
      if (!userResponse.ok) {
        return { success: false, message: 'Failed to fetch user data' };
      }
      const userData = await userResponse.json();

      const response = await fetch(`http://localhost:3001/users/${engineerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userData,
          stores: (userData.stores || []).filter(id => id !== storeId)
        })
      });

      if (response.ok) {
        // Also update the current user in localStorage
        const updatedUser = { ...userData, stores: (userData.stores || []).filter(id => id !== storeId) };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, message: 'Successfully removed from store' };
      } else {
        return { success: false, message: 'Failed to remove engineer from store' };
      }
    } catch (error) {
      return { success: false, message: 'Connection error. Please try again.' };
    }
  };

  return (
    <StoresContext.Provider value={{
      stores,
      createStore,
      updateStore,
      deleteStore,
      assignStoreToUser,
      assignEngineerToStore,
      removeEngineerFromStore,
      loading,
      currentUser
    }}>
      {children}
    </StoresContext.Provider>
  );
};