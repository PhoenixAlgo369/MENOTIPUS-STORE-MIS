import React, { useState } from 'react';
import { Users, Shield, Settings, Eye, EyeOff, Edit3, Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PinVerificationModal from './PinVerificationModal';

const MasterControl = () => {
  const { user, permissions, updatePermissions, hasPermission } = useAuth();
  const [editingRole, setEditingRole] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState(null);
  
  // Define role hierarchy
  const roleHierarchy = [
    { id: 'engineer', name: 'Engineer', level: 5, description: 'Full system access' },
    { id: 'owner', name: 'Owner', level: 4, description: 'Business ownership rights' },
    { id: 'manager', name: 'Manager', level: 3, description: 'Operational management' },
    { id: 'supervisor', name: 'Supervisor', level: 2, description: 'Team supervision' },
    { id: 'cashier', name: 'Cashier', level: 1, description: 'Basic transaction processing' }
  ];

  // Define available permissions
  const permissionModules = [
    { id: 'users', name: 'User Management' },
    { id: 'products', name: 'Product Management' },
    { id: 'sales', name: 'Sales Operations' },
    { id: 'suppliers', name: 'Supplier Relations' },
    { id: 'reports', name: 'Reporting' },
    { id: 'settings', name: 'System Settings' },
    { id: 'stores', name: 'Store Management' },
    { id: 'master_data', name: 'Master Data' },
    { id: 'pos', name: 'Point of Sale' },
    { id: 'expenses', name: 'Expense Tracking' },
    { id: 'cashier_shifts', name: 'Cashier Shifts' }
  ];

  const permissionLevels = [
    { id: 'none', name: 'No Access', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    { id: 'read', name: 'Read Only', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    { id: 'create', name: 'Create', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    { id: 'crud', name: 'Full Access', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
  ];

  const handlePermissionChange = (roleId, moduleId, level) => {
    const newPermissions = {
      ...permissions,
      [roleId]: {
        ...permissions[roleId],
        [moduleId]: level
      }
    };
    
    setPinAction(() => async (pin) => {
      // In a real app, you would verify the PIN with your backend
      updatePermissions(newPermissions);
      alert('Permissions updated successfully');
      return { success: true }; // For demo purposes
    });
    
    setShowPinModal(true);
  };

  const getPermissionLevel = (roleId, moduleId) => {
    return permissions[roleId]?.[moduleId] || 'none';
  };

  const getPermissionBadge = (level) => {
    const perm = permissionLevels.find(p => p.id === level);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${perm.color}`}>
        {perm.name}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="mr-3 h-8 w-8 text-blue-600" />
            Master Control Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage roles, permissions, and company settings
          </p>
        </div>
      </div>

      {/* Role Hierarchy Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="mr-2 h-5 w-5 text-purple-600" />
          Role Hierarchy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {roleHierarchy.map(role => (
            <div 
              key={role.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
                  Level {role.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="mr-2 h-5 w-5 text-green-600" />
          Permissions Matrix
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                {permissionModules.map(module => (
                  <th key={module.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {module.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {roleHierarchy.map(role => (
                <tr key={role.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</div>
                  </td>
                  {permissionModules.map(module => (
                    <td key={`${role.id}-${module.id}`} className="px-4 py-3 whitespace-nowrap text-center">
                      <select
                        value={getPermissionLevel(role.id, module.id)}
                        onChange={(e) => handlePermissionChange(role.id, module.id, e.target.value)}
                        className="w-full max-w-[120px] mx-auto px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        {permissionLevels.map(level => (
                          <option key={level.id} value={level.id}>{level.name}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Queries Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mt-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="mr-2 h-5 w-5 text-indigo-600" />
          Support Queries Management
        </h2>
        <div className="text-gray-600 dark:text-gray-400">
          <p>Configure support queries settings for your company:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Define which roles can submit support tickets</li>
            <li>Set up automatic escalation rules</li>
            <li>Configure notification settings for different role levels</li>
            <li>Manage support ticket categories and priorities</li>
          </ul>
          <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            Configure Support Settings
          </button>
        </div>
      </div>

      {/* Company Registration Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mt-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="mr-2 h-5 w-5 text-teal-600" />
          Company Registration
        </h2>
        <div className="text-gray-600 dark:text-gray-400">
          <p>This system supports thousands of companies registering their stalls:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Each company gets isolated data and resources</li>
            <li>Role-based access control within each company</li>
            <li>Multi-tenant architecture ensures data separation</li>
            <li>Scalable infrastructure to support growth</li>
          </ul>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> The system is designed to scale to thousands of companies. 
              Each company operates independently with their own users, stores, and data.
            </p>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={pinAction}
        title="Verify Your PIN"
        message="Enter your PIN to confirm these permission changes"
      />
    </div>
  );
};

export default MasterControl;