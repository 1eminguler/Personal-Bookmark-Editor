import React, { useState } from 'react';
import { BookmarkItem } from '../../types';
import { Icon } from '../Common/Icon';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BookmarkItem | null;
  tree: BookmarkItem[];
  onMove: (sourceId: string, targetParentId: string) => Promise<void>;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  onClose,
  item,
  tree,
  onMove,
}) => {
  const [targetId, setTargetId] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const collectFolders = (nodes: BookmarkItem[], depth = 0): { id: string; title: string; depth: number }[] => {
    const list: { id: string; title: string; depth: number }[] = [];
    for (const node of nodes) {
      if (node.children) {
        // Can't move a folder into itself
        if (node.id !== item.id) {
          const title = node.id === '1' ? '📁 Root Directory' : (node.title || 'Untitled Folder');
          list.push({ id: node.id, title, depth });
          list.push(...collectFolders(node.children, depth + 1));
        }
      }
    }
    return list;
  };

  const folderOptions = collectFolders(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onMove(item.id, targetId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="soft-modal-backdrop" onClick={onClose}>
      <div className="soft-modal-card soft-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="soft-modal-header">
          <span className="soft-modal-title">
            <Icon name="folder" size={14} />
            <span>Move to Folder</span>
          </span>
          <button type="button" className="soft-close-btn" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="soft-modal-body">
          <p className="soft-hint">
            Select target folder to move <strong>"{item.title}"</strong>:
          </p>

          <div className="soft-input-group">
            <select
              className="soft-select-input"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              autoFocus
            >
              {folderOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {'\u00A0'.repeat(f.depth * 2)}📁 {f.title}
                </option>
              ))}
            </select>
          </div>

          <div className="soft-modal-footer">
            <button type="button" className="soft-btn-text" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="soft-btn-submit" disabled={submitting}>
              {submitting ? 'Moving...' : 'Move'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
