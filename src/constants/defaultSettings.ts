import { UserSettings } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  // Behavior: left edge hover trigger + optional floating trigger tab
  triggerWidth: 10,
  hoverOpenDelay: 50,
  hoverCloseDelay: 320,
  isPinned: false,
  showTriggerTab: true,
  triggerTabTop: 80,
  defaultOpenMode: 'currentTab',
  showFavorites: true,
  showRecent: true,
  showFavicons: true,
  autoCloseOnOpen: true,
  enableKeyboardShortcut: true,
  startFolderId: '1',
  sortMode: 'manual',

  // Appearance: 4 core themes
  themeId: 'dark',
  panelWidth: 320,
  borderRadius: 14,
  rowDensity: 'normal',
  fontSize: 12.5,
  iconSize: 15,
  animationSpeed: 220,

  customOpacity: 88,
  customBlur: 20,

  // New tab appearance
  newtabWallpaper: 'mountain',
  newtabShowWidgets: true,

  // Stored state
  favoriteIds: [],
  recentIds: [],
};
