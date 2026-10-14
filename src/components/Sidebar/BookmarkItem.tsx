import React, { useState } from 'react';
import { BookmarkItem as BookmarkItemType, UserSettings } from '../../types';
import { getDomainInitials, getFaviconUrl } from '../../utils/favicon';
import { Icon } from '../Common/Icon';
import { ContextMenuState } from './ContextMenu';

interface BookmarkItemProps {
  item: BookmarkItemType;
  depth: number;
  settings: UserSettings;
  isFavorite: boolean;
  onOpen: (url: string, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, state: ContextMenuState) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (item: BookmarkItemType) => void;
  onDelete: (item: BookmarkItemType) => void;
  onMove: (sourceId: string, destination: { parentId: string; index?: number }) => void;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const BookmarkItem: React.FC<BookmarkItemProps> = ({
  item,
  depth,
  settings,
  isFavorite,
  onOpen,
  onContextMenu,
  onToggleFavorite,
  onEdit,
  onDelete,
  onMove,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
}) => {
  const [imgError, setImgError] = useState(false);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);

  const faviconUrl = getFaviconUrl(item.url);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, parentId: item.parentId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    if (e.clientY < midPoint) {
      setDragOverPosition('above');
    } else {
      setDragOverPosition('below');
    }
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPosition(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.id === item.id) return;

      const targetParentId = item.parentId || '1';
      let targetIndex = item.index ?? 0;
      if (dragOverPosition === 'below') {
        targetIndex += 1;
      }
      onMove(data.id, { parentId: targetParentId, index: targetIndex });
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div
      className={`soft-bookmark-row ${dragOverPosition ? `drop-${dragOverPosition}` : ''} ${
        isSelected ? 'selected' : ''
      }`}
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
      draggable={!isMultiSelectMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        if (isMultiSelectMode && onToggleSelect) {
          onToggleSelect(item.id);
        } else if (item.url) {
          onOpen(item.url, e);
        }
      }}
      onAuxClick={(e) => {
        if (e.button === 1 && item.url) {
          onOpen(item.url, e);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, {
          item,
          x: e.clientX,
          y: e.clientY,
          isFolder: false,
        });
      }}
    >
      {isMultiSelectMode && (
        <input
          type="checkbox"
          className="soft-checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect && onToggleSelect(item.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div className="soft-item-icon">
        {!imgError && faviconUrl && settings.showFavicons ? (
          <img
            src={faviconUrl}
            alt=""
            className="soft-favicon"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="soft-initials">{getDomainInitials(item.url)}</span>
        )}
      </div>

      <div className="soft-item-details" title={`${item.title}\n${item.url}`}>
        <span className="soft-item-title">{item.title || item.url || 'Untitled Bookmark'}</span>
      </div>

      <div className="soft-hover-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`soft-action-btn ${isFavorite ? 'favorite-active' : ''}`}
          title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          onClick={() => onToggleFavorite(item.id)}
        >
          <Icon name={isFavorite ? 'star-filled' : 'star'} size={12} />
        </button>
        <button
          type="button"
          className="soft-action-btn"
          title="Edit"
          onClick={() => onEdit(item)}
        >
          <Icon name="edit" size={12} />
        </button>
        <button
          type="button"
          className="soft-action-btn danger"
          title="Delete"
          onClick={() => onDelete(item)}
        >
          <Icon name="trash" size={12} />
        </button>
      </div>
    </div>
  );
};
