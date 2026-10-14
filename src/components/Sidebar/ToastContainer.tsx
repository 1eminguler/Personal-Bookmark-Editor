import React from 'react';
import { UndoAction } from '../../types';
import { Icon } from '../Common/Icon';

interface ToastContainerProps {
  toast: UndoAction | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toast, onUndo, onDismiss }) => {
  if (!toast) return null;

  return (
    <div className="toast-notification">
      <div className="toast-content">
        <Icon name="check" size={14} color="#10b981" />
        <span className="toast-text">{toast.description}</span>
      </div>
      <div className="toast-actions">
        <button type="button" className="toast-undo-btn" onClick={onUndo}>
          <Icon name="undo" size={12} />
          <span>Undo</span>
        </button>
        <button type="button" className="toast-close-btn" onClick={onDismiss} title="Dismiss">
          <Icon name="close" size={12} />
        </button>
      </div>
    </div>
  );
};
