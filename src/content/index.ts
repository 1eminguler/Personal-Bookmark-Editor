import React from 'react';
import { createRoot } from 'react-dom/client';
import { SidebarContainer } from '../components/Sidebar/SidebarContainer';
import cssText from './styles.css?inline';

function init() {
  // Only inject in top window (avoid iframe ads/embeds)
  if (window !== window.top) return;

  // Prevent duplicate injection
  if (document.getElementById('sahsi-bookmark-root')) return;

  const host = document.createElement('div');
  host.id = 'sahsi-bookmark-root';
  host.style.cssText =
    'position: fixed !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 100vh !important; z-index: 2147483647 !important; pointer-events: none !important;';

  // Attach Open Shadow DOM for complete CSS/DOM isolation
  const shadowRoot = host.attachShadow({ mode: 'open' });

  // Inject Styles into Shadow Root
  const styleEl = document.createElement('style');
  styleEl.textContent = cssText;
  shadowRoot.appendChild(styleEl);

  // App Mount Point
  const mountPoint = document.createElement('div');
  mountPoint.className = 'sahsi-shadow-mount';
  mountPoint.style.cssText = 'width: 100%; height: 100%; pointer-events: none;';
  shadowRoot.appendChild(mountPoint);

  document.documentElement.appendChild(host);

  // Mount React
  const root = createRoot(mountPoint);
  root.render(React.createElement(SidebarContainer, { isEmbedded: false }));
}

// Ensure DOM is ready before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
