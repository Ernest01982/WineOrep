import Dexie, { Table } from 'dexie';
import { Client, Visit, Order, OrderItem, Product, RepTask, TaskType, StockDiscountReason, SyncQueue } from '../types';

export class OfflineDatabase extends Dexie {
  clients!: Table<Client>;
  visits!: Table<Visit>;
  orders!: Table<Order>;
  orderItems!: Table<OrderItem>;
  products!: Table<Product>;
  repTasks!: Table<RepTask>;
  taskTypes!: Table<TaskType>;
  stockDiscountReasons!: Table<StockDiscountReason>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('RepDashboardDB');
    
    this.version(1).stores({
      clients: 'id, name, region',
      visits: 'id, rep_id, client_id, check_in_time, sync_status',
      orders: 'id, rep_id, client_id, visit_id, sync_status, created_at',
      orderItems: 'id, order_id, product_id, sync_status',
      products: 'id, name, sku, category',
      repTasks: 'id, rep_id, task_type_id, status, due_date, sync_status',
      taskTypes: 'id, name',
      stockDiscountReasons: 'id, reason',
      syncQueue: 'id, table_name, record_id, operation, created_at'
    });
  }
}

export const offlineDb = new OfflineDatabase();

export class OfflineService {
  static async saveClient(client: Client) {
    await offlineDb.clients.put(client);
  }

  static async saveClients(clients: Client[]) {
    await offlineDb.clients.bulkPut(clients);
  }

  static async getClients(region?: string) {
    let query = offlineDb.clients.orderBy('name');
    if (region) {
      query = query.filter(client => client.region === region);
    }
    return await query.toArray();
  }

  static async searchClients(searchTerm: string) {
    return await offlineDb.clients
      .filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .toArray();
  }

  static async saveVisit(visit: Visit) {
    await offlineDb.visits.put(visit);
    if (visit.sync_status === 'pending') {
      await this.addToSyncQueue('visits', visit.id, 'insert', visit);
    }
  }

  static async getVisits(repId: string) {
    return await offlineDb.visits
      .where('rep_id')
      .equals(repId)
      .reverse()
      .sortBy('created_at');
  }

  static async saveOrder(order: Order, orderItems: OrderItem[]) {
    await offlineDb.orders.put(order);
    await offlineDb.orderItems.bulkPut(orderItems);
    
    if (order.sync_status === 'pending') {
      await this.addToSyncQueue('orders', order.id, 'insert', order);
      for (const item of orderItems) {
        await this.addToSyncQueue('order_items', item.id, 'insert', item);
      }
    }
  }

  static async getProducts() {
    return await offlineDb.products.orderBy('name').toArray();
  }

  static async saveProducts(products: Product[]) {
    await offlineDb.products.bulkPut(products);
  }

  static async updateTask(taskId: string, updates: Partial<RepTask>) {
    const existing = await offlineDb.repTasks.get(taskId);
    if (existing) {
      const updated = { ...existing, ...updates, sync_status: 'pending' as const };
      await offlineDb.repTasks.put(updated);
      await this.addToSyncQueue('rep_tasks', taskId, 'update', updated);
    }
  }

  static async getTasks(repId: string) {
    return await offlineDb.repTasks
      .where('rep_id')
      .equals(repId)
      .toArray();
  }

  static async addToSyncQueue(tableName: string, recordId: string, operation: 'insert' | 'update' | 'delete', data: any) {
    const queueItem: SyncQueue = {
      id: crypto.randomUUID(),
      table_name: tableName,
      record_id: recordId,
      operation,
      data,
      retry_count: 0,
      created_at: new Date().toISOString()
    };
    
    await offlineDb.syncQueue.put(queueItem);
  }

  static async getSyncQueue() {
    return await offlineDb.syncQueue.orderBy('created_at').toArray();
  }

  static async removeSyncQueueItem(id: string) {
    await offlineDb.syncQueue.delete(id);
  }

  static async updateSyncQueueItem(id: string, updates: Partial<SyncQueue>) {
    const existing = await offlineDb.syncQueue.get(id);
    if (existing) {
      await offlineDb.syncQueue.put({ ...existing, ...updates });
    }
  }

  static async getPendingCount() {
    return await offlineDb.syncQueue.count();
  }

  static async getDashboardStats(repId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const [todayVisits, totalOrders, pendingTasks, pendingSync] = await Promise.all([
      offlineDb.visits
        .where('rep_id')
        .equals(repId)
        .filter(visit => visit.created_at.startsWith(today))
        .count(),
      
      offlineDb.orders
        .where('rep_id')
        .equals(repId)
        .count(),
      
      offlineDb.repTasks
        .where('rep_id')
        .equals(repId)
        .filter(task => task.status !== 'completed')
        .count(),
      
      offlineDb.syncQueue.count()
    ]);

    return {
      plannedVisitsToday: todayVisits,
      ordersPlaced: totalOrders,
      tasksAssigned: pendingTasks,
      pendingSync
    };
  }
}