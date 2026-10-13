import type { AuditLog } from './types';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('syncsphere_token');
  const demoRole = localStorage.getItem('syncsphere_role') || 'ADMIN';
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['x-demo-role'] = demoRole;
  }
  return headers;
}

async function downloadFile(url: string, fallbackName: string): Promise<void> {
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch {
      // Non-JSON error responses use the status message.
    }
    throw new Error(message);
  }

  const disposition = response.headers.get('content-disposition');
  const filename = disposition?.match(/filename="?([^"]+)"?/i)?.[1] || fallbackName;
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

// Authentication API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  demoLogin: (role: 'ADMIN' | 'EDITOR') =>
    apiRequest('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => apiRequest('/auth/me'),
};

// Products API
export const productsApi = {
  list: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    return apiRequest(`/products?${qs.toString()}`);
  },
  get: (id: string) => apiRequest(`/products/${id}`),
  create: (data: any) => apiRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
  duplicate: (id: string) => apiRequest(`/products/${id}/duplicate`, { method: 'POST' }),
  getStats: () => apiRequest('/products/stats'),
};

// Categories & Attributes API
export const taxonomyApi = {
  listCategories: () => apiRequest('/categories'),
  createCategory: (data: any) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),

  listAttributes: () => apiRequest('/attributes'),
  createAttribute: (data: any) => apiRequest('/attributes', { method: 'POST', body: JSON.stringify(data) }),
  updateAttribute: (id: string, data: any) => apiRequest(`/attributes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAttribute: (id: string) => apiRequest(`/attributes/${id}`, { method: 'DELETE' }),
};

// Sync API
export const syncApi = {
  pushSingle: (productId: string) => apiRequest(`/sync/push/${productId}`, { method: 'POST' }),
  pushBulk: (productIds: string[]) =>
    apiRequest('/sync/bulk', { method: 'POST', body: JSON.stringify({ productIds }) }),
  pullProducts: () => apiRequest('/sync/import', { method: 'POST' }),
  listJobs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params as any);
    return apiRequest(`/sync/jobs?${qs.toString()}`);
  },
  getJob: (id: string) => apiRequest(`/sync/jobs/${id}`),
  retryJob: (id: string) => apiRequest(`/sync/jobs/${id}/retry`, { method: 'POST' }),
  listConflicts: () => apiRequest('/sync/conflicts'),
  resolveConflict: (id: string, resolution: string, mergedData?: any) =>
    apiRequest(`/sync/conflicts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, mergedData }),
    }),
};

// CSV API
export const csvApi = {
  preview: async (csvContent?: string, file?: File) => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE}/csv/preview`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to preview CSV');
      }
      return response.json();
    }
    return apiRequest('/csv/preview', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });
  },
  import: (rows: any[], options: any = {}) =>
    apiRequest('/csv/import', { method: 'POST', body: JSON.stringify({ rows, options }) }),
  downloadTemplate: () => downloadFile(`${API_BASE}/csv/template`, 'syncsphere_product_template.csv'),
  export: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params as any);
    return downloadFile(`${API_BASE}/csv/export?${qs.toString()}`, 'syncsphere_catalog.csv');
  },
};

// Settings API
export const settingsApi = {
  get: () => apiRequest('/settings'),
  update: (data: any) => apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  test: (data: any) => apiRequest('/settings/test', { method: 'POST', body: JSON.stringify(data) }),
};

// Webhooks API
export const webhooksApi = {
  listEvents: () => apiRequest('/webhooks/events'),
  simulate: (data: any) => apiRequest('/webhooks/simulate', { method: 'POST', body: JSON.stringify(data) }),
};

// Audit Logs API
export const auditApi = {
  list: (params: Record<string, any> = {}): Promise<{ logs: AuditLog[] }> => {
    const qs = new URLSearchParams(params as any);
    return apiRequest(`/audit?${qs.toString()}`);
  },
};
