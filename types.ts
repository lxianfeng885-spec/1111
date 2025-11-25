
export interface Resource {
  type: '人员' | '机械' | '材料';
  name: string;
  count: number;
  unit: string;
}

export interface Entry {
  id: string;
  date: string; // ISO YYYY-MM-DD
  category: string; // Main Engineering Category
  subCategory: string; // Sub Engineering Type
  location: string; // Road Direction / Section
  description: string; // Specific Content
  amount: number;
  status: '待处理' | '已完成' | '审核中' | '紧急';
  notes: string;
  resources: Resource[]; // Personnel, Machinery, Materials
  photos: string[]; // Base64 strings of photos
}

export interface DailyStats {
  totalAmount: number;
  categoryBreakdown: Record<string, number>;
  count: number;
}

export type SortField = 'date' | 'amount' | 'category' | 'status' | 'location';
export type SortDirection = 'asc' | 'desc';
