import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Clock, Shield, Search, Store, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStores } from '../contexts/StoresContext';

const EngineerActivation = () => {
  const { user, hasPermission } = useAuth();
  const { stores, assignEngineerToStore, removeEngineerFromStore } = useStores();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trials'); // 'trials' or 'stores'

  // Check if user has engineer permissions
  const canExtendTrial = hasPermission('users', 'crud');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3001/users');
        if (response.ok) {
          const allUsers = await response.json();
          // Filter out only users with expired or expiring trials
          const trialUsers = allUsers.filter(u => 
            u.trialStatus === 'active' || 
            (u.trialEndDate && new Date(u.trialEndDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) // Within 3 days of expiry
          );
          setUsers(trialUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const extendTrial = async (userId) => {
    if (!window.confirm('Are you sure you want to extend this user\'s trial for 30 days?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trialStatus: 'extended',
          trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
      });

      if (response.ok) {
        alert('Trial extended successfully for 30 days!');
        // Refresh the user list
        const updatedUsers = users.map(u => 
          u.id === userId 
            ? { ...u, trialStatus: 'extended', trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } 
            : u
        );
        setUsers(updatedUsers);
      } else {
        alert('Failed to extend trial');
      }
    } catch (error) {
      console.error('Error extending trial:', error);
      alert('Error extending trial');
    }
  };

  const deactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user? This will prevent them from logging in.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'inactive'
        })
      });

      if (response.ok) {
        alert('User deactivated successfully!');
        // Refresh the user list
        const updatedUsers = users.map(u => 
          u.id === userId 
            ? { ...u, status: 'inactive' } 
            : u
        );
        setUsers(updatedUsers);
      } else {
        alert('Failed to deactivate user');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Error deactivating user');
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAssignToStore = async (storeId) => {
    const result = await assignEngineerToStore(user.id, storeId);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleRemoveFromStore = async (storeId) => {
    if (!window.confirm('Are you sure you want to remove yourself from this store?')) {
      return;
    }
    const result = await removeEngineerFromStore(user.id, storeId);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const myAssignedStores = stores.filter(s => user?.stores?.includes(s.id));

  if (!hasPermission('users', 'crud')) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 dark:text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Access Denied</h2>
            <p className="text-red-600 dark:text-red-300">
              You don't have the required permissions to access this feature.
              Only engineers can manage user trials.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="mr-3 h-8 w-8 text-blue-600" />
            Engineer Activation Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage user trial periods and store assignments
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setActiveTab('trials')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'trials'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Trial Management
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
              activeTab === 'stores'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Store className="h-4 w-4 mr-2" />
            Store Assignments ({myAssignedStores.length})
          </button>
        </div>

        {/* Trial Management Tab */}
        {activeTab === 'trials' && (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>

            {/* Trial Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trial Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trial End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No users with active or expiring trials found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const trialEndDate = new Date(user.trialEndDate);
                    const currentDate = new Date();
                    const daysRemaining = Math.ceil((trialEndDate - currentDate) / (1000 * 60 * 60 * 24));
                    
                    let statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                    if (daysRemaining <= 0) {
                      statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                    } else if (daysRemaining <= 3) {
                      statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                    }
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <span className="text-blue-800 dark:text-blue-300 font-medium">
                                {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || user.email || 'Unknown User'}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username || user.email?.split('@')[0] || 'unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.trialStatus === 'extended' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {user.trialStatus === 'extended' ? 'Extended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {user.trialEndDate ? new Date(user.trialEndDate).toLocaleDateString() : 'N/A'} 
                            {user.trialEndDate && (
                              (() => {
                                const trialEndDate = new Date(user.trialEndDate);
                                const currentDate = new Date();
                                const diffTime = Math.abs(trialEndDate - currentDate);
                                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return daysRemaining > 0 ? (
                                  <span className="ml-2 text-xs">({daysRemaining} days left)</span>
                                ) : (
                                  <span className="ml-2 text-xs text-red-600">({Math.abs(daysRemaining)} days overdue)</span>
                                );
                              })()
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => extendTrial(user.id)}
                              disabled={user.status === 'inactive'}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                user.status === 'inactive'
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-800/30 dark:text-green-300'
                              }`}
                            >
                              Extend 30 Days
                            </button>
                            <button
                              onClick={() => deactivateUser(user.id)}
                              disabled={user.status === 'inactive'}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                user.status === 'inactive'
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-800/30 dark:text-red-300'
                              }`}
                            >
                              Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
                </table>
              </div>
            </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
            <UserCheck className="mr-2 h-5 w-5" />
            Instructions
          </h2>
          <ul className="space-y-2 text-blue-700 dark:text-blue-300 text-sm">
            <li className="flex items-start">
              <Clock className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <span><strong>Trial Period:</strong> All new users get a 7-day free trial upon signup</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <span><strong>Extension:</strong> Engineers can extend a user's trial for 30 additional days</span>
            </li>
            <li className="flex items-start">
              <UserCheck className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <span><strong>Deactivation:</strong> Engineers can deactivate users who have exceeded their trial period</span>
            </li>
            <li className="flex items-start">
              <Calendar className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <span><strong>Monitoring:</strong> Users with expiring trials (within 3 days) are highlighted in yellow</span>
            </li>
          </ul>
        </div>
          </>
        )}

        {/* Store Assignments Tab */}
        {activeTab === 'stores' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* All Stores */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Store className="h-5 w-5 mr-2 text-blue-600" />
                  All Stores in Network
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stores.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No stores found</p>
                  ) : (
                    stores.map((store) => {
                      const isAssigned = user?.stores?.includes(store.id);
                      return (
                        <div
                          key={store.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isAssigned
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{store.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{store.address || 'No address'}</p>
                          </div>
                          {isAssigned ? (
                            <button
                              onClick={() => handleRemoveFromStore(store.id)}
                              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg transition"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignToStore(store.id)}
                              className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg transition flex items-center"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Assign
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* My Assigned Stores */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Store className="h-5 w-5 mr-2 text-green-600" />
                  My Assigned Stores
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {myAssignedStores.length === 0 ? (
                    <div className="text-center py-8">
                      <Store className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        You are not assigned to any stores yet
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                        Click "Assign" on a store from the left panel
                      </p>
                    </div>
                  ) : (
                    myAssignedStores.map((store) => (
                      <div
                        key={store.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{store.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{store.address || 'No address'}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveFromStore(store.id)}
                          className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg transition flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Store Assignment Instructions */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                <Store className="mr-2 h-5 w-5" />
                Store Assignment Instructions
              </h2>
              <ul className="space-y-2 text-blue-700 dark:text-blue-300 text-sm">
                <li className="flex items-start">
                  <Shield className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span><strong>Engineer Access:</strong> As an engineer, you can oversee any store in the network</span>
                </li>
                <li className="flex items-start">
                  <Plus className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span><strong>Assign:</strong> Click "Assign" to add yourself to a store's oversight team</span>
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span><strong>Remove:</strong> Click "Remove" to remove yourself from a store</span>
                </li>
                <li className="flex items-start">
                  <Store className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span><strong>Store Visibility:</strong> You can view all stores across the network, not just assigned ones</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EngineerActivation;