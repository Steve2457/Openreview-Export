(() => {
  const ns = window.__OR_EXPORT__;

  function extractTextWithMath(el) {
    function unwrapMathDelimiters(tex) {
      let s = String(tex ?? '').trim();
      if (!s) return '';

      let changed = true;
      while (changed) {
        changed = false;
        if (/^\$\$[\s\S]*\$\$$/.test(s)) {
          s = s.slice(2, -2).trim();
          changed = true;
          continue;
        }
        if (/^\$[\s\S]*\$$/.test(s)) {
          s = s.slice(1, -1).trim();
          changed = true;
          continue;
        }
        if (/^\\\([\s\S]*\\\)$/.test(s)) {
          s = s.slice(2, -2).trim();
          changed = true;
          continue;
        }
        if (/^\\\[[\s\S]*\\\]$/.test(s)) {
          s = s.slice(2, -2).trim();
          changed = true;
        }
      }
      return s;
    }

    function wrapMath(tex, isDisplay) {
      const core = unwrapMathDelimiters(tex);
      if (!core) return '';
      return isDisplay ? `\n\\[\n${core}\n\\]\n` : `\\(${core}\\)`;
    }

    function mathMlNodeToTex(node) {
      if (!node) return '';
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent || '').replace(/\s+/g, ' ').trim();
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes || []);
      const childTex = () => children.map((c) => mathMlNodeToTex(c)).join('');
      const grouped = (s) => {
        const t = (s || '').trim();
        if (!t) return '';
        return /^[a-zA-Z0-9]+$/.test(t) ? t : `{${t}}`;
      };

      if (tag === 'math' || tag === 'mrow' || tag === 'semantics') return childTex();
      if (tag === 'mstyle' || tag === 'mpadded' || tag === 'mphantom' || tag === 'menclose') {
        return childTex();
      }
      if (tag === 'mi' || tag === 'mn') return (node.textContent || '').trim();
      if (tag === 'mo') return (node.textContent || '').trim();
      if (tag === 'mtext') return `\\text{${(node.textContent || '').trim()}}`;

      if (tag === 'msub') {
        const base = grouped(mathMlNodeToTex(children[0]));
        const sub = grouped(mathMlNodeToTex(children[1]));
        return `${base}_{${sub}}`;
      }
      if (tag === 'msup') {
        const base = grouped(mathMlNodeToTex(children[0]));
        const sup = grouped(mathMlNodeToTex(children[1]));
        return `${base}^{${sup}}`;
      }
      if (tag === 'msubsup') {
        const base = grouped(mathMlNodeToTex(children[0]));
        const sub = grouped(mathMlNodeToTex(children[1]));
        const sup = grouped(mathMlNodeToTex(children[2]));
        return `${base}_{${sub}}^{${sup}}`;
      }
      if (tag === 'mfrac') {
        const num = mathMlNodeToTex(children[0]);
        const den = mathMlNodeToTex(children[1]);
        return `\\frac{${num}}{${den}}`;
      }
      if (tag === 'msqrt') return `\\sqrt{${childTex()}}`;
      if (tag === 'mroot') {
        const body = mathMlNodeToTex(children[0]);
        const root = mathMlNodeToTex(children[1]);
        return `\\sqrt[${root}]{${body}}`;
      }
      if (tag === 'mfenced') {
        const open = node.getAttribute('open') || '(';
        const close = node.getAttribute('close') || ')';
        const sep = node.getAttribute('separators') || ',';
        const inner = children
          .map((c) => mathMlNodeToTex(c))
          .filter(Boolean)
          .join(sep[0] || ',');
        return `${open}${inner}${close}`;
      }
      if (tag === 'munderover') {
        const base = grouped(mathMlNodeToTex(children[0]));
        const under = grouped(mathMlNodeToTex(children[1]));
        const over = grouped(mathMlNodeToTex(children[2]));
        return `${base}_{${under}}^{${over}}`;
      }
      if (tag === 'munder') {
        const base = grouped(mathMlNodeToTex(children[0]));
        const under = grouped(mathMlNodeToTex(children[1]));
        return `${base}_{${under}}`;
      }
      if (tag === 'mover') {
        const base = grouped(mathMlNodeToTex(children[0]));
        const over = grouped(mathMlNodeToTex(children[1]));
        return `${base}^{${over}}`;
      }
      if (tag === 'annotation' || tag === 'annotation-xml') return '';
      return childTex();
    }

    const texMap = new Map();
    try {
      const mjDoc = window.MathJax?.startup?.document;
      if (mjDoc) {
        let items;
        if (typeof mjDoc.math?.toArray === 'function') {
          items = mjDoc.math.toArray();
        } else {
          items = [];
          let node = mjDoc.math?.head;
          while (node) {
            if (node.data) items.push(node.data);
            else items.push(node);
            node = node.next;
          }
        }
        for (const item of items) {
          const root = item.typesetRoot ?? item.start?.node;
          if (root && item.math != null) {
            const payload = { tex: String(item.math), display: !!item.display };
            if (root.tagName?.toLowerCase?.() === 'mjx-container') {
              texMap.set(root, payload);
            }
            const containers = root.querySelectorAll?.('mjx-container');
            if (containers && containers.length) {
              containers.forEach((c) => texMap.set(c, payload));
            } else {
              texMap.set(root, payload);
            }
          }
        }
      }
    } catch (_) {}

    function decodeMjxGlyphText(mjxContainer) {
      const chars = [];
      const glyphNodes = mjxContainer.querySelectorAll('mjx-c');
      for (const glyph of glyphNodes) {
        const cls = glyph.getAttribute('class') || '';
        const m = cls.match(/\bmjx-c([0-9A-F]{2,6})\b/i);
        if (m) {
          const cp = parseInt(m[1], 16);
          if (Number.isFinite(cp) && cp > 0) {
            try {
              chars.push(String.fromCodePoint(cp));
              continue;
            } catch (_) {}
          }
        }
        const t = glyph.textContent;
        if (t) chars.push(t);
      }
      const s = chars.join('').replace(/\s+/g, ' ').trim();
      if (s) return s;
      return mjxContainer.innerText?.replace(/\s+/g, ' ').trim() || '';
    }

    const BLOCK_TAGS = new Set([
      'p',
      'div',
      'li',
      'tr',
      'td',
      'th',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'pre',
    ]);

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const tag = node.tagName.toLowerCase();
      if (tag === 'mjx-container') {
        const isDisplay = node.hasAttribute('display') || node.getAttribute('display') === 'true';
        const originalText = node.dataset?.originalText?.trim();
        if (originalText) return wrapMath(originalText, isDisplay);

        if (texMap.has(node)) {
          const { tex, display } = texMap.get(node);
          return wrapMath(tex, display);
        }

        const assistiveMml = node.querySelector('mjx-assistive-mml');
        if (assistiveMml) {
          const anns = assistiveMml.getElementsByTagName('annotation');
          for (const ann of anns) {
            if (ann.getAttribute('encoding') === 'application/x-tex') {
              const tex = ann.textContent.trim();
              if (tex) return wrapMath(tex, isDisplay);
            }
          }
          const mathNode = assistiveMml.querySelector('math');
          if (mathNode) {
            const texFromMathMl = mathMlNodeToTex(mathNode).trim();
            if (texFromMathMl) return wrapMath(texFromMathMl, isDisplay);
          }
        }

        const label = node.getAttribute('aria-label');
        if (label) return wrapMath(label, isDisplay);

        const mjxMath = node.querySelector('mjx-math');
        if (mjxMath) {
          const decoded = decodeMjxGlyphText(node);
          if (decoded) return wrapMath(decoded, isDisplay);
          const fallbackText = mjxMath.textContent?.replace(/\s+/g, ' ').trim();
          if (fallbackText) return wrapMath(fallbackText, isDisplay);
        }
        return '';
      }

      if (tag === 'mjx-assistive-mml') return '';

      if (tag === 'script') {
        if (node.type === 'math/tex') return `$${node.textContent.trim()}$`;
        if (node.getAttribute('type') === 'math/tex; mode=display') {
          return `\n$$${node.textContent.trim()}$$\n`;
        }
      }

      if (node.classList.contains('katex-mathml')) {
        const ann = node.querySelector('annotation[encoding="application/x-tex"]');
        if (ann) {
          const display = !!node.closest('.katex-display');
          return display ? `\n$$${ann.textContent.trim()}$$\n` : `$${ann.textContent.trim()}$`;
        }
      }
      if (node.classList.contains('katex-html')) return '';

      if (tag === 'br') return '\n';

      let text = '';
      for (const child of node.childNodes) text += walk(child);
      if (BLOCK_TAGS.has(tag)) text += '\n';
      return text;
    }

    return walk(el).replace(/\n{3,}/g, '\n\n').trim();
  }

  ns.extractTextWithMath = extractTextWithMath;
})();
