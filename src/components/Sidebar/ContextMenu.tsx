import React, { useEffect, useRef } from 'react';
import { isProtectedFolder } from '../../services/bookmarkService';
import { BookmarkItem, OpenMode } from '../../types';
import { Icon } from '../Common/Icon';

export interface ContextMenuState {
  item?: BookmarkItem;
  x: number;
  y: number;
  isFolder?: boolean;
  isEmptyArea?: boolean;
  targetFolderId?: string;
}

interface ContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
  onOpen: (url: string, mode: OpenMode) => void;
  onEdit: (item: BookmarkItem) => void;
  onDelete: (item: BookmarkItem) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  onCreateFolder: (parentId: string) => void;
  onCreateBookmark: (parentId: string) => void;
  onToggleExpand?: (folderId: string) => void;
  onShowProperties: (item: BookmarkItem) => void;
  onMoveToFolder: (item: BookmarkItem) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  menu,
  onClose,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite,
  onCreateFolder,
  onCreateBookmark,
  onToggleExpand,
  onShowProperties,
  onMoveToFolder,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (ref.current && !ref.current.contains(e.target as Node) && !path.includes(ref.current)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!menu) return null;

  const { item, x, y, isFolder, isEmptyArea, targetFolderId = '1' } = menu;
  const isProtected = item ? isProtectedFolder(item.id) : false;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onClose();
  };

  // Ensure menu stays within viewport
  const menuWidth = 210;
  const menuHeight = isFolder ? 220 : 260;
  const clampedX = Math.min(Math.max(10, x), window.innerWidth - menuWidth - 10);
  const clampedY = Math.min(Math.max(10, y), window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={ref}
      className="soft-context-menu"
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Empty area right-click */}
      {isEmptyArea && (
        <>
          <button
            className="soft-menu-item"
            onClick={() => {
              onCreateFolder(targetFolderId);
              onClose();
            }}
          >
            <Icon name="folder" size={13} />
            <span>Create New Folder</span>
          </button>
          <button
            className="soft-menu-item"
            onClick={() => {
              onCreateBookmark(targetFolderId);
              onClose();
            }}
          >
            <Icon name="plus" size={13} />
            <span>Add New Bookmark</span>
          </button>
        </>
      )}

      {/* Folder options */}
      {!isEmptyArea && isFolder && item && (
        <>
          {onToggleExpand && (
            <button
              className="soft-menu-item"
              onClick={() => {
                onToggleExpand(item.id);
                onClose();
              }}
            >
              <Icon name="folder-open" size={13} />
              <span>Expand / Collapse Folder</span>
            </button>
          )}
          <button
            className="soft-menu-item"
            onClick={() => {
              onCreateFolder(item.id);
              onClose();
            }}
          >
            <Icon name="folder" size={13} />
            <span>New Subfolder Here</span>
          </button>
          <button
            className="soft-menu-item"
            onClick={() => {
              onCreateBookmark(item.id);
              onClose();
            }}
          >
            <Icon name="plus" size={13} />
            <span>New Bookmark Here</span>
          </button>
          <div className="soft-menu-divider" />
          {!isProtected ? (
            <>
              <button
                className="soft-menu-item"
                onClick={() => {
                  onEdit(item);
                  onClose();
                }}
              >
                <Icon name="edit" size={13} />
                <span>Rename</span>
              </button>
              <button
                className="soft-menu-item"
                onClick={() => {
                  onMoveToFolder(item);
                  onClose();
                }}
              >
                <Icon name="folder" size={13} />
                <span>Move to Folder...</span>
              </button>
              <button
                className="soft-menu-item danger"
                onClick={() => {
                  onDelete(item);
                  onClose();
                }}
              >
                <Icon name="trash" size={13} />
                <span>Delete Folder</span>
              </button>
            </>
          ) : (
            <div className="soft-menu-disabled-hint">
              <span>(System folder cannot be modified/moved)</span>
            </div>
          )}
          <div className="soft-menu-divider" />
          <button
            className="soft-menu-item"
            onClick={() => {
              onShowProperties(item);
              onClose();
            }}
          >
            <Icon name="alert-circle" size={13} />
            <span>Properties</span>
          </button>
        </>
      )}

      {/* Bookmark item options */}
      {!isEmptyArea && !isFolder && item && item.url && (
        <>
          <button
            className="soft-menu-item"
            onClick={() => {
              onOpen(item.url!, 'currentTab');
              onClose();
            }}
          >
            <Icon name="globe" size={13} />
            <span>Open in Current Tab</span>
          </button>
          <button
            className="soft-menu-item"
            onClick={() => {
              onOpen(item.url!, 'newTab');
              onClose();
            }}
          >
            <Icon name="external-link" size={13} />
            <span>Open in New Tab</span>
          </button>
          <button
            className="soft-menu-item"
            onClick={() => {
              onOpen(item.url!, 'newBackgroundTab');
              onClose();
            }}
          >
            <Icon name="layers" size={13} />
            <span>Open in Background Tab</span>
          </button>
          <button
            className="soft-menu-item"
            onClick={() => {
              onOpen(item.url!, 'newWindow');
              onClose();
            }}
          >
            <Icon name="external-link" size={13} />
            <span>Open in New Window</span>
          </button>
          <div className="soft-menu-divider" />
          <button className="soft-menu-item" onClick={() => copyToClipboard(item.url!)}>
            <Icon name="copy" size={13} />
            <span>Copy URL Address</span>
          </button>
          <button
            className="soft-menu-item"
            onClick={() => {
              onToggleFavorite(item.id);
              onClose();
            }}
          >
            <Icon name={isFavorite ? 'star-filled' : 'star'} size={13} />
            <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
          </button>
          <div className="soft-menu-divider" />
          <button
            className="soft-menu-item"
            onClick={() => {
              onEdit(item);
              onClose();
            }}
          >
            <Icon name="edit" size={13} />
            <span>Edit Bookmark</span>
          </button>
          <button
            className="soft-menu-item"
            onClick={() => {
              onMoveToFolder(item);
              onClose();
            }}
          >
            <Icon name="folder" size={13} />
            <span>Move to Folder...</span>
          </button>
          <button
            className="soft-menu-item danger"
            onClick={() => {
              onDelete(item);
              onClose();
            }}
          >
            <Icon name="trash" size={13} />
            <span>Delete</span>
          </button>
          <div className="soft-menu-divider" />
          <button
            className="soft-menu-item"
            onClick={() => {
              onShowProperties(item);
              onClose();
            }}
          >
            <Icon name="alert-circle" size={13} />
            <span>Properties</span>
          </button>
        </>
      )}
    </div>
  );
};
