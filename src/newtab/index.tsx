import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Icon } from '../components/Common/Icon';
import { SidebarContainer } from '../components/Sidebar/SidebarContainer';
import '../content/styles.css';
import { useSettings } from '../hooks/useSettings';
import { bookmarkService } from '../services/bookmarkService';
import { getDomainInitials, getFaviconUrl } from '../utils/favicon';

const WALLPAPERS = [
  {
    id: 'mountain',
    name: 'Nature & Mountains',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=80',
  },
  {
    id: 'ocean',
    name: 'Ocean & Coast',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=80',
  },
  {
    id: 'night',
    name: 'Cosmic Night',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2560&q=80',
  },
  {
    id: 'forest',
    name: 'Misty Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2560&q=80',
  },
  {
    id: 'minimal',
    name: 'Minimal Dark',
    url: '',
  },
];

const NewTabApp: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [topSites, setTopSites] = useState<{ title: string; url: string }[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bookmarkService.getTopSites().then((sites) => {
      if (sites && sites.length > 0) {
        setTopSites(sites.slice(0, 8));
      } else {
        setTopSites([
          { title: 'Google', url: 'https://www.google.com' },
          { title: 'YouTube', url: 'https://www.youtube.com' },
          { title: 'GitHub', url: 'https://github.com' },
          { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
        ]);
      }
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (/^https?:\/\//i.test(q) || /^[a-z0-9-]+(\.[a-z]{2,})+/i.test(q)) {
      window.location.href = q.startsWith('http') ? q : `https://${q}`;
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    }
  };

  const currentWpIndex = Math.max(
    0,
    WALLPAPERS.findIndex((w) => w.id === settings.newtabWallpaper)
  );
  const currentWp = WALLPAPERS[currentWpIndex];

  const handleNextWallpaper = () => {
    const nextIdx = (currentWpIndex + 1) % WALLPAPERS.length;
    updateSettings({ newtabWallpaper: WALLPAPERS[nextIdx].id });
  };

  const handleToggleWidgets = () => {
    updateSettings({ newtabShowWidgets: !settings.newtabShowWidgets });
  };

  const timeString = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const bgStyle: React.CSSProperties = currentWp?.url
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.45)), url(${currentWp.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        background: 'radial-gradient(circle at 50% 30%, #1a1e29 0%, #0d0f14 60%, #08090c 100%)',
      };

  const showWidgets = settings.newtabShowWidgets !== false;

  return (
    <div className="newtab-fullscreen-container" style={bgStyle}>
      {/* Dynamic Background with Ambient Glow */}
      <div className="newtab-backdrop-glow" />

      {/* Main Start Page Content (Togglable for clean wallpaper view) */}
      {showWidgets && (
        <div className="newtab-center-content">
          <div className="newtab-time-box">
            <h1 className="newtab-clock-display">{timeString}</h1>
            <p className="newtab-date-display">{dateString}</p>
          </div>

          {/* Web Search Bar */}
          <form onSubmit={handleSearch} className="newtab-search-form">
            <div className="newtab-search-input-box">
              <Icon name="search" size={16} className="newtab-search-icon" />
              <input
                type="text"
                className="newtab-search-input"
                placeholder="Search web or bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </form>

          {/* Top Visited Sites Shortcuts */}
          {topSites.length > 0 && (
            <div className="newtab-shortcuts-grid">
              {topSites.map((site) => {
                const favicon = getFaviconUrl(site.url);
                return (
                  <a
                    key={site.url}
                    href={site.url}
                    className="newtab-shortcut-card"
                    title={`${site.title}\n${site.url}`}
                  >
                    <div className="shortcut-icon-wrapper">
                      {favicon ? (
                        <img src={favicon} alt="" className="shortcut-favicon" />
                      ) : (
                        <span className="shortcut-initials">{getDomainInitials(site.url)}</span>
                      )}
                    </div>
                    <span className="shortcut-title">{site.title || site.url}</span>
                  </a>
                );
              })}
            </div>
          )}

          <div className="newtab-hint-pill">
            <Icon name="bookmark" size={13} color="#38bdf8" />
            <span>
              Move mouse to left edge or press <strong>Alt + B</strong> to open bookmarks.
            </span>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Start Page Controls */}
      <div className="newtab-bottom-controls">
        <button
          type="button"
          className="newtab-control-pill"
          onClick={handleNextWallpaper}
          title={`Wallpaper: ${currentWp?.name || 'Nature'} (Click to change)`}
        >
          <Icon name="palette" size={13} />
          <span>{currentWp?.name || 'Wallpaper'}</span>
        </button>
        <button
          type="button"
          className="newtab-control-pill"
          onClick={handleToggleWidgets}
          title={showWidgets ? 'Clean Mode: Hide clock and search' : 'Show clock and search'}
        >
          <Icon name={showWidgets ? 'close' : 'plus'} size={12} />
          <span>{showWidgets ? 'Clean View' : 'Show Widgets'}</span>
        </button>
      </div>

      {/* The EXACT SAME sliding bookmark sidebar - hidden off-screen to left until hovered */}
      <SidebarContainer isEmbedded={false} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<NewTabApp />);
