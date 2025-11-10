// Main site JS: slideshow, modal (donation), panic exit, FAQ toggles
// Place this as your script.js (this file replaces/contains your site's JS)

(function () {
  'use strict';

  // Run after DOM ready
  document.addEventListener('DOMContentLoaded', () => {

    /* -------------------------
       HERO SLIDESHOW (simple)
       ------------------------- */
    (function initSlideshow() {
      const slides = Array.from(document.querySelectorAll('.hero-slide'));
      const prevBtn = document.querySelector('.slide-arrow.prev');
      const nextBtn = document.querySelector('.slide-arrow.next');
      if (!slides.length) return;

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

      // init
      showSlide(current);
      startAuto();

      // Pause autoplay on mouse over for UX
      const hero = document.querySelector('.hero-slideshow');
      if (hero) {
        hero.addEventListener('mouseenter', stopAuto);
        hero.addEventListener('mouseleave', startAuto);
      }
    })();


    /* -------------------------
       DONATION MODAL
       ------------------------- */
    (function initDonationModal() {
      const donateBtn = document.getElementById('donateBtn');
      const modal = document.getElementById('donateModal');
      if (!donateBtn || !modal) return;

      const modalContent = modal.querySelector('.modal-content');
      const closeTriggers = modal.querySelectorAll('[data-close-modal], .modal-close');
      let previouslyFocused = null;
      let keyHandler = null;

      function openModal() {
        previouslyFocused = document.activeElement;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflow = 'hidden'; // lock scroll
        // Focus the first focusable element inside modal, or modal content
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

      // Close on overlay click
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-overlay')) {
          closeModal();
        }
      });

      // Close on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
          closeModal();
        }
      });

      // Focus trap implementation
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

      function getFocusable(context) {
        const selector = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
        return Array.from((context || document).querySelectorAll(selector)).filter(el => el.offsetParent !== null);
      }
    })();


    /* -------------------------
       PANIC EXIT BUTTON
       ------------------------- */
    (function initPanicExit() {
      const btn = document.getElementById('panicExitBtn');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Hide immediately for privacy
        try {
          document.documentElement.style.transition = 'none';
          document.body.style.visibility = 'hidden';
          if (document.activeElement) document.activeElement.blur();
        } catch (err) {
          // ignore
        }

        // Try to close window (may be blocked)
        try {
          window.open('', '_self');
          window.close();
        } catch (err) { /* ignore */ }

        // Fallback: navigate away and replace history
        try {
          window.location.replace('about:blank');
        } catch (err) {
          window.location.href = 'about:blank';
        }
      }, { passive: true });
    })();


    /* -------------------------
       FAQ TOGGLE
       ------------------------- */
    (function initFaqs() {
      const faqButtons = Array.from(document.querySelectorAll('.faq-question'));
      faqButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const parent = btn.closest('.faq-item');
          if (!parent) return;
          const answer = parent.querySelector('.faq-answer');
          const isOpen = answer && answer.classList.contains('open');

          // close all
          document.querySelectorAll('.faq-answer.open').forEach(a => a.classList.remove('open'));
          document.querySelectorAll('.faq-question.active').forEach(q => q.classList.remove('active'));

          if (!isOpen && answer) {
            answer.classList.add('open');
            btn.classList.add('active');
          } else {
            // already closed -> ensure removed
            if (answer) answer.classList.remove('open');
            btn.classList.remove('active');
          }
        });
      });
    })();


    /* -------------------------
       Small UX: prevent contact form default (optional)
       ------------------------- */
    (function initContactForm() {
      const form = document.querySelector('.contact-form');
      if (!form) return;
      form.addEventListener('submit', (e) => {
        // Let your backend handle submissions. For now prevent accidental navigation during testing.
        e.preventDefault();
        // Basic UI feedback (you can replace with real submit)
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
    })();

  }); // DOMContentLoaded end

})(); // IIFE end
