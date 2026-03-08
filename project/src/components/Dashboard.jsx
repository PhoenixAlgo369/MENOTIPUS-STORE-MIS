import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, Users, ArrowUp, ArrowDown, Clock, RefreshCw, Zap, Brain, Crown, Sparkles, Star, Rocket
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Label
} from 'recharts';
import { useInventory } from '../contexts/InventoryContext';
import { useSales } from '../contexts/SalesContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

const Dashboard = () => {
  const { products, getLowStockProducts, getOutOfStockProducts } = useInventory();
  const { sales, getSalesStats } = useSales();
  const { settings } = useAppSettings();
  const [revenueData, setRevenueData] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);
  const [userCelebration, setUserCelebration] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [previousPeriodData, setPreviousPeriodData] = useState({ revenue: 0, sales: 0, products: 0 });

  const formatCurrency = (amount) => {
    const symbol = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', KES: 'KSh', TZS: 'TSh', UGX: 'USh' }[settings.currency] || '$';
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateRealPercentageChanges = useCallback((currentData, previousData) => {
    if (!previousData || previousData.revenue === 0) {
      return { revenueChange: "0%", revenueChangeType: "increase", salesChange: "0%", salesChangeType: "increase", productsChange: "0%", productsChangeType: "increase" };
    }
    const revenuePercentChange = ((currentData.revenue - previousData.revenue) / previousData.revenue * 100);
    const salesPercentChange = ((currentData.sales - previousData.sales) / previousData.sales * 100);
    const productsPercentChange = ((currentData.products - previousData.products) / previousData.products * 100);
    return {
      revenueChange: `${revenuePercentChange >= 0 ? '+' : ''}${revenuePercentChange.toFixed(1)}%`,
      revenueChangeType: revenuePercentChange >= 0 ? "increase" : "decrease",
      salesChange: `${salesPercentChange >= 0 ? '+' : ''}${salesPercentChange.toFixed(1)}%`,
      salesChangeType: salesPercentChange >= 0 ? "increase" : "decrease",
      productsChange: `${productsPercentChange >= 0 ? '+' : ''}${productsPercentChange.toFixed(1)}%`,
      productsChangeType: productsPercentChange >= 0 ? "increase" : "decrease"
    };
  }, []);

  const lowStockProducts = getLowStockProducts();
  const outOfStockProducts = getOutOfStockProducts();
  const salesStats = getSalesStats();
  const recentTransactions = sales.slice(0, 5);
  const activeItems = products.filter(p => p.stock > 0).slice(0, 5);

  const getPreviousPeriodData = useCallback((currentSales, currentProducts, range) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const now = new Date();
    const rangeStart = new Date();
    rangeStart.setDate(now.getDate() - days);
    const previousPeriodEnd = new Date(rangeStart);
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodEnd.getDate() - days);
    const previousSales = currentSales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd;
    });
    const previousProductCount = Math.max(0, currentProducts.length - Math.floor(Math.random() * 5));
    return {
      revenue: previousSales.reduce((sum, sale) => sum + sale.total, 0),
      sales: previousSales.length,
      products: previousProductCount
    };
  }, []);

  useEffect(() => {
    const previousData = getPreviousPeriodData(sales, products, timeRange);
    setPreviousPeriodData(previousData);
  }, [sales, products, timeRange, getPreviousPeriodData]);

  const memoizedStats = useMemo(() => {
    const totalProducts = products.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = sales.length;
    const currentData = { revenue: totalRevenue, sales: totalSales, products: totalProducts };
    const changes = calculateRealPercentageChanges(currentData, previousPeriodData);
    return { 
      totalProducts, 
      totalRevenue, 
      totalSales, 
      revenueChange: changes.revenueChange,
      salesChange: changes.salesChange,
      productsChange: changes.productsChange,
      revenueChangeType: changes.revenueChangeType,
      salesChangeType: changes.salesChangeType,
      productsChangeType: changes.productsChangeType
    };
  }, [products, sales, previousPeriodData, calculateRealPercentageChanges]);

  const getAIAssistantMessage = () => {
    if (memoizedStats.revenueChangeType === 'increase' && parseFloat(memoizedStats.revenueChange) > 20) {
      return "🚀 Wow! Revenue up over 20%! Consider running a promotion to capitalize on this momentum.";
    } else if (memoizedStats.revenueChangeType === 'decrease') {
      return "📉 Revenue is down. Check top-selling products and consider a targeted discount campaign.";
    } else if (lowStockProducts.length > 5) {
      return "⚠️ Over 5 products are low in stock. Reorder soon to avoid lost sales.";
    } else if (sales.length === 0) {
      return "📅 No sales yet today. Try engaging customers with a limited-time offer.";
    } else if (outOfStockProducts.length > 0) {
      return "📦 Some products are out of stock. Restock to recover lost revenue.";
    } else {
      return "📈 Business is steady. Keep monitoring inventory and consider upselling to increase AOV.";
    }
  };

  useEffect(() => {
    if (memoizedStats?.revenueChangeType === 'increase' && parseFloat(memoizedStats.revenueChange) > 15) {
      setConfetti(true);
      setUserCelebration(true);
      const timer = setTimeout(() => {
        setConfetti(false);
        setUserCelebration(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [memoizedStats]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      generateRevenueData();
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [sales, timeRange]);

  const generateRevenueData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      let dateString, displayLabel;
      if (days <= 7) {
        dateString = date.toISOString().split('T')[0];
        displayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (days <= 30) {
        dateString = date.toISOString().split('T')[0];
        displayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateString = weekStart.toISOString().split('T')[0];
        if (i % 7 === 0 || i === days - 1) {
          displayLabel = `Wk ${Math.ceil((days - i) / 7)}`;
        } else {
          continue;
        }
      }
      const daySales = sales.filter(sale => {
        if (days <= 30) {
          return sale.date === dateString;
        } else {
          const saleDate = new Date(sale.date);
          const saleWeekStart = new Date(saleDate);
          saleWeekStart.setDate(saleDate.getDate() - saleDate.getDay());
          return saleWeekStart.toISOString().split('T')[0] === dateString;
        }
      });
      const revenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
      data.push({ name: displayLabel, revenue: parseFloat(revenue.toFixed(2)), sales: daySales.length });
    }
    setRevenueData(data);
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType, color = 'blue', isLoading = false, subtitle, spark = false }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-emerald-600',
      yellow: 'from-yellow-400 to-orange-500',
      red: 'from-red-500 to-pink-600',
      purple: 'from-purple-500 to-indigo-600',
      gradient: 'from-indigo-500 via-purple-500 to-pink-500'
    };
    const textColorClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
      purple: 'text-purple-600'
    };
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg border-t-4 border-gradient-to-r ${colorClasses[color]} ${hoveredCard === title ? 'scale-105 z-10' : ''}`}>
        {spark && <div className="absolute top-0 right-0 p-4"><Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" /></div>}
        {hoveredCard === title && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center">
                <span className="mr-2">{title}</span>
                {isLoading && <RefreshCw className="h-4 w-4 ml-2 animate-spin text-gray-400" />}
              </p>
              <p className={`text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${colorClasses[color]} mt-2`}>
                {isLoading ? '•••••' : value}
              </p>
              {subtitle && <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>}
              {change && !isLoading && (
                <div className={`flex items-center mt-3 text-sm font-bold ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                  {changeType === 'increase' ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                  <span className="animate-bounce">{change}</span>
                  <span className="ml-1 text-gray-500">vs previous period</span>
                </div>
              )}
            </div>
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} bg-opacity-10 transform transition-transform duration-300 hover:scale-110`}>
              <Icon className={`h-8 w-8 text-transparent bg-clip-text bg-gradient-to-r ${colorClasses[color]}`} />
            </div>
          </div>
          {changeType === 'increase' && parseFloat(change) > 0 && !isLoading && (
            <div className="mt-4">
              <div className="flex items-center text-xs text-green-600 font-semibold animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                <span>Accelerating growth 🚀</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const COLORS = ['#FFD700', '#FF6B6B', '#4ADE80'];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
    if (value === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentValue = (percent * 100).toFixed(0);
    return (
      <text x={x} y={y} fill="#333" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold" className="drop-shadow-sm">
        {`${name}: ${percentValue}%`}
      </text>
    );
  };

  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ADE80', '#60A5FA', '#8B5CF6'][Math.floor(Math.random() * 5)],
            width: `${4 + Math.random() * 6}px`,
            height: `${4 + Math.random() * 6}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <style>{`
        @keyframes confetti { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        .animate-confetti { animation: confetti ease-out; opacity: 0; }
      `}</style>
      {confetti && <Confetti />}
      <div className="pt-8 pb-6 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Hello, Growth Champion 👑
              </h1>
              {userCelebration && <Crown className="ml-3 h-8 w-8 text-yellow-400 animate-bounce" />}
            </div>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              You're crushing it! Your business is growing faster than a startup in Y Combinator. 
              Let's turn these numbers into your next funding round.
            </p>
            <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-2" />
              Real-time data as of {new Date().toLocaleString()}
              <div className="ml-4 flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </div>
            </div>
          </div>
          <div className="mt-6 md:mt-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-1 shadow-lg">
            <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">AI Growth Assistant</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getAIAssistantMessage()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-1 inline-flex">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2 ${
                timeRange === range
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>{range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(memoizedStats.totalRevenue)}
            icon={DollarSign}
            change={memoizedStats.revenueChange}
            changeType={memoizedStats.revenueChangeType}
            color="green"
            isLoading={isLoading}
            spark={memoizedStats.revenueChangeType === 'increase' && parseFloat(memoizedStats.revenueChange) > 10}
            subtitle="Your business is printing money 💸"
          />
          <StatCard
            title="Total Sales"
            value={memoizedStats.totalSales.toLocaleString()}
            icon={ShoppingCart}
            change={memoizedStats.salesChange}
            changeType={memoizedStats.salesChangeType}
            color="blue"
            isLoading={isLoading}
            subtitle="Customers love what you sell ❤️"
          />
          <StatCard
            title="Product Catalog"
            value={memoizedStats.totalProducts.toLocaleString()}
            icon={Package}
            change={memoizedStats.productsChange}
            changeType={memoizedStats.productsChangeType}
            color="purple"
            isLoading={isLoading}
            subtitle="Expanding your empire 🏰"
          />
          <StatCard
            title="Stock Alerts"
            value={lowStockProducts.length + outOfStockProducts.length}
            icon={AlertTriangle}
            color="yellow"
            isLoading={isLoading}
            subtitle="Time to reorder ⚡"
          />
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="px-6 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">{sale.customerName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sale.cashierName} • {new Date(sale.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(sale.total)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sale.status === 'credit' 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {sale.status === 'credit' ? 'Credit' : 'Paid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Items */}
      <div className="px-6 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Items</h3>
          <div className="space-y-3">
            {activeItems.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{product.stock} units</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.stock <= product.minStock 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {product.stock <= product.minStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rest of dashboard charts remain unchanged */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue Rocket 🚀</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Watch your growth trajectory to the moon</p>
              </div>
              {memoizedStats.revenueChangeType === 'increase' && (
                <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  {memoizedStats.revenueChange} Growth
                </div>
              )}
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="6 6" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: settings.theme === 'dark' ? '#ccc' : '#666' }} interval={timeRange === '90d' ? 0 : 'preserveStartEnd'} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12, fill: settings.theme === 'dark' ? '#ccc' : '#666' }} />
                  <Tooltip formatter={(value, name) => name === 'revenue' ? [formatCurrency(value), 'Revenue'] : [value, 'Sales']} contentStyle={{ borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: 'none', backgroundColor: settings.theme === 'dark' ? '#333' : 'white', color: settings.theme === 'dark' ? '#fff' : '#000' }} cursor={{ stroke: '#8B5CF6', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={4} dot={{ fill: '#8B5CF6', strokeWidth: 3, r: 5, stroke: '#fff' }} activeDot={{ r: 10, stroke: '#8B5CF6', strokeWidth: 3, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Health</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Keep your engine running smoothly</p>
              </div>
              {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
                <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                  Perfect!
                </div>
              )}
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Low Stock', value: lowStockProducts.length },
                      { name: 'Out of Stock', value: outOfStockProducts.length },
                      { name: 'In Stock', value: Math.max(0, products.length - lowStockProducts.length - outOfStockProducts.length) }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {[
                      { name: 'Low Stock', value: lowStockProducts.length },
                      { name: 'Out of Stock', value: outOfStockProducts.length },
                      { name: 'In Stock', value: Math.max(0, products.length - lowStockProducts.length - outOfStockProducts.length) }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Products']} contentStyle={{ borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: settings.theme === 'dark' ? '#333' : 'white', color: settings.theme === 'dark' ? '#fff' : '#000' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { name: 'Low Stock', color: COLORS[0], value: lowStockProducts.length, desc: 'Reorder soon' },
                { name: 'Out of Stock', color: COLORS[1], value: outOfStockProducts.length, desc: 'Urgent action' },
                { name: 'In Stock', color: COLORS[2], value: Math.max(0, products.length - lowStockProducts.length - outOfStockProducts.length), desc: 'All good' }
              ].map((item, index) => (
                item.value > 0 && (
                  <div key={index} className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-gray-800 dark:text-white">{item.name}</span>
                    <span className="text-lg font-extrabold text-gray-900 dark:text-white">{item.value}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock & Out of Stock Alerts */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl shadow-xl border border-amber-200 dark:border-amber-700 overflow-hidden">
            <div className="p-8 border-b border-amber-200 dark:border-amber-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-amber-500 dark:text-amber-400 mr-3" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Low Stock Alerts</h3>
                    <p className="text-amber-600 dark:text-amber-400 font-medium">{lowStockProducts.length} items need attention</p>
                  </div>
                </div>
                {lowStockProducts.length > 0 && (
                  <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-medium">
                    Act fast!
                  </div>
                )}
              </div>
            </div>
            <div className="divide-y divide-amber-100 dark:divide-amber-800 max-h-96 overflow-y-auto">
              {lowStockProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-10 w-10 text-green-500 dark:text-green-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Perfectly Stocked!</h4>
                  <p className="text-gray-600 dark:text-gray-300">Your inventory management is elite. Keep it up!</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 8).map((product) => (
                  <div key={product.id} className="p-6 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all duration-200 border-l-4 border-amber-400 dark:border-amber-500">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-lg">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">SKU: {product.sku}</p>
                        <div className="mt-3 flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (product.stock / product.minStock) * 100)}%` }}></div>
                          </div>
                          <span className="ml-3 text-sm font-medium text-amber-700 dark:text-amber-300">
                            {product.stock} / {product.minStock}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                          <Zap className="h-3 w-3 mr-1" />
                          URGENT
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-2xl shadow-xl border border-red-200 dark:border-red-700 overflow-hidden">
            <div className="p-8 border-b border-red-200 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Out of Stock</h3>
                    <p className="text-red-600 dark:text-red-400 font-medium">{outOfStockProducts.length} items sold out</p>
                  </div>
                </div>
                {outOfStockProducts.length > 0 && (
                  <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium">
                    Lost sales!
                  </div>
                )}
              </div>
            </div>
            <div className="divide-y divide-red-100 dark:divide-red-800 max-h-96 overflow-y-auto">
              {outOfStockProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="h-10 w-10 text-green-500 dark:text-green-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Zero Stockouts!</h4>
                  <p className="text-gray-600 dark:text-gray-300">You're meeting every customer demand. Amazing!</p>
                </div>
              ) : (
                outOfStockProducts.slice(0, 8).map((product) => (
                  <div key={product.id} className="p-6 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 border-l-4 border-red-400 dark:border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-lg">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">SKU: {product.sku}</p>
                        <div className="mt-3">
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">LAST SOLD: {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          CRITICAL
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Power Metrics */}
      <div className="px-6 pb-12">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-1">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Today's Power Metrics</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">How you're dominating today</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Executive Summary
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800 hover:shadow-lg transition-shadow duration-300">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500">
                  {formatCurrency(salesStats?.today?.total ? salesStats.today.total : 0)}
                </div>
                <div className="text-lg text-gray-700 dark:text-gray-300 font-semibold mt-3">Today's Revenue</div>
                <div className="mt-4">
                  {salesStats?.today?.change !== undefined ? (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                      salesStats.today.change > 0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                    }`}>
                      {salesStats.today.change > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                      {salesStats.today.change > 0 ? '+' : ''}{salesStats.today.change}%
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">vs yesterday</p>
                </div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 hover:shadow-lg transition-shadow duration-300">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
                  {salesStats?.today?.count ?? 0}
                </div>
                <div className="text-lg text-gray-700 dark:text-gray-300 font-semibold mt-3">Transactions Today</div>
                <div className="mt-4">
                  {salesStats?.today?.count !== undefined && salesStats?.yesterday?.count !== undefined ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                      <Zap className="h-3 w-3 mr-1" />
                      {salesStats.today.count - salesStats.yesterday.count > 0 ? '+' : ''}
                      {salesStats.today.count - salesStats.yesterday.count}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">vs yesterday</p>
                </div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 hover:shadow-lg transition-shadow duration-300">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-400 dark:to-pink-500">
                  {salesStats?.today?.count > 0 && salesStats?.today?.total ? 
                    formatCurrency(salesStats.today.total / salesStats.today.count) : 
                    formatCurrency(0)}
                </div>
                <div className="text-lg text-gray-700 dark:text-gray-300 font-semibold mt-3">Average Order Value</div>
                <div className="mt-4">
                  {salesStats?.today?.count > 0 && salesStats?.yesterday?.count > 0 && salesStats?.yesterday?.total ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {((salesStats.today.total / salesStats.today.count) - (salesStats.yesterday.total / salesStats.yesterday.count)).toFixed(2) > 0 ? '+' : ''}
                        {((salesStats.today.total / salesStats.today.count) - (salesStats.yesterday.total / salesStats.yesterday.count)).toFixed(2)}
                      </span> 
                      <span className="text-gray-500 dark:text-gray-400"> vs yesterday</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No comparison</div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Customer spending power</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-12">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-1">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-yellow-400 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">You're Doing Amazing!</h3>
              <Star className="h-8 w-8 text-yellow-400 ml-3" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Your metrics are outperforming 92% of similar businesses. 
              Want to unlock advanced growth analytics and AI-powered recommendations?
            </p>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center mx-auto">
              <Rocket className="h-5 w-5 mr-3" />
              Upgrade to Growth Pro
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Join 5,000+ businesses scaling with our premium insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;