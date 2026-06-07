import React, { useState, useEffect, useRef } from 'react';
import { Filter, X, Plus } from 'lucide-react';

export interface FilterCriteria {
  field: string;
  condition: string;
  value: string;
  label?: string; // For display purposes
}

export interface FilterFieldDef {
  label: string;
  value: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
  options?: { label: string; value: string }[];
  fetchOptions?: (page: number) => Promise<{ data: { label: string; value: string }[], hasMore: boolean }>;
}

const InfiniteSelect = ({ fetchOptions, value, label, onChange }: { fetchOptions: (page: number) => Promise<{ data: { label: string; value: string }[], hasMore: boolean }>, value: string, label?: string, onChange: (val: string, label: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadOptions = async () => {
      if (loading || !hasMore) return;
      setLoading(true);
      try {
        const res = await fetchOptions(page);
        setOptions(prev => {
          const newOpts = res.data.filter(d => !prev.find(p => p.value === d.value));
          return [...prev, ...newOpts];
        });
        setHasMore(res.hasMore);
      } catch (e) {
        setHasMore(false);
      }
      setLoading(false);
    };
    loadOptions();
  }, [page, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value || 'Select Value...';

  return (
    <div className="relative flex-1" ref={containerRef}>
      <button
        type="button"
        className="w-full text-left text-sm sm:text-xs px-3 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/50 outline-none dark:text-slate-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="block truncate text-slate-700 dark:text-slate-200">{label || options.find(o => o.value === value)?.label || value || 'Select Value...'}</span>
      </button>
      {isOpen && (
        <div className="absolute z-[60] w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <div
            className="px-3 py-2 text-sm sm:text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-500 dark:text-slate-400"
            onClick={() => { onChange('', ''); setIsOpen(false); }}
          >
            Select Value...
          </div>
          {options.map(opt => (
            <div
              key={opt.value}
              className="px-3 py-2 text-sm sm:text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200"
              onClick={() => { onChange(opt.value, opt.label); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
          {loading && <div className="px-3 py-2 text-sm text-slate-500">Loading...</div>}
          <div ref={observerTarget} className="h-1" />
        </div>
      )}
    </div>
  );
};

interface FilterMenuProps {
  activeFilters: FilterCriteria[];
  onApplyFilters: (filters: FilterCriteria[]) => void;
  availableFields: FilterFieldDef[];
}

export const FilterChips: React.FC<{
  activeFilters: FilterCriteria[];
  availableFields: FilterFieldDef[];
  onRemoveFilter: (index: number) => void;
}> = ({ activeFilters, availableFields, onRemoveFilter }) => {
  const getFieldLabel = (val: string) => availableFields.find(f => f.value === val)?.label || val;
  const getConditionLabel = (cond: string, type: string) => {
    switch (cond) {
      case 'eq': return 'equals';
      case 'like': return 'contains';
      case 'gt': return type === 'number' ? 'greater than' : 'after';
      case 'ge': return type === 'number' ? 'greater than or equal to' : 'on or after';
      case 'lt': return type === 'number' ? 'lesser than' : 'before';
      case 'le': return type === 'number' ? 'lesser than or equal to' : 'on or before';
      default: return cond;
    }
  };

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map((filter, idx) => {
        const fieldDef = availableFields.find(f => f.value === filter.field);
        const type = fieldDef?.type || 'string';
        return (
          <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm animate-in fade-in zoom-in-95">
            <span className="text-slate-400 uppercase tracking-tighter text-[9px]">{getFieldLabel(filter.field)}</span>
            <span className="text-slate-400 dark:text-slate-500 lowercase font-medium">{getConditionLabel(filter.condition, type)}</span>
            <span className="text-cyan-600 dark:text-cyan-400 truncate max-w-[120px]" title={filter.value}>"{filter.label || filter.value}"</span>
            <button
              onClick={() => onRemoveFilter(idx)}
              className="ml-1 -mr-1 text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Remove filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const FilterMenu: React.FC<FilterMenuProps> = ({ activeFilters, onApplyFilters, availableFields }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterCriteria[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    setDraftFilters([...activeFilters]);
    setIsOpen(true);
  };

  const addFilter = () => {
    if (availableFields.length === 0) return;
    const defaultField = availableFields[0];
    const defaultCondition = getAvailableConditions(defaultField)[0].value;
    setDraftFilters([...draftFilters, { field: defaultField.value, condition: defaultCondition, value: '' }]);
  };

  const updateFilter = (index: number, key: keyof FilterCriteria, val: string, label?: string) => {
    setDraftFilters(prev => prev.map((f, i) => {
      if (i === index) {
        const updated = { ...f, [key]: val };
        
        if (key === 'field') {
          const fieldDef = availableFields.find(x => x.value === val);
          const conditions = getAvailableConditions(fieldDef);
          if (!conditions.find(c => c.value === f.condition)) {
            updated.condition = conditions[0].value;
          }
          updated.value = '';
          delete updated.label;
        }

        if (label !== undefined) {
          updated.label = label;
        } else if (key === 'value' && !label) {
          delete updated.label;
        }
        
        return updated;
      }
      return f;
    }));
  };

  const removeDraftFilter = (index: number) => {
    const newFilters = draftFilters.filter((_, i) => i !== index);
    setDraftFilters(newFilters);
  };

  const removeAppliedFilter = (index: number) => {
    const newApplied = activeFilters.filter((_, i) => i !== index);
    setDraftFilters(newApplied);
    onApplyFilters(newApplied);
  };

  const apply = () => {
    const validFilters = draftFilters.filter(f => f.value.trim() !== '');
    onApplyFilters(validFilters);
    setIsOpen(false);
  };

  const clear = () => {
    setDraftFilters([]);
    onApplyFilters([]);
    setIsOpen(false);
  };

  const getAvailableConditions = (fieldDef?: FilterFieldDef) => {
    if (!fieldDef) return [{ value: 'eq', label: 'equals' }];

    if (fieldDef.options || fieldDef.fetchOptions || fieldDef.type === 'boolean') {
      return [{ value: 'eq', label: 'equals' }];
    }

    switch (fieldDef.type) {
      case 'number':
        return [
          { value: 'eq', label: 'equals' },
          { value: 'gt', label: 'greater than' },
          { value: 'ge', label: 'greater than or equal to' },
          { value: 'lt', label: 'lesser than' },
          { value: 'le', label: 'lesser than or equal to' }
        ];
      case 'date':
        return [
          { value: 'eq', label: 'equals' },
          { value: 'gt', label: 'after' },
          { value: 'ge', label: 'on or after' },
          { value: 'lt', label: 'before' },
          { value: 'le', label: 'on or before' }
        ];
      case 'string':
      default:
        return [
          { value: 'eq', label: 'equals' },
          { value: 'like', label: 'contains' }
        ];
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/85 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <button
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg transition-all text-xs font-bold whitespace-nowrap ${
            activeFilters.length > 0
              ? 'bg-cyan-500 text-white shadow-sm hover:bg-cyan-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-none'
          }`}
          title="Filters"
        >
          <Filter className={`w-4 h-4 ${activeFilters.length > 0 ? 'text-white' : 'text-cyan-500'}`} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters.length > 0 && (
            <span className={`text-[9px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[16px] h-4 flex items-center justify-center shadow-sm ${
              activeFilters.length > 0 ? 'bg-white text-cyan-600' : 'bg-cyan-500 text-white'
            }`}>
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 sm:hidden animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed sm:absolute sm:right-0 bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-auto w-full sm:w-[580px] sm:mt-2 bg-white dark:bg-slate-800 border-t sm:border border-slate-200 dark:border-slate-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 p-4 sm:p-6 flex flex-col max-h-[85vh] sm:max-h-[600px] animate-in slide-in-from-bottom-4 sm:slide-in-from-top-2">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Advanced Filters</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-1 min-h-[150px]">
              {draftFilters.map((filter, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-center bg-slate-50/50 dark:bg-slate-900/40 p-4 sm:p-3 rounded-2xl sm:rounded-xl border border-slate-200/50 dark:border-slate-800/50 relative group">
                  <div className="sm:col-span-4">
                    <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Field</label>
                    <select
                      className="w-full text-sm sm:text-xs px-3 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 outline-none dark:text-slate-200 transition-all cursor-pointer font-medium"
                      value={filter.field}
                      onChange={e => updateFilter(index, 'field', e.target.value)}
                    >
                      {availableFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Condition</label>
                    <select
                      className="w-full text-sm sm:text-xs px-3 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 outline-none dark:text-slate-200 transition-all cursor-pointer"
                      value={filter.condition}
                      onChange={e => updateFilter(index, 'condition', e.target.value)}
                    >
                      {getAvailableConditions(availableFields.find(f => f.value === filter.field)).map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <label className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Value</label>
                    {(() => {
                      const fieldDef = availableFields.find(f => f.value === filter.field);

                      if (fieldDef?.fetchOptions && filter.condition === 'eq') {
                        return (
                          <InfiniteSelect
                            fetchOptions={fieldDef.fetchOptions}
                            value={filter.value}
                            label={filter.label}
                            onChange={(val, label) => updateFilter(index, 'value', val, label)}
                          />
                        );
                      }

                      if (fieldDef?.options && (filter.condition === 'eq' || fieldDef.type === 'boolean')) {
                        return (
                          <select
                            className="w-full text-sm sm:text-xs px-3 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 outline-none dark:text-slate-200 transition-all cursor-pointer"
                            value={filter.value}
                            onChange={e => {
                              const label = e.target.options[e.target.selectedIndex].text;
                              updateFilter(index, 'value', e.target.value, label === 'Select Value...' ? '' : label);
                            }}
                          >
                            <option value="">Select Value...</option>
                            {fieldDef.options.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        );
                      }

                      if (fieldDef?.type === 'boolean') {
                        return (
                          <select
                            className="w-full text-sm sm:text-xs px-3 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 outline-none dark:text-slate-200 transition-all cursor-pointer"
                            value={filter.value}
                            onChange={e => updateFilter(index, 'value', e.target.value)}
                          >
                            <option value="">Select Value...</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        );
                      }

                      return (
                        <input
                          type={fieldDef?.type === 'date' ? 'date' : 'text'}
                          className="w-full text-sm sm:text-xs px-3 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/30 outline-none dark:text-slate-200 transition-all placeholder:text-slate-400"
                          value={filter.value}
                          onChange={e => updateFilter(index, 'value', e.target.value)}
                          placeholder="Type value..."
                        />
                      );
                    })()}
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      onClick={() => removeDraftFilter(index)}
                      className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Remove filter rule"
                    >
                      <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {draftFilters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/50 animate-in fade-in zoom-in-95">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                    <Filter className="w-6 h-6 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No filters added yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Add rules to narrow down your results.</p>
                  <button
                    onClick={addFilter}
                    className="mt-4 px-4 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-xl transition-colors uppercase tracking-widest"
                  >
                    Add Rule
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100 dark:border-slate-700/50 mt-auto">
              <button
                onClick={addFilter}
                className="flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-cyan-600 bg-cyan-500/10 hover:bg-cyan-500/20 dark:text-cyan-400 rounded-xl transition-all w-full sm:w-auto uppercase tracking-widest active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Rule
              </button>

              <div className="flex gap-3 sm:ml-auto w-full sm:w-auto">
                <button
                  onClick={clear}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors uppercase tracking-widest"
                >
                  Clear All
                </button>
                <button
                  onClick={apply}
                  className="flex-[2] sm:flex-none px-8 py-2.5 text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 uppercase tracking-widest"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};