import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

interface Position {
  top: number;
  left?: number;
  right?: number;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const top = rect.bottom + 4;
    if (align === 'right') {
      setPosition({ top, right: window.innerWidth - rect.right });
    } else {
      setPosition({ top, left: rect.left });
    }
  }, [align]);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open) calculatePosition();
    setOpen((p) => !p);
  }

  // Close when clicking outside both the trigger and the menu
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Close on scroll or resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      className="fixed w-48 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl py-1"
      style={{
        top: position.top,
        zIndex: 99999,
        ...(position.right !== undefined ? { right: position.right } : { left: position.left }),
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          disabled={item.disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!item.disabled) {
              item.onClick();
              setOpen(false);
            }
          }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left',
            item.danger
              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            item.disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        onClick={handleToggle}
      >
        {trigger}
      </div>
      {typeof document !== 'undefined' && createPortal(menu, document.body)}
    </>
  );
}
