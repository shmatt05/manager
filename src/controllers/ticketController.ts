import { Request, Response } from 'express';
import { TicketService } from '../services/ticketService';

export class TicketController {
  private ticketService: TicketService;

  constructor(ticketService: TicketService) {
    this.ticketService = ticketService;
  }

  async getTicketHistory(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const history = await this.ticketService.getTicketHistory(ticketId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
} 