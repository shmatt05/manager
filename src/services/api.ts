import { getToken } from '../utils/auth';

export const getTicketHistory = async (ticketId: string) => {
  try {
    const response = await fetch(`/api/tickets/${ticketId}/history`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`, // Assuming you have auth
      },
    });
    if (!response.ok) throw new Error('Failed to fetch ticket history');
    return await response.json();
  } catch (error) {
    console.error('Error fetching ticket history:', error);
    throw error;
  }
}; 