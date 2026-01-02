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
  },
  // Human-readable page paths for cleaner GA4 reports
  pagePaths: {
    'home-page': '/home',
    'about-background': '/about',
    'gallery-background': '/gallery',
    'schedule-background': '/schedule',
    'menu-background': '/menu',
    'pricing-background': '/pricing',
    'contact-background': '/contact'
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
   * Uses human-readable paths from CONFIG.pagePaths for cleaner GA4 reports.
   * @param {string} pageId - The page identifier to log
   */
  const logPageView = (pageId) => {
    if (!isGtagAvailable()) return;

    const pagePath = CONFIG.pagePaths[pageId] || '/' + pageId;
    const pageTitle = pagePath.slice(1); // Remove leading slash for title

    gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: window.location.href,
      page_path: pagePath
    });
  };

  /**
   * Logs a phone click conversion event.
   * Uses beacon transport to ensure delivery before page navigation.
   * @param {string} location - Where the click occurred (header, cta_primary, contact_page, mobile_sticky, footer)
   */
  const logPhoneClick = (location) => {
    if (!isGtagAvailable()) return;

    gtag('event', 'phone_click', {
      event_category: 'conversion',
      event_label: location,
      phone_number: '832-810-2722',
      transport_type: 'beacon'
    });
  };

  /**
   * Logs an email click conversion event.
   * Uses beacon transport to ensure delivery before mailto navigation.
   * @param {string} location - Where the click occurred (contact_page, footer)
   */
  const logEmailClick = (location) => {
    if (!isGtagAvailable()) return;

    gtag('event', 'email_click', {
      event_category: 'conversion',
      event_label: location,
      transport_type: 'beacon'
    });
  };

  /**
   * Logs a form submission conversion event.
   * Uses beacon transport to ensure delivery before form navigation.
   * @param {Object} formData - Form field data to include
   */
  const logFormSubmit = (formData = {}) => {
    if (!isGtagAvailable()) return;

    gtag('event', 'form_submit', {
      event_category: 'conversion',
      form_name: 'contact_form',
      transport_type: 'beacon',
      ...formData
    });
  };

  /**
   * Logs a CTA click event.
   * @param {string} ctaType - Type of CTA (primary, secondary)
   * @param {string} destination - Where the CTA leads
   */
  const logCtaClick = (ctaType, destination) => {
    if (!isGtagAvailable()) return;

    gtag('event', 'cta_click', {
      event_category: 'engagement',
      cta_type: ctaType,
      destination: destination
    });
  };

  /**
   * Logs a phone click conversion event.
   * @param {string} location - Where the click occurred (header, cta_primary, contact_page, mobile_sticky, footer)
   */
  const logPhoneClick = (location) => {
    if (!isGtagAvailable()) return;

    gtag('event', 'phone_click', {
      event_category: 'conversion',
      event_label: location,
      phone_number: '832-810-2722'
    });
  };

  /**
   * Logs a form submission conversion event.
   * @param {Object} formData - Form field data to include
   */
  const logFormSubmit = (formData = {}) => {
    if (!isGtagAvailable()) return;

    gtag('event', 'form_submit', {
      event_category: 'conversion',
      form_name: 'contact_form',
      ...formData
    });
  };

  /**
   * Logs a CTA click event.
   * @param {string} ctaType - Type of CTA (primary, secondary)
   * @param {string} destination - Where the CTA leads
   */
  const logCtaClick = (ctaType, destination) => {
    if (!isGtagAvailable()) return;

    gtag('event', 'cta_click', {
      event_category: 'engagement',
      cta_type: ctaType,
      destination: destination
    });
  };

  return Object.freeze({
    logPageView,
    logPhoneClick,
    logEmailClick,
    logFormSubmit,
    logCtaClick,
    isGtagAvailable
  });
}

// =============================================================================
// Tracker Module (UTM Parameters)
// =============================================================================

/**
 * Captures and persists UTM parameters for marketing attribution.
 * Stores in sessionStorage to persist across SPA navigation.
 */
function Tracker() {
  const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const STORAGE_KEY = 'honeybee_utm';

  /**
   * Extracts UTM parameters from the current URL.
   * @returns {Object} Object containing UTM parameters found
   */
  const extractFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const data = {};

    PARAMS.forEach(param => {
      const value = params.get(param);
      if (value) {
        data[param] = value;
      }
    });

    return data;
  };

  /**
   * Saves UTM parameters to sessionStorage.
   * New params take precedence over existing ones.
   * @param {Object} data - UTM parameters to save
   */
  const save = (data) => {
    if (Object.keys(data).length === 0) return;

    const existing = get();
    const merged = { ...existing, ...data };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      // sessionStorage unavailable (private browsing, etc.)
    }
  };

  /**
   * Retrieves stored UTM parameters.
   * @returns {Object} Stored UTM parameters or empty object
   */
  const get = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  };

  /**
   * Attaches UTM parameters as hidden fields to a form.
   * @param {HTMLFormElement} form - The form element to enhance
   */
  const attachToForm = (form) => {
    if (!form) return;

    const data = get();

    Object.entries(data).forEach(([key, value]) => {
      let input = form.querySelector(`input[name="${key}"]`);

      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        form.appendChild(input);
      }

      input.value = value;
    });
  };

  /**
   * Initializes the tracker - captures UTM params from URL.
   */
  const init = () => {
    const data = extractFromUrl();
    save(data);
  };

  return Object.freeze({
    init,
    get,
    attachToForm
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
 * @param {Object} analytics - The analytics tracker
 * @param {Object} tracker - The UTM parameter tracker
 */
function EventController(nav, slideShow, analytics, tracker) {
  /**
   * Determines the location context for a phone link click.
   * @param {Element} link - The clicked tel: link
   * @returns {string} Location identifier for analytics
   */
  const getPhoneLocation = (link) => {
    if (link.closest('.header-phone')) return 'header';
    if (link.closest('.cta-container')) return 'cta_primary';
    if (link.closest('#contact-text-box')) return 'contact_page';
    if (link.closest('.mobile-cta-bar')) return 'mobile_sticky';
    if (link.closest('footer')) return 'footer';
    return 'unknown';
  };

  /**
   * Determines the location context for an email link click.
   * @param {Element} link - The clicked mailto: link
   * @returns {string} Location identifier for analytics
   */
  const getEmailLocation = (link) => {
    if (link.closest('#contact-text-box')) return 'contact_page';
    if (link.closest('footer')) return 'footer';
    return 'unknown';
  };

  /**
   * Handles click events via delegation.
   * @param {Event} event - The click event
   */
  const handleClick = (event) => {
    // Phone click tracking (tel: links)
    const phoneLink = event.target.closest('a[href^="tel:"]');
    if (phoneLink) {
      const location = getPhoneLocation(phoneLink);
      analytics.logPhoneClick(location);
      // Don't prevent default - let the call go through
      return;
    }

    // Email click tracking (mailto: links)
    const emailLink = event.target.closest('a[href^="mailto:"]');
    if (emailLink) {
      const location = getEmailLocation(emailLink);
      analytics.logEmailClick(location);
      // Don't prevent default - let the email client open
      return;
    }

    const target = event.target.closest('[data-page], [data-action], [data-slide], [data-slide-delta]');
    if (!target) return;

    // CTA secondary link tracking (before navigation)
    if (target.classList.contains('cta-secondary')) {
      analytics.logCtaClick('secondary', target.dataset.page);
    }

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

    // Contact form submission tracking
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', () => {
        // Attach UTM parameters as hidden fields
        tracker.attachToForm(contactForm);

        // Log form submission with relevant data
        const formData = {
          child_age: contactForm.querySelector('[name="child_age"]')?.value || '',
          has_phone: !!contactForm.querySelector('[name="phone"]')?.value,
          has_start_date: !!contactForm.querySelector('[name="start_date"]')?.value
        };
        analytics.logFormSubmit(formData);

        // Don't prevent default - let Formspree handle submission
      });
    }
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

// Initialize UTM tracking first (captures params from URL immediately)
const tracker = Tracker();
tracker.init();

const analytics = Analytics();
const nav = LoggedNavigator(Nav(), analytics);
const slideShow = SlideShow();
const eventController = EventController(nav, slideShow, analytics, tracker);

// Initialize event delegation
eventController.init();

// Show first slide (already visible in HTML, but ensures state is synced)
slideShow.goToSlide(1);

// Log initial page view (matches CONFIG.defaultPage for consistency)
analytics.logPageView(CONFIG.defaultPage);

// Log campaign landing if UTM parameters present
const utmData = tracker.get();
if (Object.keys(utmData).length > 0 && typeof gtag === 'function') {
  gtag('event', 'campaign_landing', {
    event_category: 'marketing',
    ...utmData
  });
}

// Run dev tests in local environment
DevTests().run();
