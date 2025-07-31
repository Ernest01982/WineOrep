import { DatabaseService } from './database';
import { OfflineService } from './offline';
import { SyncQueue } from '../types';

export class SyncService {
  private static isOnline = navigator.onLine;
  private static syncInProgress = false;

  static initialize() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Auto-sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingData();
      }
    }, 5 * 60 * 1000);
  }

  static getConnectionStatus() {
    return this.isOnline;
  }

  static async syncPendingData() {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    
    try {
      const pendingItems = await OfflineService.getSyncQueue();
      console.log(`Syncing ${pendingItems.length} pending items...`);

      for (const item of pendingItems) {
        try {
          await this.syncSingleItem(item);
          await OfflineService.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          await OfflineService.updateSyncQueueItem(item.id, {
            retry_count: item.retry_count + 1,
            last_attempt: new Date().toISOString()
          });
        }
      }

      // Sync fresh data from server
      await this.syncFromServer();
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private static async syncSingleItem(item: SyncQueue) {
    switch (item.table_name) {
      case 'visits':
        await DatabaseService.syncVisit(item.data);
        break;
      case 'orders':
        await DatabaseService.syncOrder(item.data);
        break;
      case 'order_items':
        await DatabaseService.syncOrderItems([item.data]);
        break;
      case 'rep_tasks':
        await DatabaseService.updateTask(item.record_id, item.data);
        break;
      default:
        throw new Error(`Unknown table: ${item.table_name}`);
    }
  }

  private static async syncFromServer() {
    try {
      // Sync clients
      const clients = await DatabaseService.getClients();
      await OfflineService.saveClients(clients);

      // Sync products  
      const products = await DatabaseService.getProducts();
      await OfflineService.saveProducts(products);

      console.log('Server data synced successfully');
    } catch (error) {
      console.error('Failed to sync from server:', error);
    }
  }

  static async forceSyncNow() {
    if (this.isOnline) {
      await this.syncPendingData();
      return true;
    }
    return false;
  }
}