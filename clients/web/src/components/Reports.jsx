import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Download, TrendingUp, DollarSign, Package, Users, BarChart3, PieChart as PieChartIcon, FileDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { useSales } from '../contexts/SalesContext';
import { useInventory } from '../contexts/InventoryContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

const GradientDefs = () => (
  <defs>
    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
    </linearGradient>
    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
    </linearGradient>
  </defs>
);

const Reports = () => {
  const { sales, getSalesStats } = useSales();
  const { products } = useInventory();
  const { settings } = useAppSettings();
  const [dateRange, setDateRange] = useState('7d');
  const [reportData, setReportData] = useState({ dailySales: [], topProducts: [], categoryBreakdown: [] });
  const [filters, setFilters] = useState({ customerName: '', receiptNo: '', paymentMethod: '', minAmount: '', maxAmount: '' });
  const chartRef = useRef(null);

  const salesStats = getSalesStats();

  const formatPrice = (amount) => {
    const symbol = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', KES: 'KSh', TZS: 'TSh', UGX: 'USh' }[settings.currency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  };

  useEffect(() => {
    if (sales && products) {
      generateReportData();
    }
  }, [sales, products, dateRange, filters]);

  const generateReportData = () => {
    if (!sales || !products) return;

    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const dailySalesData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const daySales = sales.filter(sale => {
        const saleDate = typeof sale.date === 'string' ? sale.date.split('T')[0] : '';
        return saleDate === dateString;
      });
      const revenue = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const profit = daySales.reduce((sum, sale) => {
        if (!sale.items) return sum;
        return sum + sale.items.reduce((itemSum, item) => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            return itemSum + ((item.price - product.costPrice) * item.quantity);
          }
          return itemSum;
        }, 0);
      }, 0);
      dailySalesData.push({
        date: dateString,
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: revenue,
        profit: profit,
        sales: daySales.length,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0
      });
    }

    const filteredSales = sales.filter(sale => {
      if (filters.customerName && !sale.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
      if (filters.receiptNo && !String(sale.id).includes(filters.receiptNo)) return false;
      if (filters.paymentMethod && sale.paymentMethod !== filters.paymentMethod) return false;
      if (filters.minAmount && sale.total < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && sale.total > parseFloat(filters.maxAmount)) return false;
      return true;
    });

    const productSales = {};
    filteredSales.forEach(sale => {
      if (!sale.items) return;
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { id: item.productId, name: item.name || 'Unknown Product', quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity || 0;
        productSales[item.productId].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });

    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const categoryBreakdown = {};
    filteredSales.forEach(sale => {
      if (!sale.items) return;
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (!categoryBreakdown[product.category]) {
            categoryBreakdown[product.category] = { name: product.category || 'Uncategorized', value: 0, count: 0 };
          }
          categoryBreakdown[product.category].value += (item.price || 0) * (item.quantity || 0);
          categoryBreakdown[product.category].count += item.quantity || 0;
        }
      });
    });

    setReportData({
      dailySales: dailySalesData,
      topProducts,
      categoryBreakdown: Object.values(categoryBreakdown)
    });
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(",")
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  if (!sales || !products) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            Track revenue, profit, and performance trends with beautiful, interactive charts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => exportToCSV(reportData.dailySales, 'daily-sales-report')}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => alert('PNG export requires additional library')}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FileDown className="h-4 w-4" />
              Export PNG
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter Transactions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Customer name"
            value={filters.customerName}
            onChange={(e) => setFilters({...filters, customerName: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          />
          <input
            type="text"
            placeholder="Receipt #"
            value={filters.receiptNo}
            onChange={(e) => setFilters({...filters, receiptNo: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          />
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
          <input
            type="number"
            placeholder="Min Amount"
            value={filters.minAmount}
            onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          />
          <input
            type="number"
            placeholder="Max Amount"
            value={filters.maxAmount}
            onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          />
          <button
            onClick={() => setFilters({ customerName: '', receiptNo: '', paymentMethod: '', minAmount: '', maxAmount: '' })}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Revenue", value: formatPrice(sales.reduce((sum, sale) => sum + (sale.total || 0), 0)), icon: DollarSign, color: "green" },
          { title: "Total Sales", value: sales.length, icon: BarChart3, color: "blue" },
          { title: "Avg Sale Value", value: sales.length > 0 ? formatPrice(sales.reduce((sum, sale) => sum + (sale.total || 0), 0) / sales.length) : formatPrice(0), icon: TrendingUp, color: "purple" },
          { title: "Products Sold", value: sales.reduce((sum, sale) => sum + (sale.items ? sale.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) : 0), 0), icon: Package, color: "yellow" }
        ].map((item, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-900/30 text-${item.color}-600 dark:text-${item.color}-400`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Revenue & Profit Trends</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Revenue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Profit</span>
              </div>
            </div>
          </div>
          <div ref={chartRef} style={{ width: '100%', height: 360 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.dailySales} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <GradientDefs />
                <CartesianGrid strokeDasharray="4 4" stroke={settings.darkMode ? '#333' : '#e0e0e0'} strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fill: settings.darkMode ? '#aaa' : '#666', fontSize: 12 }} label={{ value: 'Days', position: 'insideBottom', offset: -10, fill: settings.darkMode ? '#aaa' : '#666', fontSize: 14, fontWeight: 'bold' }} />
                <YAxis tickFormatter={(value) => formatPrice(value)} tick={{ fill: settings.darkMode ? '#aaa' : '#666', fontSize: 12 }} label={{ value: 'Amount', angle: -90, position: 'insideLeft', offset: 0, fill: settings.darkMode ? '#aaa' : '#666', fontSize: 14, fontWeight: 'bold' }} />
                <Tooltip formatter={(value, name, props) => { if (name === 'profitMargin') return `${value.toFixed(1)}%`; return formatPrice(value); }} labelFormatter={(label) => `Date: ${label}`} contentStyle={{ borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: 'none', backgroundColor: settings.darkMode ? '#222' : 'white', color: settings.darkMode ? '#fff' : '#000', padding: '16px', fontSize: '14px' }} itemStyle={{ padding: '8px 0' }} separator=": " />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} name="Revenue" fill="url(#colorRevenue)" animationDuration={1500} animationEasing="ease-out" />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} name="Profit" fill="url(#colorProfit)" animationDuration={1500} animationEasing="ease-out" />
                <ReferenceLine />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sales by Category</h3>
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value) => [formatPrice(value), 'Revenue']} contentStyle={{ borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', backgroundColor: settings.darkMode ? '#222' : 'white', color: settings.darkMode ? '#fff' : '#000', padding: '16px', fontSize: '14px' }} />
                {reportData.categoryBreakdown.length > 0 ? (
                  <Pie
                    data={reportData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {reportData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={settings.darkMode ? '#333' : '#fff'} strokeWidth={2} />
                    ))}
                  </Pie>
                ) : (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={settings.darkMode ? '#aaa' : '#666'} fontSize="16" fontWeight="bold">
                    No data available
                  </text>
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Performing Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quantity Sold</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Avg Price</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.topProducts.length > 0 ? (
                reportData.topProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
                          index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">{product.quantity} <span className="text-gray-500 dark:text-gray-400">units</span></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">{formatPrice(product.revenue)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {product.quantity > 0 ? formatPrice(product.revenue / product.quantity) : formatPrice(0)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <PieChartIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No sales data available</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Today", stats: salesStats?.today },
          { title: "This Week", stats: salesStats?.week },
          { title: "This Month", stats: salesStats?.month }
        ].map((period, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-4">{period.title}</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sales</span>
                <span className="font-bold text-gray-900 dark:text-white">{period.stats?.count || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPrice(period.stats?.total || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Sale</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {period.stats?.count > 0 ? formatPrice(period.stats?.total / period.stats?.count) : formatPrice(0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;