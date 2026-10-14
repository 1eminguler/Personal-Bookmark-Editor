import React, { useRef, useState } from 'react';
import { THEME_PRESETS, resolveTheme } from '../../constants/themes';
import { exportImportService } from '../../services/exportImport';
import { BookmarkItem, ThemePreset, UserSettings } from '../../types';
import { Icon } from '../Common/Icon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  onResetSettings: () => Promise<void>;
  tree: BookmarkItem[];
  onImportBookmarks: (items: any[]) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  tree,
  onImportBookmarks,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'backup'>('appearance');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentTheme = resolveTheme(
    settings.themeId,
    settings.customOpacity,
    settings.customBlur
  );

  const handleThemePresetSelect = (id: ThemePreset) => {
    onUpdateSettings({ themeId: id });
  };

  const handleBookmarkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          await onImportBookmarks(parsed);
          setImportStatus('JSON backup loaded successfully');
        } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          const parsed = exportImportService.parseNetscapeHtml(text);
          await onImportBookmarks(parsed);
          setImportStatus('HTML bookmarks loaded successfully');
        }
      } catch {
        setImportStatus('Failed to read file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="soft-modal-backdrop" onClick={onClose}>
      <div className="soft-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="soft-modal-header">
          <div className="soft-modal-tabs">
            <button
              type="button"
              className={`soft-tab ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </button>
            <button
              type="button"
              className={`soft-tab ${activeTab === 'behavior' ? 'active' : ''}`}
              onClick={() => setActiveTab('behavior')}
            >
              Behavior
            </button>
            <button
              type="button"
              className={`soft-tab ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => setActiveTab('backup')}
            >
              Backup
            </button>
          </div>
          <button type="button" className="soft-close-btn" onClick={onClose} title="Close">
            <Icon name="close" size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="soft-modal-body">
          {activeTab === 'appearance' && (
            <div className="soft-section-stack">
              <div className="soft-setting-group">
                <span className="soft-group-title">Theme Selection</span>
                <div className="soft-themes-row">
                  {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((tId) => (
                    <button
                      key={tId}
                      type="button"
                      className={`soft-theme-pill ${settings.themeId === tId ? 'selected' : ''}`}
                      onClick={() => handleThemePresetSelect(tId)}
                    >
                      <span
                        className="soft-theme-dot"
                        style={{ backgroundColor: THEME_PRESETS[tId].accentColor }}
                      />
                      <span>{THEME_PRESETS[tId].name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="soft-setting-group">
                <div className="soft-slider-item">
                  <div className="soft-slider-header">
                    <span>Background Opacity</span>
                    <span className="soft-value-pill">%{currentTheme.bgOpacity}</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    className="soft-range"
                    value={currentTheme.bgOpacity}
                    onChange={(e) => onUpdateSettings({ customOpacity: Number(e.target.value) })}
                  />
                </div>

                <div className="soft-slider-item">
                  <div className="soft-slider-header">
                    <span>Backdrop Blur</span>
                    <span className="soft-value-pill">{currentTheme.backdropBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    className="soft-range"
                    value={currentTheme.backdropBlur}
                    onChange={(e) => onUpdateSettings({ customBlur: Number(e.target.value) })}
                  />
                </div>

                <div className="soft-slider-item">
                  <div className="soft-slider-header">
                    <span>Sidebar Width</span>
                    <span className="soft-value-pill">{settings.panelWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="260"
                    max="550"
                    step="10"
                    className="soft-range"
                    value={settings.panelWidth}
                    onChange={(e) => onUpdateSettings({ panelWidth: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'behavior' && (
            <div className="soft-section-stack">
              <div className="soft-setting-group">
                <span className="soft-group-title">Edge Detection</span>
                <div className="soft-slider-item">
                  <div className="soft-slider-header">
                    <span>Left Edge Sensitivity (Trigger Strip)</span>
                    <span className="soft-value-pill">{settings.triggerWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="25"
                    className="soft-range"
                    value={settings.triggerWidth}
                    onChange={(e) => onUpdateSettings({ triggerWidth: Number(e.target.value) })}
                  />
                  <p className="soft-hint">Trigger area detected when moving mouse to the far-left edge.</p>
                </div>
              </div>

              <div className="soft-setting-group">
                <span className="soft-group-title">Preferences</span>
                <label className="soft-toggle-row">
                  <div>
                    <span>Left Edge Trigger Tab (Button)</span>
                    <p className="soft-sub-hint">A physical tab on the screen edge you can click or hover to open.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="soft-switch"
                    checked={settings.showTriggerTab !== false}
                    onChange={(e) => onUpdateSettings({ showTriggerTab: e.target.checked })}
                  />
                </label>
                <label className="soft-toggle-row">
                  <span>Auto-close sidebar after clicking a bookmark</span>
                  <input
                    type="checkbox"
                    className="soft-switch"
                    checked={settings.autoCloseOnOpen}
                    onChange={(e) => onUpdateSettings({ autoCloseOnOpen: e.target.checked })}
                  />
                </label>
                <label className="soft-toggle-row">
                  <span>Show website favicon icons</span>
                  <input
                    type="checkbox"
                    className="soft-switch"
                    checked={settings.showFavicons}
                    onChange={(e) => onUpdateSettings({ showFavicons: e.target.checked })}
                  />
                </label>
                <label className="soft-toggle-row">
                  <span>Show favorites quick bar</span>
                  <input
                    type="checkbox"
                    className="soft-switch"
                    checked={settings.showFavorites}
                    onChange={(e) => onUpdateSettings({ showFavorites: e.target.checked })}
                  />
                </label>
              </div>

              <div className="soft-setting-group">
                <span className="soft-group-title">New Tab Widgets</span>
                <label className="soft-toggle-row">
                  <span>Show centered clock and search bar</span>
                  <input
                    type="checkbox"
                    className="soft-switch"
                    checked={settings.newtabShowWidgets !== false}
                    onChange={(e) => onUpdateSettings({ newtabShowWidgets: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="soft-section-stack">
              <div className="soft-setting-group">
                <span className="soft-group-title">Export</span>
                <div className="soft-btn-grid">
                  <button
                    type="button"
                    className="soft-glass-btn"
                    onClick={() => exportImportService.exportToJson(tree)}
                  >
                    <Icon name="download" size={13} />
                    <span>Export as JSON</span>
                  </button>
                  <button
                    type="button"
                    className="soft-glass-btn"
                    onClick={() => exportImportService.exportToHtml(tree)}
                  >
                    <Icon name="download" size={13} />
                    <span>Export as HTML</span>
                  </button>
                </div>
              </div>

              <div className="soft-setting-group">
                <span className="soft-group-title">Import</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.html,.htm"
                  style={{ display: 'none' }}
                  onChange={handleBookmarkFileUpload}
                />
                <button
                  type="button"
                  className="soft-glass-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="upload" size={13} />
                  <span>Select Backup File (.json, .html)</span>
                </button>
                {importStatus && <p className="soft-status-text">{importStatus}</p>}
              </div>

              <div className="soft-setting-group soft-danger-area">
                <button
                  type="button"
                  className="soft-reset-btn"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset settings to defaults?')) {
                      onResetSettings();
                    }
                  }}
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
