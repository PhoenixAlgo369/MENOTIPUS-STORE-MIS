import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Clock, Save, AlertTriangle, CheckCircle, RefreshCw, Bell, HelpCircle, Package, ShoppingCart, Info, Shield, Users, Package as PackageIcon, BarChart3, Settings as SettingsIcon
} from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { settings, updateSettings } = useAppSettings();
  const { user, permissions, updatePermissions } = useAuth();
  const [localSettings, setLocalSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [localPermissions, setLocalPermissions] = useState(permissions);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
    setLocalPermissions(permissions);
  }, [settings, permissions]);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePermissionChange = (role, module, value) => {
    setLocalPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [module]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await updateSettings(localSettings);
      if (user.role === 'systems_admin') {
        updatePermissions(localPermissions);
      }
      setSaveStatus('success');
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const modules = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'products', name: 'Products', icon: PackageIcon },
    { id: 'sales', name: 'Sales', icon: ShoppingCart },
    { id: 'suppliers', name: 'Suppliers', icon: Package },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: SettingsIcon }
  ];

  const roles = [
    { id: 'systems_admin', name: 'Systems Admin' },
    { id: 'admin', name: 'Admin' },
    { id: 'manager', name: 'Manager' },
    { id: 'supervisor', name: 'Supervisor' },
    { id: 'cashier', name: 'Cashier' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center mb-8">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <SettingsIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Customize your business dashboard</p>
          </div>
        </div>

        {saveStatus && (
          <div className={`mb-6 p-4 rounded-xl flex items-center ${
            saveStatus === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {saveStatus === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5 mr-3" />
                Settings saved successfully!
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 mr-3" />
                Failed to save settings. Please try again.
              </>
            )}
          </div>
        )}

        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center mb-4">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Currency</h2>
          </div>
          <select
            value={localSettings.currency || 'USD'}
            onChange={(e) => handleSettingChange('currency', e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">British Pound (£)</option>
            <option value="CAD">Canadian Dollar (C$)</option>
            <option value="KES">Kenyan Shilling (KSh)</option>
            <option value="TZS">Tanzanian Shilling (TSh)</option>
            <option value="UGX">Ugandan Shilling (USh)</option>
          </select>
        </div>

        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center mb-4">
            <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tax Rate</h2>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={localSettings.taxRate || 10}
              onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
              className="w-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-gray-700 dark:text-gray-300">%</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This tax rate will be applied to all new sales transactions
          </p>
        </div>

        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Session Timeout</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[5, 15, 30, 60].map((mins) => (
              <label 
                key={mins}
                className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <input
                  type="radio"
                  name="sessionTimeout"
                  value={mins}
                  checked={parseInt(localSettings.sessionTimeout) === mins}
                  onChange={() => handleSettingChange('sessionTimeout', mins.toString())}
                  className="mr-3 text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-gray-700 dark:text-gray-300">{mins} min{mins !== 1 ? 's' : ''}</span>
              </label>
            ))}
          </div>
        </div>

        {user.role === 'systems_admin' && (
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
            <div className="flex items-center mb-6">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Role Permissions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    {modules.map(module => (
                      <th key={module.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {module.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {roles.map(role => (
                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </td>
                      {modules.map(module => (
                        <td key={`${role.id}-${module.id}`} className="px-4 py-3 whitespace-nowrap text-center">
                          <select
                            value={localPermissions[role.id]?.[module.id] || 'none'}
                            onChange={(e) => handlePermissionChange(role.id, module.id, e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            disabled={role.id === 'systems_admin'}
                          >
                            <option value="none">None</option>
                            <option value="read">Read</option>
                            <option value="create">Create</option>
                            <option value="crud">Full CRUD</option>
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
          </div>
          {[
            { id: 'supportNotifications', label: 'Support Tickets', icon: HelpCircle, color: 'indigo' },
            { id: 'lowStockAlerts', label: 'Low Stock Alerts', icon: AlertTriangle, color: 'yellow' },
            { id: 'outOfStockAlerts', label: 'Out of Stock Alerts', icon: Package, color: 'red' },
            { id: 'salesNotifications', label: 'New Sales', icon: ShoppingCart, color: 'green' },
            { id: 'purchaseOrderNotifications', label: 'Purchase Orders', icon: Package, color: 'blue' },
            { id: 'systemNotifications', label: 'System Status', icon: Info, color: 'gray' }
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <item.icon className={`h-5 w-5 text-${item.color}-600 dark:text-${item.color}-400 mr-3`} />
                <div><h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3></div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings[item.id] !== false}
                  onChange={(e) => handleSettingChange(item.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;