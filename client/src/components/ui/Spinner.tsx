import React from 'react';
import { cn } from '../../utils/cn';

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string; }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-primary-600', sizes[size], className)} role="status" aria-label="Loading" />
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-950 z-50">
      <Spinner size="lg" />
    </div>
  );
}
