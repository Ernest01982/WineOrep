import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { OfflineService } from '../services/offline';
import { SyncService } from '../services/sync';
import { SyncQueue as SyncQueueType } from '../types';

export function SyncQueue() {
  const [syncItems, setSyncItems] = useState<SyncQueueType[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyncQueue();
    
    // Load last sync time from localStorage
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(lastSync);
    }
  }, []);

  const loadSyncQueue = async () => {
    try {
      const queue = await OfflineService.getSyncQueue();
      setSyncItems(queue);
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const success = await SyncService.forceSyncNow();
      if (success) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        localStorage.setItem('lastSyncTime', now);
        await loadSyncQueue();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'insert':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'update':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTableName = (tableName: string) => {
    return tableName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Sync Queue</h2>
        <button
          onClick={handleSyncNow}
          disabled={syncing || !SyncService.getConnectionStatus()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              {syncItems.length} items pending sync
            </p>
            {lastSyncTime && (
              <p className="text-sm text-gray-600">
                Last sync: {formatTimeAgo(lastSyncTime)}
              </p>
            )}
          </div>
          
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            SyncService.getConnectionStatus()
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              SyncService.getConnectionStatus() ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{SyncService.getConnectionStatus() ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Sync Queue Items */}
      {syncItems.length > 0 ? (
        <div className="space-y-3">
          {syncItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getOperationIcon(item.operation)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatTableName(item.table_name)}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {item.operation} operation
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {formatTimeAgo(item.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {item.retry_count > 0 && (
                    <span className="inline-block px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded mb-1">
                      {item.retry_count} retries
                    </span>
                  )}
                  
                  {item.last_attempt && (
                    <p className="text-xs text-gray-500">
                      Last attempt: {formatTimeAgo(item.last_attempt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">All synced up!</h3>
          <p className="text-gray-600">No pending items to sync</p>
        </div>
      )}
    </div>
  );
}