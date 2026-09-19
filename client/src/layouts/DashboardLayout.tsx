import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useAppSelector, useAppDispatch } from '../hooks/useAppSelector';
import { setMobileSidebarOpen } from '../store/uiSlice';
import { useSocket } from '../hooks/useSocket';
import { cn } from '../utils/cn';

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const mobileSidebarOpen = useAppSelector((s) => s.ui.mobileSidebarOpen);

  // Initialize Socket.IO connection and event listeners
  useSocket();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => dispatch(setMobileSidebarOpen(false))}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden">
            <Sidebar onClose={() => dispatch(setMobileSidebarOpen(false))} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className={cn('flex-1 overflow-auto p-4 lg:p-6')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
