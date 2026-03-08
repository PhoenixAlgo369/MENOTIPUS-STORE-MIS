import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit3, Trash2, MapPin, Phone, Mail, Users, Package } from 'lucide-react';
import { useStores } from '../contexts/StoresContext';
import { useAuth } from '../contexts/AuthContext';
import PinVerificationModal from './PinVerificationModal';

const StoresManagement = () => {
  const { stores, createStore, updateStore, deleteStore, assignStoreToUser, loading, currentUser } = useStores();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('StoresManagement - user:', user);
    console.log('StoresManagement - currentUser:', currentUser);
    console.log('StoresManagement - stores:', stores);
    console.log('StoresManagement - loading:', loading);
  }, [user, currentUser, stores, loading]);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    relatedStores: [],
    storeType: 'independent', // 'independent', 'related', 'parent', 'child'
    parentStore: null
  });

  const [filter, setFilter] = useState('all');

  const filteredStores = stores.filter(store => {
    if (filter === 'all') return true;
    if (filter === 'related') return store.storeType !== 'independent';
    if (filter === 'independent') return store.storeType === 'independent';
    return true;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateStore = () => {
    console.log('Create store clicked, user:', user);
    setIsEditing(false);
    setCurrentStore(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      relatedStores: [],
      storeType: 'independent',
      parentStore: null
    });
    setIsModalOpen(true);
  };

  const handleEditStore = (store) => {
    setIsEditing(true);
    setCurrentStore(store);
    setFormData({
      name: store.name || '',
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      manager: store.manager || '',
      relatedStores: store.relatedStores || [],
      storeType: store.storeType || 'independent',
      parentStore: store.parentStore || null
    });
    setIsModalOpen(true);
  };

  const handleDeleteStore = (store) => {
    setPinAction(() => async (pin) => {
      // In a real app, you would verify the PIN with your backend
      // For now, we'll just proceed with the deletion
      const result = await deleteStore(store.id);
      if (result.success) {
        alert('Store deleted successfully');
      } else {
        alert(result.message);
      }
      return { success: true }; // For demo purposes
    });
    setShowPinModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing && currentStore) {
      const result = await updateStore(currentStore.id, formData);
      if (result.success) {
        alert('Store updated successfully');
        setIsModalOpen(false);
      } else {
        alert(result.message);
      }
    } else {
      const result = await createStore(formData);
      if (result.success) {
        alert('Store created successfully');
        setIsModalOpen(false);
      } else {
        alert(result.message);
      }
    }
  };

  const handleAssignStore = async (storeId) => {
    setPinAction(() => async (pin) => {
      // In a real app, you would verify the PIN with your backend
      const result = await assignStoreToUser(user.id, storeId);
      if (result.success) {
        alert('Store assigned to you successfully');
      } else {
        alert(result.message);
      }
      return { success: true }; // For demo purposes
    });
    setShowPinModal(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Store Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your stores and their relationships
          </p>
        </div>
        {/* Only admin and systems_admin can see the Add Store button */}
        {['admin', 'systems_admin'].includes(currentUser?.role) && (
          <button
            onClick={handleCreateStore}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            title="Click to create a new store"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Store
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All Stores
          </button>
          <button
            onClick={() => setFilter('independent')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'independent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Independent
          </button>
          <button
            onClick={() => setFilter('related')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'related'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Related Stores
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store) => (
          <div key={store.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <Building2 className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{store.name}</h3>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{store.address || 'Address not set'}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditStore(store)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteStore(store)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 mr-2" />
                <span>{store.phone || 'Phone not set'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 mr-2" />
                <span>{store.email || 'Email not set'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4 mr-2" />
                <span>Manager: {store.manager || 'Not assigned'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Package className="h-4 w-4 mr-2" />
                <span>Type: {store.storeType || 'Independent'}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleAssignStore(store.id)}
                className="w-full bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-800/30 dark:text-green-300 py-2 px-4 rounded-lg text-sm font-medium transition"
              >
                Assign to Me
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for creating/editing stores */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Store' : 'Create New Store'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" title="Enter the official name of your store">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Enter store name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" title="Enter the physical address of your store">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Enter store address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" title="Enter the contact phone number for your store">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" title="Enter the official email address for your store">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" title="Enter the name of the store manager">
                      Manager
                    </label>
                    <input
                      type="text"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Enter manager name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" title="Choose the relationship type of this store within your company">
                      Store Type
                    </label>
                    <select
                      name="storeType"
                      value={formData.storeType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      <option value="independent">Independent Store</option>
                      <option value="related">Related Store</option>
                      <option value="parent">Parent Store</option>
                      <option value="child">Child Store</option>
                    </select>
                  </div>

                  {(formData.storeType === 'child' || formData.storeType === 'related') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" title="Select the parent store if this is a child or related store">
                        Parent Store (optional)
                      </label>
                      <select
                        name="parentStore"
                        value={formData.parentStore || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="">Select parent store</option>
                        {stores
                          .filter(s => s.storeType === 'parent')
                          .map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isEditing ? 'Update Store' : 'Create Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={pinAction}
        title="Verify Your PIN"
        message="Enter your PIN to confirm this action"
      />
    </div>
  );
};

export default StoresManagement;