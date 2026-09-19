import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, CheckSquare, User, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchService, type SearchResults } from '../../services/search.service';
import { useDebounce } from '../../hooks/useDebounce';
import { useWorkspace } from '../../hooks/useWorkspace';
import { Spinner } from '../ui/Spinner';
import { cn } from '../../utils/cn';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const debouncedQ = useDebounce(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQ, activeWorkspaceId],
    queryFn: () => searchService.search(debouncedQ, activeWorkspaceId ?? undefined).then(r => r.data),
    enabled: debouncedQ.length >= 2,
    staleTime: 30000,
  });

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleClose() {
    setOpen(false);
    setQuery('');
  }

  const results = data as SearchResults | undefined;
  const hasResults = results && (
    results.users.length + results.workspaces.length + results.projects.length + results.tasks.length > 0
  );

  return (
    <>
      {/* Trigger */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full max-w-xs"
        aria-label="Search (Ctrl+K)"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden sm:inline ml-auto text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search tasks, projects, members…"
                className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm focus:outline-none"
                aria-label="Search"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading && debouncedQ.length >= 2 && (
                <div className="flex justify-center py-8"><Spinner /></div>
              )}

              {!isLoading && debouncedQ.length >= 2 && !hasResults && (
                <p className="text-sm text-gray-400 text-center py-8">No results for "{query}"</p>
              )}

              {!debouncedQ && (
                <p className="text-xs text-gray-400 text-center py-8">Type at least 2 characters to search</p>
              )}

              {hasResults && (
                <div className="py-2">
                  {results!.tasks.length > 0 && (
                    <Section icon={<CheckSquare size={13} />} title="Tasks">
                      {results!.tasks.map(task => (
                        <ResultItem
                          key={task._id}
                          icon={<CheckSquare size={13} className="text-blue-500" />}
                          primary={task.title}
                          secondary={`${task.status} · ${task.priority}`}
                          onClick={() => { navigate(`/tasks/${task._id}?workspaceId=${task.workspaceId}`); handleClose(); }}
                        />
                      ))}
                    </Section>
                  )}
                  {results!.projects.length > 0 && (
                    <Section icon={<FolderKanban size={13} />} title="Projects">
                      {results!.projects.map(p => (
                        <ResultItem
                          key={p._id}
                          icon={<FolderKanban size={13} className="text-primary-500" />}
                          primary={p.name}
                          secondary={`[${p.key}] · ${p.status}`}
                          onClick={() => { navigate(`/projects/${p._id}/board?workspaceId=${p.workspaceId}`); handleClose(); }}
                        />
                      ))}
                    </Section>
                  )}
                  {results!.workspaces.length > 0 && (
                    <Section icon={<Briefcase size={13} />} title="Workspaces">
                      {results!.workspaces.map(ws => (
                        <ResultItem
                          key={ws._id}
                          icon={<Briefcase size={13} className="text-green-500" />}
                          primary={ws.name}
                          secondary={`/${ws.slug}`}
                          onClick={() => { navigate('/workspaces'); handleClose(); }}
                        />
                      ))}
                    </Section>
                  )}
                  {results!.users.length > 0 && (
                    <Section icon={<User size={13} />} title="People">
                      {results!.users.map(u => (
                        <ResultItem
                          key={u._id}
                          icon={<User size={13} className="text-violet-500" />}
                          primary={u.name}
                          secondary={u.email}
                          onClick={() => handleClose()}
                        />
                      ))}
                    </Section>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">↵</kbd> select</span>
              <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

function ResultItem({ icon, primary, secondary, onClick }: {
  icon: React.ReactNode; primary: string; secondary: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{primary}</p>
        <p className="text-xs text-gray-400 truncate">{secondary}</p>
      </div>
    </button>
  );
}
