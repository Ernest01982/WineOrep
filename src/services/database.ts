import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class DatabaseService {
  static async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async getRepTasks(repId: string) {
    const { data, error } = await supabase
      .from('rep_tasks')
      .select('*')
      .eq('rep_id', repId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getDiscountReasons() {
    const { data, error } = await supabase
      .from('stock_discount_reasons')
      .select('*')
      .order('label');
    
    if (error) throw error;
    return data;
  }

  static async getCurrentRep() {
    // For demo purposes, return the first rep
    // In production, this would be based on authentication
    const { data, error } = await supabase
      .from('reps')
      .select('*')
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getClientProducts(clientId: string) {
    const { data, error } = await supabase
      .from('client_products')
      .select(`
        *,
        products (*)
      `)
      .eq('client_id', clientId)
      .eq('listed', true);
    
    if (error) throw error;
    return data;
  }

  static async syncVisit(visit: any) {
    const { data, error } = await supabase
      .from('visits')
      .upsert(visit, { onConflict: 'id' })
      .select();
    
    if (error) throw error;
    return data;
  }

  static async syncOrder(order: any) {
    const { data, error } = await supabase
      .from('orders')
      .upsert(order, { onConflict: 'id' })
      .select();
    
    if (error) throw error;
    return data;
  }

  static async syncOrderItems(orderItems: any[]) {
    const { data, error } = await supabase
      .from('order_items')
      .upsert(orderItems, { onConflict: 'id' })
      .select();
    
    if (error) throw error;
    return data;
  }

  static async updateTask(taskId: string, updates: any) {
    const { data, error } = await supabase
      .from('rep_tasks')
      .update(updates)
      .eq('id', taskId)
      .select();
    
    if (error) throw error;
    return data;
  }
}