"use client";

import React from 'react';
import { Pin } from 'lucide-react';
import { usePinStore } from '@/hooks/use-pin-store';
import { cn } from '@/lib/utils';

interface PinIndicatorProps {
  chatId: string;
  onClick?: () => void;
  className?: string;
}

export const PinIndicator: React.FC<PinIndicatorProps> = React.memo(({ 
  chatId, 
  onClick, 
  className 
}) => {
  // Early return if no chatId to prevent unnecessary renders
  if (!chatId) return null;
  
  // Use optimized selector that only returns the count
  const count = usePinStore((state) => state.getPinnedCount(chatId));

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md",
        "bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20",
        "text-indigo-400 hover:text-indigo-300 transition-all duration-200",
        "text-xs font-medium",
        className
      )}
      title={`${count} pinned message${count > 1 ? 's' : ''}`}
    >
      <Pin size={14} className="rotate-45" />
      <span>{count}</span>
    </button>
  );
});

export const PinBadge: React.FC<{ count: number; className?: string }> = ({ 
  count, 
  className 
}) => {
  if (count === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 px-1.5 py-0.5 rounded-full",
      "bg-indigo-500 text-white text-xs font-bold",
      className
    )}>
      <Pin size={10} className="rotate-45" />
      {count}
    </div>
  );
};