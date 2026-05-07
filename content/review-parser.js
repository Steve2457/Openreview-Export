(() => {
  const ns = window.__OR_EXPORT__;

  async function ensureForumRepliesRendered() {
    const noteSel = '#forum-replies .note[data-id], .forum-replies-container .note[data-id]';
    const holderSels = [
      '#forum-replies .rc-virtual-list-holder',
      '.forum-replies-container .rc-virtual-list-holder',
    ];
    let prev = -1;
    for (let pass = 0; pass < 14; pass++) {
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: 'auto' });
      for (const sel of holderSels) {
        const holder = document.querySelector(sel);
        if (holder) holder.scrollTop = holder.scrollHeight;
      }
      await ns.sleep(220);
      const n = document.querySelectorAll(noteSel).length;
      if (n === prev && pass > 4) break;
      prev = n;
    }
  }

  function isReviewNoteElement(noteEl) {
    const headingText =
      noteEl.querySelector('.heading h4, .heading .minimal-title')?.innerText || '';
    if (/official review|official meta review|meta review/i.test(headingText)) return true;
    if (noteEl.querySelector('a[href*="Official_Review"]')) return true;
    const sig = noteEl.querySelector('.heading .signatures')?.innerText || '';
    if (/Reviewer|AnonReviewer|Area_Chair/i.test(sig)) {
      const blob = noteEl.innerText.slice(0, 4000);
      if (/\b(Rating|Confidence|Soundness|Recommendation|Presentation|Contribution)\b/i.test(blob)) {
        return true;
      }
    }
    return false;
  }

  function extractFieldsFromNoteContent(noteEl) {
    const root = noteEl.querySelector('.note-content');
    if (!root) return [];
    const out = [];
    root.querySelectorAll(':scope > div').forEach((div) => {
      const labelEl = div.querySelector('strong.note-content-field');
      if (!labelEl) return;
      const label = labelEl.textContent.replace(/:\s*$/, '').trim();
      if (!label || label.startsWith('_')) return;
      const lk = ns.labelToKey(label);
      if (ns.OMIT_FIELD_KEYS.has(lk)) return;
      const valEl = div.querySelector('.note-content-value');
      const text = valEl ? ns.extractTextWithMath(valEl) : '';
      out.push({ label, text });
    });
    return out;
  }

  function partitionDomFields(fields) {
    const compact = [];
    const body = [];
    for (const { label, text } of fields) {
      const key = ns.labelToKey(label);
      const str = String(text).trim();
      if (!str) continue;
      const forceLong = ns.BODY_FIELD_ORDER.includes(key) || str.includes('\n') || str.length > 220;
      const isCompact =
        !forceLong &&
        (ns.SHORT_FIELD_HINTS.test(key) || (!str.includes('\n') && str.length <= 220));
      if (isCompact) compact.push({ label, text: str });
      else body.push({ label, text: str });
    }
    compact.sort((a, b) => {
      const as = ns.SHORT_FIELD_HINTS.test(ns.labelToKey(a.label)) ? 0 : 1;
      const bs = ns.SHORT_FIELD_HINTS.test(ns.labelToKey(b.label)) ? 0 : 1;
      if (as !== bs) return as - bs;
      return a.label.localeCompare(b.label);
    });
    body.sort((a, b) => {
      const ia = ns.BODY_FIELD_ORDER.indexOf(ns.labelToKey(a.label));
      const ib = ns.BODY_FIELD_ORDER.indexOf(ns.labelToKey(b.label));
      const ra = ia === -1 ? 1000 : ia;
      const rb = ib === -1 ? 1000 : ib;
      if (ra !== rb) return ra - rb;
      return a.label.localeCompare(b.label);
    });
    return { compact, body };
  }

  function extractOfficialReviewsFromDom() {
    const paperTitle = ns.getPaperTitleFromDom();
    const selector = '#forum-replies .note[data-id], .forum-replies-container .note[data-id]';
    let nodes = document.querySelectorAll(selector);
    if (!nodes.length) nodes = document.querySelectorAll('main.forum .forum-replies-container .note[data-id]');
    if (!nodes.length) nodes = document.querySelectorAll('main.forum .note[data-id]');

    const reviews = [];
    nodes.forEach((noteEl) => {
      if (!isReviewNoteElement(noteEl)) return;
      const fields = extractFieldsFromNoteContent(noteEl);
      if (!fields.length) return;
      const headingText =
        noteEl.querySelector('.heading h4, .heading .minimal-title')?.innerText
          ?.trim()
          .replace(/\s+/g, ' ') || '';
      const signatureText =
        noteEl.querySelector('.heading .signatures')?.innerText?.trim().replace(/\s+/g, ' ') || '';
      reviews.push({
        noteId: noteEl.getAttribute('data-id') || '',
        headingText,
        signatureText,
        fields,
      });
    });
    return { paperTitle, reviews };
  }

  function scrapeDomFallback() {
    const title = ns.getPaperTitleFromDom();
    const headings = Array.from(document.querySelectorAll('main h2, main h3, main h4, main h5'));
    const reviewHeadings = headings.filter((h) => /official review/i.test(h.textContent || ''));
    const chunks = [];

    for (const h of reviewHeadings) {
      const parts = [h.textContent?.trim() || 'Official Review'];
      let el = h.nextElementSibling;
      let depth = 0;
      const tag = h.tagName;
      while (el && depth < 80) {
        if (/^H[1-6]$/.test(el.tagName)) {
          const level = parseInt(el.tagName[1], 10);
          const hLevel = parseInt(tag[1], 10);
          if (level <= hLevel && el !== h) break;
        }
        parts.push(ns.extractTextWithMath(el) || '');
        el = el.nextElementSibling;
        depth += 1;
      }
      chunks.push(parts.join('\n\n'));
    }

    let md = `# ${title}\n\n`;
    md += `> Scraped from · ${window.location.href}\n\n`;
    if (!chunks.length) {
      md += `_Could not find an “Official Review” block. Log in, expand reviews, scroll to load all replies, then try again._\n`;
      return md;
    }
    md += `_Visible page text below; may be incomplete._\n\n---\n\n`;
    chunks.forEach((chunk, i) => {
      md += `## Review ${i + 1}\n\n`;
      md += `${ns.escapeAccidentalAtxHeaders(String(chunk).trim())}\n\n`;
      md += `---\n\n`;
    });
    return md;
  }

  function isPaperForumPage() {
    try {
      const h = window.location.hostname.replace(/^www\./, '');
      if (h !== 'openreview.net') return false;
      const p = window.location.pathname;
      if (p !== '/forum' && p !== '/forum/') return false;
      return new URLSearchParams(window.location.search).has('id');
    } catch {
      return false;
    }
  }

  ns.ensureForumRepliesRendered = ensureForumRepliesRendered;
  ns.partitionDomFields = partitionDomFields;
  ns.extractOfficialReviewsFromDom = extractOfficialReviewsFromDom;
  ns.scrapeDomFallback = scrapeDomFallback;
  ns.isPaperForumPage = isPaperForumPage;
})();
