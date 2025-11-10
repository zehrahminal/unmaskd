// script.js — restored scroll-reveal + existing behaviours (slideshow, modal, panic exit, FAQ, contact)
// Save/replace this file as script.js and hard-refresh the page (Ctrl+Shift+R)

(function () {
  'use strict';

  console.log('script.js loaded');

  // Global error handler (keeps errors visible in console)
  window.addEventListener('error', function (ev) {
    console.error('Uncaught error:', ev.message, ev.error);
  });

  // Utility to run blocks safely so one error doesn't break everything
  function safeRun(name, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`Error in ${name}:`, err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');

    /* -------------------------
       SCROLL REVEAL (IntersectionObserver)
       ------------------------- */
    safeRun('initScrollReveal', function initScrollReveal() {
      // Remove any global immediate reveal previously added (defensive)
      try {
        document.querySelectorAll('section.visible').forEach(s => s.classList.remove('visible'));
      } catch (e) { /* ignore */ }

      // If IntersectionObserver supported, reveal sections when they enter viewport
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const section = entry.target;
              section.classList.add('visible');

              // Stagger .glide-bottom children inside the section
              const glideEls = Array.from(section.querySelectorAll('.glide-bottom'));
              glideEls.forEach((el, i) => {
                // Use small incremental delays
                el.style.animationDelay = `${i * 100}ms`;
              });

              obs.unobserve(section);
            }
          });
        }, {
          root: null,
          rootMargin: '0px 0px -12% 0px',
          threshold: 0.12
        });

        document.querySelectorAll('section').forEach(s => observer.observe(s));
        console.log('Scroll reveal initialized with IntersectionObserver');
      } else {
        // Fallback: reveal all
        document.querySelectorAll('section').forEach(s => s.classList.add('visible'));
        console.log('IntersectionObserver not supported — revealed all sections');
      }
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
       DONATION MODAL
       ------------------------- */
    safeRun('initDonationModal', function initDonationModal() {
      const donateBtn = document.getElementById('donateBtn');
      const modal = document.getElementById('donateModal');
      if (!donateBtn || !modal) {
        console.log('donateBtn or donateModal not present — skipping donation modal init.');
        return;
      }
      // Prevent double initialization (if inline script also exists)
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
        if (e.target === modal || e.target.classList.contains('modal-overlay')) {
          closeModal();
        }
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
        console.log('panicExitBtn not found — skipping panic exit init.');
        return;
      }
      // avoid multiple binds
      if (btn.dataset.panicInitialized) return;
      btn.dataset.panicInitialized = '1';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          document.documentElement.style.transition = 'none';
          document.body.style.visibility = 'hidden';
          if (document.activeElement) document.activeElement.blur();
        } catch (err) { /* ignore */ }

        try { window.open('', '_self'); window.close(); } catch (err) { /* ignore */ }
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
        // avoid duplicate handlers
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

  }); // DOMContentLoaded end

})(); // IIFE end
