// API 客户端 - 增强版，包含错误处理和拦截器

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;

    // 从 localStorage 读取 token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      // 处理 401 未授权
      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        throw new ApiError('未授权，请重新登录', 401);
      }

      // 处理其他错误状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '请求失败' }));
        throw new ApiError(
          errorData.message || errorData.detail || '请求失败',
          response.status,
          errorData
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // 网络错误
      throw new ApiError('网络连接失败，请检查您的网络');
    }
  }

  private async streamRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
      }
      throw new ApiError('请求失败', response.status);
    }

    return response.body!;
  }

  // ========== 认证 API ==========

  async sendCode(email: string) {
    return this.request('/api/v1/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async register(email: string, code: string, password: string) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, code, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ access_token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/api/v1/auth/me');
  }

  async logout() {
    const response = await this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    return this.request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
  }

  // ========== 类别 API ==========

  async getCategories() {
    return this.request<{ categories: import('../types').Category[] }>('/api/v1/categories');
  }

  async getCategoryById(id: string) {
    return this.request(`/api/v1/categories/${id}`);
  }

  async createCategory(data: {
    name: string;
    name_en: string;
    description: string;
    icon: string;
    color: string;
    is_visible_to_users: boolean;
  }) {
    return this.request('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: Partial<{
    name: string;
    name_en: string;
    description: string;
    icon: string;
    color: string;
    is_visible_to_users: boolean;
  }>) {
    return this.request(`/api/v1/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/api/v1/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async generateCategoryPrompt(id: string) {
    return this.request(`/api/v1/categories/${id}/generate-prompt`, {
      method: 'POST',
    });
  }

  async getCategoryStats() {
    return this.request('/api/v1/categories/stats');
  }

  async getKnowledgeStats() {
    return this.request('/api/v1/categories/knowledge-stats');
  }

  // ========== 聊天 API ==========

  async chat(message: string, categoryId: string, sessionId?: string) {
    return this.request('/api/v1/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        message,
        category_id: categoryId,
        session_id: sessionId,
      }),
    });
  }

  async *chatStream(message: string, categoryId: string, sessionId?: string) {
    const stream = await this.streamRequest('/api/v1/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        message,
        category_id: categoryId,
        session_id: sessionId,
      }),
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const data = trimmedLine.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.error('Failed to parse SSE data:', data);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async getSessions(categoryId?: string) {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    return this.request<{ sessions: import('../types').Conversation[] }>(`/api/v1/chat/sessions${params}`);
  }

  async getSession(id: string) {
    return this.request(`/api/v1/chat/sessions/${id}`);
  }

  async deleteSession(id: string) {
    return this.request(`/api/v1/chat/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async updateSession(id: string, data: { title?: string }) {
    return this.request(`/api/v1/chat/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ========== 文档 API ==========

  async getDocuments(params?: { category_id?: string; status?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.category_id) searchParams.set('category_id', params.category_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request<{ documents: import('../types').Document[]; total: number }>(
      `/api/v1/documents${query ? `?${query}` : ''}`
    );
  }

  async getDocument(id: string) {
    return this.request(`/api/v1/documents/${id}`);
  }

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/v1/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '上传失败' }));
      throw new ApiError(errorData.message || errorData.detail || '上传失败', response.status);
    }

    return response.json();
  }

  async uploadBatch(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/v1/documents/upload/batch`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '上传失败' }));
      throw new ApiError(errorData.message || errorData.detail || '上传失败', response.status);
    }

    return response.json();
  }

  async processDocument(id: string) {
    return this.request(`/api/v1/documents/${id}/process`, {
      method: 'POST',
    });
  }

  async classifyDocument(id: string) {
    return this.request(`/api/v1/documents/${id}/classify`, {
      method: 'POST',
    });
  }

  async deleteDocument(id: string) {
    return this.request(`/api/v1/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== 管理员 API ==========

  async getDashboardStats() {
    return this.request('/api/v1/admin/dashboard/stats');
  }

  async getActivity(period: 'day' | 'week' | 'month' = 'week') {
    return this.request(`/api/v1/admin/dashboard/activity?period=${period}`);
  }

  async getUsers(params?: { limit?: number; offset?: number; is_active?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());

    const query = searchParams.toString();
    return this.request<{ users: import('../types').User[]; total: number }>(
      `/api/v1/admin/users${query ? `?${query}` : ''}`
    );
  }

  async getUser(id: string) {
    return this.request(`/api/v1/admin/users/${id}`);
  }

  async updateUser(id: string, data: Partial<{
    email: string;
    is_admin: boolean;
    is_active: boolean;
  }>) {
    return this.request(`/api/v1/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleUserStatus(id: string) {
    return this.request(`/api/v1/admin/users/${id}/disable`, {
      method: 'POST',
    });
  }

  async getUserStats(id: string) {
    return this.request(`/api/v1/admin/users/${id}/stats`);
  }

  async getAuditLogs(params?: { limit?: number; offset?: number; user_id?: string; action?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.user_id) searchParams.set('user_id', params.user_id);
    if (params?.action) searchParams.set('action', params.action);

    const query = searchParams.toString();
    return this.request<{ logs: any[]; total: number }>(`/api/v1/admin/audit-logs${query ? `?${query}` : ''}`);
  }

  async getSettings() {
    return this.request<Record<string, string>>('/api/v1/admin/settings');
  }

  async updateSetting(key: string, value: string) {
    return this.request(`/api/v1/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  async getCategoriesAdmin() {
    return this.request('/api/v1/categories');
  }

  async createCategoryAdmin(data: {
    name: string;
    name_en: string;
    description: string;
    icon: string;
    color: string;
    is_visible_to_users: boolean;
    expertise_areas?: string[];
    subcategories?: string[];
    tags?: string[];
  }) {
    return this.request('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategoryAdmin(id: string, data: Partial<{
    name: string;
    name_en: string;
    description: string;
    icon: string;
    color: string;
    is_visible_to_users: boolean;
    expertise_areas: string[];
    subcategories: string[];
    tags: string[];
  }>) {
    return this.request(`/api/v1/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategoryAdmin(id: string) {
    return this.request(`/api/v1/categories/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
export { ApiError };
