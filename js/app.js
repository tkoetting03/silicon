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
  initCvScrollReveal();
  initPageTransitions();
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
let proseResizeListenerAttached = false;
let activeProseCompute = null;

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

  activeProseCompute = computeLayoutMap;
  computeLayoutMap();

  // Recompute when web fonts finish loading & rendering
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => activeProseCompute && activeProseCompute());
  }

  // Recompute on debounced window resize
  if (!proseResizeListenerAttached) {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => activeProseCompute && activeProseCompute(), 150);
    }, { passive: true });
    proseResizeListenerAttached = true;
  }

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
let smoothScrollListenerAttached = false;
function initSmoothResumeScroll() {
  if (smoothScrollListenerAttached) return;
  smoothScrollListenerAttached = true;

  let activeRafId = null;
  let activeCancelCleanup = null;

  function smoothScrollToElement(target, duration = 750) {
    if (!target) return;

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

    const prevScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    const startTime = performance.now();
    let isCancelled = false;

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
        if (history.pushState) {
          history.pushState(null, '', '#' + (target.id || 'cv'));
        }
      }
    }

    activeRafId = requestAnimationFrame(step);
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#cv"], a[href="#resume"], a[href$="#cv"], a[href$="#resume"]');
    if (!link) return;

    const target = document.getElementById('cv') || document.getElementById('resume');
    if (target) {
      e.preventDefault();
      target.classList.add('is-revealed');
      smoothScrollToElement(target, 750);
    }
  });
}

/* ==========================================================================
   8. Bottom CV Scroll-Reveal Opacity Handler (50% Idle -> 100% On Scroll)
   ========================================================================== */
let cvScrollListenerAttached = false;
function initCvScrollReveal() {
  const cvSection = document.getElementById('cv') || document.querySelector('.resume-section');
  if (!cvSection) return;

  const SCROLL_THRESHOLD = 50;

  function updateCvOpacity() {
    const sec = document.getElementById('cv') || document.querySelector('.resume-section');
    if (!sec) return;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY > SCROLL_THRESHOLD) {
      sec.classList.add('is-revealed');
    } else {
      sec.classList.remove('is-revealed');
    }
  }

  if (!cvScrollListenerAttached) {
    window.addEventListener('scroll', updateCvOpacity, { passive: true });
    cvScrollListenerAttached = true;
  }
  updateCvOpacity();
}

/* ==========================================================================
   9. Seamless Shared-Element Page Transitions (Hybrid Tier 1 & Tier 2)
   ========================================================================== */
const pageCache = new Map();
const scrollPositions = new Map();
let isTransitioning = false;
let lastActiveSection = null;

function reinitializePageComponents() {
  initDocumentSettings();
  initKaTeXAutoRender();
  initBibTeXModal();
  initTerminalRecompile();
  initOpampAccordion();
  initSectionTitleHover();
  initCvScrollReveal();
}

function getSectionNameFromUrl(urlStr) {
  try {
    const url = new URL(urlStr, window.location.href);
    const filename = url.pathname.split('/').pop().toLowerCase();
    if (filename === 'favorites.html') return 'favorites';
    if (filename === 'projectfiles.html') return 'projectfiles';
    if (filename === 'projects.html') return 'projects';
    if (filename === 'quotes.html') return 'quotes';
    if (filename === 'paper.html') return 'paper';
    if (filename === 'socials.html') return 'socials';
  } catch (e) {}
  return null;
}

function prefetchPage(urlStr) {
  try {
    const url = new URL(urlStr, window.location.href);
    if (url.origin !== window.location.origin) return;
    const path = url.pathname;
    if (pageCache.has(path)) return;
    fetch(url.href)
      .then(res => res.ok ? res.text() : null)
      .then(html => {
        if (html) pageCache.set(path, html);
      })
      .catch(() => {});
  } catch (e) {}
}

async function navigateToPage(targetUrl, options = {}) {
  if (isTransitioning) return;

  const targetPath = new URL(targetUrl, window.location.href).pathname;
  const currentPath = window.location.pathname;
  if (targetPath === currentPath) return;

  const isBack = options.isBack || targetPath.endsWith('index.html') || targetPath === '/' || targetPath.endsWith('/');
  const isPopState = options.isPopState || false;

  // Determine active section name for shared element morph
  let section = options.section || null;
  if (!section) {
    if (isBack) {
      section = lastActiveSection || getSectionNameFromUrl(window.location.href) || document.querySelector('.article-title')?.dataset.section || null;
    } else {
      section = getSectionNameFromUrl(targetUrl);
    }
  }

  isTransitioning = true;
  scrollPositions.set(currentPath, window.scrollY);

  try {
    // 1. Fetch HTML from cache or network
    let html = pageCache.get(targetPath);
    if (!html) {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error('Fetch failed: ' + res.status);
      html = await res.text();
      pageCache.set(targetPath, html);
    }

    // 2. Parse destination document
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(html, 'text/html');
    const newMain = newDoc.querySelector('main.paper-outer-wrapper');
    const newTitle = newDoc.title || document.title;

    if (!newMain) {
      window.location.href = targetUrl;
      return;
    }

    if (section) {
      lastActiveSection = section;
    }

    // 3. Execution via View Transitions API (Tier 1 & Tier 2 Primary)
    const supportsViewTransition = typeof document.startViewTransition === 'function';

    if (supportsViewTransition) {
      // Dynamic scoping: Ensure ONLY the active section pair has view-transition-name
      // so other links fade naturally with the surrounding editorial prose
      const currentLinks = document.querySelectorAll('.flow-highlight-link[data-section]');
      currentLinks.forEach(link => {
        if (section && link.dataset.section === section) {
          link.style.viewTransitionName = `section-heading-${section}`;
        } else {
          link.style.viewTransitionName = 'none';
        }
      });

      const currentH1 = document.querySelector('.article-title');
      if (currentH1) {
        if (section && (currentH1.dataset.section === section || (!currentH1.dataset.section && isBack))) {
          currentH1.style.viewTransitionName = `section-heading-${section}`;
        } else {
          currentH1.style.viewTransitionName = 'none';
        }
      }

      // Prepare destination DOM elements
      const newLinks = newMain.querySelectorAll('.flow-highlight-link[data-section]');
      newLinks.forEach(link => {
        if (section && link.dataset.section === section) {
          link.style.viewTransitionName = `section-heading-${section}`;
        } else {
          link.style.viewTransitionName = 'none';
        }
      });

      const newH1 = newMain.querySelector('.article-title');
      if (newH1) {
        if (section && (newH1.dataset.section === section || !isBack)) {
          newH1.style.viewTransitionName = `section-heading-${section}`;
        } else {
          newH1.style.viewTransitionName = 'none';
        }
      }

      const transition = document.startViewTransition(() => {
        document.title = newTitle;
        if (!isPopState) {
          history.pushState({ path: targetUrl, section }, '', targetUrl);
        }
        const currentMain = document.querySelector('main.paper-outer-wrapper');
        if (currentMain) {
          currentMain.replaceWith(newMain);
        }

        const targetScrollY = isBack ? (scrollPositions.get(targetPath) || 0) : 0;
        window.scrollTo(0, targetScrollY);
        reinitializePageComponents();
      });

      await transition.finished;

      // Clean up temporary inline viewTransitionNames, reverting to stylesheet
      document.querySelectorAll('[data-section]').forEach(el => {
        el.style.viewTransitionName = '';
      });

      // Accessibility focus routing
      const targetFocusElem = isBack
        ? (section ? document.querySelector(`.flow-highlight-link[data-section="${section}"]`) : null) || document.querySelector('.article-title')
        : document.querySelector('.article-title');

      if (targetFocusElem) {
        targetFocusElem.setAttribute('tabindex', '-1');
        targetFocusElem.focus({ preventScroll: true });
      }

    } else {
      // Tier 2 Fallback: FLIP / Clone Transition for browsers without View Transitions API
      const sourceElem = isBack
        ? document.querySelector('.article-title')
        : (section ? document.querySelector(`.flow-highlight-link[data-section="${section}"]`) : null);

      const targetSelector = isBack
        ? (section ? `.flow-highlight-link[data-section="${section}"]` : '.article-title')
        : '.article-title';

      const srcRect = sourceElem ? sourceElem.getBoundingClientRect() : null;
      const srcStyle = sourceElem ? window.getComputedStyle(sourceElem) : null;

      let clone = null;
      if (sourceElem && srcRect && typeof sourceElem.animate === 'function') {
        clone = document.createElement('div');
        clone.textContent = sourceElem.textContent;
        clone.className = 'transition-heading-clone';
        Object.assign(clone.style, {
          position: 'fixed',
          top: srcRect.top + 'px',
          left: srcRect.left + 'px',
          width: srcRect.width + 'px',
          height: srcRect.height + 'px',
          fontFamily: srcStyle.fontFamily,
          fontSize: srcStyle.fontSize,
          fontWeight: srcStyle.fontWeight,
          letterSpacing: srcStyle.letterSpacing,
          lineHeight: srcStyle.lineHeight,
          color: srcStyle.color,
          margin: '0',
          padding: '0',
          zIndex: '10000',
          pointerEvents: 'none',
          transformOrigin: 'top left',
          boxSizing: 'border-box'
        });
        document.body.appendChild(clone);
        sourceElem.style.visibility = 'hidden';
      }

      newMain.style.opacity = '0';
      const currentMain = document.querySelector('main.paper-outer-wrapper');
      if (currentMain) {
        currentMain.replaceWith(newMain);
      }
      document.title = newTitle;
      if (!isPopState) {
        history.pushState({ path: targetUrl, section }, '', targetUrl);
      }

      const targetScrollY = isBack ? (scrollPositions.get(targetPath) || 0) : 0;
      window.scrollTo(0, targetScrollY);
      reinitializePageComponents();

      const destElem = document.querySelector(targetSelector);
      if (clone && destElem && typeof destElem.animate === 'function') {
        const destRect = destElem.getBoundingClientRect();
        destElem.style.visibility = 'hidden';

        const deltaX = destRect.left - srcRect.left;
        const deltaY = destRect.top - srcRect.top;
        const scaleX = destRect.width / srcRect.width;
        const scaleY = destRect.height / srcRect.height;

        const cloneAnim = clone.animate([
          { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1 },
          { transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`, opacity: 1 }
        ], {
          duration: 380,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
          fill: 'forwards'
        });

        newMain.animate([
          { opacity: 0 },
          { opacity: 1 }
        ], {
          duration: 320,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
          fill: 'forwards'
        });

        await cloneAnim.finished;
        clone.remove();
        destElem.style.visibility = '';
        newMain.style.opacity = '1';
        destElem.setAttribute('tabindex', '-1');
        destElem.focus({ preventScroll: true });
      } else {
        if (clone) clone.remove();
        newMain.style.opacity = '1';
        if (destElem) {
          destElem.setAttribute('tabindex', '-1');
          destElem.focus({ preventScroll: true });
        }
      }
    }

  } catch (err) {
    console.error('Transition error, falling back to standard navigation:', err);
    window.location.href = targetUrl;
  } finally {
    isTransitioning = false;
  }
}

function initPageTransitions() {
  if (document.documentElement) {
    pageCache.set(window.location.pathname, document.documentElement.outerHTML);
  }

  const currentH1 = document.querySelector('.article-title');
  if (currentH1 && currentH1.dataset.section) {
    lastActiveSection = currentH1.dataset.section;
  }

  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;
    if (link.origin === window.location.origin) {
      prefetchPage(link.href);
    }
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    if (link.hasAttribute('download') || link.getAttribute('target') === '_blank') {
      return;
    }

    if (!link.href.startsWith('http://') && !link.href.startsWith('https://')) {
      return;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return;
    }

    if (url.pathname === window.location.pathname && url.hash) {
      return;
    }

    const isTargetIndex = url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/');
    const isCurrentIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    const targetSection = getSectionNameFromUrl(url.href);

    if ((isCurrentIndex && targetSection) || (!isCurrentIndex && isTargetIndex) || targetSection) {
      e.preventDefault();
      const isBack = link.classList.contains('tex-back-link') || isTargetIndex;
      const section = link.dataset.section || targetSection || lastActiveSection;
      navigateToPage(link.href, { isBack, section });
    }
  });

  window.addEventListener('popstate', (e) => {
    const currentPath = window.location.pathname;
    const isTargetIndex = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');
    const section = (e.state && e.state.section) || lastActiveSection || getSectionNameFromUrl(window.location.href);
    navigateToPage(window.location.href, {
      isPopState: true,
      isBack: isTargetIndex,
      section
    });
  });
}

