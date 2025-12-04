// src/features/support/zoho-service.ts
import axios from 'axios';

// This service runs on the CLIENT SIDE and talks to YOUR Next.js API routes
// We do not expose Zoho secrets here.

const API_BASE = '/api/integrations/zoho';

export const zohoService = {
  // Get Tickets
  getTickets: async (params: { page?: number; status?: string }) => {
    const { data } = await axios.get(`${API_BASE}/tickets`, { params });
    return data;
  },

  // Create Ticket
  createTicket: async (ticketData: { subject: string; description: string; email: string }) => {
    const { data } = await axios.post(`${API_BASE}/tickets`, ticketData);
    return data;
  },

  // Get Ticket Details
  getTicket: async (ticketId: string) => {
    const { data } = await axios.get(`${API_BASE}/tickets/${ticketId}`);
    return data;
  }
};
