import React from 'react';
import { BookmarkItem, UserSettings } from '../../types';
import { getDomainInitials, getFaviconUrl } from '../../utils/favicon';
import { Icon } from '../Common/Icon';

interface FavoritesBarProps {
  favoriteIds: string[];
  findNode: (id: string) => BookmarkItem | null;
  onOpen: (url: string, e: React.MouseEvent) => void;
  onRemoveFavorite: (id: string) => void;
  settings: UserSettings;
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favoriteIds,
  findNode,
  onOpen,
  onRemoveFavorite,
  settings,
}) => {
  if (!settings.showFavorites || favoriteIds.length === 0) return null;

  const favoriteItems = favoriteIds
    .map((id) => findNode(id))
    .filter((item): item is BookmarkItem => Boolean(item && item.url));

  if (favoriteItems.length === 0) return null;

  return (
    <div className="soft-favorites-bar">
      <div className="soft-favorites-list">
        {favoriteItems.map((item) => {
          const [imgError, setImgError] = React.useState(false);
          const favicon = getFaviconUrl(item.url);

          return (
            <button
              key={item.id}
              className="soft-favorite-pill"
              title={`${item.title} - ${item.url}`}
              onClick={(e) => onOpen(item.url!, e)}
              onAuxClick={(e) => {
                if (e.button === 1) onOpen(item.url!, e);
              }}
            >
              <div className="soft-pill-icon">
                {!imgError && favicon && settings.showFavicons ? (
                  <img src={favicon} alt="" onError={() => setImgError(true)} />
                ) : (
                  <span className="soft-pill-initials">{getDomainInitials(item.url)}</span>
                )}
              </div>
              <span className="soft-pill-title">{item.title || item.url}</span>
              <button
                type="button"
                className="soft-pill-remove"
                title="Remove from favorites"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFavorite(item.id);
                }}
              >
                <Icon name="close" size={9} />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
};
