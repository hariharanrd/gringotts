
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, hasMore, onPageChange }) => {
  return (
    <div className="flex items-center justify-between pt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-xl hover:bg-slate-700/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>
      <span className="text-sm text-slate-400 font-medium">
        Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-xl hover:bg-slate-700/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
