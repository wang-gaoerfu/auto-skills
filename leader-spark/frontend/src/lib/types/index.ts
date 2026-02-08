// API 类型定义

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  tokens?: number;
}

export interface Conversation {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  messages: Message[];
  updatedAt: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  name_en: string;
  description: string;
  icon: string;
  color: string;
  document_count: number;
  is_visible_to_users: boolean;
  subcategories?: string[];
  tags?: string[];
  expertise_areas?: string[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  category_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunk_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  message: string;
  category_id: string;
  session_id?: string;
  stream?: boolean;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  tokens_used?: number;
}

export interface AnalysisResult {
  is_new_category: boolean;
  confidence: number;
  matched_category?: string;
  reasoning: string;
  new_category?: {
    name: string;
    name_en: string;
    description: string;
    icon: string;
    color: string;
    subcategories: string[];
    tags: string[];
    expertise_areas: string[];
  };
}

export interface UploadResult {
  file_id: string;
  filename: string;
  size: number;
  temp_path: string;
  analysis: AnalysisResult;
}
