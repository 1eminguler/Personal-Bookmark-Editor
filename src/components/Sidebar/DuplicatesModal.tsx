import React from 'react';
import { BookmarkItem } from '../../types';
import { Icon } from '../Common/Icon';

interface DuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: Map<string, BookmarkItem[]>;
  onDeleteDuplicate: (id: string) => Promise<void>;
  onKeepOnlyOne: (items: BookmarkItem[]) => Promise<void>;
}

export const DuplicatesModal: React.FC<DuplicatesModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  onDeleteDuplicate,
  onKeepOnlyOne,
}) => {
  if (!isOpen) return null;

  const duplicateEntries = Array.from(duplicates.entries());

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Icon name="alert-circle" size={18} color="#f59e0b" />
            <span>Duplicate Bookmarks Scanner</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="modal-body duplicates-list-container">
          {duplicateEntries.length === 0 ? (
            <div className="empty-state">
              <Icon name="check" size={32} color="#10b981" />
              <p>Great! No duplicate bookmarks found.</p>
            </div>
          ) : (
            <>
              <p className="duplicates-info">
                A total of <strong>{duplicateEntries.length}</strong> unique URLs are bookmarked multiple times.
              </p>
              {duplicateEntries.map(([url, items]) => (
                <div key={url} className="duplicate-card">
                  <div className="duplicate-card-header">
                    <span className="duplicate-url" title={url}>
                      {url}
                    </span>
                    <button
                      type="button"
                      className="btn-sm btn-cleanup"
                      title="Keep the first one and delete all duplicate copies"
                      onClick={() => onKeepOnlyOne(items)}
                    >
                      <Icon name="trash" size={12} />
                      <span>Clean Duplicates ({items.length - 1})</span>
                    </button>
                  </div>
                  <div className="duplicate-instances">
                    {items.map((item, idx) => (
                      <div key={item.id} className="duplicate-instance-row">
                        <span className="instance-index">#{idx + 1}</span>
                        <span className="instance-title">{item.title || 'Untitled'}</span>
                        <button
                          type="button"
                          className="instance-delete-btn"
                          title="Delete this copy"
                          onClick={() => onDeleteDuplicate(item.id)}
                        >
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
