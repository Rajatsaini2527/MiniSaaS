import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, type ChatMessage } from '../../services/chat.service';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { Avatar } from '../ui/Avatar';
import { formatRelative } from '../../utils/format';
import { cn } from '../../utils/cn';

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qc = useQueryClient();

  // Load message history
  const { data } = useQuery({
    queryKey: ['chat', activeWorkspaceId],
    queryFn: () => chatService.getMessages(activeWorkspaceId!).then(r => r.data),
    enabled: !!activeWorkspaceId,
    staleTime: 0,
  });

  useEffect(() => {
    if (data) setMessages(data);
  }, [data]);

  // Socket events
  useEffect(() => {
    if (!activeWorkspaceId) return;
    const socket = getSocket();

    const onMessage = (msg: ChatMessage) => {
      if (msg.workspaceId === activeWorkspaceId && !msg.projectId) {
        setMessages(prev => [...prev, msg]);
        qc.invalidateQueries({ queryKey: ['chat', activeWorkspaceId] });
      }
    };

    const onTyping = ({ name, isTyping }: { userId: string; name: string; isTyping: boolean }) => {
      setTypingUsers(prev =>
        isTyping ? (prev.includes(name) ? prev : [...prev, name]) : prev.filter(n => n !== name)
      );
    };

    socket.on('chat.message', onMessage);
    socket.on('chat.typing', onTyping);

    return () => {
      socket.off('chat.message', onMessage);
      socket.off('chat.typing', onTyping);
    };
  }, [activeWorkspaceId, qc]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !activeWorkspaceId) return;
    const socket = getSocket();
    socket.emit('chat.message', { workspaceId: activeWorkspaceId, content: message.trim() });
    setMessage('');
  }

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setMessage(e.target.value);
    const socket = getSocket();
    socket.emit('chat.typing', { workspaceId: activeWorkspaceId, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('chat.typing', { workspaceId: activeWorkspaceId, isTyping: false });
    }, 1500);
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col" style={{ height: 420 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary-600" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Team Chat</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400" aria-label="Close chat">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No messages yet. Say hello! 👋</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user._id === user?._id;
          return (
            <div key={msg._id} className={cn('flex gap-2', isMe && 'flex-row-reverse')}>
              <Avatar name={msg.user.name} src={msg.user.avatar} size="xs" className="flex-shrink-0 mt-0.5" />
              <div className={cn('max-w-[75%]', isMe && 'items-end flex flex-col')}>
                <div className={cn('px-3 py-1.5 rounded-2xl text-sm', isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm')}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 px-1">{formatRelative(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <p className="text-xs text-gray-400 italic">{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <input
          value={message}
          onChange={handleTyping}
          placeholder="Message…"
          maxLength={2000}
          className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          aria-label="Type a message"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-1.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
