import React from 'react';
import { createRoot } from 'react-dom/client';
import { SidebarContainer } from '../components/Sidebar/SidebarContainer';
import '../content/styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(<SidebarContainer isEmbedded={true} />);
