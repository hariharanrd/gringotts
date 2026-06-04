
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasMore,
  onPageChange,
  pageSize,
  onPageSizeChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/50 mt-4">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Show</span>
        <CustomSelect
          value={pageSize}
          onChange={(val) => onPageSizeChange(Number(val))}
          options={[
            { value: 10, label: '10 per page' },
            { value: 25, label: '25 per page' },
            { value: 50, label: '50 per page' },
            { value: 75, label: '75 per page' },
            { value: 100, label: '100 per page' }
          ]}
          className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/60 !w-auto"
          dropdownClassName="w-36 mt-1.5"
        />
      </div>

      {/* Navigation Buttons and Info */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
          Page <span className="text-slate-900 dark:text-white font-bold">{currentPage}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalPages || 1}</span>
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasMore}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
