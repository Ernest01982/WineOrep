import React, { useState, useEffect } from 'react';
import { Calendar, Package, CheckSquare, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { OfflineService } from '../services/offline';
import { SyncService } from '../services/sync';

interface DashboardStats {
  plannedVisitsToday: number;
  ordersPlaced: number;
  tasksAssigned: number;
  pendingSync: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    plannedVisitsToday: 0,
    ordersPlaced: 0,
    tasksAssigned: 0,
    pendingSync: 0
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStats();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadStats = async () => {
    try {
      const dashboardStats = await OfflineService.getDashboardStats('current-rep-id');
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) return;
    
    setSyncing(true);
    try {
      await SyncService.forceSyncNow();
      await loadStats();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const statCards = [
    {
      title: 'Visits Today',
      value: stats.plannedVisitsToday,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Orders Placed',
      value: stats.ordersPlaced,
      icon: Package,
      color: 'bg-green-500',
    },
    {
      title: 'Active Tasks',
      value: stats.tasksAssigned,
      icon: CheckSquare,
      color: 'bg-amber-500',
    },
    {
      title: 'Pending Sync',
      value: stats.pendingSync,
      icon: RotateCcw,
      color: stats.pendingSync > 0 ? 'bg-red-500' : 'bg-gray-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {isOnline && (
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
        
        {stats.pendingSync > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {stats.pendingSync} items waiting to sync
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 text-left bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
            <p className="font-medium text-blue-900">New Visit</p>
            <p className="text-sm text-blue-700">Log a client visit</p>
          </button>
          <button className="p-3 text-left bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
            <p className="font-medium text-green-900">Create Order</p>
            <p className="text-sm text-green-700">Place a new order</p>
          </button>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Today's Schedule</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-700">Visit: Downtown Wine Co.</span>
            <span className="text-xs text-gray-500">10:00 AM</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-700">Visit: Metro Liquor Store</span>
            <span className="text-xs text-gray-500">2:30 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}