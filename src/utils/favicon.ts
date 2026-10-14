export function getFaviconUrl(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    // Use Google favicon cache service
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
  } catch {
    return '';
  }
}

export function getDomainInitials(url?: string): string {
  if (!url) return '?';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    return host.slice(0, 2).toUpperCase();
  } catch {
    return '?';
  }
}
