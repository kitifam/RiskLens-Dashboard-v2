import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none active:scale-95';
  
  const variants = {
    primary: 'bg-cyan-600 text-white hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(8,145,178,0.5)] focus:ring-cyan-500 border border-transparent',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 focus:ring-slate-500 border border-slate-700',
    outline: 'border border-slate-600 bg-transparent hover:bg-slate-800 text-slate-300 focus:ring-slate-500',
    ghost: 'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 focus:ring-slate-500',
    danger: 'bg-red-900/50 text-red-200 hover:bg-red-900 hover:text-white border border-red-800 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] focus:ring-red-500'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg'
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}