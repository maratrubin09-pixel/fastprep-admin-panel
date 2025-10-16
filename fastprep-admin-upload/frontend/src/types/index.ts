// User types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  roleId: string;
  role?: Role;
  createdAt: string;
  updatedAt: string;
}

// Role types
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permissions;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permissions {
  crm: ModulePermissions;
  tasks: ModulePermissions;
  messages: ModulePermissions;
  analytics: ModulePermissions;
  users: ModulePermissions;
  roles: ModulePermissions;
  settings: ModulePermissions;
  dataAccess: DataAccessPermissions;
}

export interface ModulePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface DataAccessPermissions {
  customers: 'own' | 'team' | 'all';
  leads: 'own' | 'team' | 'all';
  tasks: 'own' | 'team' | 'all';
  messages: 'own' | 'team' | 'all';
}

// Customer types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  source?: string;
  status: CustomerStatus;
  notes?: string;
  tags: string[];
  assignedTo?: string;
  assignedUser?: User;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed' | 'lost';

// Lead types
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  source: LeadSource;
  sourceDetails?: string;
  status: LeadStatus;
  priority: Priority;
  assignedTo?: string;
  assignedUser?: User;
  customerId?: string;
  customer?: Customer;
  convertedAt?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type LeadSource = 'website' | 'referral' | 'social' | 'advertisement' | 'cold_call' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignedTo: string;
  assignedUser?: User;
  createdBy: string;
  creator?: User;
  dueDate?: string;
  completedAt?: string;
  customerId?: string;
  customer?: Customer;
  leadId?: string;
  lead?: Lead;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Message types
export interface Conversation {
  id: string;
  platform: MessagePlatform;
  platformId: string;
  customerId?: string;
  customer?: Customer;
  assignedTo?: string;
  assignedUser?: User;
  status: ConversationStatus;
  priority: Priority;
  lastMessageAt?: string;
  lastMessageFrom?: 'customer' | 'agent';
  unreadCount: number;
  metadata: Record<string, any>;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  conversation?: Conversation;
  senderId?: string;
  sender?: User;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  messageType: MessageType;
  platformMessageId?: string;
  isRead: boolean;
  readAt?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type MessagePlatform = 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'email';
export type ConversationStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'location';

// Activity Log types
export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

// File types
export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  uploader?: User;
  entityType?: string;
  entityId?: string;
  isPublic: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleId: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Dashboard types
export interface DashboardMetrics {
  totalCustomers: number;
  totalLeads: number;
  totalTasks: number;
  totalMessages: number;
  newLeadsToday: number;
  completedTasksToday: number;
  unreadMessages: number;
  conversionRate: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

// Messenger specific types
export interface ConversationStats {
  platform: string;
  status: string;
  count: number;
}

export interface MessageSendRequest {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  metadata?: Record<string, any>;
}

export interface ConversationAssignmentRequest {
  assignedTo: string;
}

export interface ConversationStatusUpdateRequest {
  status?: ConversationStatus;
  priority?: Priority;
}

// Socket.io event types
export interface SocketEvents {
  // Connection events
  join_conversations: (userId: string) => void;
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  
  // Message events
  new_message: (data: { message: Message }) => void;
  message_read: (data: { conversationId: string; messageId: string; userId: string }) => void;
  message_read_update: (data: { messageId: string; userId: string; readAt: string }) => void;
  
  // Conversation events
  conversation_assigned: (data: { conversationId: string; assignedTo: string }) => void;
  conversation_updated: (data: { conversationId: string; status?: ConversationStatus; priority?: Priority }) => void;
  conversation_status_updated: (data: { conversationId: string; status?: ConversationStatus; priority?: Priority }) => void;
  
  // Typing events
  typing_start: (data: { conversationId: string; userId: string; userName: string }) => void;
  typing_stop: (data: { conversationId: string; userId: string }) => void;
  user_typing: (data: { userId: string; userName: string; conversationId: string }) => void;
  user_stopped_typing: (data: { userId: string; conversationId: string }) => void;
  
  // Notification events
  notification: (data: { type: string; message: string; data?: any }) => void;
}
