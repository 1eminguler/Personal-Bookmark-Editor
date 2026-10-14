import { BookmarkItem, ExtensionMessage, OpenMode } from '../types';

export const isProtectedFolder = (id?: string): boolean => {
  if (!id) return false;
  return id === '0' || id === '1' || id === '2' || id === '3' || id === 'mobile';
};

export const bookmarkService = {
  async getTree(): Promise<BookmarkItem[]> {
    if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.getTree) {
      const tree = await chrome.bookmarks.getTree();
      return tree as BookmarkItem[];
    }
    const res = await this.sendMessage<BookmarkItem[]>({ type: 'GET_BOOKMARKS_TREE' });
    return res || [];
  },

  async getTopSites(): Promise<{ title: string; url: string }[]> {
    if (typeof chrome !== 'undefined' && chrome.topSites && chrome.topSites.get) {
      return new Promise((resolve) => {
        chrome.topSites.get((sites) => resolve(sites || []));
      });
    }
    const res = await this.sendMessage<{ title: string; url: string }[]>({ type: 'GET_TOP_SITES' });
    return res || [];
  },

  async create(data: { parentId?: string; title: string; url?: string; index?: number }): Promise<BookmarkItem> {
    if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.create) {
      const res = await chrome.bookmarks.create(data);
      return res as BookmarkItem;
    }
    const res = await this.sendMessage<BookmarkItem>({ type: 'CREATE_BOOKMARK', ...data });
    if (!res) throw new Error('Failed to create bookmark.');
    return res;
  },

  async update(id: string, changes: { title: string; url?: string }): Promise<BookmarkItem> {
    if (isProtectedFolder(id)) {
      throw new Error('System root folders (Bookmarks Bar, etc.) cannot be renamed.');
    }
    if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.update) {
      const res = await chrome.bookmarks.update(id, changes);
      return res as BookmarkItem;
    }
    const res = await this.sendMessage<BookmarkItem>({ type: 'UPDATE_BOOKMARK', id, ...changes });
    if (!res) throw new Error('Failed to update bookmark.');
    return res;
  },

  async move(id: string, destination: { parentId: string; index?: number }): Promise<BookmarkItem> {
    if (isProtectedFolder(id)) {
      throw new Error('System root folders cannot be moved.');
    }
    if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.move) {
      const res = await chrome.bookmarks.move(id, destination);
      return res as BookmarkItem;
    }
    const res = await this.sendMessage<BookmarkItem>({
      type: 'MOVE_BOOKMARK',
      id,
      parentId: destination.parentId,
      index: destination.index,
    });
    if (!res) throw new Error('Failed to move bookmark.');
    return res;
  },

  async remove(id: string, isFolder: boolean = false): Promise<void> {
    if (isProtectedFolder(id)) {
      throw new Error('System root folders cannot be deleted.');
    }
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      if (isFolder) {
        await chrome.bookmarks.removeTree(id);
      } else {
        await chrome.bookmarks.remove(id);
      }
      return;
    }
    await this.sendMessage<void>({ type: 'REMOVE_BOOKMARK', id, isFolder });
  },

  async getCurrentTab(): Promise<{ title?: string; url?: string; favIconUrl?: string } | null> {
    const res = await this.sendMessage<{ title?: string; url?: string; favIconUrl?: string } | null>({
      type: 'GET_CURRENT_TAB',
    });
    return res || null;
  },

  async openTab(url: string, mode: OpenMode = 'currentTab'): Promise<void> {
    await this.sendMessage<void>({ type: 'OPEN_TAB', url, mode });
  },

  async search(query: string): Promise<BookmarkItem[]> {
    if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.search) {
      const results = await chrome.bookmarks.search(query);
      return results as BookmarkItem[];
    }
    const res = await this.sendMessage<BookmarkItem[]>({ type: 'SEARCH_BOOKMARKS', query });
    return res || [];
  },

  // Cycle detection to prevent moving a folder into its own subtree
  canMoveNode(nodeId: string, targetParentId: string, tree: BookmarkItem[]): boolean {
    if (nodeId === targetParentId) return false;

    const findNode = (nodes: BookmarkItem[], id: string): BookmarkItem | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const nodeToMove = findNode(tree, nodeId);
    if (!nodeToMove || !nodeToMove.children) return true; // Bookmark item can move anywhere

    // Check if targetParentId is inside nodeToMove subtree
    const isDescendant = (parent: BookmarkItem, childId: string): boolean => {
      if (!parent.children) return false;
      for (const child of parent.children) {
        if (child.id === childId) return true;
        if (isDescendant(child, childId)) return true;
      }
      return false;
    };

    return !isDescendant(nodeToMove, targetParentId);
  },

  sendMessage<T>(msg: ExtensionMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn('Chrome runtime not available');
        resolve([] as unknown as T);
        return;
      }
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Extension message error:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success === false) {
          console.error('Extension action failed:', response.error);
          reject(new Error(response.error || 'Operation failed.'));
        } else if (response && response.data !== undefined) {
          resolve(response.data as T);
        } else {
          resolve(response as T);
        }
      });
    });
  },
};
