import { useCallback, useEffect, useState } from 'react';
import { bookmarkService, isProtectedFolder } from '../services/bookmarkService';
import { BookmarkItem, UserSettings } from '../types';
import { useUndo } from './useUndo';

export function useBookmarks(settings: UserSettings) {
  const [tree, setTree] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sahsi_expanded_folders');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(['1']); // Bookmarks Bar expanded by default
  });

  const loadTree = useCallback(async () => {
    try {
      const data = await bookmarkService.getTree();
      if (data && data.length > 0) {
        setTree(data);
        setErrorMessage(null);
      }
    } catch (err: any) {
      console.error('Failed to load bookmark tree:', err);
      setErrorMessage(err.message || 'Failed to load bookmark tree.');
    } finally {
      setLoading(false);
    }
  }, []);

  const undo = useUndo(loadTree);

  useEffect(() => {
    loadTree();

    const handleMessage = (msg: any) => {
      if (msg && msg.type === 'BOOKMARKS_UPDATED') {
        loadTree();
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, [loadTree]);

  // Expand / collapse folder toggle
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      try {
        localStorage.setItem('sahsi_expanded_folders', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  const expandAll = useCallback((nodes: BookmarkItem[]) => {
    const ids: string[] = [];
    const collect = (list: BookmarkItem[]) => {
      for (const item of list) {
        if (item.children) {
          ids.push(item.id);
          collect(item.children);
        }
      }
    };
    collect(nodes);
    setExpandedFolders(new Set(ids));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  // Find a specific node by ID
  const findNode = useCallback(
    (id: string, nodes: BookmarkItem[] = tree): BookmarkItem | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(id, node.children);
          if (found) return found;
        }
      }
      return null;
    },
    [tree]
  );

  // Flatten all bookmarks for search / duplicate detection
  const flattenBookmarks = useCallback((nodes: BookmarkItem[] = tree): BookmarkItem[] => {
    const list: BookmarkItem[] = [];
    const traverse = (items: BookmarkItem[]) => {
      for (const item of items) {
        if (item.url) {
          list.push(item);
        }
        if (item.children) {
          traverse(item.children);
        }
      }
    };
    traverse(nodes);
    return list;
  }, [tree]);

  // Find duplicate URLs
  const findDuplicates = useCallback((): Map<string, BookmarkItem[]> => {
    const map = new Map<string, BookmarkItem[]>();
    const all = flattenBookmarks();
    for (const item of all) {
      if (!item.url) continue;
      const cleanUrl = item.url.replace(/\/+$/, '').toLowerCase();
      const existing = map.get(cleanUrl) || [];
      existing.push(item);
      map.set(cleanUrl, existing);
    }
    const duplicates = new Map<string, BookmarkItem[]>();
    for (const [url, items] of map.entries()) {
      if (items.length > 1) {
        duplicates.set(url, items);
      }
    }
    return duplicates;
  }, [flattenBookmarks]);

  // Create bookmark or folder
  const createItem = async (data: { parentId?: string; title: string; url?: string; index?: number }) => {
    try {
      const created = await bookmarkService.create(data);
      undo.pushUndo({
        type: 'create',
        description: `Created: "${data.title}"`,
        undoData: { id: created.id },
      });
      // Expand target folder so user immediately sees created item
      if (data.parentId) {
        setExpandedFolders((prev) => new Set([...prev, data.parentId!]));
      }
      await loadTree();
      return created;
    } catch (err: any) {
      alert(`Creation failed: ${err.message}`);
      throw err;
    }
  };

  // Edit item
  const updateItem = async (id: string, changes: { title: string; url?: string }) => {
    if (isProtectedFolder(id)) {
      alert('System root folders cannot be renamed.');
      return;
    }
    const old = findNode(id);
    if (!old) return;
    try {
      const updated = await bookmarkService.update(id, changes);
      undo.pushUndo({
        type: 'update',
        description: `Edited: "${changes.title}"`,
        undoData: { id, oldTitle: old.title, oldUrl: old.url },
      });
      await loadTree();
      return updated;
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
      throw err;
    }
  };

  // Move item
  const moveItem = async (id: string, destination: { parentId: string; index?: number }) => {
    if (isProtectedFolder(id)) {
      alert('System root folders cannot be moved.');
      return;
    }
    const old = findNode(id);
    if (!old) return;

    // Check circular moving
    if (!bookmarkService.canMoveNode(id, destination.parentId, tree)) {
      alert('Error: A folder cannot be moved into itself or its subfolder.');
      return;
    }

    const oldParentId = old.parentId || '1';
    const oldIndex = old.index || 0;

    try {
      await bookmarkService.move(id, destination);
      undo.pushUndo({
        type: 'move',
        description: `Moved: "${old.title}"`,
        undoData: { id, oldParentId, oldIndex },
      });
      await loadTree();
    } catch (err: any) {
      alert(`Move failed: ${err.message}`);
      throw err;
    }
  };

  // Delete item
  const deleteItem = async (id: string, isFolder: boolean = false) => {
    if (isProtectedFolder(id)) {
      alert('System root folders (Bookmarks Bar, etc.) cannot be deleted.');
      return;
    }
    const old = findNode(id);
    if (!old) return;

    if (isFolder && old.children && old.children.length > 0) {
      const confirmed = confirm(
        `"${old.title}" folder and its ${old.children.length} bookmarks will be deleted. Do you want to continue?`
      );
      if (!confirmed) return;
    }

    try {
      await bookmarkService.remove(id, isFolder);
      undo.pushUndo({
        type: 'delete',
        description: `Deleted: "${old.title}"`,
        undoData: {
          title: old.title,
          url: old.url,
          parentId: old.parentId || '1',
          index: old.index,
        },
      });
      await loadTree();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
      throw err;
    }
  };

  return {
    tree,
    loading,
    errorMessage,
    expandedFolders,
    toggleFolder,
    expandAll,
    collapseAll,
    findNode,
    flattenBookmarks,
    findDuplicates,
    createItem,
    updateItem,
    moveItem,
    deleteItem,
    loadTree,
    undo,
  };
}
