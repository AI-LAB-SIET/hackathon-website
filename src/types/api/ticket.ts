export interface Ticket {
  id: string;
  teamId: string;
  category: 'Internet' | 'Power' | 'Hardware' | 'Food' | 'Venue' | 'Other' | 'Mentor Needed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  raisedBy: string;
  assignedTo?: string;
  assignedToName?: string;
  description: string;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  teamName?: string;
}

export interface TicketFilters {
  status?: Ticket['status'];
  category?: Ticket['category'];
  priority?: Ticket['priority'];
  assignedTo?: string;
  teamId?: string;
  raisedBy?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTicketRequest {
  teamId: string;
  category: Ticket['category'];
  priority: Ticket['priority'];
  description: string;
}

export interface UpdateTicketRequest {
  id: string;
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  assignedTo?: string;
  resolution?: string;
}

export interface AssignTicketRequest {
  ticketId: string;
  volunteerEmail: string;
}

export interface TicketStats {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byPriority: Record<Ticket['priority'], number>;
  byCategory: Record<Ticket['category'], number>;
  averageResolutionTime: number;
}