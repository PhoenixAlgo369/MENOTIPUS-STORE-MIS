// src/components/Header.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  HelpCircle,
  ChevronDown,
  AlertTriangle, // ✅ For high-priority
  ShoppingCart,
  Package,
  CheckCircle,
  Info,
  MessageSquare,
  Store
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { useSales } from '../contexts/SalesContext';
import { useSuppliers } from '../contexts/SuppliersContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useSupportTickets } from '../contexts/SupportTicketsContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

// ✅ ICON MAP — Converts string names to actual Lucide React components
const IconMap = {
  AlertTriangle,
  MessageSquare,
  ShoppingCart,
  Package,
  CheckCircle,
  Info,
  Bell,
  HelpCircle,
};

// ✅ PRIORITY ORDER FOR SORTING (High first)
const PRIORITY_ORDER = {
  high: 1,
  warning: 2,
  info: 3,
  success: 4,
  error: 5,
  default: 6
};

const Header = ({ user, onMenuClick, setActiveView, selectedStore, onStoreChange }) => {
  const { logout } = useAuth();
  const { products, getLowStockProducts, getOutOfStockProducts, getLowStockProductsCrossStore, getOutOfStockProductsCrossStore } = useInventory();
  const { sales } = useSales();
  const { purchaseOrders } = useSuppliers();
  const { supportTickets } = useSupportTickets();
  const { settings, updateSettings } = useAppSettings();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(Date.now());
  
  const [userLastLogin, setUserLastLogin] = useState(() => {
    const saved = localStorage.getItem(`userLastLogin_${user?.id}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  
  useEffect(() => {
    if (user?.id) {
      const now = Date.now();
      localStorage.setItem(`userLastLogin_${user.id}`, now.toString());
      setUserLastLogin(now);
    }
  }, [user?.id]);

  const generateNotifications = () => {
    const newNotifications = [];
    const now = Date.now();
    const generationId = `${now}-${user?.id || 'unknown'}`;
    
    if (notificationGenerationRef.current.has(generationId)) {
      return [];
    }
    
    notificationGenerationRef.current.add(generationId);
    const cutoffTime = userLastLogin || 0;
    
    // Support Notifications from localStorage (legacy/manual)
    const supportNotifications = [];
    try {
      const stored = localStorage.getItem('pendingSupportNotifications');
      if (stored) {
        const pending = JSON.parse(stored);
        supportNotifications.push(...pending);
        localStorage.removeItem('pendingSupportNotifications');
      }
    } catch (e) {
      console.error('Error parsing pending support notifications');
    }

    // ✅ Process support notifications — now supports forUserEmail
    supportNotifications.forEach(notif => {
      if (
        (notif.forRole && notif.forRole === user?.role) ||
        (notif.forUserId && notif.forUserId === user?.id) ||
        (notif.forUserEmail && notif.forUserEmail === user?.email) ||
        notif.forRole === 'all'
      ) {
        newNotifications.push({
          ...notif,
          time: new Date(notif.time),
          read: false
        });
      }
    });

    // Support Ticket Notifications — New Tickets & Admin Replies
    supportTickets.forEach(ticket => {
      const ticketCreatedAt = new Date(ticket.createdAt).getTime();
      const ticketRespondedAt = ticket.respondedAt ? new Date(ticket.respondedAt).getTime() : null;
      
      // ✅ CASE 1: Notify ADMINS about ANY unaddressed ticket (even if created before their login)
      if (ticket.status !== 'addressed') {
        const wasAlreadyNotified = localStorage.getItem(`supportTicket_admin_seen_${ticket.id}_${user?.id}`) === 'true';
        
        if (!wasAlreadyNotified && user?.role === 'admin') {
          // ✅ Detect high-priority tickets
          const isHighPriority = ticket.priority === 'high';
          newNotifications.push({
            id: `support-new-${ticket.id}-${now}`,
            type: isHighPriority ? 'high' : 'warning', // ✅ Use 'high' type
            iconName: isHighPriority ? 'AlertTriangle' : 'MessageSquare', // ✅ High = AlertTriangle
            title: isHighPriority ? '🚨 URGENT: New Support Ticket' : 'New Support Ticket',
            message: `From ${ticket.name} (${ticket.email}): ${ticket.subject}`,
            time: new Date(ticket.createdAt),
            read: false,
            category: 'support',
            ticketId: ticket.id,
            priority: ticket.priority || 'normal' // ✅ Store priority for sorting
          });
          localStorage.setItem(`supportTicket_admin_seen_${ticket.id}_${user?.id}`, 'true');
        }
      }

      // ✅ CASE 2: Admin replied → notify original submitter (cashier/user)
      if (ticketRespondedAt && ticketRespondedAt > cutoffTime) {
        const wasAlreadyNotifiedReply = localStorage.getItem(`supportTicket_reply_${ticket.id}_${user?.id}`) === 'true';
        
        // Check if current user is the ticket submitter (by email or name)
        const isTicketSubmitter = user?.email === ticket.email || user?.name === ticket.name;
        
        if (!wasAlreadyNotifiedReply && isTicketSubmitter) {
          newNotifications.push({
            id: `support-reply-${ticket.id}-${now}`,
            type: 'info',
            iconName: 'MessageSquare',
            title: 'Admin Replied to Your Ticket',
            message: `Re: "${ticket.subject}" — ${ticket.adminResponse.substring(0, 50)}${ticket.adminResponse.length > 50 ? '...' : ''}`,
            time: new Date(ticket.respondedAt),
            read: false,
            category: 'support',
            ticketId: ticket.id,
            priority: 'normal'
          });
          localStorage.setItem(`supportTicket_reply_${ticket.id}_${user?.id}`, 'true');
        }
      }
    });

    // Low Stock Alerts - Cross Store
    const lowStockProducts = selectedStore ? getLowStockProducts() : getLowStockProductsCrossStore();
    lowStockProducts.forEach(product => {
      const wasAlreadyLow = localStorage.getItem(`lowStock_${product.id}_${user?.id}`) === 'true';

      if (!wasAlreadyLow) {
        const storeInfo = product.storeId ? `(Store ID: ${product.storeId})` : '';
        newNotifications.push({
          id: `low-stock-${product.id}-${now}`,
          type: 'warning',
          iconName: 'AlertTriangle',
          title: selectedStore ? 'Low Stock Alert' : `Low Stock Alert ${storeInfo}`,
          message: `${product.name} is running low (${product.stock} left) ${storeInfo ? 'at ' + storeInfo : ''}`,
          time: new Date(),
          read: false,
          category: 'inventory',
          productId: product.id,
          storeId: product.storeId,
          priority: 'normal'
        });
        localStorage.setItem(`lowStock_${product.id}_${user?.id}`, 'true');
      }
    });

    // Out of Stock Alerts - Cross Store
    const outOfStockProducts = selectedStore ? getOutOfStockProducts() : getOutOfStockProductsCrossStore();
    outOfStockProducts.forEach(product => {
      const wasAlreadyOutOfStock = localStorage.getItem(`outOfStock_${product.id}_${user?.id}`) === 'true';

      if (!wasAlreadyOutOfStock) {
        const storeInfo = product.storeId ? `(Store ID: ${product.storeId})` : '';
        newNotifications.push({
          id: `out-of-stock-${product.id}-${now}`,
          type: 'error',
          iconName: 'Package',
          title: selectedStore ? 'Out of Stock' : `Out of Stock ${storeInfo}`,
          message: `${product.name} is out of stock ${storeInfo ? 'at ' + storeInfo : ''}`,
          time: new Date(),
          read: false,
          category: 'inventory',
          productId: product.id,
          storeId: product.storeId,
          priority: 'normal'
        });
        localStorage.setItem(`outOfStock_${product.id}_${user?.id}`, 'true');
      }
    });
    
    // Recent Sales
    const recentSales = sales.filter(sale => {
      const saleDate = new Date(sale.date).getTime();
      return saleDate > cutoffTime && (now - saleDate) < 24 * 60 * 60 * 1000;
    });
    
    recentSales.slice(0, 3).forEach(sale => {
      newNotifications.push({
        id: `sale-${sale.id}-${now}`,
        type: 'success',
        iconName: 'ShoppingCart',
        title: 'New Sale',
        message: `Order #${sale.id} processed for $${sale.total.toFixed(2)}`,
        time: new Date(sale.date),
        read: false,
        category: 'sales',
        saleId: sale.id,
        priority: 'normal'
      });
    });
    
    // Pending Purchase Orders
    const pendingPOs = purchaseOrders.filter(po => {
      const poCreated = new Date(po.createdAt || po.date).getTime();
      return po.status === 'pending' && poCreated > cutoffTime;
    });
    
    pendingPOs.slice(0, 2).forEach(po => {
      newNotifications.push({
        id: `po-${po.id}-${now}`,
        type: 'info',
        iconName: 'Package',
        title: 'Pending Purchase Order',
        message: `PO #${po.poNumber} for ${po.supplierName} is pending`,
        time: new Date(po.createdAt || po.date),
        read: false,
        category: 'purchases',
        poId: po.id,
        priority: 'normal'
      });
    });
    
    // Recently Delivered POs
    const recentDeliveredPOs = purchaseOrders.filter(po => {
      if (!po.deliveryDate) return false;
      const deliveryTime = new Date(po.deliveryDate).getTime();
      return po.status === 'delivered' && deliveryTime > cutoffTime && (now - deliveryTime) < 24 * 60 * 60 * 1000;
    });
    
    recentDeliveredPOs.slice(0, 2).forEach(po => {
      newNotifications.push({
        id: `delivered-po-${po.id}-${now}`,
        type: 'success',
        iconName: 'CheckCircle',
        title: 'Purchase Order Delivered',
        message: `PO #${po.poNumber} from ${po.supplierName} has been delivered`,
        time: new Date(po.deliveryDate),
        read: false,
        category: 'purchases',
        poId: po.id,
        priority: 'normal'
      });
    });
    
    // System Check Notification (every 5 minutes)
    const minutesSinceLastCheck = (now - lastChecked) / (60 * 1000);
    if (minutesSinceLastCheck > 5) {
      newNotifications.push({
        id: `system-check-${now}`,
        type: 'info',
        iconName: 'Info',
        title: 'System Status',
        message: 'System running normally. Last check completed.',
        time: new Date(),
        read: false,
        category: 'system',
        priority: 'normal'
      });
      setLastChecked(now);
    }
    
    // ✅ SORT NOTIFICATIONS BY PRIORITY
    return newNotifications.sort((a, b) => {
      const aPriority = PRIORITY_ORDER[a.type] || PRIORITY_ORDER.default;
      const bPriority = PRIORITY_ORDER[b.type] || PRIORITY_ORDER.default;
      return aPriority - bPriority; // High (1) comes before Warning (2), etc.
    });
  };

  const notificationGenerationRef = useRef(new Set());

  useEffect(() => {
    if (!user?.id) return;
    
    const newNotifications = generateNotifications();
    if (newNotifications.length === 0) return;
    
    setNotifications(prev => {
      const recentNotifications = prev.filter(n => {
        const notificationAge = Date.now() - n.time.getTime();
        return notificationAge < 24 * 60 * 60 * 1000;
      });
      
      const existingIds = new Set(recentNotifications.map(n => n.id));
      const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
      
      if (uniqueNewNotifications.length > 0) {
        return [...recentNotifications, ...uniqueNewNotifications];
      }
      
      return prev;
    });
  }, [products, sales, purchaseOrders, supportTickets, lastChecked, user?.id]);

  // Listen for new support notifications from other tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'newSupportNotification' && e.newValue) {
        try {
          const notif = JSON.parse(e.newValue);
          if (
            (notif.forRole && notif.forRole === user?.role) ||
            (notif.forUserId && notif.forUserId === user?.id) ||
            (notif.forUserEmail && notif.forUserEmail === user?.email) ||
            notif.forRole === 'all'
          ) {
            setNotifications(prev => [
              ...prev,
              {
                ...notif,
                time: new Date(notif.time),
                read: false
              }
            ]);
          }
        } catch (err) {
          console.error('Error handling new support notification');
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user?.id, user?.role, user?.email]);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.user-dropdown');
      const notificationsDropdown = document.querySelector('.notifications-dropdown');
      
      if (dropdown && !dropdown.contains(event.target) && !event.target.closest('.user-trigger')) {
        setShowDropdown(false);
      }
      
      if (notificationsDropdown && !notificationsDropdown.contains(event.target) && !event.target.closest('.notifications-trigger')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    // Redirect to support view if it's a support ticket
    const notification = notifications.find(n => n.id === id);
    if (notification?.category === 'support') {
      setActiveView('support-queries');
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'high': // ✅ NEW: High priority = red
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  // ✅ FIXED: Now safely handles iconName strings
  const getNotificationIcon = (iconNameOrComponent, type) => {
    let IconComponent = null;

    if (typeof iconNameOrComponent === 'string') {
      IconComponent = IconMap[iconNameOrComponent];
    } else if (typeof iconNameOrComponent === 'function' || (iconNameOrComponent && typeof iconNameOrComponent.type === 'function')) {
      // Fallback for legacy component format
      IconComponent = iconNameOrComponent;
    }

    // Fallback if icon not found
    if (!IconComponent) {
      console.warn(`Icon "${iconNameOrComponent}" not found in IconMap`);
      IconComponent = Info;
    }

    return (
      <div className={`p-2 rounded-full ${getNotificationColor(type)}`}>
        <IconComponent className="h-4 w-4" />
      </div>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 fixed top-0 left-0 right-0 z-50 transition-colors duration-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center ml-2 lg:ml-0">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-2 mr-3 shadow-sm">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">TM</span>
                </div>
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Metanopus</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sales & Inventory System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {selectedStore && (
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm font-medium text-blue-800 dark:text-blue-300">
                <Store className="inline mr-1 h-4 w-4" />
                {selectedStore.name}
              </div>
            )}
            <ThemeToggle />

            <div className="relative notifications-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="notifications-trigger p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-white relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 transition-all duration-200 animate-fadeIn max-h-96 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <div className="flex space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark all as read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No new notifications</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">We'll alert you to important updates</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map(notification => {
                        return (
                          <div 
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors cursor-pointer ${
                              !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex space-x-3">
                              {getNotificationIcon(notification.iconName || notification.icon, notification.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {getTimeAgo(notification.time)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative user-dropdown">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="user-trigger flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                </div>
                
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                
                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-300" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 transition-all duration-200 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setShowDropdown(false);
                        setActiveView('settings');
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowDropdown(false);
                        setActiveView('contact');
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span>Help & Support</span>
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button 
                      onClick={logout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;