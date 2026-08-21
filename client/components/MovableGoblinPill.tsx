import React, { useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { GoblinAvatar } from './GoblinAvatar';

interface MovableGoblinPillProps {
  isOpen: boolean;
  onClick: () => void;
}

const STORAGE_KEY = 'gringotts_goblin_pill_pos';
const PADDING = 16;

export const MovableGoblinPill: React.FC<MovableGoblinPillProps> = ({
  onClick,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);

  // Keep currentPosRef in sync with state for accurate reading in event handlers
  useEffect(() => {
    currentPosRef.current = position;
  }, [position]);

  // Initialize position from localStorage or calculate default bottom-right
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialPos: { x: number; y: number } | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          initialPos = parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved goblin pill position', e);
      }
    }

    const computeClampedPos = (pos: { x: number; y: number } | null) => {
      const pillWidth = pillRef.current?.offsetWidth || 135;
      const pillHeight = pillRef.current?.offsetHeight || 48;
      const maxX = Math.max(PADDING, window.innerWidth - pillWidth - PADDING);
      const maxY = Math.max(PADDING, window.innerHeight - pillHeight - PADDING);

      if (pos) {
        return {
          x: Math.min(Math.max(PADDING, pos.x), maxX),
          y: Math.min(Math.max(PADDING, pos.y), maxY),
        };
      }
      return {
        x: Math.max(PADDING, window.innerWidth - pillWidth - 24),
        y: Math.max(PADDING, window.innerHeight - pillHeight - 24),
      };
    };

    setPosition(computeClampedPos(initialPos));
  }, []);

  // Handle window resizing to keep pill within screen bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const pillWidth = pillRef.current?.offsetWidth || 135;
        const pillHeight = pillRef.current?.offsetHeight || 48;
        const maxX = Math.max(PADDING, window.innerWidth - pillWidth - PADDING);
        const maxY = Math.max(PADDING, window.innerHeight - pillHeight - PADDING);

        return {
          x: Math.min(Math.max(PADDING, prev.x), maxX),
          y: Math.min(Math.max(PADDING, prev.y), maxY),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary mouse click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };

    const currentX = currentPosRef.current?.x ?? (window.innerWidth - 160);
    const currentY = currentPosRef.current?.y ?? (window.innerHeight - 80);
    startPosRef.current = { x: currentX, y: currentY };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported or fails
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (!hasMovedRef.current && Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      const pillWidth = pillRef.current?.offsetWidth || 135;
      const pillHeight = pillRef.current?.offsetHeight || 48;
      const maxX = Math.max(PADDING, window.innerWidth - pillWidth - PADDING);
      const maxY = Math.max(PADDING, window.innerHeight - pillHeight - PADDING);

      const nextX = Math.min(Math.max(PADDING, startPosRef.current.x + dx), maxX);
      const nextY = Math.min(Math.max(PADDING, startPosRef.current.y + dy), maxY);

      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    if (hasMovedRef.current) {
      setIsDragging(false);
      // Save latest position to localStorage
      if (currentPosRef.current) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPosRef.current));
      }
    } else {
      setIsDragging(false);
      onClick();
    }
    hasMovedRef.current = false;
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    setIsDragging(false);
    hasMovedRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  };

  // If position hasn't been computed yet, use bottom-right default styling
  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
        userSelect: 'none',
      }
    : {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        touchAction: 'none',
        userSelect: 'none',
      };

  return (
    <div
      ref={pillRef}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`z-40 p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/40 text-emerald-300 shadow-2xl shadow-emerald-950/80 flex items-center gap-2 group goblin-glow goblin-trigger-btn select-none touch-none ${
        isDragging
          ? 'cursor-grabbing scale-105 shadow-emerald-500/30 opacity-95'
          : 'cursor-grab hover:scale-105 active:scale-95 transition-transform duration-200'
      }`}
      title="Drag to reposition or click to ask Goblin AI Vault Keeper"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <GripVertical className="w-3.5 h-3.5 text-emerald-500/40 group-hover:text-emerald-400/80 transition-colors -mr-0.5" />
      <GoblinAvatar size="sm" animateHover={false} />
      <span className="text-xs font-extrabold tracking-wide hidden sm:inline text-emerald-300 group-hover:text-white pointer-events-none">
        Goblin AI
      </span>
    </div>
  );
};
