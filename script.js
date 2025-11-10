// script.js — defensive site script (replace your current script.js with this)
(function () {
  'use strict';

  // Quick startup log
  console.log('script.js (defensive) loaded');

  // Try to make sections visible immediately to avoid blank page if other code errors
  try {
    if (document.querySelectorAll) {
      document.querySelectorAll('section').forEach(s => s.classList.add('visible'));
      console.log('Immediate: .visible added to sections');
    }
  } catch (err) {
    console.warn('Immediate section reveal failed (will try on DOMContentLoaded):', err);
  }

  // Global error handler to surface unexpected errors
  window.addEventListener('error', function (ev) {
    console.error('Uncaught error:', ev.message, ev.error);
  });

  // Utility: run code safely so a single error doesn't stop everything
  function safeRun(name, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`Error in ${name}:`, err);
    }
  }

  // DOM-ready entry
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');

    // Ensure sections visible (in case immediate attempt ran before DOM ready)
    try {
      document.querySelectorAll('section').forEach(s => s.classList.add('visible'));
      console.log('DOMContentLoaded: .visible ensured on sections');
    } catch (err) {
      console.error('Failed to add .visible to sections on DOMContentLoaded:', err);
    }

    /* -------------------------
       HERO SLIDESHOW
       ------------------------- */
    safeRun('initSlideshow', function initSlideshow() {
      const slides = Array.from(document.querySelectorAll('.hero-slide'));
      const prevBtn = document.querySelector('.slide-arrow.prev');
      const nextBtn = document.querySelector('.slide-arrow.next');
      if (!slides.length) {
        console.log('No slides found (slideshow skipped).');
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
       DONATION MODAL
       ------------------------- */
    safeRun('initDonationModal', function initDonationModal() {
      const donateBtn = document.getElementById('donateBtn');
      const modal = document.getElementById('donateModal');
      if (!donateBtn || !modal) {
        console.log('Donation modal/button not present — skipping modal init.');
        return;
      }

      const modalContent = modal.querySelector('.modal-content');
      const closeTriggers = modal.querySelectorAll('[data-close-modal], .modal-close');
      let previouslyFocused = null;
      let keyHandler = null;

      function getFocusable(context) {
        const selector = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
        return Array.from((context || document).querySelectorAll(selector)).filter(el => {
          // Ensure element is visible
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
      closeTriggers.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); }));

      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) closeModal();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
      });

      console.log('Donation modal initialized');
    });

    /* -------------------------
       PANIC EXIT
       ------------------------- */
    safeRun('initPanicExit', function initPanicExit() {
      const btn = document.getElementById('panicExitBtn');
      if (!btn) {
        console.log('panicExitBtn not found — skipping');
        return;
      }
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          document.documentElement.style.transition = 'none';
          document.body.style.visibility = 'hidden';
          if (document.activeElement) document.activeElement.blur();
        } catch (err) {}
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
        console.log('No FAQ buttons found (skipping).');
        return;
      }
      faqButtons.forEach(btn => {
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

  }); // DOMContentLoaded
})(); // IIFE
