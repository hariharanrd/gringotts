import React from 'react';
import { Category } from '../types';
import { ICONS } from './icons';
import { Tag } from 'lucide-react';

interface CategoryIconProps {
  category?: Category;
  className?: string;
  size?: number | string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = "w-4 h-4", size }) => {

  const IconComponent = category && category.icon && (ICONS as any)[category.icon] ? (ICONS as any)[category.icon] : Tag;
  const colorClass = category && category.color ? category.color : 'text-slate-500 dark:text-slate-400';

  return (
    <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0`}>
      <IconComponent className={`${className} ${colorClass}`} size={size} />
    </div>
  );
};

export default CategoryIcon;
