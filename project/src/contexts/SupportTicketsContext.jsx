import React, { createContext, useContext, useState, useEffect } from 'react';

const SupportTicketsContext = createContext();

export const useSupportTickets = () => {
  return useContext(SupportTicketsContext);
};

export const SupportTicketsProvider = ({ children }) => {
  const [supportTickets, setSupportTickets] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/supportTickets')
      .then(res => res.json())
      .then(data => setSupportTickets(data))
      .catch(err => console.error("Failed to fetch support tickets", err));
  }, []);

  return (
    <SupportTicketsContext.Provider value={{ supportTickets }}>
      {children}
    </SupportTicketsContext.Provider>
  );
};