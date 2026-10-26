/**
 * SILICON — Minimalist Interactive LaTeX Website
 * Author: Thomas Koetting (tkoetting03)
 */

document.addEventListener('DOMContentLoaded', () => {
  initDocumentSettings();
  initKaTeXAutoRender();
  initBibTeXModal();
  initTerminalRecompile();
  initOpampAccordion();
  initLocalGhostHover();
});

/* ==========================================================================
   1. Document Initialization (Pure White Background, Left-Aligned Flow)
   ========================================================================== */
function initDocumentSettings() {
  const root = document.documentElement;
  root.setAttribute('data-theme', 'paper');
  root.setAttribute('data-layout', 'onecolumn');
}

/* ==========================================================================
   2. KaTeX Auto-Render Initializer
   ========================================================================== */
function initKaTeXAutoRender() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
    initLocalGhostHover();
  } else {
    setTimeout(initKaTeXAutoRender, 150);
  }
}

/* ==========================================================================
   3. BibTeX Modal & Copy Action
   ========================================================================== */
function initBibTeXModal() {
  const modal = document.getElementById('bibtex-modal');
  const openBtns = document.querySelectorAll('[data-open-bibtex]');
  const closeBtn = document.getElementById('bibtex-close-btn');
  const copyBtn = document.getElementById('bibtex-copy-btn');
  const codeElem = document.getElementById('bibtex-code');

  if (!modal) return;

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('open');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  if (copyBtn && codeElem) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeElem.textContent).then(() => {
        const origText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied to Clipboard';
        setTimeout(() => { copyBtn.textContent = origText; }, 2000);
      });
    });
  }
}

/* ==========================================================================
   4. TeX Terminal Compilation Simulator ("Recompile")
   ========================================================================== */
function initTerminalRecompile() {
  const recompileBtns = document.querySelectorAll('[data-recompile-tex]');
  const modal = document.getElementById('recompile-modal');
  const logElem = document.getElementById('recompile-log');
  const closeBtn = document.getElementById('recompile-close-btn');

  if (!modal || !logElem) return;

  const LOG_LINES = [
    "This is pdfTeX, Version 3.141592653-2.6-1.40.24 (TeX Live 2026/Mac)",
    "entering extended mode",
    "(./silicon.tex",
    "LaTeX2e <2026-06-01> patch level 2",
    "L3 programming layer <2026-05-18>",
    "(/usr/local/texlive/2026/texmf-dist/tex/latex/base/article.cls",
    "Document Class: article 2024/02/08 v1.4n Standard LaTeX document class",
    "Loading font Computer Modern Roman 10pt [cmr10] ... done",
    "Loading KaTeX mathematical engine v0.16.9 ... done",
    ")",
    "(Projects ... ok)",
    "(Operational Amplifier ... ok)",
    "(Can Non-Cooperative Game Theory Assist Modeling ... ok)",
    "(Artificial Intelligence ... ok)",
    "(Quotes of Note ... ok)",
    "(Favorites ... ok)",
    "(Project Files ... ok)",
    "(Socials ... ok)",
    "Output written on silicon.pdf (typeset complete).",
    "Transcript written on silicon.log.",
    "Typeset finished in 24ms with 0 errors, 0 warnings."
  ];

  recompileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('open');
      logElem.innerHTML = '';
      let lineIdx = 0;

      function printNextLine() {
        if (lineIdx < LOG_LINES.length) {
          const div = document.createElement('div');
          div.textContent = LOG_LINES[lineIdx];
          logElem.appendChild(div);
          logElem.scrollTop = logElem.scrollHeight;
          lineIdx++;
          setTimeout(printNextLine, lineIdx > 16 ? 40 : 25);
        } else {
          const finished = document.createElement('div');
          finished.style.color = '#58a6ff';
          finished.style.marginTop = '0.5rem';
          finished.innerHTML = '<strong>[OK] Document typeset successfully.</strong>';
          logElem.appendChild(finished);

          const sheet = document.querySelector('.paper-sheet');
          if (sheet) {
            sheet.style.opacity = '0.4';
            setTimeout(() => { sheet.style.opacity = '1'; }, 180);
          }
        }
      }
      printNextLine();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
}

/* ==========================================================================
   5. Expandable Op Amp Accordion Badge & Hash Handler
   ========================================================================== */
function initOpampAccordion() {
  const details = document.getElementById('opamp-details');
  const badge = document.getElementById('opamp-toggle-text');
  if (!details || !badge) return;

  const updateBadge = () => {
    badge.textContent = details.open ? 'Close' : 'Read';
  };

  details.addEventListener('toggle', updateBadge);

  if (window.location.hash === '#opamp' || window.location.hash === '#opamp-details') {
    details.open = true;
    updateBadge();
    setTimeout(() => {
      details.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}

/* ==========================================================================
   6. Localized Area Hover for Landing Page Filler Text
   ========================================================================== */
function initLocalGhostHover() {
  const container = document.querySelector('.latex-prose-container');
  if (!container || container.dataset.tokensInitialized) return;

  const ghosts = container.querySelectorAll('.lorem-ghost');
  if (!ghosts.length) return;

  container.dataset.tokensInitialized = 'true';

  // Wrap text nodes in span.lorem-token (preserving KaTeX formulas)
  function tokenizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text.trim()) return;
      const parts = text.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      for (const part of parts) {
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else if (part.length > 0) {
          const span = document.createElement('span');
          span.className = 'lorem-token';
          span.textContent = part;
          frag.appendChild(span);
        }
      }
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList.contains('katex')) {
        node.classList.add('lorem-token');
      } else {
        Array.from(node.childNodes).forEach(tokenizeNode);
      }
    }
  }

  ghosts.forEach(g => {
    tokenizeNode(g);
    g.classList.add('tokens-ready');
  });

  const tokens = Array.from(container.querySelectorAll('.lorem-token'));
  let tokenBounds = [];

  function updateBounds() {
    tokenBounds = tokens.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2
      };
    });
  }

  // Calculate center coordinates for proximity detection
  setTimeout(updateBounds, 120);
  window.addEventListener('resize', updateBounds, { passive: true });
  window.addEventListener('scroll', updateBounds, { passive: true });

  const RADIUS_CORE = 45; // px for primary highlight (0.55 opacity)
  const RADIUS_SOFT = 85; // px for secondary falloff (0.38 opacity)
  let activeTokens = new Set();
  let rafId = null;

  container.addEventListener('mousemove', (e) => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const mx = e.clientX;
      const my = e.clientY;
      const nextActive = new Set();

      for (let i = 0; i < tokenBounds.length; i++) {
        const item = tokenBounds[i];
        const dx = mx - item.cx;
        const dy = my - item.cy;
        const distSq = dx * dx + dy * dy;

        if (distSq < RADIUS_CORE * RADIUS_CORE) {
          item.el.classList.add('proximity-core');
          item.el.classList.remove('proximity-soft');
          nextActive.add(item.el);
        } else if (distSq < RADIUS_SOFT * RADIUS_SOFT) {
          item.el.classList.add('proximity-soft');
          item.el.classList.remove('proximity-core');
          nextActive.add(item.el);
        }
      }

      for (const el of activeTokens) {
        if (!nextActive.has(el)) {
          el.classList.remove('proximity-core', 'proximity-soft');
        }
      }
      activeTokens = nextActive;
    });
  });

  container.addEventListener('mouseleave', () => {
    if (rafId) cancelAnimationFrame(rafId);
    for (const el of activeTokens) {
      el.classList.remove('proximity-core', 'proximity-soft');
    }
    activeTokens.clear();
  });
}
