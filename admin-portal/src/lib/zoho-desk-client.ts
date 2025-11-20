// lib/zoho-desk-client.ts
import axios from 'axios';

const ZOHO_DESK_BASE_URL = `https://desk.zoho.${process.env.ZOHO_REGION}/api/v1`;

class ZohoDeskClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      },
    });

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return this.accessToken;
  }

  async makeRequest(method: string, endpoint: string, data?: any) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios({
        method,
        url: `${ZOHO_DESK_BASE_URL}/${endpoint}`,
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        data,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limit handling
        console.warn('Zoho Desk rate limit reached, retrying after 60s...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        return this.makeRequest(method, endpoint, data);
      }
      throw error;
    }
  }

  // ✅ Core Methods
  async getTickets(params?: any) {
    return this.makeRequest('GET', 'tickets', params);
  }

  async createTicket(ticketData: {
    subject: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    category: string;
    email: string;
    phone?: string;
  }) {
    return this.makeRequest('POST', 'tickets', ticketData);
  }

  async updateTicket(ticketId: string, updates: any) {
    return this.makeRequest('PATCH', `tickets/${ticketId}`, updates);
  }

  async addComment(ticketId: string, content: string, isPublic: boolean = true) {
    return this.makeRequest('POST', `tickets/${ticketId}/comments`, {
      content,
      isPublic,
    });
  }

  async getTicketHistory(ticketId: string) {
    return this.makeRequest('GET', `tickets/${ticketId}/activities`);
  }
}

export const zohoDeskClient = new ZohoDeskClient();
