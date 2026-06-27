export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  tags: string[];
  url: string;
  thumbnailUrl?: string;
  badge?: string;
  badgeColor?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  downloads?: number;
  views?: number;
  rating?: number;
}

export type ResourceCategory = 
  | 'apis' 
  | 'datasets' 
  | 'tools' 
  | 'learning' 
  | 'templates' 
  | 'cloud' 
  | 'documentation';

export interface ResourceFilters {
  category?: ResourceCategory;
  tags?: string[];
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'views' | 'downloads' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateResourceRequest {
  title: string;
  description: string;
  category: ResourceCategory;
  tags: string[];
  url: string;
  thumbnailUrl?: string;
  badge?: string;
  badgeColor?: string;
  featured?: boolean;
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  id: string;
}