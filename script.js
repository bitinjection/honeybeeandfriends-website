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
    'philosophy-background': '/philosophy',
    'gallery-background': '/gallery',
    'schedule-background': '/schedule',
    'menu-background': '/menu',
    'pricing-background': '/pricing',
    'contact-background': '/contact'
  },
  // URL hash to page ID mapping for routing
  routes: {
    '': 'home-page',
    'home': 'home-page',
    'about': 'about-background',
    'philosophy': 'philosophy-background',
    'gallery': 'gallery-background',
    'schedule': 'schedule-background',
    'menu': 'menu-background',
    'pricing': 'pricing-background',
    'contact': 'contact-background'
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

/**
 * Converts a URL hash to a page ID.
 * @param {string} hash - The hash without the # prefix
 * @returns {string} The corresponding page ID or default page
 */
const hashToPageId = (hash) =>
  CONFIG.routes[hash.toLowerCase()] || CONFIG.defaultPage;

/**
 * Converts a page ID to a URL hash.
 * @param {string} pageId - The page identifier
 * @returns {string} The corresponding hash (without #) or empty string for home
 */
const pageIdToHash = (pageId) => {
  const entry = Object.entries(CONFIG.routes)
    .find(([hash, id]) => id === pageId && hash !== '');
  return entry ? entry[0] : '';
};

// =============================================================================
// Analytics Module (GA4)
// =============================================================================

/**
 * Creates an analytics tracker for GA4.
 * Note: gtag is initialized in the HTML head via Google's snippet.
 */
function Analytics(getUtmData = () => ({})) {
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
      page_path: pagePath,
      ...getUtmData()
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
      transport_type: 'beacon',
      ...getUtmData()
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
      transport_type: 'beacon',
      ...getUtmData()
    });
  };

  /**
   * Logs a form submission conversion event.
   * Uses beacon transport to ensure delivery before form navigation.
   * Fires both GA4 event and Google Ads conversion.
   * @param {Object} formData - Form field data to include
   */
  const logFormSubmit = (formData = {}) => {
    if (!isGtagAvailable()) return;

    // GA4 event
    gtag('event', 'form_submit', {
      event_category: 'conversion',
      form_name: 'contact_form',
      transport_type: 'beacon',
      ...getUtmData(),
      ...formData
    });

    // Google Ads conversion
    gtag('event', 'conversion', {
      send_to: 'AW-10946914652/eYfHCK2a9OcbENzS8uMo',
      value: 100.00,
      currency: 'USD',
      transport_type: 'beacon'
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
// Router Module (URL Hash Navigation)
// =============================================================================

/**
 * Creates a router that syncs navigation with URL hash.
 * Enables shareable URLs and browser back/forward support.
 * @param {Object} navigator - The base Nav instance for page switching
 */
function Router(navigator) {
  /**
   * Extracts the hash from the current URL (without # prefix).
   * @returns {string} The current hash or empty string
   */
  const getHash = () => window.location.hash.slice(1);

  /**
   * Navigates to a page and optionally updates the URL.
   * @param {string} pageId - The page to navigate to
   * @param {boolean} updateHistory - Whether to push to browser history
   */
  const navigate = (pageId, updateHistory = true) => {
    navigator.swapMiddle(pageId);

    if (updateHistory) {
      const hash = pageIdToHash(pageId);
      const newUrl = hash ? `#${hash}` : window.location.pathname;
      history.pushState({ pageId }, '', newUrl);
    }
  };

  /**
   * Handles browser back/forward navigation.
   */
  const handlePopState = () => {
    const pageId = hashToPageId(getHash());
    navigate(pageId, false);
  };

  /**
   * Initializes the router - sets up event listeners and handles initial URL.
   */
  const init = () => {
    window.addEventListener('popstate', handlePopState);

    // Handle initial URL hash on page load
    const hash = getHash();
    if (hash) {
      const pageId = hashToPageId(hash);
      if (pageId !== CONFIG.defaultPage) {
        navigate(pageId, false);
      }
    }
  };

  return Object.freeze({
    navigate,
    init
  });
}

/**
 * Decorator that syncs navigation with URL hash.
 * @param {Object} navigator - The Nav instance to wrap
 * @param {Object} router - The Router instance to use
 */
function RoutedNavigator(navigator, router) {
  const swapMiddle = (pageId) => {
    router.navigate(pageId);
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

  // Check if slideshow elements exist - if not, return a no-op interface
  if (getSlides().length === 0) {
    return Object.freeze({
      advance: () => {},
      goToSlide: () => {},
      destroy: () => {}
    });
  }

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
   * Toggles the expanded state of a testimonial review.
   * @param {Element} button - The toggle button that was clicked
   */
  const toggleReview = (button) => {
    const card = button.closest('.testimonial-card');
    if (!card) return;

    const preview = card.querySelector('.testimonial-preview');
    const full = card.querySelector('.testimonial-full');
    const toggleText = button.querySelector('.toggle-text');

    if (!full) return; // Short review without full text

    const isExpanded = card.classList.contains('expanded');

    if (isExpanded) {
      // Collapse
      card.classList.remove('expanded');
      show(preview);
      hide(full);
      if (toggleText) toggleText.textContent = 'Read full review';
    } else {
      // Expand
      card.classList.add('expanded');
      hide(preview);
      show(full);
      if (toggleText) toggleText.textContent = 'Show less';
    }
  };

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
    // YouTube facade - load iframe on click
    const youtubeFacade = event.target.closest('.youtube-facade');
    if (youtubeFacade) {
      event.preventDefault();
      const wrapper = youtubeFacade.closest('.video-wrapper');
      const iframe = wrapper?.querySelector('iframe');
      if (iframe && iframe.dataset.src) {
        iframe.src = iframe.dataset.src;
        iframe.classList.remove(CONFIG.classes.hidden);
        youtubeFacade.classList.add(CONFIG.classes.hidden);
      }
      return;
    }

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
        'toggle-sidebar': () => nav.toggleSideBar(),
        'toggle-review': () => toggleReview(target)
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

    // Contact form AJAX submission with conversion tracking on success only
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitBtn = contactForm.querySelector('.form-submit-btn');
        const statusEl = contactForm.querySelector('.form-status');

        // Disable button and show loading state
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.originalText = submitBtn.textContent;
          submitBtn.textContent = 'Sending...';
        }

        // Clear previous status
        if (statusEl) {
          statusEl.className = 'form-status';
          statusEl.textContent = '';
        }

        // Collect analytics data before submission
        const analyticsData = {
          child_age: contactForm.querySelector('[name="child_age"]')?.value || '',
          has_phone: !!contactForm.querySelector('[name="phone"]')?.value,
          has_start_date: !!contactForm.querySelector('[name="start_date"]')?.value
        };

        // Attach UTM parameters to form before submission
        tracker.attachToForm(contactForm);

        try {
          const response = await fetch(contactForm.action, {
            method: 'POST',
            body: new FormData(contactForm),
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            // SUCCESS - Form was accepted by Formspree
            // Only now do we fire conversion tracking
            analytics.logFormSubmit(analyticsData);

            // Show success message
            if (statusEl) {
              statusEl.className = 'form-status form-status--success';
              statusEl.textContent = 'Thank you! Your message has been sent. We\'ll get back to you within 24 hours.';
            }

            // Reset form
            contactForm.reset();
          } else {
            // Handle Formspree error response
            const data = await response.json();
            const errorMsg = data.errors
              ? data.errors.map(e => e.message).join(', ')
              : 'Something went wrong. Please try again.';

            if (statusEl) {
              statusEl.className = 'form-status form-status--error';
              statusEl.textContent = errorMsg;
            }
          }
        } catch (error) {
          // Network error or other failure
          if (statusEl) {
            statusEl.className = 'form-status form-status--error';
            statusEl.textContent = 'Network error. Please check your connection and try again.';
          }
        } finally {
          // Re-enable button
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText || 'Send Message';
          }
        }
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
 * Test runner for local development.
 * Tests are organized by category and named as documentation.
 */
function DevTests() {
  const isLocalEnvironment = () =>
    CONFIG.localHosts.includes(location.hostname);

  // Helper: create temporary DOM element for testing
  const createTestElement = (className = '') => {
    const el = document.createElement('div');
    if (className) el.className = className;
    return el;
  };

  const tests = [
    // =========================================================================
    // Pure Functions - hashToPageId
    // =========================================================================
    {
      category: 'Pure Functions',
      name: 'hashToPageId: returns correct pageId for valid hash',
      test: () => hashToPageId('gallery') === 'gallery-background'
    },
    {
      category: 'Pure Functions',
      name: 'hashToPageId: returns default page for empty hash',
      test: () => hashToPageId('') === CONFIG.defaultPage
    },
    {
      category: 'Pure Functions',
      name: 'hashToPageId: returns default page for unknown hash',
      test: () => hashToPageId('nonexistent') === CONFIG.defaultPage
    },
    {
      category: 'Pure Functions',
      name: 'hashToPageId: handles case-insensitive input',
      test: () => hashToPageId('GALLERY') === 'gallery-background'
    },

    // =========================================================================
    // Pure Functions - pageIdToHash
    // =========================================================================
    {
      category: 'Pure Functions',
      name: 'pageIdToHash: returns correct hash for valid pageId',
      test: () => pageIdToHash('gallery-background') === 'gallery'
    },
    {
      category: 'Pure Functions',
      name: 'pageIdToHash: returns "home" for home-page',
      test: () => pageIdToHash('home-page') === 'home'
    },
    {
      category: 'Pure Functions',
      name: 'pageIdToHash: returns empty string for unknown pageId',
      test: () => pageIdToHash('unknown-page') === ''
    },

    // =========================================================================
    // Utilities - show, hide, isHidden
    // =========================================================================
    {
      category: 'Utilities',
      name: 'show: removes is-hidden class from element',
      test: () => {
        const el = createTestElement('is-hidden');
        show(el);
        return !el.classList.contains('is-hidden');
      }
    },
    {
      category: 'Utilities',
      name: 'hide: adds is-hidden class to element',
      test: () => {
        const el = createTestElement();
        hide(el);
        return el.classList.contains('is-hidden');
      }
    },
    {
      category: 'Utilities',
      name: 'isHidden: returns true for hidden element',
      test: () => {
        const el = createTestElement('is-hidden');
        return isHidden(el) === true;
      }
    },
    {
      category: 'Utilities',
      name: 'isHidden: returns false for visible element',
      test: () => {
        const el = createTestElement();
        return isHidden(el) === false;
      }
    },
    {
      category: 'Utilities',
      name: 'show/hide: handle null element gracefully',
      test: () => {
        show(null);
        hide(null);
        return true; // No exception thrown
      }
    },

    // =========================================================================
    // CONFIG Validation
    // =========================================================================
    {
      category: 'CONFIG',
      name: 'CONFIG: all pagePaths have corresponding route',
      test: () => {
        const routePageIds = Object.values(CONFIG.routes);
        const pathPageIds = Object.keys(CONFIG.pagePaths);
        return pathPageIds.every(id => routePageIds.includes(id));
      }
    },
    {
      category: 'CONFIG',
      name: 'CONFIG: routes.home maps to defaultPage',
      test: () => CONFIG.routes['home'] === CONFIG.defaultPage
    },

    // =========================================================================
    // Integration - DOM state checks
    // =========================================================================
    {
      category: 'Integration',
      name: 'DOM: gtag analytics is available',
      test: () => typeof gtag === 'function'
    },
    {
      category: 'Integration',
      name: 'DOM: nav elements with data-page exist',
      test: () => document.querySelectorAll('[data-page]').length > 0
    },
    {
      category: 'Integration',
      name: 'DOM: video tour container exists',
      test: () => document.querySelector('.video-tour-container') !== null
    },
    {
      category: 'Integration',
      name: 'DOM: video tour has ARIA role="region"',
      test: () => document.querySelector('.video-tour-container[role="region"]') !== null
    },
    {
      category: 'Integration',
      name: 'DOM: active nav uses aria-current="page"',
      test: () => document.querySelector('[data-page][aria-current="page"]') !== null
    },
    {
      category: 'Integration',
      name: 'DOM: hidden pages use is-hidden class',
      test: () => document.querySelectorAll('.middle-content.is-hidden').length > 0
    },

    // =========================================================================
    // Gallery - video tour in gallery section
    // =========================================================================
    {
      category: 'Gallery',
      name: 'DOM: gallery section contains video tour',
      test: () => {
        const gallery = document.getElementById('gallery-background');
        return gallery && gallery.querySelector('.video-tour-container') !== null;
      }
    },
    {
      category: 'Gallery',
      name: 'DOM: gallery video has correct YouTube embed',
      test: () => {
        const gallery = document.getElementById('gallery-background');
        if (!gallery) return false;
        const iframe = gallery.querySelector('.video-tour-container iframe');
        return iframe && iframe.src.includes('youtube.com/embed/vlqsKMn97VE');
      }
    },
    {
      category: 'Gallery',
      name: 'Accessibility: gallery video has ARIA region',
      test: () => {
        const gallery = document.getElementById('gallery-background');
        if (!gallery) return false;
        const video = gallery.querySelector('.video-tour-container');
        return video && video.getAttribute('role') === 'region';
      }
    },
    {
      category: 'Gallery',
      name: 'DOM: gallery still contains image thumbnails',
      test: () => {
        const gallery = document.getElementById('gallery-background');
        if (!gallery) return false;
        const images = gallery.querySelectorAll('.gallery img');
        return images.length > 0;
      }
    },

    // =========================================================================
    // Contact Section - form-first hero layout
    // =========================================================================
    {
      category: 'Contact Section',
      name: 'DOM: contact form exists and has Formspree action',
      test: () => {
        const form = document.getElementById('contact-form');
        return form && form.action.includes('formspree.io');
      }
    },
    {
      category: 'Contact Section',
      name: 'DOM: contact info bar exists',
      test: () => document.querySelector('.contact-info-bar') !== null
    },
    {
      category: 'Contact Section',
      name: 'DOM: phone link in contact bar has tel: href',
      test: () => {
        const phoneLink = document.querySelector('.contact-info-bar a[href^="tel:"]');
        return phoneLink !== null;
      }
    },
    {
      category: 'Contact Section',
      name: 'DOM: email link in contact bar has mailto: href',
      test: () => {
        const emailLink = document.querySelector('.contact-info-bar a[href^="mailto:"]');
        return emailLink !== null;
      }
    },
    {
      category: 'Contact Section',
      name: 'Accessibility: required form fields have labels',
      test: () => {
        const form = document.getElementById('contact-form');
        if (!form) return false;
        const inputs = form.querySelectorAll('input[required], select[required]');
        return Array.from(inputs).every(input => {
          const label = form.querySelector(`label[for="${input.id}"]`);
          return label !== null;
        });
      }
    }
  ];

  /**
   * Runs all tests, grouped by category.
   */
  const run = () => {
    if (!isLocalEnvironment()) return;

    console.log('=== Dev Tests ===\n');

    // Group tests by category
    const categories = [...new Set(tests.map(t => t.category))];
    let totalPassed = 0;
    let totalTests = 0;

    categories.forEach(category => {
      console.log(`${category}:`);
      const categoryTests = tests.filter(t => t.category === category);

      categoryTests.forEach(({ name, test }) => {
        totalTests++;
        let passed = false;
        try {
          passed = test();
        } catch (e) {
          console.log(`  FAIL: ${name}`);
          console.log(`        Error: ${e.message}`);
          return;
        }

        if (passed) {
          totalPassed++;
          console.log(`  PASS: ${name}`);
        } else {
          console.log(`  FAIL: ${name}`);
        }
      });

      console.log('');
    });

    console.log(`=== ${totalPassed}/${totalTests} tests passed ===`);
  };

  return Object.freeze({ run });
}

// =============================================================================
// Initialization
// =============================================================================

// Initialize UTM tracking first (captures params from URL immediately)
const tracker = Tracker();
tracker.init();

// Build navigation with decorator chain: Nav → RoutedNavigator → LoggedNavigator
const analytics = Analytics(tracker.get);
const baseNav = Nav();
const router = Router(baseNav);
const routedNav = RoutedNavigator(baseNav, router);
const nav = LoggedNavigator(routedNav, analytics);

const slideShow = SlideShow();
const eventController = EventController(nav, slideShow, analytics, tracker);

// Initialize event delegation
eventController.init();

// Initialize router (handles URL hash and sets up popstate listener)
router.init();

// Show first slide (already visible in HTML, but ensures state is synced)
slideShow.goToSlide(1);

// Log initial page view (router.init may have navigated based on URL hash)
const initialHash = window.location.hash.slice(1);
const initialPage = initialHash ? hashToPageId(initialHash) : CONFIG.defaultPage;
analytics.logPageView(initialPage);

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
