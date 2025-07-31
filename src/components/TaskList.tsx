import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Camera } from 'lucide-react';
import { OfflineService } from '../services/offline';
import { RepTask } from '../types';

export function TaskList() {
  const [tasks, setTasks] = useState<RepTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const taskList = await OfflineService.getTasks('current-rep-id');
      setTasks(taskList);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const updates: Partial<RepTask> = {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined
      };
      
      await OfflineService.updateTask(taskId, updates);
      
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-amber-50 border-amber-200';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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
      <h2 className="text-xl font-bold text-gray-900">Tasks</h2>

      {/* Task Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'pending', 'in_progress', 'completed'].map(filter => (
          <button
            key={filter}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap"
          >
            {filter.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className={`bg-white rounded-lg p-4 shadow-sm border ${getStatusColor(task.status)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(task.status)}
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  {task.due_date && isOverdue(task.due_date) && task.status !== 'completed' && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      Overdue
                    </span>
                  )}
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                )}
                
                {task.due_date && (
                  <p className="text-xs text-gray-500">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                )}
                
                {task.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>Notes:</strong> {task.notes}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                {task.status !== 'completed' && (
                  <>
                    {task.status === 'pending' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Start
                      </button>
                    )}
                    
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Complete
                    </button>
                  </>
                )}
                
                <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded">
                  <Camera size={16} />
                </button>
              </div>
            </div>
            
            {task.sync_status === 'pending' && (
              <div className="mt-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-xs text-amber-700">Waiting to sync</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No tasks assigned</p>
        </div>
      )}
    </div>
  );
}