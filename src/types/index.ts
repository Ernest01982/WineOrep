export interface Rep {
  id: string;
  name: string;
  email: string;
  region: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  region: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  created_at: string;
}

export interface Visit {
  id: string;
  rep_id: string;
  client_id: string;
  check_in_time: string;
  check_out_time?: string;
  visit_type?: 'good' | 'missed' | 'problem' | 'bad';
  notes?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  category: string;
  in_stock: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  rep_id: string;
  client_id: string;
  visit_id?: string;
  total_amount: number;
  discount_percentage?: number;
  discount_reason_id?: string;
  is_free_stock: boolean;
  pdf_url?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface RepTask {
  id: string;
  rep_id: string;
  task_type_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  completed_at?: string;
  notes?: string;
  photo_url?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface TaskType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface StockDiscountReason {
  id: string;
  reason: string;
  max_discount_percentage: number;
  created_at: string;
}

export interface SyncQueue {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  retry_count: number;
  last_attempt?: string;
  created_at: string;
}