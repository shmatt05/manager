export interface ITicket {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdBy: string;
  // ... other fields
}

export interface CreateTicketDto {
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdBy: string;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  updatedBy: string;
} 