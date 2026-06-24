import React, { useState, useEffect } from 'react';
import { FolderClosed } from 'lucide-react';
import { api } from '../services/api';

interface LazyGroupThumbnailProps {
  groupId: number;
  groupName: string;
  isBanner?: boolean; // true for details page cover banner, false for group card top banner
}

const LazyGroupThumbnail: React.FC<LazyGroupThumbnailProps> = ({ groupId, groupName, isBanner }) => {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getTransactionGroupThumbnail(groupId)
      .then(data => {
        if (active) {
          setThumbnailSrc(data || null);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load group thumbnail:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [groupId]);

  if (loading) {
    return (
      <div className={`${isBanner ? 'h-48 sm:h-64' : 'h-28'} w-full bg-slate-250 dark:bg-slate-800 animate-pulse relative rounded-3xl overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600">
          <FolderClosed className="w-8 h-8 animate-pulse text-slate-350 dark:text-slate-700" />
        </div>
      </div>
    );
  }

  const src = thumbnailSrc || '/default-group-cover.svg';

  return (
    <div className={`relative ${isBanner ? 'h-48 sm:h-64' : 'h-28'} w-full overflow-hidden ${isBanner ? 'rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md' : ''}`}>
      <img
        src={src}
        alt={groupName}
        className={`w-full h-full object-cover transition-transform duration-500 ${!isBanner ? 'group-hover:scale-105' : ''}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
    </div>
  );
};

export default LazyGroupThumbnail;
