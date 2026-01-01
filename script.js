/**
 * Honeybee and Friends Daycare - Main JavaScript
 *
 * Uses factory functions with a functional programming style.
 * Event handling via delegation for decoupled, accessible interactions.
 * Visibility controlled via CSS classes (is-hidden) - JS never sets display directly.
 * Active states use aria-current attribute for accessibility and styling.
 */

// =============================================================================
// Constants
// =============================================================================

const CONFIG = Object.freeze({
  defaultPage: 'home-page',
  slideInterval: 5000,
  localHosts: ['', 'localhost', '127.0.0.1'],
  classes: {
    hidden: 'is-hidden'
  },
  selectors: {
    slide: '[data-slideshow="slide"]',
    dot: '[data-slideshow="dot"]',
    liveRegion: '[data-slideshow="live-region"]'
  }
});

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Shows an element by removing the hidden class.
 * @param {Element} el - The element to show
 */
const show = (el) => {
  if (el) el.classList.remove(CONFIG.classes.hidden);
};

/**
 * Hides an element by adding the hidden class.
 * @param {Element} el - The element to hide
 */
const hide = (el) => {
  if (el) el.classList.add(CONFIG.classes.hidden);
};

/**
 * Checks if an element is hidden.
 * @param {Element} el - The element to check
 * @returns {boolean}
 */
const isHidden = (el) => el && el.classList.contains(CONFIG.classes.hidden);

// =============================================================================
// Analytics Module (GA4)
// =============================================================================

/**
 * Creates an analytics tracker for GA4.
 * Note: gtag is initialized in the HTML head via Google's snippet.
 */
function Analytics() {
  const isGtagAvailable = () =>
    typeof gtag === 'function';

  /**
   * Logs a virtual page view for SPA-style navigation.
   * @param {string} pageId - The page identifier to log
   */
  const logPageView = (pageId) => {
    if (!isGtagAvailable()) return;

    gtag('event', 'page_view', {
      page_title: pageId,
      page_location: window.location.href,
      page_path: '/' + pageId
    });
  };

  return Object.freeze({
    logPageView,
    isGtagAvailable
  });
}

// =============================================================================
// Navigation Module
// =============================================================================

/**
 * Creates a navigation controller for the SPA-style page switching.
 * Uses aria-current="page" for active state (decoupled from CSS class names).
 */
function Nav() {
  let currentPage = CONFIG.defaultPage;

  const hamburgerBtn = () => document.querySelector('[data-action="show-sidebar"]');
  const sideNavBar = () => document.getElementById('side-nav-bar');
  const filter = () => document.getElementById('filter');

  /**
   * Updates the active state on all navigation elements.
   * Uses aria-current="page" which CSS can style via attribute selector.
   * @param {string} pageId - The page to mark as active
   */
  const updateActiveNav = (pageId) => {
    // Remove aria-current from all nav buttons
    document.querySelectorAll('[data-page]')
      .forEach(el => el.removeAttribute('aria-current'));

    // Set aria-current on buttons matching this page
    document.querySelectorAll(`[data-page="${pageId}"]`)
      .forEach(el => el.setAttribute('aria-current', 'page'));
  };

  /**
   * Switches the visible content section.
   * @param {string} pageId - The page section to display
   */
  const swapMiddle = (pageId) => {
    const prevEl = document.getElementById(currentPage);
    const nextEl = document.getElementById(pageId);

    if (!nextEl) {
      console.warn(`Nav: Page "${pageId}" not found`);
      return;
    }

    hide(prevEl);
    show(nextEl);

    updateActiveNav(pageId);
    currentPage = pageId;
    hideSideBar();
  };

  const showSideBar = () => {
    show(sideNavBar());
    show(filter());

    // Update ARIA state
    const btn = hamburgerBtn();
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
    }
  };

  const hideSideBar = () => {
    hide(sideNavBar());
    hide(filter());

    // Update ARIA state
    const btn = hamburgerBtn();
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
    }
  };

  const isSideBarOpen = () => !isHidden(sideNavBar());

  const toggleSideBar = () => {
    isSideBarOpen() ? hideSideBar() : showSideBar();
  };

  return Object.freeze({
    swapMiddle,
    showSideBar,
    hideSideBar,
    toggleSideBar
  });
}

/**
 * Decorator that adds analytics logging to navigation actions.
 * @param {Object} navigator - The Nav instance to wrap
 * @param {Object} analytics - The Analytics instance to use
 */
function LoggedNavigator(navigator, analytics) {
  const swapMiddle = (pageId) => {
    navigator.swapMiddle(pageId);
    analytics.logPageView(pageId);
  };

  return Object.freeze({
    swapMiddle,
    showSideBar: navigator.showSideBar,
    hideSideBar: navigator.hideSideBar,
    toggleSideBar: navigator.toggleSideBar
  });
}

// =============================================================================
// SlideShow Module
// =============================================================================

/**
 * Creates an auto-advancing slideshow controller with ARIA support.
 * Visibility controlled via is-hidden class, not inline styles.
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Time between slides in ms
 */
function SlideShow(options = {}) {
  const interval = options.interval || CONFIG.slideInterval;

  let currentIndex = 0;
  let autoAdvanceTimer = null;

  const getSlides = () => document.querySelectorAll(CONFIG.selectors.slide);
  const getDots = () => document.querySelectorAll(CONFIG.selectors.dot);
  const getLiveRegion = () => document.querySelector(CONFIG.selectors.liveRegion);

  /**
   * Updates ARIA attributes on dots for accessibility.
   * @param {number} activeIndex - The currently active slide index
   */
  const updateAriaStates = (activeIndex) => {
    getDots().forEach((dot, index) => {
      dot.setAttribute('aria-selected', index === activeIndex ? 'true' : 'false');
    });
  };

  /**
   * Announces slide change to screen readers.
   * @param {number} slideNumber - The 1-based slide number
   * @param {number} total - Total number of slides
   */
  const announceSlide = (slideNumber, total) => {
    const liveRegion = getLiveRegion();
    if (liveRegion) {
      liveRegion.textContent = `Slide ${slideNumber} of ${total}`;
    }
  };

  /**
   * Displays the slide at the given index, handling wraparound.
   * @param {number} index - The 0-based slide index
   */
  const showSlide = (index) => {
    const slides = getSlides();
    const dots = getDots();
    const totalSlides = slides.length;

    if (totalSlides === 0) return;

    // Handle wraparound
    if (index >= totalSlides) {
      currentIndex = 0;
    } else if (index < 0) {
      currentIndex = totalSlides - 1;
    } else {
      currentIndex = index;
    }

    // Hide all slides
    slides.forEach(slide => hide(slide));

    // Show current slide
    show(slides[currentIndex]);

    // Update ARIA states (CSS styles dots via [aria-selected="true"])
    updateAriaStates(currentIndex);
    announceSlide(currentIndex + 1, totalSlides);
  };

  const startAutoAdvance = () => {
    stopAutoAdvance();
    autoAdvanceTimer = setInterval(() => {
      showSlide(currentIndex + 1);
    }, interval);
  };

  const stopAutoAdvance = () => {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  };

  const resetAutoAdvance = () => {
    startAutoAdvance();
  };

  /**
   * Advances the slideshow by a given delta.
   * @param {number} delta - Number of slides to advance (negative to go back)
   */
  const advance = (delta) => {
    showSlide(currentIndex + delta);
    resetAutoAdvance();
  };

  /**
   * Jumps to a specific slide (1-based index for external API compatibility).
   * @param {number} slideNumber - The 1-based slide number
   */
  const goToSlide = (slideNumber) => {
    showSlide(slideNumber - 1);
    resetAutoAdvance();
  };

  /**
   * Cleans up the slideshow timer. Call when removing the slideshow.
   */
  const destroy = () => {
    stopAutoAdvance();
  };

  // Initialize
  startAutoAdvance();

  return Object.freeze({
    advance,
    goToSlide,
    destroy
  });
}

// =============================================================================
// Event Controller (Delegation)
// =============================================================================

/**
 * Sets up event delegation for all interactive elements.
 * Decouples HTML from JavaScript by using data attributes.
 * @param {Object} nav - The navigation controller
 * @param {Object} slideShow - The slideshow controller
 */
function EventController(nav, slideShow) {
  /**
   * Handles click events via delegation.
   * @param {Event} event - The click event
   */
  const handleClick = (event) => {
    const target = event.target.closest('[data-page], [data-action], [data-slide], [data-slide-delta]');
    if (!target) return;

    // Navigation: data-page
    if (target.dataset.page) {
      event.preventDefault();
      nav.swapMiddle(target.dataset.page);
      return;
    }

    // Actions: data-action
    if (target.dataset.action) {
      event.preventDefault();
      const actions = {
        'show-sidebar': () => nav.showSideBar(),
        'hide-sidebar': () => nav.hideSideBar(),
        'toggle-sidebar': () => nav.toggleSideBar()
      };
      const action = actions[target.dataset.action];
      if (action) action();
      return;
    }

    // Slideshow: data-slide (go to specific slide)
    if (target.dataset.slide) {
      event.preventDefault();
      const slideNumber = parseInt(target.dataset.slide, 10);
      if (!isNaN(slideNumber)) {
        slideShow.goToSlide(slideNumber);
      }
      return;
    }

    // Slideshow: data-slide-delta (advance by delta)
    if (target.dataset.slideDelta) {
      event.preventDefault();
      const delta = parseInt(target.dataset.slideDelta, 10);
      if (!isNaN(delta)) {
        slideShow.advance(delta);
      }
      return;
    }
  };

  /**
   * Handles keyboard events for accessibility.
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleKeydown = (event) => {
    // Handle Escape to close sidebar
    if (event.key === 'Escape') {
      nav.hideSideBar();
      return;
    }

    // Handle arrow keys on slideshow dots
    const target = event.target;
    if (target.matches(CONFIG.selectors.dot)) {
      const dots = Array.from(document.querySelectorAll(CONFIG.selectors.dot));
      const currentIdx = dots.indexOf(target);

      let nextIdx = currentIdx;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIdx = (currentIdx + 1) % dots.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIdx = (currentIdx - 1 + dots.length) % dots.length;
      }

      if (nextIdx !== currentIdx) {
        event.preventDefault();
        dots[nextIdx].focus();
        dots[nextIdx].click();
      }
    }
  };

  /**
   * Initializes event listeners.
   */
  const init = () => {
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
  };

  /**
   * Removes event listeners for cleanup.
   */
  const destroy = () => {
    document.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleKeydown);
  };

  return Object.freeze({
    init,
    destroy
  });
}

// =============================================================================
// Development Utilities
// =============================================================================

/**
 * Simple test runner for local development.
 */
function DevTests() {
  const isLocalEnvironment = () =>
    CONFIG.localHosts.includes(location.hostname);

  const tests = [
    {
      name: 'gtag is available',
      test: () => typeof gtag === 'function'
    },
    {
      name: 'nav elements exist',
      test: () => document.querySelectorAll('[data-page]').length > 0
    },
    {
      name: 'slideshow elements exist',
      test: () => document.querySelectorAll(CONFIG.selectors.slide).length > 0
    },
    {
      name: 'slideshow has ARIA attributes',
      test: () => document.querySelector('[aria-roledescription="carousel"]') !== null
    },
    {
      name: 'active nav uses aria-current',
      test: () => document.querySelector('[data-page][aria-current="page"]') !== null
    },
    {
      name: 'hidden pages use is-hidden class',
      test: () => document.querySelectorAll('.middle-content.is-hidden').length > 0
    }
  ];

  const run = () => {
    if (!isLocalEnvironment()) return;

    console.log('=== Dev Tests ===');

    const results = tests.map(({ name, test }) => {
      const passed = test();
      console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
      return passed;
    });

    const passCount = results.filter(Boolean).length;
    console.log(`=== ${passCount}/${tests.length} tests passed ===`);
  };

  return Object.freeze({ run });
}

// =============================================================================
// Initialization
// =============================================================================

const analytics = Analytics();
const nav = LoggedNavigator(Nav(), analytics);
const slideShow = SlideShow();
const eventController = EventController(nav, slideShow);

// Initialize event delegation
eventController.init();

// Show first slide (already visible in HTML, but ensures state is synced)
slideShow.goToSlide(1);

// Log initial page view
analytics.logPageView('landing-page');

// Run dev tests in local environment
DevTests().run();
