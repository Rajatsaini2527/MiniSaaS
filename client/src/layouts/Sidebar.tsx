import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Bell, Settings,
  ChevronDown, Plus, X, LogOut,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useWorkspaces } from '../features/workspaces/hooks';
import { useAppDispatch } from '../hooks/useAppSelector';
import { clearCredentials } from '../store/authSlice';
import { clearWorkspaceState } from '../store/workspaceSlice';
import { authService } from '../services/auth.service';
import { queryClient } from '../lib/queryClient';
import toast from 'react-hot-toast';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps { onClose?: () => void; }

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();
  const { activeWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [wsOpen, setWsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  useWorkspaces(); // Ensure workspaces are loaded

  async function handleLogout() {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    dispatch(clearCredentials());
    dispatch(clearWorkspaceState());
    queryClient.clear();
    navigate('/login');
    toast.success('Logged out');
  }

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 font-bold text-primary-600 text-lg">
          <FolderKanban size={22} />
          <span>MiniSaaS</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" aria-label="Close sidebar">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setWsOpen((p) => !p)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-expanded={wsOpen}
        >
          <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {activeWorkspace?.name?.[0]?.toUpperCase() ?? 'W'}
          </div>
          <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {activeWorkspace?.name ?? 'Select workspace'}
          </span>
          <ChevronDown size={14} className={cn('text-gray-400 transition-transform', wsOpen && 'rotate-180')} />
        </button>

        {wsOpen && (
          <div className="mt-1 space-y-0.5">
            {workspaces.map((ws) => (
              <button
                key={ws._id}
                onClick={() => { switchWorkspace(ws._id); setWsOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left',
                  activeWorkspace?._id === ws._id
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <div className="w-5 h-5 rounded bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {ws.name[0].toUpperCase()}
                </div>
                <span className="truncate">{ws.name}</span>
              </button>
            ))}
            <button
              onClick={() => { navigate('/workspaces'); setWsOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus size={14} />
              New workspace
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
            )}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Menu */}
      {user && (
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
