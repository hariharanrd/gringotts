import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: any;
  label: string;
}

interface CustomSelectProps {
  value: any;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  dropdownClassName = '',
  autoFocus = false,
  onBlur
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus && triggerRef.current) {
      triggerRef.current.focus();
      setIsOpen(true);
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onBlur) {
          onBlur();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (val: any) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (onBlur) onBlur();
    } else if (e.key === 'ArrowDown' && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full text-left" data-spot-edit="true">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all shadow-sm ${className}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 mt-1.5 w-full min-w-[140px] max-h-60 overflow-y-auto bg-white/95 dark:bg-slate-950/95 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl py-1.5 z-[150] glass backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-200 ${dropdownClassName}`}>
          {options.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-slate-400 italic">No options</div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-4 py-2 text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
