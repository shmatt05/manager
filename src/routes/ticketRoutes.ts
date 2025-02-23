import { Router } from 'express';
import { TicketController } from '../controllers/ticketController';
import { TicketService } from '../services/ticketService';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();
const ticketService = new TicketService();
const ticketController = new TicketController(ticketService);

router.post('/', authenticateJWT, ticketController.createTicket.bind(ticketController));
router.get('/', authenticateJWT, ticketController.getTickets.bind(ticketController));
router.get('/:id', authenticateJWT, ticketController.getTicket.bind(ticketController));
router.put('/:id', authenticateJWT, ticketController.updateTicket.bind(ticketController));
router.delete('/:id', authenticateJWT, ticketController.deleteTicket.bind(ticketController));

router.get('/:ticketId/history', authenticateJWT, ticketController.getTicketHistory.bind(ticketController));

export default router; 