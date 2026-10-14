import React from 'react';
import { BookmarkItem as BookmarkItemType, UserSettings } from '../../types';
import { BookmarkItem } from './BookmarkItem';
import { ContextMenuState } from './ContextMenu';
import { FolderItem } from './FolderItem';

interface BookmarkTreeProps {
  nodes: BookmarkItemType[];
  depth?: number;
  settings: UserSettings;
  favoriteIds: string[];
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  onOpen: (url: string, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, state: ContextMenuState) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (item: BookmarkItemType) => void;
  onDelete: (item: BookmarkItemType) => void;
  onMove: (sourceId: string, destination: { parentId: string; index?: number }) => void;
  onAddInsideFolder?: (parentId: string) => void;
  searchQuery?: string;
  isMultiSelectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export const BookmarkTree: React.FC<BookmarkTreeProps> = ({
  nodes,
  depth = 0,
  settings,
  favoriteIds,
  expandedFolders,
  onToggleFolder,
  onOpen,
  onContextMenu,
  onToggleFavorite,
  onEdit,
  onDelete,
  onMove,
  onAddInsideFolder,
  searchQuery,
  isMultiSelectMode,
  selectedIds,
  onToggleSelect,
}) => {
  // Sort nodes based on settings.sortMode
  const sortedNodes = [...nodes].sort((a, b) => {
    const aIsFolder = Boolean(a.children);
    const bIsFolder = Boolean(b.children);
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;

    if (settings.sortMode === 'alpha-asc') {
      return a.title.localeCompare(b.title, 'tr');
    }
    if (settings.sortMode === 'alpha-desc') {
      return b.title.localeCompare(a.title, 'tr');
    }
    if (settings.sortMode === 'date-newest') {
      return (b.dateAdded || 0) - (a.dateAdded || 0);
    }
    if (settings.sortMode === 'date-oldest') {
      return (a.dateAdded || 0) - (b.dateAdded || 0);
    }
    return (a.index ?? 0) - (b.index ?? 0);
  });

  if (sortedNodes.length === 0) {
    if (depth > 0) {
      return <div className="soft-empty-folder">Empty folder</div>;
    }
    return null;
  }

  return (
    <div className="soft-tree-container">
      {sortedNodes.map((item) => {
        const isFolder = Boolean(item.children);

        if (isFolder) {
          const isOpen = expandedFolders.has(item.id);
          return (
            <FolderItem
              key={item.id}
              item={item}
              depth={depth}
              isOpen={isOpen}
              onToggle={onToggleFolder}
              settings={settings}
              onContextMenu={onContextMenu}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onAddInside={onAddInsideFolder}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedIds?.has(item.id)}
              onToggleSelect={onToggleSelect}
            >
              {item.children && (
                <BookmarkTree
                  nodes={item.children}
                  depth={depth + 1}
                  settings={settings}
                  favoriteIds={favoriteIds}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onOpen={onOpen}
                  onContextMenu={onContextMenu}
                  onToggleFavorite={onToggleFavorite}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMove={onMove}
                  onAddInsideFolder={onAddInsideFolder}
                  searchQuery={searchQuery}
                  isMultiSelectMode={isMultiSelectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                />
              )}
            </FolderItem>
          );
        }

        return (
          <BookmarkItem
            key={item.id}
            item={item}
            depth={depth}
            settings={settings}
            isFavorite={favoriteIds.includes(item.id)}
            onOpen={onOpen}
            onContextMenu={onContextMenu}
            onToggleFavorite={onToggleFavorite}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
            isMultiSelectMode={isMultiSelectMode}
            isSelected={selectedIds?.has(item.id)}
            onToggleSelect={onToggleSelect}
          />
        );
      })}
    </div>
  );
};
