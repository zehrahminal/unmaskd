// Section reveal and active nav highlight
document.addEventListener("DOMContentLoaded", function() {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll("nav a");

  function onScroll() {
    let activeIdx = 0;
    sections.forEach((section, idx) => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.2) {
        section.classList.add("visible");
        activeIdx = idx;
      } else {
        section.classList.remove("visible");
      }
    });
    navLinks.forEach((link, idx) => {
      if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
        link.classList.toggle("active", idx === activeIdx);
      }
    });
  }

  onScroll();
  window.addEventListener("scroll", onScroll);

  // Smooth scroll for nav links
  navLinks.forEach(link => {
    if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
      link.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          window.scrollTo({
            top: target.offsetTop - 20,
            behavior: "smooth"
          });
        }
      });
    }
  });

  // HERO SLIDESHOW LOGIC
  const slides = document.querySelectorAll(".hero-slide");
  const prevBtn = document.querySelector(".slide-arrow.prev");
  const nextBtn = document.querySelector(".slide-arrow.next");
  let slideIdx = 0, slideTimer;

  function showSlide(idx) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === idx);
      // Glide in each child on show
      if (i === idx) {
        const gliders = slide.querySelectorAll('.glide-bottom');
        gliders.forEach((el, j) => {
          el.style.opacity = 0;
          el.style.transform = "translateY(60px)";
          setTimeout(() => {
            el.style.opacity = 1;
            el.style.transform = "translateY(0)";
            el.style.transition = "opacity .8s cubic-bezier(.45,.05,.55,.95), transform .8s cubic-bezier(.45,.05,.55,.95)";
          }, 300 + j * 120);
        });
      }
    });
  }
  function nextSlide() {
    slideIdx = (slideIdx + 1) % slides.length;
    showSlide(slideIdx);
    resetTimer();
  }
  function prevSlide() {
    slideIdx = (slideIdx - 1 + slides.length) % slides.length;
    showSlide(slideIdx);
    resetTimer();
  }
  function resetTimer() {
    clearTimeout(slideTimer);
    slideTimer = setTimeout(nextSlide, 4800);
  }

  if (slides.length && nextBtn && prevBtn) {
    showSlide(slideIdx);
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    slideTimer = setTimeout(nextSlide, 4800);
  }

  // Glide in .glide-bottom elements on page load (outside slides)
  document.querySelectorAll('.glide-bottom').forEach((el, idx) => {
    el.style.opacity = 0;
    el.style.transform = "translateY(60px)";
    setTimeout(() => {
      el.style.opacity = 1;
      el.style.transform = "translateY(0)";
      el.style.transition = "opacity .8s cubic-bezier(.45,.05,.55,.95), transform .8s cubic-bezier(.45,.05,.55,.95)";
    }, 400 + idx * 120);
  });

  // FAQ accordion logic
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', function() {
      const ans = this.nextElementSibling;
      const isOpen = ans.classList.contains('open');
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
      document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('active'));
      if (!isOpen) {
        ans.classList.add('open');
        this.classList.add('active');
      }
    });
  });
});