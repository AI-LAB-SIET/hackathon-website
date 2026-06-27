export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedArea: string;
  assignedResponsibilities: string;
  status: 'active' | 'inactive' | 'pending';
  shiftStart?: string;
  shiftEnd?: string;
  skills: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

export interface VolunteerFilters {
  status?: Volunteer['status'];
  assignedArea?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateVolunteerRequest {
  name: string;
  email: string;
  phone: string;
  assignedArea: string;
  assignedResponsibilities: string;
  shiftStart?: string;
  shiftEnd?: string;
  skills?: string[];
  emergencyContact?: Volunteer['emergencyContact'];
}

export interface UpdateVolunteerRequest extends Partial<CreateVolunteerRequest> {
  id: string;
  status?: Volunteer['status'];
}

export interface VolunteerStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  byArea: Record<string, number>;
  onShift: number;
}