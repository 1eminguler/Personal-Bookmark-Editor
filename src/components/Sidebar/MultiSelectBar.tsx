import React, { useState } from 'react';
import { BookmarkItem } from '../../types';
import { Icon } from '../Common/Icon';

interface MultiSelectBarProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkMove: (ids: string[], targetParentId: string) => Promise<void>;
  tree: BookmarkItem[];
}

export const MultiSelectBar: React.FC<MultiSelectBarProps> = ({
  selectedIds,
  onClearSelection,
  onBulkDelete,
  onBulkMove,
  tree,
}) => {
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  if (selectedIds.size === 0) return null;

  const count = selectedIds.size;

  const collectFolders = (nodes: BookmarkItem[], depth = 0): { id: string; title: string; depth: number }[] => {
    const list: { id: string; title: string; depth: number }[] = [];
    for (const node of nodes) {
      if (node.children) {
        list.push({ id: node.id, title: node.title || 'Untitled Folder', depth });
        list.push(...collectFolders(node.children, depth + 1));
      }
    }
    return list;
  };

  const folderOptions = collectFolders(tree);

  return (
    <div className="multiselect-floating-bar">
      <div className="multiselect-info">
        <span className="multiselect-badge">{count}</span>
        <span>items selected</span>
      </div>

      <div className="multiselect-actions">
        <div className="move-dropdown-wrapper">
          <button
            type="button"
            className="btn-select-action"
            onClick={() => setShowMoveDropdown(!showMoveDropdown)}
          >
            <Icon name="folder" size={13} />
            <span>Move...</span>
          </button>
          {showMoveDropdown && (
            <div className="move-dropdown-menu">
              <div className="dropdown-title">Select Target Folder:</div>
              {folderOptions.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="dropdown-folder-option"
                  onClick={() => {
                    onBulkMove(Array.from(selectedIds), f.id);
                    setShowMoveDropdown(false);
                  }}
                >
                  {'\u00A0'.repeat(f.depth * 2)}📁 {f.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn-select-action danger"
          onClick={() => onBulkDelete(Array.from(selectedIds))}
        >
          <Icon name="trash" size={13} />
          <span>Delete ({count})</span>
        </button>

        <button type="button" className="btn-select-close" onClick={onClearSelection} title="Clear selection">
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
};
