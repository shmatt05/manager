import { Ticket, ITicket } from '../models/Ticket';
import { TicketHistory, ITicketHistory } from '../models/TicketHistory';
import { CreateTicketDto, UpdateTicketDto } from '../dto/ticket.dto';

export class TicketService {
  private async createHistoryEntry(
    ticketId: Schema.Types.ObjectId,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    userId: Schema.Types.ObjectId,
    ticketData: any,
    changes?: { field: string; oldValue: any; newValue: any }[]
  ) {
    const historyEntry: Partial<ITicketHistory> = {
      ticketId,
      action,
      userId,
      ticketData,
      timestamp: new Date(),
      changes
    };
    
    await TicketHistory.create(historyEntry);
  }

  async createTicket(ticketData: CreateTicketDto): Promise<ITicket> {
    // ... existing validation code ...

    const ticket = await Ticket.create(ticketData);
    
    // Record creation in history
    await this.createHistoryEntry(
      ticket._id,
      'CREATE',
      ticketData.createdBy,
      ticket.toObject(),
      null
    );

    return ticket;
  }

  async updateTicket(id: string, updateData: UpdateTicketDto): Promise<ITicket> {
    const oldTicket = await Ticket.findById(id);
    if (!oldTicket) {
      throw new Error('Ticket not found');
    }

    // Calculate changes
    const changes = Object.keys(updateData).map(field => ({
      field,
      oldValue: oldTicket[field],
      newValue: updateData[field]
    }));

    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Record update in history
    await this.createHistoryEntry(
      oldTicket._id,
      'UPDATE',
      updateData.updatedBy, // Make sure this is passed in UpdateTicketDto
      updatedTicket.toObject(),
      changes
    );

    return updatedTicket;
  }

  async deleteTicket(id: string, userId: Schema.Types.ObjectId): Promise<void> {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Record deletion in history before deleting
    await this.createHistoryEntry(
      ticket._id,
      'DELETE',
      userId,
      ticket.toObject(),
      null
    );

    await Ticket.findByIdAndDelete(id);
  }

  async getTicketHistory(ticketId: string): Promise<ITicketHistory[]> {
    return TicketHistory.find({ ticketId })
      .sort({ timestamp: -1 })
      .populate('userId', 'name email')
      .populate('ticketData.assignedTo', 'name email')
      .populate('ticketData.createdBy', 'name email');
  }
} 