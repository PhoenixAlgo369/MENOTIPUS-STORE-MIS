import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  BarChart3, 
  TrendingUp, 
  Eye,
  Store,
  Plus,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStores } from '../contexts/StoresContext';
import TrialCountdown from './TrialCountdown';

const CompanyDashboard = ({ onSelectStore }) => {
  const { user } = useAuth();
  const { stores } = useStores();
  const [companyStats, setCompanyStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    storesCount: 0
  });

  // Filter stores that belong to this user's company
  // systems_admin and admin see ALL stores (god's view)
  const userStores = ['systems_admin', 'admin', 'engineer'].includes(user?.role)
    ? stores // Show all stores
    : stores.filter(store =>
        user && (store.createdBy === user.id || (user.stores && user.stores.includes(store.id)))
      );

  useEffect(() => {
    // Calculate company-wide statistics
    // In a real app, this would aggregate data from all stores in the company
    const mockStats = {
      totalRevenue: userStores.reduce((sum, store) => sum + (Math.random() * 10000), 0),
      totalOrders: userStores.reduce((sum, store) => sum + Math.floor(Math.random() * 100), 0),
      totalProducts: userStores.reduce((sum, store) => sum + Math.floor(Math.random() * 500), 0),
      totalCustomers: userStores.reduce((sum, store) => sum + Math.floor(Math.random() * 200), 0),
      storesCount: userStores.length
    };
    
    setCompanyStats(mockStats);
  }, [user, stores]); // Removed userStores from dependencies to avoid infinite loop

  const stats = [
    { title: 'Total Revenue', value: `$${companyStats.totalRevenue.toLocaleString(undefined, {maximumFractionDigits: 2})}`, change: '+12.5%', icon: DollarSign, color: 'text-green-500' },
    { title: 'Total Orders', value: companyStats.totalOrders.toLocaleString(), change: '+8.2%', icon: ShoppingCart, color: 'text-blue-500' },
    { title: 'Total Products', value: companyStats.totalProducts.toLocaleString(), change: '+3.1%', icon: Package, color: 'text-purple-500' },
    { title: 'Total Customers', value: companyStats.totalCustomers.toLocaleString(), change: '+5.7%', icon: Users, color: 'text-yellow-500' },
    { title: 'Stores', value: companyStats.storesCount, change: '+2', icon: Store, color: 'text-indigo-500' }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-blue-600" />
          Company Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {user?.name || 'User'}. Here's an overview of your company.
        </p>
      </div>
      
      {/* Trial Countdown for non-demo users */}
      <TrialCountdown user={user} />

      {/* Company Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.color}`}>{stat.change}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Company Stores Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Store className="mr-2 h-5 w-5 text-indigo-600" />
            Your Stores
          </h2>
          <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="mr-2 h-5 w-5" />
            Add Store
          </button>
        </div>

        {userStores.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No stores yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You don't have any stores set up. Create your first store to get started.
            </p>
            <button className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              <Plus className="mr-2 h-5 w-5" />
              Create Store
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userStores.map(store => (
              <div key={store.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{store.name}</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{store.address}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Manager: {store.manager}</span>
                  <span className="text-gray-500 dark:text-gray-400">Type: {store.storeType}</span>
                </div>
                <button
                  onClick={() => onSelectStore(store)}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Enter Store
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Company Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
          Company Performance
        </h2>
        <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Performance chart would appear here</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Aggregate data from all your stores
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;