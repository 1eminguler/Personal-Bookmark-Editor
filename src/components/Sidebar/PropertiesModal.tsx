import React from 'react';
import { BookmarkItem } from '../../types';
import { Icon } from '../Common/Icon';

interface PropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BookmarkItem | null;
  parentFolderTitle?: string;
}

export const PropertiesModal: React.FC<PropertiesModalProps> = ({
  isOpen,
  onClose,
  item,
  parentFolderTitle = 'Root Directory',
}) => {
  if (!isOpen || !item) return null;

  const isFolder = Boolean(item.children);
  const dateFormatted = item.dateAdded
    ? new Date(item.dateAdded).toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  return (
    <div className="soft-modal-backdrop" onClick={onClose}>
      <div className="soft-modal-card soft-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="soft-modal-header">
          <span className="soft-modal-title">
            <Icon name={isFolder ? 'folder' : 'bookmark'} size={14} />
            <span>{isFolder ? 'Folder Properties' : 'Bookmark Properties'}</span>
          </span>
          <button type="button" className="soft-close-btn" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="soft-modal-body">
          <div className="soft-prop-row">
            <span className="soft-prop-label">Title:</span>
            <span className="soft-prop-value">{item.title || 'Untitled'}</span>
          </div>

          {!isFolder && item.url && (
            <div className="soft-prop-row">
              <span className="soft-prop-label">URL:</span>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="soft-prop-link"
                title={item.url}
              >
                {item.url}
              </a>
            </div>
          )}

          <div className="soft-prop-row">
            <span className="soft-prop-label">Location:</span>
            <span className="soft-prop-value">📁 {parentFolderTitle}</span>
          </div>

          {isFolder && (
            <div className="soft-prop-row">
              <span className="soft-prop-label">Contents:</span>
              <span className="soft-prop-value">{item.children ? `${item.children.length} items` : '0 items'}</span>
            </div>
          )}

          <div className="soft-prop-row">
            <span className="soft-prop-label">Date Added:</span>
            <span className="soft-prop-value">{dateFormatted}</span>
          </div>
        </div>

        <div className="soft-modal-footer">
          <button type="button" className="soft-btn-submit" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
