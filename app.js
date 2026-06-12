/**
 * HOUSE OF MORI (HŌM) — Main Application Script
 * Orchestrates intro sequence, parallax, section reveals, menu navigation, tabs, and reservation flow.
 */

let lenis;

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initLenis();
  initIntroSequence();
  initScrollEffects();
  initMobileMenu();
  initMenuTabs();
  initReservationForm();
});

/**
 * 0. Smooth Scroll (Lenis)
 * Initialises Lenis smooth scrolling and binds anchor links.
 */
function initLenis() {
  if (typeof Lenis === 'undefined') return;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
    smoothWheel: true,
    smoothTouch: false
  });

  // Stop scroll during loading sequence
  lenis.stop();

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Link standard anchor clicks to Lenis scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        lenis.scrollTo(target, { offset: 0, duration: 1.2 });
      }
    });
  });

  // Bind parallax updates to scroll event
  lenis.on('scroll', () => {
    updateParallax();
  });

  // Initial position check
  setTimeout(updateParallax, 3500);
}

/**
 * 1. Intro Loader Sequence
 * Coordinates timings for logo reveal, diagonal blade stroke, split panel translation, and scroll activation.
 */
function initIntroSequence() {
  const body = document.body;
  const loader = document.getElementById('intro-loader');

  if (!loader) return;

  // Step 1: Draw the diagonal blade line (triggers after short delay)
  setTimeout(() => {
    body.classList.add('cut-active');
  }, 400);

  // Step 2: Fade out the center HŌM logo lettermark
  setTimeout(() => {
    body.classList.add('logo-faded');
  }, 1200);

  // Step 3: Slide the panels apart diagonally
  setTimeout(() => {
    body.classList.add('loaded');
  }, 1600);

  // Step 4: Complete loading, remove loader from layout, enable body scrolling
  setTimeout(() => {
    body.classList.remove('loading');
    body.classList.add('loaded-finished');
    if (lenis) {
      lenis.start(); // Enable scroll once loaded
    }
  }, 3400); // 1.6s panels start + 1.8s duration
}

/**
 * 2. Scroll-Related Interactions
 * Sticky header visual states and Intersection Observer for section entry animations.
 */
function initScrollEffects() {
  const header = document.getElementById('main-header');
  const revealSections = document.querySelectorAll('.reveal-section');

  // Sticky Header Scrolled Class
  const checkScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', checkScroll);
  checkScroll(); // Initial check

  // Scroll Reveal Observer
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // Trigger only once
        }
      });
    }, {
      root: null,
      threshold: 0.12, // Trigger when 12% of section is visible
      rootMargin: '0px 0px -40px 0px'
    });

    revealSections.forEach(section => {
      sectionObserver.observe(section);
    });
  } else {
    // Fallback: Show all sections if observer not supported
    revealSections.forEach(section => {
      section.classList.add('revealed');
    });
  }
}

/**
 * 3. Mobile Navigation Drawer
 * Toggles overlay drawer, icon rotation, and locks viewport scrolling when open.
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle-btn');
  const navMenu = document.getElementById('nav-menu-container');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!menuToggle || !navMenu) return;

  const toggleMenu = () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('open');
    document.body.classList.toggle('menu-open'); // Can lock scrolling if needed
  };

  menuToggle.addEventListener('click', toggleMenu);

  // Close menu when navigation links are clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) {
        toggleMenu();
      }
    });
  });
}

/**
 * 4. Interactive Menu Tabs
 * Transitions menu items based on food/beverage categories.
 */
function initMenuTabs() {
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanelId = tab.getAttribute('aria-controls');

      // Update Tab Active State
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Transition Panels
      panels.forEach(panel => {
        if (panel.id === targetPanelId) {
          panel.classList.add('active');
          panel.removeAttribute('hidden');
        } else {
          panel.classList.remove('active');
          panel.setAttribute('hidden', '');
        }
      });
    });
  });
}

/**
 * 5. Integrated Reservation Form Coordinator
 * Sets minimum booking date limit to tomorrow, manages submission flows and mock API callback feedback.
 */
function initReservationForm() {
  const form = document.getElementById('booking-form');
  const successMsg = document.getElementById('booking-success-msg');
  const resetBtn = document.getElementById('booking-reset-btn');
  const dateInput = document.getElementById('booking-date');

  if (!form || !successMsg || !dateInput) return;

  // Set min date field boundary to tomorrow
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    let month = tomorrow.getMonth() + 1;
    let day = tomorrow.getDate();

    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;

    return `${year}-${month}-${day}`;
  };

  dateInput.value = getTomorrowString();
  dateInput.min = getTomorrowString();

  // Submission Flow
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Perform simple validation check
    const name = document.getElementById('booking-name').value.trim();
    const email = document.getElementById('booking-email').value.trim();
    const phone = document.getElementById('booking-phone').value.trim();

    if (!name || !email || !phone) {
      alert('Please fill out all required fields.');
      return;
    }

    // Trigger loading state on button
    const submitBtn = document.getElementById('booking-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'CHECKING AVAILABILITY...';
    submitBtn.disabled = true;

    // Simulate concierge service delay (1.2s)
    setTimeout(() => {
      form.style.opacity = '0';

      setTimeout(() => {
        form.setAttribute('hidden', '');
        successMsg.removeAttribute('hidden');
        successMsg.style.opacity = '1';

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 300);

    }, 1200);
  });

  // Reset/Request Another Table Flow
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      successMsg.style.opacity = '0';

      setTimeout(() => {
        successMsg.setAttribute('hidden', '');
        form.reset();
        dateInput.value = getTomorrowString();
        form.removeAttribute('hidden');
        form.style.opacity = '1';
      }, 300);
    });
  }
}

/**
 * 6. Smooth Scroll Parallax (Lenis Link)
 * Translates page background images relative to scroll speed and element viewport position.
 */
function updateParallax() {
  const parallaxImages = document.querySelectorAll('.parallax-img');
  const viewportHeight = window.innerHeight;

  parallaxImages.forEach(img => {
    const parent = img.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    if (parentRect.top < viewportHeight && parentRect.bottom > 0) {
      // Calculate how far the parent has scrolled across the viewport (from -1 to 1)
      const scrolledPercent = (parentRect.top + parentRect.height / 2 - viewportHeight / 2) / (viewportHeight / 2 + parentRect.height / 2);

      // Translate image vertically (Max 55px translation)
      const translateY = scrolledPercent * 55;
      img.style.transform = `translate3d(0, ${translateY}px, 0) scale(1.15)`;
    }
  });
}

/**
 * 7. Custom Inertial Mouse Cursor
 * Animates a circle trail following the mouse pointer, with hover-expansion logic.
 */
function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  const dot = cursor?.querySelector('.cursor-dot');
  const ring = cursor?.querySelector('.cursor-ring');
  const label = document.getElementById('cursor-label');

  if (!cursor || !dot || !ring || !label) return;

  let mouseX = 0, mouseY = 0; // Target coordinates
  let ringX = 0, ringY = 0;   // Trailing coordinates with LERP

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Position core dot instantly
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
  });

  // LERP animation loop for trailing ring and label
  const tick = () => {
    ringX += (mouseX - ringX) * 0.12; // 0.12 speed multiplier for smooth trail lag
    ringY += (mouseY - ringY) * 0.12;

    // Position trailing elements directly
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    
    label.style.left = `${ringX}px`;
    label.style.top = `${ringY}px`;

    requestAnimationFrame(tick);
  };
  
  tick();

  // Hover states logic
  const interactiveSelector = 'a, button, select, input, .menu-tab, .gallery-item, .btn';
  
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest(interactiveSelector);
    if (!target) return;

    cursor.classList.add('hovered');

    // Special hover categories
    if (target.closest('.gallery-item')) {
      cursor.classList.add('has-label');
      label.textContent = 'VIEW';
    } else if (target.closest('#reservations') || target.closest('#header-book-btn') || target.closest('#cafe-book-btn') || target.closest('#events-inquire-btn')) {
      cursor.classList.add('has-label');
      label.textContent = 'BOOK';
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest(interactiveSelector);
    if (!target) return;

    cursor.classList.remove('hovered');
    cursor.classList.remove('has-label');
    label.textContent = '';
  });
}
