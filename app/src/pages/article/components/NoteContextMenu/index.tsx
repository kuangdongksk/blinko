import { useEffect, useRef } from 'react';
import { Icon } from '@/components/Common/Iconify/icons';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface NoteContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
}

export const NoteContextMenu = ({ position, onClose, onInsertAbove, onInsertBelow }: NoteContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!position) return null;

  const menuWidth = 160;
  const menuHeight = 80;
  const x = Math.min(position.x, window.innerWidth - menuWidth);
  const y = Math.min(position.y, window.innerHeight - menuHeight);

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 bg-background border border-default-200 rounded-lg shadow-lg py-1 min-w-[160px]"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        <button
          onClick={() => {
            onInsertAbove();
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-default-100 flex items-center gap-2 text-sm"
        >
          <Icon icon="mdi:arrow-up" width="16" height="16" />
          在上方插入笔记
        </button>
        <button
          onClick={() => {
            onInsertBelow();
            onClose();
          }}
          className="w-full px-4 py-2 text-left hover:bg-default-100 flex items-center gap-2 text-sm"
        >
          <Icon icon="mdi:arrow-down" width="16" height="16" />
          在下方插入笔记
        </button>
      </div>
      <div className="fixed inset-0 z-40" onClick={onClose} />
    </>
  );
};
