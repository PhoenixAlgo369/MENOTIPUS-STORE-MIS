import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Activity, 
  Calendar,
  Download,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MasterData = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [data, setData] = useState({
    sales: [],
    inventory: [],
    customers: [],
    suppliers: [],
    users: []
  });
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API calls to fetch data from all modules
    const fetchData = async () => {
      setLoading(true);
      
      // In a real app, this would be API calls to fetch data from all modules
      setTimeout(() => {
        setData({
          sales: [
            { date: '2023-01', revenue: 4000, orders: 240, profit: 2400 },
            { date: '2023-02', revenue: 3000, orders: 138, profit: 2210 },
            { date: '2023-03', revenue: 2000, orders: 149, profit: 2290 },
            { date: '2023-04', revenue: 2780, orders: 139, profit: 2000 },
            { date: '2023-05', revenue: 1890, orders: 148, profit: 2181 },
            { date: '2023-06', revenue: 2390, orders: 139, profit: 2500 }
          ],
          inventory: [
            { category: 'Electronics', count: 400 },
            { category: 'Clothing', count: 300 },
            { category: 'Home & Kitchen', count: 300 },
            { category: 'Beauty', count: 200 },
            { category: 'Sports', count: 278 },
            { category: 'Books', count: 189 }
          ],
          customers: [
            { month: 'Jan', new: 40, returning: 240 },
            { month: 'Feb', new: 30, returning: 138 },
            { month: 'Mar', new: 20, returning: 149 },
            { month: 'Apr', new: 27, returning: 139 },
            { month: 'May', new: 18, returning: 148 },
            { month: 'Jun', new: 23, returning: 139 }
          ],
          topProducts: [
            { name: 'Laptop', sold: 120, revenue: 48000 },
            { name: 'Smartphone', sold: 98, revenue: 39200 },
            { name: 'Headphones', sold: 85, revenue: 8500 },
            { name: 'Tablet', sold: 65, revenue: 19500 },
            { name: 'Watch', sold: 52, revenue: 10400 }
          ],
          alerts: [
            { id: 1, type: 'low_stock', message: 'Product A is running low on stock', severity: 'high' },
            { id: 2, type: 'expiring', message: 'Batch of Product B expires next week', severity: 'medium' },
            { id: 3, type: 'low_sales', message: 'Product C has low sales this month', severity: 'low' }
          ]
        });
        setLoading(false);
      }, 1000);
    };

    fetchData();
  }, [timeRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const stats = [
    { title: 'Total Revenue', value: '$24,580', change: '+12.5%', icon: DollarSign, color: 'text-green-500' },
    { title: 'Total Orders', value: '1,248', change: '+8.2%', icon: ShoppingCart, color: 'text-blue-500' },
    { title: 'Active Products', value: '342', change: '+3.1%', icon: Package, color: 'text-purple-500' },
    { title: 'New Customers', value: '128', change: '+5.7%', icon: Users, color: 'text-yellow-500' }
  ];

  if (loading) {
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
            <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
            Master Data Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive overview of all business data
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
            <Download className="mr-2 h-5 w-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Alerts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
            System Alerts
          </h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {data.alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`flex items-center p-3 rounded-lg ${
                alert.severity === 'high' 
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                  : alert.severity === 'medium'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}
            >
              <AlertTriangle className={`h-5 w-5 mr-3 ${
                alert.severity === 'high' 
                  ? 'text-red-500' 
                  : alert.severity === 'medium'
                  ? 'text-yellow-500'
                  : 'text-blue-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
              </div>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
            Revenue Overview
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.sales}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Package className="mr-2 h-5 w-5 text-purple-500" />
            Inventory Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={data.inventory}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.inventory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5 text-blue-500" />
            Top Selling Products
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topProducts}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sold" fill="#3b82f6" name="Units Sold" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5 text-green-500" />
            Customer Growth
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.customers}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="new" fill="#8b5cf6" name="New Customers" />
              <Bar dataKey="returning" fill="#ec4899" name="Returning Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-blue-500" />
            Recent Sales
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">#ORD-{1000 + item}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Customer {item}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${(item * 120).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
            Low Stock Items
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Product {item}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item * 5}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Category {item % 3}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterData;