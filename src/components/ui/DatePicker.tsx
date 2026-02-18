import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DatePicker({ value, onChange, label, error, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectDay = (d: number) => {
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  const displayLabel = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div ref={ref} className={cn('w-full relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full px-3 py-2 bg-slate-950 border rounded-lg text-left text-slate-200 flex items-center gap-2',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500',
          error ? 'border-red-500/50' : 'border-slate-700'
        )}
      >
        <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
        <span>{value ? displayLabel : '— เลือกวัน —'}</span>
      </button>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1 left-0 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-[260px]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-slate-700 text-slate-300"
              aria-label="เดือนก่อน"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-slate-200">
              {viewDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded hover:bg-slate-700 text-slate-300"
              aria-label="เดือนถัดไป"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
              <div key={d} className="py-1 text-slate-500 font-medium">
                {d}
              </div>
            ))}
            {days.map((d, i) => (
              <div key={i} className="py-0.5">
                {d === null ? (
                  <span className="block w-8 h-8" />
                ) : (
                  <button
                    type="button"
                    onClick={() => selectDay(d)}
                    className={cn(
                      'w-8 h-8 rounded-full text-slate-200 hover:bg-cyan-600 hover:text-white transition-colors',
                      value === `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                        ? 'bg-cyan-600 text-white'
                        : 'bg-transparent'
                    )}
                  >
                    {d}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
