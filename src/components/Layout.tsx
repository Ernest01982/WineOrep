import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, ClipboardList, Package, CheckSquare, RotateCcw } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/visits', icon: ClipboardList, label: 'Visits' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/sync', icon: RotateCcw, label: 'Sync' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Rep Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        {children}
      </main>

      <nav className="bg-white border-t border-gray-200 px-2 py-2">
        <div className="flex justify-around">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}