import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  className?: string;
  /** 'on' = เปิด (สีเขียว), 'off' = ปิด (สีเทา) */
  variant?: 'on' | 'off';
}

export function Toast({ message, visible, onDismiss, duration = 3500, className, variant = 'on' }: ToastProps) {
  useEffect(() => {
    if (!visible || !message) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [visible, message, duration, onDismiss]);

  if (!message) return null;

  const isOn = variant === 'on';
  const bg = isOn ? 'bg-emerald-900/95 border-emerald-500/50' : 'bg-slate-800 border-slate-600';
  const text = isOn ? 'text-emerald-100' : 'text-slate-200';

  return (
    <div
      role="alert"
      className={cn(
        'fixed bottom-6 right-6 z-[100] max-w-sm',
        'transition-all duration-500 ease-out',
        visible
          ? 'translate-x-0 translate-y-0 opacity-100'
          : 'translate-x-full translate-y-full opacity-0 pointer-events-none',
        className
      )}
    >
      <div className={cn(
        'border rounded-lg shadow-xl px-4 py-3 text-sm',
        bg,
        text
      )}>
        {message}
      </div>
    </div>
  );
}
