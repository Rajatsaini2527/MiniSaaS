import React, { useState } from 'react';
import { Menu, Bell, Sun, Moon, Monitor, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppSelector';
import { toggleMobileSidebar } from '../store/uiSlice';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../features/notifications/hooks';
import { GlobalSearch } from '../components/search/GlobalSearch';
import { ChatPanel } from '../components/chat/ChatPanel';

export function TopNav() {
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();
  const { data: notifPages } = useNotifications();
  const [chatOpen, setChatOpen] = useState(false);
  const unreadCount = (notifPages?.pages[0]?.meta?.unreadCount as number) ?? 0;

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-14">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 flex-shrink-0"
          onClick={() => dispatch(toggleMobileSidebar())}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <GlobalSearch />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {/* Theme */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="Toggle theme"
            title={`Theme: ${theme}`}
          >
            {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
          </button>

          {/* Chat */}
          <button
            onClick={() => setChatOpen(p => !p)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label="Team chat"
            title="Team chat"
          >
            <MessageSquare size={18} />
          </button>

          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </>
  );
}
