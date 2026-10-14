export interface BookmarkItem {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: BookmarkItem[];
}

export type ThemePreset = 'system' | 'light' | 'dark' | 'transparent';
export type OpenMode = 'currentTab' | 'newTab' | 'newBackgroundTab' | 'newWindow';
export type RowDensity = 'compact' | 'normal' | 'relaxed';
export type SortMode = 'manual' | 'alpha-asc' | 'alpha-desc' | 'date-newest' | 'date-oldest';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  bgColor: string;
  bgOpacity: number; // 20 - 100
  backdropBlur: number; // 0 - 30 px
  textColor: string;
  textSecondaryColor: string;
  accentColor: string;
  borderColor: string;
  rowSurfaceOpacity: number; // 0 - 50, local readability surface
}

export interface UserSettings {
  // Behavior
  triggerWidth: number; // px, 3 - 25
  hoverOpenDelay: number; // ms, 0 - 500
  hoverCloseDelay: number; // ms, 100 - 1000
  isPinned: boolean;
  defaultOpenMode: OpenMode;
  showFavorites: boolean;
  showRecent: boolean;
  showFavicons: boolean;
  autoCloseOnOpen: boolean;
  enableKeyboardShortcut: boolean;
  startFolderId: string;
  sortMode: SortMode;

  // Appearance
  themeId: ThemePreset;
  panelWidth: number; // px, 260 - 550
  borderRadius: number; // px, 0 - 24
  rowDensity: RowDensity;
  fontSize: number; // px, 11 - 15
  iconSize: number; // px, 14 - 20
  animationSpeed: number; // ms, 100 - 400

  // Custom transparency & blur override
  customOpacity: number; // 20 - 100
  customBlur: number; // 0 - 30

  // Floating trigger tab
  showTriggerTab: boolean;
  triggerTabTop: number; // px from top

  // New tab wallpaper & widgets
  newtabWallpaper: string;
  newtabShowWidgets: boolean;

  // Favorites & Recents
  favoriteIds: string[];
  recentIds: string[];
}

export type ExtensionMessage =
  | { type: 'GET_BOOKMARKS_TREE' }
  | { type: 'GET_CURRENT_TAB' }
  | { type: 'GET_TOP_SITES' }
  | { type: 'OPEN_TAB'; url: string; mode: OpenMode }
  | { type: 'CREATE_BOOKMARK'; parentId?: string; title: string; url?: string; index?: number }
  | { type: 'UPDATE_BOOKMARK'; id: string; title: string; url?: string }
  | { type: 'MOVE_BOOKMARK'; id: string; parentId: string; index?: number }
  | { type: 'REMOVE_BOOKMARK'; id: string; isFolder?: boolean }
  | { type: 'SEARCH_BOOKMARKS'; query: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'BOOKMARKS_UPDATED' };

export interface UndoAction {
  id: string;
  type: 'create' | 'delete' | 'move' | 'update';
  description: string;
  undoData: any;
}
