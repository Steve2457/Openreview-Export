(() => {
  const ns = window.__OR_EXPORT__;

  const REPLY_NOTE_SELECTOR =
    '#forum-replies .note[data-id], .forum-replies-container .note[data-id], main.forum .forum-replies .note[data-id]';

  // Venues may customize review_name, so type matching must stay broader than Official_Review.
  // These terms identify workflow/control notes that mention "review" but are not reports.
  const NON_REVIEW_WORKFLOW_TERMS = new Set([
    'acknowledgement',
    'approval',
    'assignment',
    'bid',
    'comment',
    'confirmation',
    'deadline',
    'decision',
    'deletion',
    'discussion',
    'edit',
    'feedback',
    'invitation',
    'matching',
    'process',
    'rating',
    'rebuttal',
    'recommendation',
    'recruitment',
    'release',
    'reminder',
    'request',
    'response',
    'revision',
    'stage',
    'status',
    'task',
    'update',
    'verification',
    'withdraw',
    'withdrawal',
  ]);

  const STRONG_REVIEW_FIELD_KEYS =
    /^(review|main_review|detailed_review|metareview|summary|paper_summary|review_summary|summary_and_contributions|summary_of_(?:the_)?(?:paper|work|contributions)|strengths|weaknesses|strengths_and_weaknesses|weaknesses_and_questions|pros_and_cons|questions|comments_to_authors|main_comments|detailed_comments|requested_changes|limitations?|overall_assessment|assessment|justification|broader_impact_concerns|societal_impact|ethical_concerns|ethics_concerns|details_of_ethics_concerns|confidential_comments(?:_to_area_chair)?)$/i;

  const REVIEW_FIELD_KEYS =
    /^(review|main_review|detailed_review|metareview|summary|paper_summary|review_summary|summary_and_contributions|summary_of_(?:the_)?(?:paper|work|contributions)|strengths|weaknesses|strengths_and_weaknesses|weaknesses_and_questions|pros_and_cons|questions|comments_to_authors|main_comments|detailed_comments|requested_changes|limitations?|overall_assessment|assessment|justification|broader_impact_concerns|societal_impact|ethical_concerns|ethics_concerns|details_of_ethics_concerns|confidential_comments(?:_to_area_chair)?|rating|overall_rating|recommendation|overall_recommendation|confidence|reviewer_confidence|score|overall_score|soundness|correctness|technical_quality|novelty|originality|significance|relevance|clarity|quality|impact|reproducibility|presentation|contribution|claims_and_evidence|audience)$/i;

  function normalizeReviewTypeText(text) {
    return String(text || '')
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function isReviewWorkflowTypeText(text) {
    const normalized = normalizeReviewTypeText(text);
    const reviewRelated =
      /\breviews?\b/.test(normalized) ||
      /\b(?:reviewer|referee) reports?\b/.test(normalized) ||
      /\b(?:official|paper|peer) (?:assessment|evaluation)\b/.test(normalized);
    if (!reviewRelated) return false;
    if (/\breview submissions?\b/.test(normalized)) return true;
    return normalized.split(' ').some((word) => NON_REVIEW_WORKFLOW_TERMS.has(word));
  }

  function isReviewReplyTypeText(text) {
    const normalized = normalizeReviewTypeText(text);
    if (!normalized || isReviewWorkflowTypeText(normalized)) return false;
    if (/\breviews?\b/.test(normalized)) return true;
    return (
      /\b(?:reviewer|referee) reports?\b/.test(normalized) ||
      /\b(?:official|paper|peer) (?:assessment|evaluation)\b/.test(normalized)
    );
  }

  function getInvitationTypeFromId(value) {
    let decoded = String(value || '');
    try {
      decoded = decodeURIComponent(decoded);
    } catch (_) {}
    const match = decoded.match(/\/-\/([^/?#&]+)/);
    return match?.[1] || '';
  }

  function isReviewInvitationId(value) {
    return isReviewReplyTypeText(getInvitationTypeFromId(value));
  }

  function getOwnNoteContent(noteEl) {
    return noteEl.querySelector(
      ':scope > .note-content-container > .note-content, :scope > .note-content, :scope > .content > .note-content',
    );
  }

  function getSignatureText(noteEl) {
    return (
      noteEl.querySelector('.subheading .signatures, .heading .signatures')?.innerText || ''
    );
  }

  function hasReviewerSignature(noteEl) {
    const normalized = getSignatureText(noteEl).replace(/[_/-]+/g, ' ');
    return /\b(?:anonymous )?(?:reviewers?|referees?|area chairs?|action editors?|ethics reviewers?|meta reviewers?|program committee members?|pc members?|committee members?)\b/i.test(
      normalized,
    );
  }

  function getFieldRows(noteEl) {
    const root = getOwnNoteContent(noteEl);
    if (!root) return [];
    return Array.from(root.querySelectorAll(':scope > div, :scope > li'))
      .map((row) => {
        const labelEl = row.querySelector('.note-content-field');
        const label = labelEl?.textContent?.replace(/:\s*$/, '').trim() || '';
        return { row, labelEl, label, key: ns.labelToKey(label) };
      })
      .filter(({ label }) => label && !label.startsWith('_'));
  }

  function hasReviewFields(noteEl) {
    const keys = getFieldRows(noteEl)
      .map(({ key }) => key)
      .filter((key) => key && !ns.OMIT_FIELD_KEYS.has(key));
    if (keys.some((key) => STRONG_REVIEW_FIELD_KEYS.test(key))) return true;
    return new Set(keys.filter((key) => REVIEW_FIELD_KEYS.test(key))).size >= 2;
  }

  function expandReviewNotes() {
    let expanded = 0;
    document.querySelectorAll(REPLY_NOTE_SELECTOR).forEach((noteEl) => {
      if (getOwnNoteContent(noteEl)) return;
      if (!isReviewNoteElement(noteEl) && !hasReviewerSignature(noteEl)) return;
      const expandButton = noteEl.querySelector(
        ':scope > .collapse-controls-v button:last-child',
      );
      if (!expandButton) return;
      expandButton.click();
      expanded += 1;
    });
    return expanded;
  }

  async function ensureForumRepliesRendered() {
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
      const n = document.querySelectorAll(REPLY_NOTE_SELECTOR).length;
      if (n === prev && pass > 4) break;
      prev = n;
    }

    if (expandReviewNotes()) await ns.sleep(250);
  }

  function isReviewNoteElement(noteEl) {
    const replyType =
      noteEl.querySelector('.subheading .invitation[title="Reply type"]')?.innerText ||
      noteEl.querySelector('.subheading .invitation')?.innerText ||
      '';
    if (isReviewReplyTypeText(replyType)) return true;
    if (isReviewWorkflowTypeText(replyType)) return false;

    const headingText =
      noteEl.querySelector('.heading h4, .heading .minimal-title')?.innerText || '';
    const collapsedTitle = headingText.split(/[•·]/, 1)[0];
    if (!replyType && isReviewReplyTypeText(collapsedTitle) && hasReviewerSignature(noteEl)) {
      return true;
    }
    const invitationLinks = Array.from(
      noteEl.querySelectorAll?.(
        'a[href*="Review"], a[href*="review"], a[data-id*="Review"], a[data-id*="review"]',
      ) || [],
    );
    if (
      invitationLinks.some((link) =>
        isReviewInvitationId(
          link.getAttribute('href') || link.getAttribute('data-id') || '',
        ),
      )
    ) {
      return true;
    }

    return hasReviewerSignature(noteEl) && hasReviewFields(noteEl);
  }

  function extractFieldsFromNoteContent(noteEl) {
    const out = [];
    getFieldRows(noteEl).forEach(({ row, label, key }) => {
      if (ns.OMIT_FIELD_KEYS.has(key)) return;
      const valEl = row.querySelector('.note-content-value');
      let text = valEl ? ns.extractTextWithMath(valEl) : ns.extractTextWithMath(row);
      if (!valEl && text) {
        const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(`^${escapedLabel}\\s*:?\\s*`, 'i'), '').trim();
      }
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
    let nodes = document.querySelectorAll(REPLY_NOTE_SELECTOR);
    if (!nodes.length) {
      nodes = document.querySelectorAll('main.forum .forum-replies-container .note[data-id]');
    }
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
      const signatureText = getSignatureText(noteEl).trim().replace(/\s+/g, ' ');
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
    const reviewNotes = Array.from(document.querySelectorAll(REPLY_NOTE_SELECTOR)).filter(
      isReviewNoteElement,
    );
    const headings = Array.from(document.querySelectorAll('main h2, main h3, main h4, main h5'));
    const reviewHeadings = headings.filter((h) => isReviewReplyTypeText(h.textContent || ''));
    const chunks = [];

    reviewNotes.forEach((noteEl) => {
      const root = getOwnNoteContent(noteEl);
      if (!root) return;
      const heading =
        noteEl.querySelector('.heading h4, .heading .minimal-title')?.innerText?.trim() ||
        'Review';
      const signature = getSignatureText(noteEl).trim();
      const body = ns.extractTextWithMath(root);
      if (body) chunks.push([heading, signature, body].filter(Boolean).join('\n\n'));
    });

    for (const h of chunks.length ? [] : reviewHeadings) {
      const parts = [h.textContent?.trim() || 'Review'];
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
      md += `_Could not find a peer-review block. Log in, show all replies, then try again._\n`;
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
  ns.isReviewReplyTypeText = isReviewReplyTypeText;
  ns.isReviewWorkflowTypeText = isReviewWorkflowTypeText;
  ns.isReviewInvitationId = isReviewInvitationId;
  ns.isReviewNoteElement = isReviewNoteElement;
  ns.extractFieldsFromNoteContent = extractFieldsFromNoteContent;
  ns.partitionDomFields = partitionDomFields;
  ns.extractOfficialReviewsFromDom = extractOfficialReviewsFromDom;
  ns.scrapeDomFallback = scrapeDomFallback;
  ns.isPaperForumPage = isPaperForumPage;
})();
