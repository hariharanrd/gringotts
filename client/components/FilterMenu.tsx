import React, { useState } from 'react';
import { Filter, X, Plus } from 'lucide-react';

export interface FilterCriteria {
  field: string;
  condition: string;
  value: string;
}

interface FilterMenuProps {
  activeFilters: FilterCriteria[];
  onApplyFilters: (filters: FilterCriteria[]) => void;
  availableFields: { label: string; value: string; type?: 'string' | 'number' | 'date' }[];
}

export const FilterMenu: React.FC<FilterMenuProps> = ({ activeFilters, onApplyFilters, availableFields }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterCriteria[]>([]);

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

  const updateFilter = (index: number, key: keyof FilterCriteria, val: string) => {
    const newFilters = [...draftFilters];

    if (key === 'field') {
      const fieldDef = availableFields.find(f => f.value === val);
      const conditions = getAvailableConditions(fieldDef?.type || 'string');
      // If current condition is incompatible with new field type, reset to first available condition
      if (!conditions.find(c => c.value === newFilters[index].condition)) {
        newFilters[index].condition = conditions[0].value;
      }
    }

    newFilters[index][key] = val;
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

  const getFieldLabel = (val: string) => availableFields.find(f => f.value === val)?.label || val;

  const getAvailableConditions = (type: string) => {
    switch (type) {
      case 'number':
      case 'date':
        return [
          { value: 'eq', label: 'equals' },
          { value: 'gt', label: 'greater than' },
          { value: 'lt', label: 'less than' }
        ];
      case 'string':
      default:
        return [
          { value: 'eq', label: 'equals' },
          { value: 'like', label: 'contains' }
        ];
    }
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'eq': return 'equals';
      case 'like': return 'contains';
      case 'gt': return 'greater than';
      case 'lt': return 'less than';
      default: return cond;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Applied Filters Badges */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map((filter, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm animate-in fade-in zoom-in-95">
              <span>{getFieldLabel(filter.field)}</span>
              <span className="text-slate-400 dark:text-slate-500">{getConditionLabel(filter.condition)}</span>
              <span className="text-cyan-600 dark:text-cyan-400">"{filter.value}"</span>
              <button
                onClick={() => removeAppliedFilter(idx)}
                className="ml-1 -mr-1 text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter Button & Dropdown */}
      <div className="relative">
        <button
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-colors text-sm font-medium ${activeFilters.length > 0
            ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
          <Filter className="w-4 h-4" />
          Filter {activeFilters.length > 0 && <span>({activeFilters.length})</span>}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full w-96 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Filters</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1">
              {draftFilters.map((filter, index) => (
                <div key={index} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <select
                    className="flex-1 text-xs px-2 py-1.5 rounded-md bg-white dark:bg-slate-800 border-none shadow-sm focus:ring-1 focus:ring-cyan-500 outline-none dark:text-slate-200"
                    value={filter.field} onChange={e => updateFilter(index, 'field', e.target.value)}
                  >
                    {availableFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <select
                    className="w-24 text-xs px-2 py-1.5 rounded-md bg-white dark:bg-slate-800 border-none shadow-sm focus:ring-1 focus:ring-cyan-500 outline-none dark:text-slate-200"
                    value={filter.condition} onChange={e => updateFilter(index, 'condition', e.target.value)}
                  >
                    {getAvailableConditions(availableFields.find(f => f.value === filter.field)?.type || 'string').map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="w-20 text-xs px-2 py-1.5 rounded-md bg-white dark:bg-slate-800 border-none shadow-sm focus:ring-1 focus:ring-cyan-500 outline-none dark:text-slate-200"
                    value={filter.value} onChange={e => updateFilter(index, 'value', e.target.value)}
                    placeholder="Value"
                  />
                  <button onClick={() => removeDraftFilter(index)} className="text-rose-400 hover:text-rose-600 transition-colors p-1"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {draftFilters.length === 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No filters added yet.</div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <button onClick={addFilter} className="flex items-center text-xs font-medium text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                <Plus className="w-3 h-3 mr-1" /> Add Rule
              </button>
              <div className="flex-1"></div>
              <button onClick={clear} className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Clear All</button>
              <button onClick={apply} className="px-4 py-1.5 text-xs font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors shadow-sm shadow-cyan-500/20">Apply</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
