export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: ResponseMeta;
}

const MOCK_DELAY_MIN = 300;
const MOCK_DELAY_MAX = 800;

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function mockDelay(): Promise<void> {
  const delay = MOCK_DELAY_MIN + Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN);
  return new Promise(resolve => setTimeout(resolve, delay));
}

function createSuccessResponse<T>(data: T, meta?: ResponseMeta): { success: true; data: T; meta?: ResponseMeta } {
  return { success: true, data, meta };
}

function createErrorResponse(code: string, message: string, details?: Record<string, unknown>, field?: string): { success: false; error: { code: string; message: string; details?: Record<string, unknown>; field?: string } } {
  return { success: false, error: { code, message, details, field } };
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export const mockApi = {
  async get<T>(key: string, defaultValue: T): Promise<{ success: true; data: T; meta?: { page?: number; limit?: number; total?: number; totalPages?: number } }> {
    await mockDelay();
    const data = getFromStorage(key, defaultValue);
    return createSuccessResponse(data);
  },

  async set<T>(key: string, value: T): Promise<{ success: true; data: T; meta?: { page?: number; limit?: number; total?: number; totalPages?: number } }> {
    await mockDelay();
    setToStorage(key, value);
    return createSuccessResponse(value);
  },

  async update<T>(key: string, updater: (current: T) => T, defaultValue: T): Promise<{ success: true; data: T; meta?: { page?: number; limit?: number; total?: number; totalPages?: number } }> {
    await mockDelay();
    const current = getFromStorage(key, defaultValue);
    const updated = updater(current);
    setToStorage(key, updated);
    return createSuccessResponse(updated);
  },

  async delete(key: string): Promise<{ success: true; data: undefined }> {
    await mockDelay();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
    return createSuccessResponse(undefined);
  },

  generateId,
  createSuccessResponse,
  createErrorResponse,
  mockDelay,
};