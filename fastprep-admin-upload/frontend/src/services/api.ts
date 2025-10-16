import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User, 
  Role, 
  Customer, 
  Lead, 
  Task, 
  Conversation, 
  Message,
  ActivityLog,
  File as FileType,
  DashboardMetrics,
  PaginatedResponse,
  ApiResponse,
  ConversationStats,
  MessageSendRequest,
  ConversationAssignmentRequest,
  ConversationStatusUpdateRequest
} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${this.client.defaults.baseURL}/auth/refresh`, {
                refreshToken
              });
              
              const { accessToken, refreshToken: newRefreshToken } = response.data;
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
    return response.data;
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get('/auth/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.put('/auth/profile', userData);
    return response.data;
  }

  // User endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await this.client.get('/users', { params });
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: RegisterRequest): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.post('/users', userData);
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  async getUserActivity(id: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<ActivityLog>> {
    const response: AxiosResponse<PaginatedResponse<ActivityLog>> = await this.client.get(`/users/${id}/activity`, { params });
    return response.data;
  }

  // Role endpoints
  async getRoles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Role>> {
    const response: AxiosResponse<PaginatedResponse<Role>> = await this.client.get('/roles', { params });
    return response.data;
  }

  async getRoleById(id: string): Promise<ApiResponse<Role>> {
    const response: AxiosResponse<ApiResponse<Role>> = await this.client.get(`/roles/${id}`);
    return response.data;
  }

  async createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Role>> {
    const response: AxiosResponse<ApiResponse<Role>> = await this.client.post('/roles', roleData);
    return response.data;
  }

  async updateRole(id: string, roleData: Partial<Role>): Promise<ApiResponse<Role>> {
    const response: AxiosResponse<ApiResponse<Role>> = await this.client.put(`/roles/${id}`, roleData);
    return response.data;
  }

  async deleteRole(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/roles/${id}`);
    return response.data;
  }

  async getDefaultPermissions(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/roles/permissions/default');
    return response.data;
  }

  // Customer endpoints
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    assignedTo?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Customer>> {
    const response: AxiosResponse<PaginatedResponse<Customer>> = await this.client.get('/customers', { params });
    return response.data;
  }

  async getCustomerById(id: string): Promise<ApiResponse<Customer>> {
    const response: AxiosResponse<ApiResponse<Customer>> = await this.client.get(`/customers/${id}`);
    return response.data;
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    const response: AxiosResponse<ApiResponse<Customer>> = await this.client.post('/customers', customerData);
    return response.data;
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const response: AxiosResponse<ApiResponse<Customer>> = await this.client.put(`/customers/${id}`, customerData);
    return response.data;
  }

  async deleteCustomer(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/customers/${id}`);
    return response.data;
  }

  // Lead endpoints
  async getLeads(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    source?: string;
    assignedTo?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Lead>> {
    const response: AxiosResponse<PaginatedResponse<Lead>> = await this.client.get('/leads', { params });
    return response.data;
  }

  async getLeadById(id: string): Promise<ApiResponse<Lead>> {
    const response: AxiosResponse<ApiResponse<Lead>> = await this.client.get(`/leads/${id}`);
    return response.data;
  }

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Lead>> {
    const response: AxiosResponse<ApiResponse<Lead>> = await this.client.post('/leads', leadData);
    return response.data;
  }

  async updateLead(id: string, leadData: Partial<Lead>): Promise<ApiResponse<Lead>> {
    const response: AxiosResponse<ApiResponse<Lead>> = await this.client.put(`/leads/${id}`, leadData);
    return response.data;
  }

  async deleteLead(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/leads/${id}`);
    return response.data;
  }

  // Task endpoints
  async getTasks(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    createdBy?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Task>> {
    const response: AxiosResponse<PaginatedResponse<Task>> = await this.client.get('/tasks', { params });
    return response.data;
  }

  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.client.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.client.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.client.put(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/tasks/${id}`);
    return response.data;
  }

  // Message endpoints
  async getConversations(params?: {
    page?: number;
    limit?: number;
    platform?: string;
    status?: string;
    assignedTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Conversation>> {
    const response: AxiosResponse<PaginatedResponse<Conversation>> = await this.client.get('/messages/conversations', { params });
    return response.data;
  }

  async getConversationById(id: string): Promise<ApiResponse<Conversation>> {
    const response: AxiosResponse<ApiResponse<Conversation>> = await this.client.get(`/messages/conversations/${id}`);
    return response.data;
  }

  async getMessages(conversationId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Message>> {
    const response: AxiosResponse<PaginatedResponse<Message>> = await this.client.get(`/messages/conversations/${conversationId}/messages`, { params });
    return response.data;
  }

  async sendMessage(messageData: MessageSendRequest): Promise<ApiResponse<Message>> {
    const response: AxiosResponse<ApiResponse<Message>> = await this.client.post('/messages/send', messageData);
    return response.data;
  }

  async assignConversation(conversationId: string, assignmentData: ConversationAssignmentRequest): Promise<ApiResponse<Conversation>> {
    const response: AxiosResponse<ApiResponse<Conversation>> = await this.client.put(`/messages/conversations/${conversationId}/assign`, assignmentData);
    return response.data;
  }

  async updateConversationStatus(conversationId: string, statusData: ConversationStatusUpdateRequest): Promise<ApiResponse<Conversation>> {
    const response: AxiosResponse<ApiResponse<Conversation>> = await this.client.put(`/messages/conversations/${conversationId}/status`, statusData);
    return response.data;
  }

  async markConversationAsRead(conversationId: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
  }

  async getConversationStats(): Promise<ApiResponse<{ stats: ConversationStats[]; totalUnread: number; totalConversations: number }>> {
    const response: AxiosResponse<ApiResponse<{ stats: ConversationStats[]; totalUnread: number; totalConversations: number }>> = await this.client.get('/messages/stats');
    return response.data;
  }

  async getPlatformConversations(platform: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    assignedTo?: string;
  }): Promise<PaginatedResponse<Conversation>> {
    const response: AxiosResponse<PaginatedResponse<Conversation>> = await this.client.get(`/messages/conversations/${platform}`, { params });
    return response.data;
  }

  // Analytics endpoints
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    const response: AxiosResponse<ApiResponse<DashboardMetrics>> = await this.client.get('/analytics/dashboard');
    return response.data;
  }

  // File endpoints
  async uploadFile(file: File, entityType?: string, entityId?: string): Promise<ApiResponse<FileType>> {
    const formData = new FormData();
    formData.append('file', file);
    if (entityType) formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);

    const response: AxiosResponse<ApiResponse<FileType>> = await this.client.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getFileById(id: string): Promise<ApiResponse<FileType>> {
    const response: AxiosResponse<ApiResponse<FileType>> = await this.client.get(`/files/${id}`);
    return response.data;
  }

  async deleteFile(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/files/${id}`);
    return response.data;
  }
}

export default new ApiClient();
