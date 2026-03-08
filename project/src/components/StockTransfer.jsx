import React, { useState, useEffect } from 'react';
import { Package, ArrowRightLeft, Store, Users, Calendar, Search, Plus, Minus, Trash2 } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { useStores } from '../contexts/StoresContext';
import { useAuth } from '../contexts/AuthContext';
import PinVerificationModal from './PinVerificationModal';

const StockTransfer = () => {
  const { products, loading: inventoryLoading, selectedStoreId } = useInventory();
  const { stores, loading: storesLoading } = useStores();
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [fromStore, setFromStore] = useState('');
  const [toStore, setToStore] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState(null);

  // Filter products to only show products from the current store
  const availableProducts = selectedStoreId 
    ? products.filter(p => p.storeId === selectedStoreId || !p.storeId)
    : products;
  
  const [transferHistory, setTransferHistory] = useState([
    {
      id: 1,
      product: 'Laptop XYZ',
      quantity: 5,
      fromStore: 'Main Store',
      toStore: 'Branch A',
      date: '2023-06-15',
      status: 'completed',
      initiatedBy: 'John Doe'
    },
    {
      id: 2,
      product: 'Wireless Mouse',
      quantity: 10,
      fromStore: 'Branch A',
      toStore: 'Branch B',
      date: '2023-06-14',
      status: 'completed',
      initiatedBy: 'Jane Smith'
    }
  ]);

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const initiateTransfer = async () => {
    if (!selectedProduct || !fromStore || !toStore || quantity <= 0) {
      alert('Please fill all required fields');
      return;
    }

    // Check if enough stock is available in the from store
    const productInFromStore = selectedProduct;
    if (!productInFromStore || productInFromStore.stock < quantity) {
      alert(`Insufficient stock in ${fromStore}. Available: ${productInFromStore?.stock || 0}`);
      return;
    }

    setPinAction(() => async (pin) => {
      try {
        // Update product stock in from store (decrease)
        const fromStoreResponse = await fetch(`http://localhost:3001/products/${selectedProduct.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stock: productInFromStore.stock - quantity,
            storeId: selectedProduct.storeId // Keep same storeId
          }),
        });

        // Create or update product in to store (increase)
        // First check if product exists in to store
        const toStoreProductsResponse = await fetch(`http://localhost:3001/products?storeId=${toStore}&name=${selectedProduct.name}`);
        let toStoreProduct = null;
        if (toStoreProductsResponse.ok) {
          const products = await toStoreProductsResponse.json();
          toStoreProduct = products[0];
        }

        if (toStoreProduct) {
          // Update existing product in to store
          await fetch(`http://localhost:3001/products/${toStoreProduct.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              stock: toStoreProduct.stock + quantity
            }),
          });
        } else {
          // Create new product in to store
          await fetch('http://localhost:3001/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...selectedProduct,
              storeId: parseInt(toStore),
              stock: quantity,
              createdAt: new Date().toISOString().split('T')[0]
            }),
          });
        }

        alert(`Transfer completed: ${quantity} units of ${selectedProduct.name} from Store ${fromStore} to Store ${toStore}`);
        return { success: true };
      } catch (error) {
        console.error('Transfer error:', error);
        alert('Failed to complete transfer');
        return { success: false };
      }
    });

    setShowPinModal(true);
  };

  const approveTransfer = (transferId) => {
    setPinAction(() => async (pin) => {
      // In a real app, you would verify the PIN with your backend
      setTransfers(prev => 
        prev.map(t => 
          t.id === transferId ? { ...t, status: 'approved' } : t
        )
      );
      alert('Transfer approved');
      return { success: true }; // For demo purposes
    });
    
    setShowPinModal(true);
  };

  const completeTransfer = (transferId) => {
    setPinAction(() => async (pin) => {
      // In a real app, you would verify the PIN with your backend
      setTransfers(prev => 
        prev.map(t => 
          t.id === transferId ? { ...t, status: 'completed' } : t
        )
      );
      alert('Transfer completed');
      return { success: true }; // For demo purposes
    });
    
    setShowPinModal(true);
  };

  if (inventoryLoading || storesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <ArrowRightLeft className="mr-3 h-8 w-8 text-blue-600" />
            Stock Transfer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Transfer inventory between stores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="mr-2 h-5 w-5 text-blue-600" />
              Initiate Stock Transfer
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Store
                </label>
                <select
                  value={fromStore}
                  onChange={(e) => setFromStore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select source store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Store
                </label>
                <select
                  value={toStore}
                  onChange={(e) => setToStore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select destination store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Product
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>

            <div className="mb-4 max-h-60 overflow-y-auto">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className={`p-3 border rounded-lg mb-2 cursor-pointer transition ${
                    selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">${product.price}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Stock: {product.stores?.find(s => s.storeId === fromStore)?.stock || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedProduct && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{selectedProduct.name}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Available: {selectedProduct.stores?.find(s => s.storeId === fromStore)?.stock || 0}
                  </span>
                </div>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                    Quantity:
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-2 border-r border-gray-300 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stores?.find(s => s.storeId === fromStore)?.stock || 0}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(selectedProduct.stores?.find(s => s.storeId === fromStore)?.stock || 0, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center border-0 focus:ring-0 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => setQuantity(q => Math.min(selectedProduct.stores?.find(s => s.storeId === fromStore)?.stock || 0, q + 1))}
                      className="p-2 border-l border-gray-300 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={initiateTransfer}
              disabled={!selectedProduct || !fromStore || !toStore || quantity <= 0}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
                !selectedProduct || !fromStore || !toStore || quantity <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <ArrowRightLeft className="mr-2 h-5 w-5" />
              Initiate Transfer
            </button>
          </div>

          {/* Pending Transfers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="mr-2 h-5 w-5 text-yellow-600" />
              Pending Transfers
            </h2>
            {transfers.filter(t => t.status === 'pending').length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p>No pending transfers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transfers.filter(t => t.status === 'pending').map(transfer => (
                  <div key={transfer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{transfer.product}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transfer.quantity} units from {transfer.fromStore} to {transfer.toStore}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Initiated by {transfer.initiatedBy} on {new Date(transfer.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveTransfer(transfer.id)}
                          className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-800/30 dark:text-green-300 rounded-lg text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => completeTransfer(transfer.id)}
                          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-800/30 dark:text-blue-300 rounded-lg text-sm"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transfer History */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-purple-600" />
              Transfer History
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transferHistory.map(transfer => (
                <div key={transfer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">{transfer.product}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transfer.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {transfer.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {transfer.quantity} units • {transfer.fromStore} → {transfer.toStore}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(transfer.date).toLocaleDateString()} • {transfer.initiatedBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={pinAction}
        title="Verify Your PIN"
        message="Enter your PIN to authorize this transfer"
      />
    </div>
  );
};

export default StockTransfer;