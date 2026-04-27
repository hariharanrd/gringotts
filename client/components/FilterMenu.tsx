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
            onClick={() => { onChange(''); setIsOpen(false); }}
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
  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'eq': return 'equals';
      case 'like': return 'contains';
      case 'gt': return 'after';
      case 'ge': return 'on or after';
      case 'lt': return 'before';
      case 'le': return 'on or before';
      default: return cond;
    }
  };

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map((filter, idx) => (
        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm animate-in fade-in zoom-in-95">
          <span className="text-slate-400 uppercase tracking-tighter text-[9px]">{getFieldLabel(filter.field)}</span>
          <span className="text-slate-400 dark:text-slate-500 lowercase font-medium">{getConditionLabel(filter.condition)}</span>
          <span className="text-cyan-600 dark:text-cyan-400 truncate max-w-[120px]" title={filter.value}>"{filter.label || filter.value}"</span>
          <button
            onClick={() => onRemoveFilter(idx)}
            className="ml-1 -mr-1 text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Remove filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
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
    const defaultCondition = getAvailableConditions(defaultField.type || 'string')[0].value;
    setDraftFilters([...draftFilters, { field: defaultField.value, condition: defaultCondition, value: '' }]);
  };

  const updateFilter = (index: number, key: keyof FilterCriteria, val: string, label?: string) => {
    const newFilters = [...draftFilters];
    
    if (key === 'field') {
      const fieldDef = availableFields.find(f => f.value === val);
      const conditions = getAvailableConditions(fieldDef?.type || 'string');
      if (!conditions.find(c => c.value === newFilters[index].condition)) {
        newFilters[index].condition = conditions[0].value;
      }
    }

    newFilters[index][key] = val;
    if (label !== undefined) {
      newFilters[index].label = label;
    } else if (key === 'value' && !label) {
       // If value is updated without explicit label, clear old label
       delete newFilters[index].label;
    }
    
    setDraftFilters(newFilters);
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

  const getAvailableConditions = (type: string) => {
    switch (type) {
      case 'number':
      case 'date':
        return [
          { value: 'eq', label: 'equals' },
          { value: 'gt', label: 'after' },
          { value: 'ge', label: 'on or after' },
          { value: 'lt', label: 'before' },
          { value: 'le', label: 'on or before' }
        ];
      case 'boolean':
        return [
          { value: 'eq', label: 'equals' }
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
    <div className="flex items-center gap-3 w-full sm:w-auto relative" ref={dropdownRef}>

      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-colors text-sm font-medium whitespace-nowrap w-full sm:w-auto ${activeFilters.length > 0
          ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
          : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filter</span>
        <span className="sm:hidden">Filters</span>
        {activeFilters.length > 0 && <span>({activeFilters.length})</span>}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 sm:hidden animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed sm:absolute sm:right-0 bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-auto w-full sm:w-96 sm:mt-2 bg-white dark:bg-slate-800 border-t sm:border border-slate-200 dark:border-slate-700/80 rounded-t-2xl sm:rounded-xl shadow-2xl z-50 p-4 sm:p-5 flex flex-col max-h-[85vh] sm:max-h-[600px] animate-in slide-in-from-bottom-4 sm:slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base sm:text-sm font-bold text-slate-800 dark:text-slate-200">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 min-h-[150px]">
              {draftFilters.map((filter, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-2 rounded-xl sm:rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2 w-full">
                    <select
                      className="flex-1 text-sm sm:text-xs px-2.5 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/50 outline-none dark:text-slate-200"
                      value={filter.field}
                      onChange={e => updateFilter(index, 'field', e.target.value)}
                    >
                      {availableFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select
                      className="w-1/3 sm:w-24 text-sm sm:text-xs px-2.5 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/50 outline-none dark:text-slate-200"
                      value={filter.condition}
                      onChange={e => updateFilter(index, 'condition', e.target.value)}
                    >
                      {getAvailableConditions(availableFields.find(f => f.value === filter.field)?.type || 'string').map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 w-full">
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
                            className="flex-1 text-sm sm:text-xs px-3 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/50 outline-none dark:text-slate-200"
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
                            className="flex-1 text-sm sm:text-xs px-3 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/50 outline-none dark:text-slate-200"
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
                          className="flex-1 text-sm sm:text-xs px-3 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border shadow-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500/50 outline-none dark:text-slate-200"
                          value={filter.value}
                          onChange={e => updateFilter(index, 'value', e.target.value)}
                          placeholder="Value"
                        />
                      );
                    })()}
                    <button
                      onClick={() => removeDraftFilter(index)}
                      className="flex items-center justify-center w-9 sm:w-auto px-2 text-rose-400 hover:text-white hover:bg-rose-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 sm:border-transparent sm:bg-transparent rounded-lg transition-colors"
                      aria-label="Remove filter rule"
                    >
                      <X className="w-4 h-4 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {draftFilters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Filter className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm sm:text-xs">No filters added yet.</p>
                  <button
                    onClick={addFilter}
                    className="mt-3 text-sm sm:text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Add your first rule
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4 sm:pt-3 border-t border-slate-100 dark:border-slate-700/50 mt-auto">
              <button
                onClick={addFilter}
                className="flex items-center justify-center gap-1.5 py-2.5 sm:py-1.5 px-4 text-sm sm:text-xs font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 rounded-xl sm:rounded-lg transition-colors w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 sm:w-3 sm:h-3" /> Add Rule
              </button>

              <div className="flex gap-2 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={clear}
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl sm:rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={apply}
                  className="flex-[2] sm:flex-none px-6 py-2.5 sm:py-1.5 text-sm sm:text-xs font-medium bg-cyan-500 text-white rounded-xl sm:rounded-lg hover:bg-cyan-600 transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98]"
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