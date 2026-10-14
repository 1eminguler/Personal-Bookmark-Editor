import React, { useEffect, useState } from 'react';
import { bookmarkService } from '../../services/bookmarkService';
import { BookmarkItem } from '../../types';
import { Icon } from '../Common/Icon';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { parentId?: string; title: string; url?: string; isFolder?: boolean }) => Promise<void>;
  tree: BookmarkItem[];
  defaultParentId?: string;
  isFolderMode?: boolean;
  editItem?: BookmarkItem | null;
  flattenBookmarks: () => BookmarkItem[];
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tree,
  defaultParentId = '1',
  isFolderMode = false,
  editItem = null,
  flattenBookmarks,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [parentId, setParentId] = useState(defaultParentId);
  const [isFolder, setIsFolder] = useState(isFolderMode);
  const [loadingActiveTab, setLoadingActiveTab] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title || '');
      setUrl(editItem.url || '');
      setParentId(editItem.parentId || '1');
      setIsFolder(Boolean(editItem.children));
    } else {
      setTitle('');
      setUrl('');
      setParentId(defaultParentId);
      setIsFolder(isFolderMode);
      setDuplicateWarning(null);
    }
  }, [editItem, defaultParentId, isFolderMode, isOpen]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!newUrl || isFolder) {
      setDuplicateWarning(null);
      return;
    }
    const clean = newUrl.replace(/\/+$/, '').toLowerCase();
    const existing = flattenBookmarks().find(
      (b) => b.url && b.url.replace(/\/+$/, '').toLowerCase() === clean && (!editItem || b.id !== editItem.id)
    );
    if (existing) {
      setDuplicateWarning(`"${existing.title}" is already bookmarked.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleFetchCurrentTab = async () => {
    setLoadingActiveTab(true);
    try {
      const tab = await bookmarkService.getCurrentTab();
      if (tab) {
        if (tab.title) setTitle(tab.title);
        if (tab.url) handleUrlChange(tab.url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingActiveTab(false);
    }
  };

  const collectFolders = (nodes: BookmarkItem[], depth = 0): { id: string; title: string; depth: number }[] => {
    const list: { id: string; title: string; depth: number }[] = [];
    for (const node of nodes) {
      if (node.children) {
        const title = node.id === '1' ? '📁 Root Directory' : (node.title || 'Untitled Folder');
        list.push({ id: node.id, title, depth });
        list.push(...collectFolders(node.children, depth + 1));
      }
    }
    return list;
  };

  const folderOptions = collectFolders(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!isFolder && !url.trim()) return;

    await onSave({
      parentId,
      title: title.trim(),
      url: isFolder ? undefined : url.trim(),
      isFolder,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="soft-modal-backdrop" onClick={onClose}>
      <div className="soft-modal-card soft-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="soft-modal-header">
          <span className="soft-modal-title">
            <Icon name={isFolder ? 'folder' : 'bookmark'} size={15} />
            <span>
              {editItem
                ? isFolder
                  ? 'Rename Folder'
                  : 'Edit Bookmark'
                : isFolder
                ? 'Create New Folder'
                : 'Add New Bookmark'}
            </span>
          </span>
          <button type="button" className="soft-close-btn" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="soft-modal-body">
          {!editItem && !isFolder && (
            <button
              type="button"
              className="soft-tab-fill-btn"
              onClick={handleFetchCurrentTab}
              disabled={loadingActiveTab}
            >
              <Icon name="globe" size={13} />
              <span>{loadingActiveTab ? 'Fetching Tab...' : 'Use Current Active Tab'}</span>
            </button>
          )}

          <div className="soft-input-group">
            <label className="soft-input-label">{isFolder ? 'Folder Name' : 'Title'}</label>
            <input
              type="text"
              className="soft-text-input"
              placeholder={isFolder ? 'e.g. Development, Design, Work...' : 'Bookmark title'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {!isFolder && (
            <div className="soft-input-group">
              <label className="soft-input-label">Web Address (URL)</label>
              <input
                type="url"
                className="soft-text-input"
                placeholder="https://..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
              />
              {duplicateWarning && <span className="soft-input-warning">{duplicateWarning}</span>}
            </div>
          )}

          <div className="soft-input-group">
            <label className="soft-input-label">Location (Folder)</label>
            <select
              className="soft-select-input"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
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
            <button type="submit" className="soft-btn-submit">
              {editItem ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
