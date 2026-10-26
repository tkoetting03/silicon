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
  initSectionTitleHover();
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
   2. KaTeX Auto-Render Initializer (Bounded Retries & Math Detection)
   ========================================================================== */
function initKaTeXAutoRender(retries = 0) {
  const MAX_RETRIES = 20;

  // Only run if the document actually contains math delimiters or elements
  const bodyText = document.body ? document.body.textContent : '';
  const hasPotentialMath = bodyText.includes('$') || bodyText.includes('\\(') || bodyText.includes('\\[');
  if (!hasPotentialMath) return;

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
  } else if (retries < MAX_RETRIES) {
    setTimeout(() => initKaTeXAutoRender(retries + 1), 150);
  }
}

/* ==========================================================================
   3. BibTeX Modal & Copy Action (Guarded Clipboard & Escape Handling)
   ========================================================================== */
function initBibTeXModal() {
  const modal = document.getElementById('bibtex-modal');
  const openBtns = document.querySelectorAll('[data-open-bibtex]');
  const closeBtn = document.getElementById('bibtex-close-btn');
  const copyBtn = document.getElementById('bibtex-copy-btn');
  const codeElem = document.getElementById('bibtex-code');

  if (!modal) return;

  const closeModal = () => modal.classList.remove('open');

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('open');
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  if (copyBtn && codeElem) {
    copyBtn.addEventListener('click', () => {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(codeElem.textContent)
        .then(() => {
          const origText = copyBtn.textContent;
          copyBtn.textContent = '✓ Copied to Clipboard';
          setTimeout(() => { copyBtn.textContent = origText; }, 2000);
        })
        .catch(err => {
          console.warn('Clipboard write rejected:', err);
        });
    });
  }
}

/* ==========================================================================
   4. TeX Terminal Compilation Simulator (Cancellable Timer Leak Fix)
   ========================================================================== */
function initTerminalRecompile() {
  const recompileBtns = document.querySelectorAll('[data-recompile-tex]');
  const modal = document.getElementById('recompile-modal');
  const logElem = document.getElementById('recompile-log');
  const closeBtn = document.getElementById('recompile-close-btn');

  if (!modal || !logElem) return;

  let activeTimer = null;

  const stopCompilation = () => {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    modal.classList.remove('open');
  };

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
      stopCompilation();
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
          activeTimer = setTimeout(printNextLine, lineIdx > 16 ? 40 : 25);
        } else {
          const finished = document.createElement('div');
          finished.style.color = '#58a6ff';
          finished.style.marginTop = '0.5rem';
          finished.innerHTML = '<strong>[OK] Document typeset successfully.</strong>';
          logElem.appendChild(finished);

          const sheet = document.querySelector('.paper-sheet');
          if (sheet) {
            sheet.style.opacity = '0.4';
            activeTimer = setTimeout(() => { sheet.style.opacity = '1'; }, 180);
          }
        }
      }
      printNextLine();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', stopCompilation);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) stopCompilation();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      stopCompilation();
    }
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
   6. Section Title Hover: Precomputed Spatial Proximity Map (Zero Layout Thrashing)
   ========================================================================== */
function initSectionTitleHover() {
  const prose = document.querySelector('.latex-cohesive-prose');
  if (!prose) return;

  const links = Array.from(prose.querySelectorAll('.flow-highlight-link'));
  const words = Array.from(prose.querySelectorAll('.lorem-phrase'));
  if (!links.length || !words.length) return;

  // Distance thresholds in pixels
  const DIST_ABOVE = 36;
  const DIST_BELOW = 36;
  const DIST_RIGHT = 220;
  const HORIZ_PAD  = 60;

  // Cached map of link element -> array of nearby word elements
  const proximityMap = new Map();

  function computeLayoutMap() {
    proximityMap.clear();

    const wordMetrics = words.map(word => ({
      el: word,
      rect: word.getBoundingClientRect()
    }));

    links.forEach(link => {
      const titleRect = link.getBoundingClientRect();
      const nearWords = [];

      wordMetrics.forEach(({ el, rect: wRect }) => {
        if (wRect.width === 0 && wRect.height === 0) return;

        const wCenterX = (wRect.left + wRect.right) / 2;
        const wCenterY = (wRect.top + wRect.bottom) / 2;

        // 1. To the right on the same line:
        const isSameLine = (wCenterY >= titleRect.top - 6) && (wCenterY <= titleRect.bottom + 6);
        const isRight = isSameLine && (wRect.left >= titleRect.right - 8) && (wRect.left <= titleRect.right + DIST_RIGHT);

        // 2. Directly above (line above the title):
        const isAbove = (wCenterY < titleRect.top - 2) && (wCenterY >= titleRect.top - DIST_ABOVE) &&
                        (wCenterX >= titleRect.left - 20) && (wRect.left <= titleRect.right + HORIZ_PAD);

        // 3. Directly below (line below the title):
        const isBelow = (wCenterY > titleRect.bottom + 2) && (wCenterY <= titleRect.bottom + DIST_BELOW) &&
                        (wCenterX >= titleRect.left - 20) && (wRect.left <= titleRect.right + HORIZ_PAD);

        if (isRight || isAbove || isBelow) {
          nearWords.push(el);
        }
      });

      proximityMap.set(link, nearWords);
    });
  }

  // Precompute on load
  computeLayoutMap();

  // Recompute only on debounced window resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(computeLayoutMap, 150);
  }, { passive: true });

  // Pure O(1) class toggle on hover: 0 getBoundingClientRect calls during interaction!
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const targets = proximityMap.get(link) || [];
      targets.forEach(w => w.classList.add('dimmed'));
    });

    link.addEventListener('mouseleave', () => {
      const targets = proximityMap.get(link) || [];
      targets.forEach(w => w.classList.remove('dimmed'));
    });
  });
}
