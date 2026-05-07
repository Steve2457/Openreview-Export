(() => {
  const ns = window.__OR_EXPORT__;

  function unwrapOpenReviewField(field) {
    if (field == null) return '';
    if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
      return field;
    }
    if (Array.isArray(field)) {
      return field.map((x) => unwrapOpenReviewField(x)).join(', ');
    }
    if (typeof field === 'object' && 'value' in field) {
      return unwrapOpenReviewField(field.value);
    }
    try {
      return JSON.stringify(field, null, 2);
    } catch {
      return String(field);
    }
  }

  function fenceMarkdown(text) {
    const s = String(text);
    let fence = '```';
    while (s.includes(fence)) fence += '`';
    return `${fence}\n${s}\n${fence}`;
  }

  function escapeAccidentalAtxHeaders(text) {
    return String(text)
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => (/^(#{1,6})\s/.test(line) ? `\\${line}` : line))
      .join('\n');
  }

  function formatLongFieldBody(value) {
    const raw = unwrapOpenReviewField(value);
    const s =
      typeof raw === 'string'
        ? raw
        : raw != null && typeof raw === 'object'
          ? JSON.stringify(raw, null, 2)
          : String(raw);
    const t = s.trim();
    if (!t) return '_empty_\n';
    if (t.includes('```') || (t.startsWith('{') && t.endsWith('}'))) {
      return fenceMarkdown(t);
    }
    return `${escapeAccidentalAtxHeaders(t)}\n`;
  }

  function labelToKey(label) {
    return String(label)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getPaperTitleFromDom() {
    return (
      document.querySelector('h2.citation_title')?.textContent?.trim() ||
      document.querySelector('.citation_title')?.textContent?.trim() ||
      document.querySelector('main h1, main h2')?.textContent?.trim() ||
      document.title?.replace(/\s*[-|]\s*OpenReview.*$/i, '').trim() ||
      'Untitled'
    );
  }

  function sanitizeFilenameBase(name) {
    const trimmed = String(name || 'Untitled')
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
      .replace(/\s+/g, ' ')
      .trim();
    return trimmed.slice(0, 180) || 'Untitled';
  }

  function downloadMarkdownInPage(markdown, filename) {
    const safe =
      typeof filename === 'string' && filename.toLowerCase().endsWith('.md')
        ? filename
        : `${String(filename || 'OpenReview-export')}.md`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = safe;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  ns.unwrapOpenReviewField = unwrapOpenReviewField;
  ns.escapeAccidentalAtxHeaders = escapeAccidentalAtxHeaders;
  ns.formatLongFieldBody = formatLongFieldBody;
  ns.labelToKey = labelToKey;
  ns.sleep = sleep;
  ns.getPaperTitleFromDom = getPaperTitleFromDom;
  ns.sanitizeFilenameBase = sanitizeFilenameBase;
  ns.downloadMarkdownInPage = downloadMarkdownInPage;
})();
