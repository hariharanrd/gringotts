import React, { useState } from 'react';

interface GoblinAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animateHover?: boolean;
  useGif?: boolean;
  gifUrl?: string;
}

export const DEFAULT_GOBLIN_GIF = 'https://media1.tenor.com/m/rXnMX6g7PvMAAAAC/surprised.gif';

export const GoblinAvatar: React.FC<GoblinAvatarProps> = ({
  size = 'md',
  className = '',
  animateHover = true,
  useGif = true,
  gifUrl = DEFAULT_GOBLIN_GIF
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9'
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer Magical Glow ring */}
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-amber-400 to-teal-500 opacity-80 blur-[3px] transition-all duration-300 ${animateHover ? 'group-hover:opacity-100 group-hover:blur-[6px]' : ''}`} />
      
      {/* Main Avatar Container */}
      <div className={`relative rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-950 to-amber-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10 dark:shadow-lg dark:shadow-emerald-950/50 overflow-hidden ${sizeMap[size]} ${animateHover ? 'transition-transform duration-300 group-hover:scale-105' : ''}`}>
        {useGif && !imgError ? (
          <img
            src={gifUrl}
            alt="Goblin AI Vault Keeper"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-2xl filter contrast-105 brightness-105"
          />
        ) : (
          /* Custom SVG Goblin Icon with pointed ears, spectacles & coin emblem */
          <svg
            className={`${iconSizes[size]} fill-current text-emerald-400 filter drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]`}
            viewBox="0 0 24 24"
          >
            {/* Goblin Head with Pointed Ears */}
            <path d="M12 2C8.5 2 6 4.5 6 7.5C4 7.5 2 9.5 2 11C2 12 3.5 12.5 4.5 12.5C5 14.5 6.5 16 8.5 17C9.5 18 10.5 18.5 12 18.5C13.5 18.5 14.5 18 15.5 17C17.5 16 19 14.5 19.5 12.5C20.5 12.5 22 12 22 11C22 9.5 20 7.5 18 7.5C18 4.5 15.5 2 12 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Spectacles */}
            <circle cx="9" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <circle cx="15" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <path d="M11 9.5H13" stroke="currentColor" strokeWidth="1.3" />
            {/* Shrewd smirk */}
            <path d="M10 14C11 14.8 13 14.8 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            {/* Gringotts Gold Coin Emblem on forehead */}
            <circle cx="12" cy="5.2" r="1.2" className="fill-amber-400 text-amber-300" stroke="#78350f" strokeWidth="0.4" />
          </svg>
        )}

        {/* Small coin sparkle badge bottom right */}
        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-amber-950 border border-amber-300 shadow z-10">
          🪙
        </span>
      </div>
    </div>
  );
};
