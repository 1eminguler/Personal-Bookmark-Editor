import React, { useState } from 'react';
import { BookmarkItem as BookmarkItemType, UserSettings } from '../../types';
import { Icon } from '../Common/Icon';
import { ContextMenuState } from './ContextMenu';

interface FolderItemProps {
  item: BookmarkItemType;
  depth: number;
  isOpen: boolean;
  onToggle: (id: string) => void;
  settings: UserSettings;
  onContextMenu: (e: React.MouseEvent, state: ContextMenuState) => void;
  onEdit: (item: BookmarkItemType) => void;
  onDelete: (item: BookmarkItemType) => void;
  onMove: (sourceId: string, destination: { parentId: string; index?: number }) => void;
  onAddInside?: (parentId: string) => void;
  children?: React.ReactNode;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  item,
  depth,
  isOpen,
  onToggle,
  settings,
  onContextMenu,
  onEdit,
  onDelete,
  onMove,
  onAddInside,
  children,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
}) => {
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | 'into' | null>(null);

  const itemCount = item.children ? item.children.length : 0;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, parentId: item.parentId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const yRatio = (e.clientY - rect.top) / rect.height;

    if (yRatio < 0.25) {
      setDragOverPosition('above');
    } else if (yRatio > 0.75) {
      setDragOverPosition('below');
    } else {
      setDragOverPosition('into');
    }
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const position = dragOverPosition;
    setDragOverPosition(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.id === item.id) return;

      if (position === 'into') {
        onMove(data.id, { parentId: item.id });
      } else {
        const targetParentId = item.parentId || '1';
        let targetIndex = item.index ?? 0;
        if (position === 'below') {
          targetIndex += 1;
        }
        onMove(data.id, { parentId: targetParentId, index: targetIndex });
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div className="soft-folder-group">
      <div
        className={`soft-folder-row ${dragOverPosition ? `drop-${dragOverPosition}` : ''} ${
          isSelected ? 'selected' : ''
        }`}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        draggable={!isMultiSelectMode}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (isMultiSelectMode && onToggleSelect) {
            onToggleSelect(item.id);
          } else {
            onToggle(item.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, {
            item,
            x: e.clientX,
            y: e.clientY,
            isFolder: true,
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

        <button
          type="button"
          className="soft-folder-caret"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.id);
          }}
        >
          <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={11} />
        </button>

        <div className="soft-folder-icon">
          <Icon
            name={isOpen ? 'folder-open' : 'folder'}
            size={15}
            color="var(--accent-color, #38bdf8)"
          />
        </div>

        <span className="soft-folder-title" title={item.title || 'Untitled Folder'}>
          {item.title || 'Untitled Folder'}
        </span>

        <span className="soft-folder-count">{itemCount}</span>

        <div className="soft-hover-actions" onClick={(e) => e.stopPropagation()}>
          {onAddInside && (
            <button
              type="button"
              className="soft-action-btn"
              title="Add Inside (+)"
              onClick={() => onAddInside(item.id)}
            >
              <Icon name="plus" size={12} />
            </button>
          )}
          <button
            type="button"
            className="soft-action-btn"
            title="Rename"
            onClick={() => onEdit(item)}
          >
            <Icon name="edit" size={12} />
          </button>
          <button
            type="button"
            className="soft-action-btn danger"
            title="Delete Folder"
            onClick={() => onDelete(item)}
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>

      {isOpen && children && <div className="soft-folder-children">{children}</div>}
    </div>
  );
};
