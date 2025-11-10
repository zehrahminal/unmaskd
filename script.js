// script.js — restored scroll-reveal + nav highlight + existing behaviours (slideshow, modal, panic exit, FAQ, contact)
// Replace your existing script.js with this file and hard-refresh the page (Ctrl+Shift+R).

(function () {
  'use strict';

  // Early injection of reveal CSS so .glide-bottom has a predictable visible state when we add .in-view.
  // This runs immediately when the script is parsed.
  (function injectRevealCSS() {
    if (document.querySelector('style[data-generated-by="script.js-reveal"]')) return;
    const css = `
      /* Reveal helper for glide-bottom elements (inserted by script.js) */
      .glide-bottom { opacity: 0; transform: translateY(18px); transition: opacity .55s ease, transform .55s ease; will-change: opacity, transform; }
      .glide-bottom.in-view { opacity: 1; transform: none; }
      /* Ensure visible state for sections used as fallback */
      section.visible .glide-bottom { opacity: 1; transform: none; }
      /* Donation modal show helper */
      #donateModal.show { display: block; }
    `;
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-generated-by', 'script.js-reveal');
    styleEl.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(styleEl);
  })();

  console.log('script.js loaded');

  // Global error handler to surface issues in console
  window.addEventListener('error', function (ev) {
    console.error('Uncaught error:', ev.message, ev.error);
  });

  // Safe-run wrapper to prevent one failing block from breaking everything
  function safeRun(name, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`Error in ${name}:`, err);
    }
  }

  // Utility: force reveal an element via inline styles (override conflicting CSS)
  function forceRevealElement(el) {
    try {
      el.classList.add('in-view');
      // Inline styles take precedence over stylesheet rules and help when CSS has !important
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.transition = el.style.transition || 'opacity .45s ease, transform .45s ease';
    } catch (e) { /* ignore */ }
  }

  // Throttle helper
  function throttle(fn, wait = 150) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');

    /* -------------------------
       SCROLL REVEAL (IntersectionObserver)
       - Adds .in-view to .glide-bottom elements (staggered)
       - Adds .visible to sections for CSS fallbacks
       - Safety nets force-reveal if something remains hidden
       ------------------------- */
    safeRun('initScrollReveal', function initScrollReveal() {
      const sections = Array.from(document.querySelectorAll('section'));
      const glideAll = Array.from(document.querySelectorAll('.glide-bottom'));
      console.debug('ScrollReveal: found', glideAll.length, '.glide-bottom elements and', sections.length, 'sections');

      function revealSectionChildren(section) {
        const glideEls = Array.from(section.querySelectorAll('.glide-bottom'));
        glideEls.forEach((el, i) => {
          setTimeout(() => {
            el.classList.add('in-view');
            // Also set inline styles to ensure visibility if stylesheet is aggressive
            forceRevealElement(el);
          }, i * 90);
        });
      }

      function runRolloutCounters(section) {
        if (!section) return;
        const counters = Array.from(section.querySelectorAll('.count-up'));
        counters.forEach(counter => {
          if (counter.dataset.animated) return;
          counter.dataset.animated = '1';
          const target = Math.max(0, +counter.dataset.target || 0);
          let current = 0;
          const duration = 900;
          const frames = Math.max(8, Math.round(duration / 16));
          const increment = target / frames;
          function update() {
            current += increment;
            if (current < target) {
              counter.textContent = Math.floor(current);
              requestAnimationFrame(update);
            } else {
              counter.textContent = target;
            }
          }
          requestAnimationFrame(update);
        });
      }

      if ('IntersectionObserver' in window && sections.length) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const section = entry.target;
              section.classList.add('visible');
              revealSectionChildren(section);
              if (section.id === 'rollout') runRolloutCounters(section);
              obs.unobserve(section);
            }
          });
        }, {
          root: null,
          rootMargin: '0px 0px -12% 0px',
          threshold: 0.12
        });

        sections.forEach(s => observer.observe(s));
        console.log('Scroll reveal initialized with IntersectionObserver');
      } else {
        // Fallback: reveal everything immediately
        glideAll.forEach(el => forceRevealElement(el));
        const rollout = document.getElementById('rollout');
        if (rollout) runRolloutCounters(rollout);
        console.log('IntersectionObserver not supported — revealed all glide-bottom elements');
      }

      // Safety net: after a short delay, force-reveal any remaining hidden elements and log a diagnostic message
      setTimeout(() => {
        const stillHidden = Array.from(document.querySelectorAll('.glide-bottom')).filter(el => {
          try {
            const cs = window.getComputedStyle(el);
            return cs && (cs.opacity === '0' || cs.display === 'none' || cs.visibility === 'hidden');
          } catch (e) { return false; }
        });
        if (stillHidden.length) {
          console.warn('Some .glide-bottom elements remain hidden after reveal. Forcing visibility for all to avoid broken UI.');
          stillHidden.forEach(forceRevealElement);
        }
      }, 1200);
    });

    /* -------------------------
       NAV: smooth scrolling + active link highlighting
       ------------------------- */
    safeRun('initNavBehavior', function initNavBehavior() {
      const header = document.querySelector('.byteback-header');
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const navLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
      const sections = Array.from(document.querySelectorAll('section[id]'));

      function smoothScrollTo(targetEl) {
        if (!targetEl) return;
        const rect = targetEl.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - Math.round(headerHeight) - 12;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }

      navLinks.forEach(a => {
        if (a.dataset.navBound) return;
        a.dataset.navBound = '1';
        a.addEventListener('click', function (ev) {
          const href = a.getAttribute('href');
          if (!href || href.charAt(0) !== '#') return;
          const targetId = href.slice(1);
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            ev.preventDefault();
            smoothScrollTo(targetEl);
            // accessibility focus
            targetEl.setAttribute('tabindex', '-1');
            targetEl.focus({ preventScroll: true });
            setTimeout(() => targetEl.removeAttribute('tabindex'), 1200);
          }
        });
      });

      if ('IntersectionObserver' in window && sections.length) {
        const navObserver = new IntersectionObserver((entries) => {
          const visible = entries.filter(e => e.isIntersecting);
          if (!visible.length) return;
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const id = visible[0].target.id;
          navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
        }, {
          threshold: [0, 0.15, 0.35, 0.6, 0.9]
        });
        sections.forEach(s => navObserver.observe(s));
      } else {
        const updateActive = throttle(() => {
          const y = window.scrollY + headerHeight + 20;
          let currentId = sections[0] ? sections[0].id : null;
          for (let s of sections) {
            if (s.offsetTop <= y) currentId = s.id;
          }
          navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${currentId}`));
        }, 120);
        window.addEventListener('scroll', updateActive);
        updateActive();
      }

      console.log('Nav smooth scrolling and active-link behaviour initialized');
    });

    /* -------------------------
       HERO SLIDESHOW
       ------------------------- */
    safeRun('initSlideshow', function initSlideshow() {
      const slides = Array.from(document.querySelectorAll('.hero-slide'));
      const prevBtn = document.querySelector('.slide-arrow.prev');
      const nextBtn = document.querySelector('.slide-arrow.next');
      if (!slides.length) {
        console.log('No slides found, skipping slideshow.');
        return;
      }

      let current = slides.findIndex(s => s.classList.contains('active'));
      if (current < 0) current = 0;
      let autoTimer = null;
      const AUTO_DELAY = 8000;

      function showSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        slides.forEach((s, i) => s.classList.toggle('active', i === index));
        current = index;
      }

      function nextSlide() { showSlide(current + 1); }
      function prevSlide() { showSlide(current - 1); }

      if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); nextSlide(); resetAuto(); });
      if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); prevSlide(); resetAuto(); });

      function startAuto() {
        stopAuto();
        autoTimer = setInterval(nextSlide, AUTO_DELAY);
      }
      function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
      function resetAuto() { startAuto(); }

      showSlide(current);
      startAuto();

      const hero = document.querySelector('.hero-slideshow');
      if (hero) {
        hero.addEventListener('mouseenter', stopAuto);
        hero.addEventListener('mouseleave', startAuto);
      }

      console.log('Slideshow initialized');
    });

    /* -------------------------
       DONATION MODAL (accessible trap focus)
       ------------------------- */
    safeRun('initDonationModal', function initDonationModal() {
      const donateBtn = document.getElementById('donateBtn');
      const modal = document.getElementById('donateModal');
      if (!donateBtn || !modal) {
        console.log('donateBtn or donateModal not present — skipping donation modal init.');
        return;
      }
      if (donateBtn.dataset.modalInitialized) {
        console.log('Donation modal already initialized, skipping duplicate init.');
        return;
      }
      donateBtn.dataset.modalInitialized = '1';

      const modalContent = modal.querySelector('.modal-content');
      const closeTriggers = modal.querySelectorAll('[data-close-modal], .modal-close');
      let previouslyFocused = null;
      let keyHandler = null;

      function getFocusable(context) {
        const selector = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
        return Array.from((context || document).querySelectorAll(selector)).filter(el => {
          try {
            return el.offsetParent !== null && window.getComputedStyle(el).visibility !== 'hidden';
          } catch (e) {
            return true;
          }
        });
      }

      function trapFocus() {
        const focusable = getFocusable(modal);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        keyHandler = function (e) {
          if (e.key !== 'Tab') return;
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        };
        modal.addEventListener('keydown', keyHandler);
      }

      function removeTrap() {
        if (keyHandler) modal.removeEventListener('keydown', keyHandler);
        keyHandler = null;
      }

      function openModal() {
        previouslyFocused = document.activeElement;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflow = 'hidden';
        const focusable = getFocusable(modal);
        if (focusable.length) focusable[0].focus();
        else if (modalContent) modalContent.focus();
        trapFocus();
      }

      function closeModal() {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
        removeTrap();
        if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
      }

      donateBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
      closeTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
      });

      // ensure modal hidden if aria-hidden true
      if (modal.getAttribute('aria-hidden') === 'true') modal.classList.remove('show');

      console.log('Donation modal initialized');
    });

    /* -------------------------
       PANIC EXIT
       ------------------------- */
    safeRun('initPanicExit', function initPanicExit() {
      const btn = document.getElementById('panicExitBtn');
      if (!btn) {
        console.log('panicExitBtn not found — skipping panic exit init.');
        return;
      }
      if (btn.dataset.panicInitialized) return;
      btn.dataset.panicInitialized = '1';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        try { document.documentElement.style.transition = 'none'; document.body.style.visibility = 'hidden'; if (document.activeElement) document.activeElement.blur(); } catch (err) {}
        try { window.open('', '_self'); window.close(); } catch (err) {}
        try { window.location.replace('about:blank'); } catch (err) { window.location.href = 'about:blank'; }
      }, { passive: true });

      console.log('Panic exit initialized');
    });

    /* -------------------------
       FAQ toggle
       ------------------------- */
    safeRun('initFaqs', function initFaqs() {
      const faqButtons = Array.from(document.querySelectorAll('.faq-question'));
      if (!faqButtons.length) {
        console.log('No FAQ buttons found.');
        return;
      }
      faqButtons.forEach(btn => {
        if (btn.dataset.faqBound) return;
        btn.dataset.faqBound = '1';

        btn.addEventListener('click', () => {
          const parent = btn.closest('.faq-item');
          if (!parent) return;
          const answer = parent.querySelector('.faq-answer');
          const isOpen = answer && answer.classList.contains('open');

          document.querySelectorAll('.faq-answer.open').forEach(a => a.classList.remove('open'));
          document.querySelectorAll('.faq-question.active').forEach(q => q.classList.remove('active'));

          if (!isOpen && answer) {
            answer.classList.add('open');
            btn.classList.add('active');
          } else {
            if (answer) answer.classList.remove('open');
            btn.classList.remove('active');
          }
        });
      });
      console.log('FAQ toggles initialized');
    });

    /* -------------------------
       Contact form demo handler
       ------------------------- */
    safeRun('initContactForm', function initContactForm() {
      const form = document.querySelector('.contact-form');
      if (!form) return;
      if (form.dataset.contactBound) return;
      form.dataset.contactBound = '1';

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        if (submit) {
          submit.disabled = true;
          submit.textContent = 'Message sent (demo)';
          setTimeout(() => {
            submit.disabled = false;
            submit.textContent = 'Send Message';
            form.reset();
          }, 1400);
        }
      });

      console.log('Contact form handler initialized (demo)');
    });

    /* -------------------------
       Final safety net: if headings still invisible after a few seconds, force-reveal
       ------------------------- */
    setTimeout(() => {
      const hidden = Array.from(document.querySelectorAll('.glide-bottom')).filter(el => {
        try {
          const cs = window.getComputedStyle(el);
          return cs && (cs.opacity === '0' || cs.display === 'none' || cs.visibility === 'hidden');
        } catch (e) { return false; }
      });
      if (hidden.length) {
        console.warn('Force-revealing', hidden.length, 'glide-bottom elements because they remain hidden. If this persists, search your CSS for rules targeting .glide-bottom, h1, .main-heading, or global heading selectors that set opacity/display/visibility.');
        hidden.forEach(forceRevealElement);
      }
    }, 3500);

  }); // DOMContentLoaded end

})(); // IIFE end
