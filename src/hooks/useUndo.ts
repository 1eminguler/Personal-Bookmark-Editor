import { useState } from 'react';
import { bookmarkService } from '../services/bookmarkService';
import { UndoAction } from '../types';

export function useUndo(refreshBookmarks: () => Promise<void>) {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [lastActionToast, setLastActionToast] = useState<UndoAction | null>(null);

  const pushUndo = (action: Omit<UndoAction, 'id'>) => {
    const fullAction: UndoAction = {
      ...action,
      id: Math.random().toString(36).substring(2, 9),
    };
    setUndoStack((prev) => [...prev.slice(-15), fullAction]);
    setLastActionToast(fullAction);
  };

  const executeUndo = async () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setLastActionToast(null);

    try {
      if (action.type === 'move') {
        // undoData: { id: string, oldParentId: string, oldIndex: number }
        await bookmarkService.move(action.undoData.id, {
          parentId: action.undoData.oldParentId,
          index: action.undoData.oldIndex,
        });
      } else if (action.type === 'delete') {
        // undoData: { title: string, url?: string, parentId: string, index?: number }
        await bookmarkService.create({
          title: action.undoData.title,
          url: action.undoData.url,
          parentId: action.undoData.parentId,
          index: action.undoData.index,
        });
      } else if (action.type === 'update') {
        // undoData: { id: string, oldTitle: string, oldUrl?: string }
        await bookmarkService.update(action.undoData.id, {
          title: action.undoData.oldTitle,
          url: action.undoData.oldUrl,
        });
      } else if (action.type === 'create') {
        // undoData: { id: string }
        await bookmarkService.remove(action.undoData.id);
      }
      await refreshBookmarks();
    } catch (err) {
      console.error('Failed to undo action:', err);
    }
  };

  const dismissToast = () => {
    setLastActionToast(null);
  };

  return {
    undoStack,
    lastActionToast,
    pushUndo,
    executeUndo,
    dismissToast,
  };
}
