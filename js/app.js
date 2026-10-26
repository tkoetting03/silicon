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
  initSmoothResumeScroll();
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
   6. Section Title Hover: Precomputed Spatial Proximity Map with Fallback
   ========================================================================== */
function initSectionTitleHover() {
  const prose = document.querySelector('.latex-cohesive-prose');
  if (!prose) return;

  const links = Array.from(prose.querySelectorAll('.flow-highlight-link'));
  const words = Array.from(prose.querySelectorAll('.lorem-phrase'));
  if (!links.length || !words.length) return;

  // Cached map of link element -> array of nearby word elements
  const proximityMap = new Map();

  function computeForLink(link) {
    const titleRect = link.getBoundingClientRect();
    const titleCenterY = (titleRect.top + titleRect.bottom) / 2;
    const nearWords = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wRect = word.getBoundingClientRect();
      if (wRect.width === 0 && wRect.height === 0) continue;

      const wCenterX = (wRect.left + wRect.right) / 2;
      const wCenterY = (wRect.top + wRect.bottom) / 2;
      const diffY = wCenterY - titleCenterY;

      // 1. Same line: to the right of the section title
      const isSameLine = Math.abs(diffY) <= 16;
      const isRight = isSameLine && (wRect.left >= titleRect.right - 12) && (wRect.left <= titleRect.right + 250);

      // 2. Line directly above (within 1 line height above title)
      const isAbove = (diffY >= -44 && diffY < -14) &&
                      (wRect.right >= titleRect.left - 15) && (wRect.left <= titleRect.right + 75);

      // 3. Line directly below (within 1 line height below title)
      const isBelow = (diffY > 14 && diffY <= 44) &&
                      (wRect.right >= titleRect.left - 15) && (wRect.left <= titleRect.right + 75);

      if (isRight || isAbove || isBelow) {
        nearWords.push(word);
      }
    }
    return nearWords;
  }

  function computeLayoutMap() {
    proximityMap.clear();
    links.forEach(link => {
      proximityMap.set(link, computeForLink(link));
    });
  }

  // Precompute on load
  computeLayoutMap();

  // Recompute when web fonts finish loading & rendering
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(computeLayoutMap);
  }

  // Recompute when window fully loads
  window.addEventListener('load', computeLayoutMap);

  // Recompute on debounced window resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(computeLayoutMap, 150);
  }, { passive: true });

  // Attach hover listeners
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      let targets = proximityMap.get(link);
      if (!targets || targets.length === 0) {
        targets = computeForLink(link);
        proximityMap.set(link, targets);
      }
      targets.forEach(w => w.classList.add('dimmed'));
    });

    link.addEventListener('mouseleave', () => {
      words.forEach(w => w.classList.remove('dimmed'));
    });
  });
}

/* ==========================================================================
   7. Smooth Scroll Handler for "CV" / "Resume" in-page anchor (RAF-driven easeInOut)
   ========================================================================== */
function initSmoothResumeScroll() {
  let activeRafId = null;
  let activeCancelCleanup = null;

  function smoothScrollToElement(target, duration = 750) {
    if (!target) return;

    // Cancel any ongoing smooth scroll animation
    if (activeRafId) {
      cancelAnimationFrame(activeRafId);
      activeRafId = null;
    }
    if (activeCancelCleanup) {
      activeCancelCleanup();
      activeCancelCleanup = null;
    }

    const startY = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = Math.max(0, target.getBoundingClientRect().top + startY - 24);
    const diff = targetY - startY;
    if (Math.abs(diff) < 2) return;

    // Temporarily bypass CSS scroll-behavior so RAF steps are not double-smoothed
    const prevScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    const startTime = performance.now();
    let isCancelled = false;

    // Cancel animation gracefully if user manually interacts with wheel, touch, or keys
    const cancelEvents = ['wheel', 'touchmove', 'keydown'];
    const onUserCancel = () => {
      isCancelled = true;
      cleanup();
    };

    const cleanup = () => {
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
      cancelEvents.forEach(evt => window.removeEventListener(evt, onUserCancel));
      activeRafId = null;
      activeCancelCleanup = null;
    };

    activeCancelCleanup = cleanup;
    cancelEvents.forEach(evt => window.addEventListener(evt, onUserCancel, { passive: true, once: true }));

    // Custom cubic ease-in-out curve
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(currentTime) {
      if (isCancelled) return;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, Math.round(startY + diff * ease));

      if (progress < 1) {
        activeRafId = requestAnimationFrame(step);
      } else {
        cleanup();
        // Update URL hash only AFTER smooth scroll reaches destination to prevent Safari instant-jump
        if (history.pushState) {
          history.pushState(null, '', '#' + (target.id || 'cv'));
        }
      }
    }

    activeRafId = requestAnimationFrame(step);
  }

  // Handle both delegated clicks and direct listeners
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#cv"], a[href="#resume"], a[href$="#cv"], a[href$="#resume"]');
    if (!link) return;

    const target = document.getElementById('cv') || document.getElementById('resume');
    if (target) {
      e.preventDefault();
      smoothScrollToElement(target, 750);
    }
  });
}
