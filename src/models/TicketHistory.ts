import { Schema, model } from 'mongoose';

export interface ITicketHistory {
  ticketId: Schema.Types.ObjectId;
  timestamp: Date;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: Schema.Types.ObjectId;
  ticketData: {
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo?: Schema.Types.ObjectId;
    createdBy: Schema.Types.ObjectId;
    // ... any other ticket fields
  };
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

const ticketHistorySchema = new Schema<ITicketHistory>({
  ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true, enum: ['CREATE', 'UPDATE', 'DELETE'] },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ticketData: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true },
    priority: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  changes: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }]
});

export const TicketHistory = model<ITicketHistory>('TicketHistory', ticketHistorySchema); 