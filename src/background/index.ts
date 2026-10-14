import { ExtensionMessage } from '../types';

// Broadcast bookmark changes to all tabs so UI updates instantly
function broadcastBookmarksUpdated() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'BOOKMARKS_UPDATED' }).catch(() => {
          // Tab might not have content script injected (e.g. chrome://)
        });
      }
    }
  });
}

// Subscribe to bookmark system events
if (chrome.bookmarks) {
  chrome.bookmarks.onCreated.addListener(broadcastBookmarksUpdated);
  chrome.bookmarks.onRemoved.addListener(broadcastBookmarksUpdated);
  chrome.bookmarks.onChanged.addListener(broadcastBookmarksUpdated);
  chrome.bookmarks.onMoved.addListener(broadcastBookmarksUpdated);
  chrome.bookmarks.onChildrenReordered.addListener(broadcastBookmarksUpdated);
}

// Handle messages from content script and extension pages
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'GET_BOOKMARKS_TREE': {
          const tree = await chrome.bookmarks.getTree();
          sendResponse({ success: true, data: tree });
          break;
        }

        case 'GET_TOP_SITES': {
          if (chrome.topSites && chrome.topSites.get) {
            chrome.topSites.get((sites) => {
              sendResponse({ success: true, data: sites || [] });
            });
            return;
          }
          sendResponse({ success: true, data: [] });
          break;
        }

        case 'CREATE_BOOKMARK': {
          const res = await chrome.bookmarks.create({
            parentId: message.parentId,
            title: message.title,
            url: message.url,
            index: message.index,
          });
          broadcastBookmarksUpdated();
          sendResponse({ success: true, data: res });
          break;
        }

        case 'UPDATE_BOOKMARK': {
          // Protected roots check
          if (['0', '1', '2', '3', 'mobile'].includes(message.id)) {
            sendResponse({ success: false, error: 'System root folders cannot be renamed.' });
            return;
          }
          const res = await chrome.bookmarks.update(message.id, {
            title: message.title,
            url: message.url,
          });
          broadcastBookmarksUpdated();
          sendResponse({ success: true, data: res });
          break;
        }

        case 'MOVE_BOOKMARK': {
          if (['0', '1', '2', '3', 'mobile'].includes(message.id)) {
            sendResponse({ success: false, error: 'System root folders cannot be moved.' });
            return;
          }
          const res = await chrome.bookmarks.move(message.id, {
            parentId: message.parentId,
            index: message.index,
          });
          broadcastBookmarksUpdated();
          sendResponse({ success: true, data: res });
          break;
        }

        case 'REMOVE_BOOKMARK': {
          if (['0', '1', '2', '3', 'mobile'].includes(message.id)) {
            sendResponse({ success: false, error: 'System root folders (Bookmarks Bar, etc.) cannot be deleted.' });
            return;
          }
          if (message.isFolder) {
            await chrome.bookmarks.removeTree(message.id);
          } else {
            await chrome.bookmarks.remove(message.id);
          }
          broadcastBookmarksUpdated();
          sendResponse({ success: true });
          break;
        }

        case 'GET_CURRENT_TAB': {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          sendResponse({
            success: true,
            data: activeTab
              ? {
                  title: activeTab.title,
                  url: activeTab.url,
                  favIconUrl: activeTab.favIconUrl,
                }
              : null,
          });
          break;
        }

        case 'OPEN_TAB': {
          const { url, mode } = message;
          if (mode === 'currentTab') {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab && activeTab.id) {
              await chrome.tabs.update(activeTab.id, { url });
            } else {
              await chrome.tabs.create({ url, active: true });
            }
          } else if (mode === 'newTab') {
            await chrome.tabs.create({ url, active: true });
          } else if (mode === 'newBackgroundTab') {
            await chrome.tabs.create({ url, active: false });
          } else if (mode === 'newWindow') {
            await chrome.windows.create({ url });
          }
          sendResponse({ success: true });
          break;
        }

        case 'SEARCH_BOOKMARKS': {
          const results = await chrome.bookmarks.search(message.query);
          sendResponse({ success: true, data: results });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error: any) {
      console.error('Service worker message handling error:', error);
      sendResponse({ success: false, error: error.message || 'An unknown error occurred' });
    }
  })();

  return true;
});

// Handle keyboard shortcut commands (Alt+B)
if (chrome.commands) {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle_sidebar') {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'TOGGLE_SIDEBAR' }).catch(async () => {
          if ((chrome as any).sidePanel && (chrome as any).sidePanel.open) {
            (chrome as any).sidePanel.open({ windowId: activeTab.windowId });
          }
        });
      }
    }
  });
}

// Handle toolbar action click: toggle sidebar on active tab
chrome.action.onClicked.addListener(async (tab) => {
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }).catch(async () => {
      if ((chrome as any).sidePanel && (chrome as any).sidePanel.open) {
        (chrome as any).sidePanel.open({ windowId: tab.windowId });
      }
    });
  }
});
