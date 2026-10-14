import { expect, test } from '@playwright/test';
import { bookmarkService } from '../../src/services/bookmarkService';
import { exportImportService } from '../../src/services/exportImport';
import { BookmarkItem } from '../../src/types';

test.describe('Bookmark Logic & Utilities', () => {
  test('Cycle detection: should prevent moving a folder into its own subtree', () => {
    const mockTree: BookmarkItem[] = [
      {
        id: '1',
        title: 'Bookmarks Bar',
        children: [
          {
            id: '10',
            title: 'Parent Folder',
            children: [
              {
                id: '20',
                title: 'Child Folder',
                children: [
                  {
                    id: '30',
                    title: 'Grandchild Folder',
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            id: '40',
            title: 'Other Folder',
            children: [],
          },
        ],
      },
    ];

    // Cannot move into itself
    expect(bookmarkService.canMoveNode('10', '10', mockTree)).toBe(false);

    // Cannot move parent into child or grandchild
    expect(bookmarkService.canMoveNode('10', '20', mockTree)).toBe(false);
    expect(bookmarkService.canMoveNode('10', '30', mockTree)).toBe(false);

    // CAN move child to other folder or root
    expect(bookmarkService.canMoveNode('20', '40', mockTree)).toBe(true);
    expect(bookmarkService.canMoveNode('30', '1', mockTree)).toBe(true);
  });

  test('Netscape HTML bookmark parser should parse valid bookmark file', () => {
    const htmlSample = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1600000000">Yazılım</H3>
    <DL><p>
        <DT><A HREF="https://github.com" ADD_DATE="1600000001">GitHub</A>
        <DT><A HREF="https://react.dev" ADD_DATE="1600000002">React</A>
    </DL><p>
    <DT><A HREF="https://google.com" ADD_DATE="1600000003">Google</A>
</DL><p>`;

    const parsed = exportImportService.parseNetscapeHtml(htmlSample);
    expect(parsed.length).toBeGreaterThan(0);

    const folder = parsed.find((item) => item.title === 'Yazılım');
    expect(folder).toBeDefined();
    expect(folder?.isFolder).toBe(true);
    expect(folder?.children?.length).toBe(2);
    expect(folder?.children?.[0].title).toBe('GitHub');
    expect(folder?.children?.[0].url).toBe('https://github.com');

    const google = parsed.find((item) => item.title === 'Google');
    expect(google).toBeDefined();
    expect(google?.url).toBe('https://google.com');
  });

  test('Netscape HTML parser should handle malformed or empty HTML gracefully', () => {
    const result = exportImportService.parseNetscapeHtml('<div>Invalid content</div>');
    expect(result).toEqual([]);
  });
});
