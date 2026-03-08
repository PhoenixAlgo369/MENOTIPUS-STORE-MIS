// src/components/AdminSupportPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle, 
  Send, 
  Loader, 
  RefreshCw 
} from 'lucide-react';

const AdminSupportPanel = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('received');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch('http://localhost:3001/supportTickets');
      const data = await res.json();
      setTickets(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateTicket = async () => {
    if (!selectedTicket || !response.trim()) return;

    setLoading(true);
    try {
      const updatedTicket = {
        ...selectedTicket,
        status: status,
        adminResponse: response,
        adminId: user.id,
        adminName: user.name,
        updatedAt: new Date().toISOString(),
        respondedAt: status === 'addressed' ? new Date().toISOString() : selectedTicket.respondedAt
      };

      const res = await fetch(`http://localhost:3001/supportTickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTicket)
      });

      if (!res.ok) throw new Error('Failed to update ticket');

      // ✅ Notify original user — MATCH BY EMAIL — USE ICON NAME STRING
      const userNotification = {
        id: `support-response-${selectedTicket.id}-${Date.now()}`,
        type: 'info',
        iconName: 'MessageSquare', // ✅ CRITICAL FIX — STRING, NOT COMPONENT
        title: 'Support Response Received',
        message: `Admin responded to your ticket: "${selectedTicket.subject}"`,
        time: new Date(),
        read: false,
        category: 'support',
        ticketId: selectedTicket.id,
        forUserEmail: selectedTicket.email
      };

      localStorage.setItem('pendingSupportNotifications', JSON.stringify([userNotification]));

      await fetchTickets();
      setSelectedTicket(null);
      setResponse('');
      setStatus('received');
    } catch (err) {
      alert('Failed to update ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (ticketStatus) => {
    switch (ticketStatus) {
      case 'addressing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'addressed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          {refreshing ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">All Tickets ({tickets.length})</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tickets yet</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{ticket.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{ticket.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {ticket.name} • {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail & Response */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  From: {selectedTicket.name} • {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="p-4">
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {selectedTicket.adminResponse && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Admin Response:</h3>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedTicket.adminResponse}</p>
                    {selectedTicket.respondedAt && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Responded on {new Date(selectedTicket.respondedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="received">Received</option>
                      <option value="addressing">Addressing</option>
                      <option value="addressed">Addressed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Response</label>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Type your response here..."
                    />
                  </div>
                  <button
                    onClick={handleUpdateTicket}
                    disabled={loading || !response.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center transition disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a ticket to view details and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportPanel;