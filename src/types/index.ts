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
  location?: string;
  contact_name?: string;
  email?: string;
  contact_phone?: string;
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
  price: number;
  price_ex_vat?: number;
  price_trade?: number;
  category: string;
  created_at: string;
}

export interface Order {
  id: string;
  rep_id: string;
  client_id: string;
  visit_id?: string;
  order_date: string;
  is_free_stock: boolean;
  discount_percent?: number;
  discount_value?: number;
  discount_reason?: string;
  free_stock_reason?: string;
  pdf_url?: string;
  notes?: string;
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
  title: string;
  description?: string;
  task_type?: string;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_by?: string;
  completed_at?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface StockDiscountReason {
  id: string;
  reason_type: 'discount' | 'free_stock';
  label: string;
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