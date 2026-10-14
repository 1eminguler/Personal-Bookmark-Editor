import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useSettings } from '../../hooks/useSettings';
import { bookmarkService } from '../../services/bookmarkService';
import { BookmarkItem as BookmarkItemType, OpenMode } from '../../types';
import { Icon } from '../Common/Icon';
import { AddBookmarkModal } from './AddBookmarkModal';
import { BookmarkTree } from './BookmarkTree';
import { ContextMenu, ContextMenuState } from './ContextMenu';
import { DuplicatesModal } from './DuplicatesModal';
import { FavoritesBar } from './FavoritesBar';
import { MoveModal } from './MoveModal';
import { MultiSelectBar } from './MultiSelectBar';
import { PropertiesModal } from './PropertiesModal';
import { SettingsModal } from './SettingsModal';
import { ToastContainer } from './ToastContainer';

interface SidebarContainerProps {
  isEmbedded?: boolean;
}

export const SidebarContainer: React.FC<SidebarContainerProps> = ({ isEmbedded = false }) => {
  const { settings, updateSettings, resetSettings, activeTheme } = useSettings();
  const {
    tree,
    loading,
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
  } = useBookmarks(settings);

  // Panel Open / Close State Machine
  const [isOpen, setIsOpen] = useState(isEmbedded || settings.isPinned);
  const [searchQuery, setSearchQuery] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFolderMode, setIsFolderMode] = useState(false);
  const [targetParentId, setTargetParentId] = useState('1');
  const [editItem, setEditItem] = useState<BookmarkItemType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);
  const [propertiesItem, setPropertiesItem] = useState<BookmarkItemType | null>(null);
  const [moveModalItem, setMoveModalItem] = useState<BookmarkItemType | null>(null);

  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Refs for state machine and timers
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const isModalActiveRef = useRef(false);
  isModalActiveRef.current =
    isAddModalOpen ||
    isSettingsOpen ||
    isDuplicatesModalOpen ||
    Boolean(propertiesItem) ||
    Boolean(moveModalItem) ||
    Boolean(contextMenu) ||
    isResizing;

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Duplicates calculation
  const duplicatesMap = useMemo(() => findDuplicates(), [findDuplicates]);

  // Keep open if pinned or embedded
  useEffect(() => {
    if (isEmbedded || settings.isPinned) {
      setIsOpen(true);
    }
  }, [isEmbedded, settings.isPinned]);

  // Listen for Toggle message from background
  useEffect(() => {
    const handleMessage = (msg: any) => {
      if (msg && msg.type === 'TOGGLE_SIDEBAR') {
        setIsOpen((prev) => !prev);
      }
    };
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, []);

  // Keyboard shortcut inside web page (Alt+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen && !settings.isPinned && !isEmbedded && !isModalActiveRef.current) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, settings.isPinned, isEmbedded]);

  // Full-height (0 to 100vh) capturing mouse move detection
  useEffect(() => {
    if (isEmbedded) return;

    const handlePointerMove = (e: MouseEvent) => {
      const triggerThreshold = Math.max(settings.triggerWidth || 10, 10);

      // Mouse reached left edge: anywhere along the full vertical height
      if (e.clientX <= triggerThreshold) {
        if (!isOpenRef.current) {
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
          if (!openTimerRef.current) {
            openTimerRef.current = setTimeout(() => {
              setIsOpen(true);
              openTimerRef.current = null;
            }, settings.hoverOpenDelay || 50);
          }
        }
      } else {
        // Only cancel open timer if mouse moved significantly away (> 35px)
        // (prevents micro-movements/jitter from aborting opening!)
        if (!isOpenRef.current && openTimerRef.current) {
          if (e.clientX > Math.max(triggerThreshold * 2.5, 35)) {
            clearTimeout(openTimerRef.current);
            openTimerRef.current = null;
          }
        }

        // When open, unpinned, and not interacting with a dialog
        if (isOpenRef.current && !settings.isPinned && !isModalActiveRef.current) {
          const leaveThreshold = settings.panelWidth + 15;
          if (e.clientX > leaveThreshold) {
            if (!closeTimerRef.current) {
              closeTimerRef.current = setTimeout(() => {
                setIsOpen(false);
                closeTimerRef.current = null;
              }, settings.hoverCloseDelay || 320);
            }
          } else {
            // Mouse is inside panel: cancel pending close!
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
          }
        }
      }
    };

    // Use capturing listeners so webpage scripts calling stopPropagation cannot block edge trigger
    window.addEventListener('mousemove', handlePointerMove, { capture: true, passive: true });
    window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove, { capture: true });
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isEmbedded, settings.triggerWidth, settings.panelWidth, settings.hoverOpenDelay, settings.hoverCloseDelay, settings.isPinned]);

  // Resize handler
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = settings.panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(550, startWidth + (moveEvent.clientX - startX)));
      updateSettings({ panelWidth: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Open URL handler
  const handleOpenUrl = (url: string, e?: React.MouseEvent, forcedMode?: OpenMode) => {
    let mode: OpenMode = forcedMode || settings.defaultOpenMode;
    if (e) {
      if (e.button === 1 || e.ctrlKey || e.metaKey) {
        mode = 'newBackgroundTab';
      } else if (e.shiftKey) {
        mode = 'newTab';
      }
    }
    bookmarkService.openTab(url, mode);
    if (!settings.isPinned && !isEmbedded && settings.autoCloseOnOpen && mode === 'currentTab') {
      setIsOpen(false);
    }
  };

  // Pin toggle
  const handleTogglePin = () => {
    updateSettings({ isPinned: !settings.isPinned });
  };

  // Favorites toggle
  const handleToggleFavorite = (id: string) => {
    const favs = new Set(settings.favoriteIds);
    if (favs.has(id)) {
      favs.delete(id);
    } else {
      favs.add(id);
    }
    updateSettings({ favoriteIds: Array.from(favs) });
  };

  // Multi select toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} bookmarks?`)) return;
    for (const id of ids) {
      await deleteItem(id, true);
    }
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  };

  const handleBulkMove = async (ids: string[], targetParentId: string) => {
    for (const id of ids) {
      await moveItem(id, { parentId: targetParentId });
    }
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  };

  // Import handler
  const handleImportBookmarks = async (items: any[]) => {
    const importRecursive = async (nodeList: any[], parentId: string) => {
      for (const item of nodeList) {
        if (item.isFolder || item.children) {
          const folder = await bookmarkService.create({
            parentId,
            title: item.title || 'Imported Folder',
          });
          if (item.children) {
            await importRecursive(item.children, folder.id);
          }
        } else if (item.url) {
          await bookmarkService.create({
            parentId,
            title: item.title || item.url,
            url: item.url,
          });
        }
      }
    };
    await importRecursive(items, '1');
    await loadTree();
  };

  // Search filter
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return tree;
    const q = searchQuery.toLowerCase();

    const filterTree = (nodes: BookmarkItemType[]): BookmarkItemType[] => {
      const results: BookmarkItemType[] = [];
      for (const node of nodes) {
        const matchesTitle = node.title.toLowerCase().includes(q);
        const matchesUrl = node.url && node.url.toLowerCase().includes(q);

        if (node.children) {
          const childMatches = filterTree(node.children);
          if (matchesTitle || childMatches.length > 0) {
            results.push({
              ...node,
              children: childMatches.length > 0 ? childMatches : node.children,
            });
          }
        } else if (matchesTitle || matchesUrl) {
          results.push(node);
        }
      }
      return results;
    };

    return filterTree(tree);
  }, [tree, searchQuery]);

  // Root bookmark bar extraction: Unwraps 'Bookmarks Bar' (id: '1')
  // so the user's folders and bookmarks appear directly at the root (File Explorer style)!
  const displayNodes = useMemo(() => {
    if (searchQuery.trim()) return filteredNodes;
    if (!tree || tree.length === 0) return [];

    // If wrapped in root "0"
    const roots = tree.length === 1 && tree[0].id === '0' && tree[0].children
      ? tree[0].children
      : tree;

    // Find Bookmarks Bar (id: '1')
    const barNode = roots.find((n) => n.id === '1');
    const otherNode = roots.find((n) => n.id === '2');
    const mobileNode = roots.find((n) => n.id === 'mobile');

    if (barNode && barNode.children) {
      const topLevel: BookmarkItemType[] = [...barNode.children];
      // If "Other Bookmarks" has items, show it cleanly as a folder at the bottom
      if (otherNode && otherNode.children && otherNode.children.length > 0) {
        topLevel.push(otherNode);
      }
      if (mobileNode && mobileNode.children && mobileNode.children.length > 0) {
        topLevel.push(mobileNode);
      }
      return topLevel;
    }

    return roots;
  }, [tree, filteredNodes, searchQuery]);

  // CSS variables for soft glassmorphism & readability
  const containerStyle = {
    '--panel-width': `${settings.panelWidth}px`,
    '--bg-color': activeTheme.bgColor,
    '--bg-opacity': `${activeTheme.bgOpacity / 100}`,
    '--backdrop-blur': `${activeTheme.backdropBlur}px`,
    '--border-radius': `${settings.borderRadius}px`,
    '--text-color': activeTheme.textColor,
    '--text-secondary': activeTheme.textSecondaryColor,
    '--accent-color': activeTheme.accentColor,
    '--border-color': activeTheme.borderColor,
    '--row-surface-opacity': `${activeTheme.rowSurfaceOpacity / 100}`,
    '--animation-speed': `${settings.animationSpeed}ms`,
    '--font-size': `${settings.fontSize}px`,
    '--icon-size': `${settings.iconSize}px`,
  } as React.CSSProperties;

  return (
    <div
      className={`sahsi-bookmark-app ${isEmbedded ? 'embedded' : ''} theme-${activeTheme.id}`}
      style={containerStyle}
    >
      {/* Invisible Full-Height Left Edge Trigger Strip */}
      {!isEmbedded && (
        <div
          className="edge-trigger-strip"
          style={{ width: `${settings.triggerWidth}px` }}
        />
      )}

      {/* Optional Floating Trigger Tab / Button on Screen Edge */}
      {!isEmbedded && !isOpen && settings.showTriggerTab !== false && (
        <button
          type="button"
          className="soft-edge-trigger-tab"
          style={{ top: `${settings.triggerTabTop || 80}px` }}
          title="Open Bookmarks Sidebar (Click or hover)"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          onMouseEnter={() => {
            if (openTimerRef.current) clearTimeout(openTimerRef.current);
            openTimerRef.current = setTimeout(() => {
              setIsOpen(true);
              openTimerRef.current = null;
            }, 50);
          }}
        >
          <Icon name="bookmark" size={14} />
          <Icon name="chevron-right" size={11} className="soft-tab-arrow" />
        </button>
      )}

      {/* Main Glassmorphic Sidebar */}
      <aside
        ref={panelRef}
        className={`soft-sidebar ${isOpen ? 'open' : 'closed'} ${settings.isPinned ? 'pinned' : ''}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            isEmptyArea: true,
            targetFolderId: '1',
          });
        }}
      >
        {/* Resize Handle on right border */}
        {!isEmbedded && (
          <div
            className={`soft-resize-handle ${isResizing ? 'active' : ''}`}
            onMouseDown={handleResizeMouseDown}
          />
        )}

        {/* Minimalist Top Control Bar */}
        <div className="soft-top-bar" onClick={(e) => e.stopPropagation()}>
          <div className="soft-bar-left">
            <span className="soft-app-label">Bookmarks</span>
          </div>

          <div className="soft-bar-actions">
            {/* New Folder Button */}
            <button
              type="button"
              className="soft-pill-action"
              title="Create New Folder"
              onClick={() => {
                setEditItem(null);
                setIsFolderMode(true);
                setTargetParentId('1');
                setIsAddModalOpen(true);
              }}
            >
              <Icon name="folder" size={13} />
              <span>Folder</span>
            </button>

            {/* New Bookmark Button */}
            <button
              type="button"
              className="soft-pill-action"
              title="Add New Bookmark"
              onClick={() => {
                setEditItem(null);
                setIsFolderMode(false);
                setTargetParentId('1');
                setIsAddModalOpen(true);
              }}
            >
              <Icon name="plus" size={13} />
              <span>Add</span>
            </button>

            {/* Duplicates check badge */}
            {duplicatesMap.size > 0 && (
              <button
                type="button"
                className="soft-icon-btn warning"
                title={`${duplicatesMap.size} duplicate URLs detected`}
                onClick={() => setIsDuplicatesModalOpen(true)}
              >
                <Icon name="alert-circle" size={13} color="#f59e0b" />
              </button>
            )}

            {/* Settings Button */}
            <button
              type="button"
              className="soft-icon-btn"
              title="Settings & Appearance"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Icon name="settings" size={13} />
            </button>

            {/* Pin Button */}
            {!isEmbedded && (
              <button
                type="button"
                className={`soft-icon-btn ${settings.isPinned ? 'active' : ''}`}
                title={settings.isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}
                onClick={handleTogglePin}
              >
                <Icon name={settings.isPinned ? 'pin' : 'pin-off'} size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="soft-search-wrap" onClick={(e) => e.stopPropagation()}>
          <Icon name="search" size={13} className="soft-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="soft-search-input"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="soft-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <Icon name="close" size={11} />
            </button>
          )}
        </div>

        {/* Favorites section */}
        <FavoritesBar
          favoriteIds={settings.favoriteIds}
          findNode={findNode}
          onOpen={(url, e) => handleOpenUrl(url, e)}
          onRemoveFavorite={handleToggleFavorite}
          settings={settings}
        />

        {/* Quick controls: Expand/Collapse */}
        <div className="soft-tree-meta" onClick={(e) => e.stopPropagation()}>
          <span className="soft-meta-count">{flattenBookmarks().length} items</span>
          <div className="soft-meta-actions">
            <button
              type="button"
              className="soft-meta-btn"
              onClick={() => expandAll(tree)}
            >
              Expand All
            </button>
            <span className="soft-meta-dot">·</span>
            <button
              type="button"
              className="soft-meta-btn"
              onClick={collapseAll}
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Bookmark Tree View */}
        <div className="soft-scroll-area">
          {loading ? (
            <div className="soft-state-box">
              <Icon name="refresh" size={18} className="spinner" />
              <span>Loading...</span>
            </div>
          ) : displayNodes.length === 0 ? (
            <div className="soft-state-box">
              <Icon name="folder" size={24} />
              <span>{searchQuery ? 'No matching results' : 'Bookmark list is empty'}</span>
            </div>
          ) : (
            <BookmarkTree
              nodes={displayNodes}
              depth={0}
              settings={settings}
              favoriteIds={settings.favoriteIds}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
              onOpen={(url, e) => handleOpenUrl(url, e)}
              onContextMenu={(_, state) => setContextMenu(state)}
              onToggleFavorite={handleToggleFavorite}
              onEdit={(item) => {
                setEditItem(item);
                setIsFolderMode(Boolean(item.children));
                setIsAddModalOpen(true);
              }}
              onDelete={(item) => deleteItem(item.id, Boolean(item.children))}
              onMove={(sourceId, dest) => moveItem(sourceId, dest)}
              onAddInsideFolder={(pId) => {
                setEditItem(null);
                setTargetParentId(pId);
                setIsFolderMode(false);
                setIsAddModalOpen(true);
              }}
              searchQuery={searchQuery}
              isMultiSelectMode={isMultiSelectMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          )}
        </div>

        {/* Floating Multi-Select Action Bar */}
        {isMultiSelectMode && (
          <MultiSelectBar
            selectedIds={selectedIds}
            onClearSelection={() => setSelectedIds(new Set())}
            onBulkDelete={handleBulkDelete}
            onBulkMove={handleBulkMove}
            tree={tree}
          />
        )}

        {/* Toast Container with Undo */}
        <ToastContainer
          toast={undo.lastActionToast}
          onUndo={undo.executeUndo}
          onDismiss={undo.dismissToast}
        />
      </aside>

      {/* Context Menu */}
      <ContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onOpen={(url, mode) => handleOpenUrl(url, undefined, mode)}
        onEdit={(item) => {
          setEditItem(item);
          setIsFolderMode(Boolean(item.children));
          setIsAddModalOpen(true);
        }}
        onDelete={(item) => deleteItem(item.id, Boolean(item.children))}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={contextMenu && contextMenu.item ? settings.favoriteIds.includes(contextMenu.item.id) : false}
        onCreateFolder={(pId) => {
          setEditItem(null);
          setTargetParentId(pId);
          setIsFolderMode(true);
          setIsAddModalOpen(true);
        }}
        onCreateBookmark={(pId) => {
          setEditItem(null);
          setTargetParentId(pId);
          setIsFolderMode(false);
          setIsAddModalOpen(true);
        }}
        onToggleExpand={(fId) => toggleFolder(fId)}
        onShowProperties={(item) => {
          setPropertiesItem(item);
        }}
        onMoveToFolder={(item) => {
          setMoveModalItem(item);
        }}
      />

      {/* Properties Modal */}
      <PropertiesModal
        isOpen={Boolean(propertiesItem)}
        onClose={() => setPropertiesItem(null)}
        item={propertiesItem}
        parentFolderTitle={
          propertiesItem?.parentId ? findNode(propertiesItem.parentId)?.title : 'Root Directory'
        }
      />

      {/* Move to Folder Modal */}
      <MoveModal
        isOpen={Boolean(moveModalItem)}
        onClose={() => setMoveModalItem(null)}
        item={moveModalItem}
        tree={tree}
        onMove={async (sourceId, targetParentId) => {
          await moveItem(sourceId, { parentId: targetParentId });
        }}
      />

      {/* Add / Edit Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditItem(null);
        }}
        onSave={async (data) => {
          if (editItem) {
            await updateItem(editItem.id, {
              title: data.title,
              url: data.url,
            });
          } else {
            await createItem({
              parentId: data.parentId,
              title: data.title,
              url: data.url,
            });
          }
        }}
        tree={tree}
        defaultParentId={targetParentId}
        isFolderMode={isFolderMode}
        editItem={editItem}
        flattenBookmarks={flattenBookmarks}
      />

      {/* Duplicates Cleaner Modal */}
      <DuplicatesModal
        isOpen={isDuplicatesModalOpen}
        onClose={() => setIsDuplicatesModalOpen(false)}
        duplicates={duplicatesMap}
        onDeleteDuplicate={async (id) => {
          await deleteItem(id);
        }}
        onKeepOnlyOne={async (items) => {
          const toDelete = items.slice(1);
          for (const item of toDelete) {
            await deleteItem(item.id);
          }
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onResetSettings={resetSettings}
        tree={tree}
        onImportBookmarks={handleImportBookmarks}
      />
    </div>
  );
};
