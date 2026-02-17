import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
    outline: 'border border-slate-600 text-slate-400'
  };

  return (
    <span 
      className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full", variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}