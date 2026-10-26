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
   6. Section Title Hover: Fade words within a small fixed distance
      (above, below, and to the right) to 10% opacity
   ========================================================================== */
function initSectionTitleHover() {
  const prose = document.querySelector('.latex-cohesive-prose');
  if (!prose) return;

  const links = prose.querySelectorAll('.flow-highlight-link');
  const words = prose.querySelectorAll('.lorem-phrase');
  if (!links.length || !words.length) return;

  // Small fixed spatial distance thresholds in pixels
  const DIST_ABOVE = 36;  // up to 1 line height above the title
  const DIST_BELOW = 36;  // up to 1 line height below the title
  const DIST_RIGHT = 220; // small fixed horizontal distance to the right on the same line
  const HORIZ_PAD  = 60;  // horizontal extension past title right edge for above/below lines

  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const titleRect = link.getBoundingClientRect();

      words.forEach(word => {
        const wRect = word.getBoundingClientRect();
        if (wRect.width === 0 && wRect.height === 0) return;

        const wCenterX = (wRect.left + wRect.right) / 2;
        const wCenterY = (wRect.top + wRect.bottom) / 2;

        let isNear = false;

        // 1. To the right on the same line:
        const isSameLine = (wCenterY >= titleRect.top - 6) && (wCenterY <= titleRect.bottom + 6);
        if (isSameLine && (wRect.left >= titleRect.right - 8) && (wRect.left <= titleRect.right + DIST_RIGHT)) {
          isNear = true;
        }

        // 2. Directly above (line above the title):
        const isAbove = (wCenterY < titleRect.top - 2) && (wCenterY >= titleRect.top - DIST_ABOVE);
        if (isAbove && (wCenterX >= titleRect.left - 20) && (wRect.left <= titleRect.right + HORIZ_PAD)) {
          isNear = true;
        }

        // 3. Directly below (line below the title):
        const isBelow = (wCenterY > titleRect.bottom + 2) && (wCenterY <= titleRect.bottom + DIST_BELOW);
        if (isBelow && (wCenterX >= titleRect.left - 20) && (wRect.left <= titleRect.right + HORIZ_PAD)) {
          isNear = true;
        }

        if (isNear) {
          word.classList.add('dimmed');
        }
      });
    });

    link.addEventListener('mouseleave', () => {
      words.forEach(word => word.classList.remove('dimmed'));
    });
  });
}
