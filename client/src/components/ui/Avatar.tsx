import React from 'react';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/format';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
const colors = ['bg-violet-500','bg-blue-500','bg-green-500','bg-yellow-500','bg-pink-500','bg-indigo-500','bg-teal-500'];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />;
  }
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0', sizes[size], colorForName(name), className)}>
      {getInitials(name)}
    </div>
  );
}
