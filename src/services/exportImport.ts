import { BookmarkItem, UserSettings } from '../types';

export const exportImportService = {
  // 1. Export Bookmarks to JSON
  exportToJson(tree: BookmarkItem[]): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tree, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bookmarks_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // 2. Export Bookmarks to Netscape HTML format
  exportToHtml(tree: BookmarkItem[]): void {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    const traverse = (nodes: BookmarkItem[], indent: number) => {
      const padding = ' '.repeat(indent);
      for (const node of nodes) {
        if (node.children) {
          const dateAdded = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
          html += `${padding}<DT><H3 ADD_DATE="${dateAdded}">${escapeXml(node.title)}</H3>\n`;
          html += `${padding}<DL><p>\n`;
          traverse(node.children, indent + 4);
          html += `${padding}</DL><p>\n`;
        } else if (node.url) {
          const dateAdded = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
          html += `${padding}<DT><A HREF="${escapeXml(node.url)}" ADD_DATE="${dateAdded}">${escapeXml(
            node.title
          )}</A>\n`;
        }
      }
    };

    traverse(tree, 4);
    html += '</DL><p>\n';

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `bookmarks_${new Date().toISOString().slice(0, 10)}.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  },

  // 3. Export Settings to JSON
  exportSettings(settings: UserSettings): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bookmark_sidebar_settings_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // 4. Parse Netscape HTML bookmarks (Works in both Browser and Node.js)
  parseNetscapeHtml(htmlText: string): { title: string; url?: string; isFolder: boolean; children?: any[] }[] {
    if (!htmlText || !htmlText.includes('<DL')) {
      return [];
    }

    const rootItems: any[] = [];
    const stack: { items: any[] }[] = [{ items: rootItems }];

    const lines = htmlText.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Check folder start: <DT><H3 ...>Title</H3>
      const folderMatch = line.match(/<DT><H3[^>]*>(.*?)<\/H3>/i);
      if (folderMatch) {
        const folder = {
          title: unescapeXml(folderMatch[1]),
          isFolder: true,
          children: [],
        };
        const currentContainer = stack[stack.length - 1];
        if (currentContainer) {
          currentContainer.items.push(folder);
        }
        continue;
      }

      // Check folder container start: <DL>
      if (/<DL/i.test(line)) {
        const currentContainer = stack[stack.length - 1];
        const lastItem = currentContainer?.items[currentContainer.items.length - 1];
        if (lastItem && lastItem.isFolder && lastItem.children) {
          stack.push({ items: lastItem.children });
        }
        continue;
      }

      // Check folder container end: </DL>
      if (/<\/DL>/i.test(line)) {
        if (stack.length > 1) {
          stack.pop();
        }
        continue;
      }

      // Check bookmark item: <DT><A HREF="url" ...>Title</A>
      const bookmarkMatch = line.match(/<DT><A\s+HREF="([^"]*)"[^>]*>(.*?)<\/A>/i);
      if (bookmarkMatch) {
        const item = {
          title: unescapeXml(bookmarkMatch[2]) || bookmarkMatch[1],
          url: unescapeXml(bookmarkMatch[1]),
          isFolder: false,
        };
        const currentContainer = stack[stack.length - 1];
        if (currentContainer) {
          currentContainer.items.push(item);
        }
      }
    }

    return rootItems;
  },
};

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function unescapeXml(str: string): string {
  return (str || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}
