import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

// Demo products template for new stores
const DEMO_PRODUCTS = [
  {
    name: "Demo Product 1",
    category: "General",
    sku: "DEMO-001",
    barcode: "DEMO001",
    costPrice: 10,
    sellingPrice: 15,
    stock: 100,
    minStock: 10,
    supplierId: null,
    description: "Demo product for new store",
    baseUnit: "piece",
    sellUnits: ["piece"],
    conversionFactors: { "piece": 1 },
    status: "active"
  },
  {
    name: "Demo Product 2",
    category: "General",
    sku: "DEMO-002",
    barcode: "DEMO002",
    costPrice: 20,
    sellingPrice: 30,
    stock: 50,
    minStock: 5,
    supplierId: null,
    description: "Demo product for new store",
    baseUnit: "piece",
    sellUnits: ["piece"],
    conversionFactors: { "piece": 1 },
    status: "active"
  }
];

export const InventoryProvider = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for cross-store view
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [selectedStoreId]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/products');
      const data = await response.json();
      const uniqueProducts = ensureUniqueIds(data);
      setAllProducts(uniqueProducts); // Store all products

      // Filter by selected store - strict store isolation
      // systems_admin and admin have GOD MODE - see all products
      if (selectedStoreId) {
        // Only show products that belong to this store OR have no storeId (global products)
        let filtered = uniqueProducts.filter(p => p.storeId === selectedStoreId || !p.storeId);

        // For owners, only show products from their assigned stores
        if (user?.role === 'owner' && user?.stores?.length > 0) {
          filtered = filtered.filter(p => !p.storeId || user.stores.includes(p.storeId));
        }

        // If store has no products, initialize with demo products
        if (filtered.length === 0 && user?.stores?.includes(selectedStoreId)) {
          await initializeStoreWithDemoProducts(selectedStoreId);
          return;
        }

        setProducts(filtered);
      } else {
        // When no store selected, show products based on user role
        // systems_admin and admin see ALL products (god's view)
        if (['systems_admin', 'admin', 'engineer'].includes(user?.role)) {
          setProducts(uniqueProducts);
        } else if (user?.role === 'owner' && user?.stores?.length > 0) {
          // Owners only see products from their stores
          const filtered = uniqueProducts.filter(p => !p.storeId || user.stores.includes(p.storeId));
          setProducts(filtered);
        } else {
          setProducts(uniqueProducts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeStoreWithDemoProducts = async (storeId) => {
    try {
      const createdProducts = [];
      for (const demoProduct of DEMO_PRODUCTS) {
        const response = await fetch('http://localhost:3001/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...demoProduct,
            storeId: storeId,
            createdAt: new Date().toISOString().split('T')[0],
            currencyAtCreation: 'USD'
          }),
        });
        
        if (response.ok) {
          const newProduct = await response.json();
          createdProducts.push(newProduct);
        }
      }
      
      if (createdProducts.length > 0) {
        setProducts(createdProducts);
        setAllProducts(prev => [...prev, ...createdProducts]);
        console.log(`Initialized store ${storeId} with ${createdProducts.length} demo products`);
      }
    } catch (error) {
      console.error('Failed to initialize store with demo products:', error);
    }
  };

  const ensureUniqueIds = (products) => {
    if (!products || products.length === 0) return [];
    
    const seenIds = new Set();
    const uniqueProducts = [];
    const duplicatesFound = [];
    
    products.forEach(product => {
      let uniqueId = product.id;
      let counter = 1;
      
      while (seenIds.has(uniqueId)) {
        uniqueId = `${product.id}_${counter}`;
        counter++;
        duplicatesFound.push(product.id);
      }
      
      seenIds.add(uniqueId);
      
      if (uniqueId !== product.id) {
        console.warn(`Duplicate product ID found: ${product.id}. Assigned new ID: ${uniqueId}`);
        uniqueProducts.push({
          ...product,
          id: uniqueId
        });
      } else {
        uniqueProducts.push(product);
      }
    });
    
    if (duplicatesFound.length > 0) {
      console.warn(`Found ${duplicatesFound.length} duplicate product IDs:`, [...new Set(duplicatesFound)]);
    }
    
    return uniqueProducts;
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:3001/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const addProduct = async (product) => {
    try {
      // Get current currency from settings
      const settingsResponse = await fetch('http://localhost:3001/businessSettings');
      let currency = 'USD';
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        currency = settings.currency || 'USD';
      }

      const productWithStore = {
        ...product,
        storeId: product.storeId || selectedStoreId, // Always associate with current store
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        currencyAtCreation: currency
      };

      const response = await fetch('http://localhost:3001/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productWithStore),
      });

      if (response.ok) {
        const newProduct = await response.json();
        setAllProducts(prev => [...prev, newProduct]);
        if (!selectedStoreId || newProduct.storeId === selectedStoreId) {
          setProducts(prev => [...prev, newProduct]);
        }
        return { success: true, product: newProduct };
      } else {
        return { success: false, message: 'Failed to add product' };
      }
    } catch (error) {
      console.error('Add product error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const bulkAddProducts = async (productsArray) => {
    const results = [];
    for (const product of productsArray) {
      const result = await addProduct(product);
      results.push({
        product: product.name,
        success: result.success,
        message: result.message
      });
    }
    return results;
  };

  const updateProduct = async (id, updates) => {
    try {
      const response = await fetch(`http://localhost:3001/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(prev => 
          prev.map(product => 
            product.id === id ? updatedProduct : product
          )
        );
        return { success: true, product: updatedProduct };
      } else {
        return { success: false, message: 'Failed to update product' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const deleteProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(prev => prev.filter(product => product.id !== id));
        return { success: true };
      } else {
        return { success: false, message: 'Failed to delete product' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const updateStock = async (id, newStock) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === id ? { ...product, stock: newStock } : product
      )
    );
    return await updateProduct(id, { stock: newStock });
  };

  const getLowStockProducts = () => {
    return products.filter(product => product.stock <= product.minStock && product.stock > 0);
  };

  const getOutOfStockProducts = () => {
    return products.filter(product => product.stock === 0);
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  const getProductsByDate = (date) => {
    return products.filter(product => product.createdAt === date);
  };

  const setSelectedStore = (storeId) => {
    setSelectedStoreId(storeId);
    if (storeId) {
      const filtered = allProducts.filter(p => p.storeId === storeId || !p.storeId);
      setProducts(filtered);
    } else {
      setProducts(allProducts);
    }
  };

  const getAllProductsCrossStore = () => {
    return allProducts;
  };

  const getLowStockProductsCrossStore = () => {
    return allProducts.filter(product => product.stock <= product.minStock && product.stock > 0);
  };

  const getOutOfStockProductsCrossStore = () => {
    return allProducts.filter(product => product.stock === 0);
  };

  return (
    <InventoryContext.Provider value={{
      products,
      allProducts,
      suppliers,
      loading,
      selectedStoreId,
      setSelectedStore,
      addProduct,
      bulkAddProducts,
      updateProduct,
      deleteProduct,
      updateStock,
      getLowStockProducts,
      getOutOfStockProducts,
      getLowStockProductsCrossStore,
      getOutOfStockProductsCrossStore,
      getAllProductsCrossStore,
      getSupplierName,
      getProductsByDate,
      fetchProducts
    }}>
      {children}
    </InventoryContext.Provider>
  );
};