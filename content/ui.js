(() => {
  const ns = window.__OR_EXPORT__;

  let injectorBootstrapped = false;
  let routeEventsBootstrapped = false;
  let lastSeenUrl = '';

  function removeFloatingButton() {
    const el = document.getElementById(ns.BUTTON_ROOT_ID);
    if (el) el.remove();
  }

  function ensureFloatingButtonState() {
    if (ns.isPaperForumPage()) ns.injectFloatingButton();
    else removeFloatingButton();
  }

  function installRouteChangeEvents() {
    if (routeEventsBootstrapped) return;
    routeEventsBootstrapped = true;

    const notify = () => window.dispatchEvent(new Event(ns.ROUTE_CHANGE_EVENT));
    const { pushState, replaceState } = history;

    history.pushState = function patchedPushState(...args) {
      const ret = pushState.apply(this, args);
      notify();
      return ret;
    };
    history.replaceState = function patchedReplaceState(...args) {
      const ret = replaceState.apply(this, args);
      notify();
      return ret;
    };

    window.addEventListener('popstate', notify);
    window.addEventListener('hashchange', notify);
    window.addEventListener(ns.ROUTE_CHANGE_EVENT, ensureFloatingButtonState);
  }

  function injectFloatingButton() {
    if (!ns.isPaperForumPage()) return;
    if (document.getElementById(ns.BUTTON_ROOT_ID)) return;

    const root = document.createElement('div');
    root.id = ns.BUTTON_ROOT_ID;
    root.setAttribute(
      'style',
      [
        'position:fixed',
        'right:16px',
        'bottom:16px',
        'z-index:2147483646',
        'font-family:system-ui,-apple-system,sans-serif',
        'font-size:14px',
      ].join(';'),
    );

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute(
      'style',
      [
        'cursor:pointer',
        'display:inline-flex',
        'align-items:center',
        'gap:8px',
        'padding:10px 14px',
        'border:1px solid #81261B',
        'border-radius:8px',
        'background:#ececec',
        'color:#81261B',
        'box-shadow:0 1px 3px rgba(0,0,0,.08)',
      ].join(';'),
    );

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('logo/Markdown-mark.svg');
    icon.alt = '';
    icon.draggable = false;
    icon.setAttribute('width', '18');
    icon.setAttribute('height', '18');
    icon.setAttribute('style', 'display:block;flex-shrink:0;');

    const label = document.createElement('span');
    label.textContent = 'Export Review';

    btn.appendChild(icon);
    btn.appendChild(label);

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await ns.ensureForumRepliesRendered();
        const domData = ns.extractOfficialReviewsFromDom();
        let md;
        let baseName;

        if (domData.reviews.length > 0) {
          md = ns.buildMarkdownFromDomData({
            paperTitle: domData.paperTitle,
            forumUrl: window.location.href,
            reviews: domData.reviews,
          });
          baseName = ns.sanitizeFilenameBase(domData.paperTitle);
        }

        if (!md) {
          md = ns.scrapeDomFallback();
          baseName = ns.sanitizeFilenameBase(
            md.match(/^#\s+(.+)$/m)?.[1]?.trim() || ns.getPaperTitleFromDom(),
          );
        }

        ns.downloadMarkdownInPage(md, `OpenReview - ${baseName}.md`);
      } catch (_) {
        try {
          const mdFallback = ns.scrapeDomFallback();
          const titleFromMd = mdFallback.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'Untitled';
          ns.downloadMarkdownInPage(
            mdFallback,
            `OpenReview - ${ns.sanitizeFilenameBase(titleFromMd)}.md`,
          );
        } catch {
          // ignore nested fallback errors
        }
      } finally {
        btn.disabled = false;
      }
    });

    root.appendChild(btn);
    document.body.appendChild(root);
  }

  function initExportButton() {
    if (injectorBootstrapped) return;
    injectorBootstrapped = true;

    installRouteChangeEvents();
    const runEnsure = () => ensureFloatingButtonState();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runEnsure, { once: true });
    } else {
      runEnsure();
    }

    const mo = new MutationObserver(() => {
      if (!document.getElementById(ns.BUTTON_ROOT_ID)) runEnsure();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    lastSeenUrl = window.location.href;
    window.setInterval(() => {
      const cur = window.location.href;
      if (cur !== lastSeenUrl) {
        lastSeenUrl = cur;
        runEnsure();
      }
    }, 800);

    window.setInterval(() => {
      if (document.visibilityState === 'visible') runEnsure();
    }, 1200);

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') runEnsure();
    });
    window.addEventListener('pageshow', runEnsure);
  }

  ns.injectFloatingButton = injectFloatingButton;
  ns.initExportButton = initExportButton;
})();
