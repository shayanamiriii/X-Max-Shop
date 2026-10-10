(function () {
  'use strict';

  const HOVER_DELAY_OPEN = 100;
  const HOVER_DELAY_CLOSE = 180;
  const MOBILE_BREAKPOINT = 768;

  const header = document.querySelector('#site-header');
  const nav = document.querySelector('.main-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navOverlay = document.querySelector('#nav-overlay');
  const navItems = document.querySelectorAll('.nav-item--has-mega, .nav-item--has-dropdown');
  const nestedMenus = document.querySelectorAll('.X-MAX-SHOP--nested');

  let openTimer = null;
  let closeTimer = null;
  let activeDropdown = null;

  const isMobile = () => window.innerWidth < MOBILE_BREAKPOINT;

  function toggleMobileNav(forceOpen) {
    const isOpen = forceOpen ?? navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navMenu.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('nav-locked', isOpen);

    if (!isOpen) {
      closeAllDropdowns();
    }
  }

  function getPanel(item) {
    return item.querySelector('.X-MAX-SHOP, .dropdown-menu');
  }

  function getTrigger(item) {
    return item.querySelector('.nav-link--trigger');
  }

  function isXMAX(panel) {
    return panel?.classList.contains('X-MAX-SHOP');
  }

  function showOverlay() {
    if (isMobile() || !navOverlay) return;
    navOverlay.removeAttribute('hidden');
    requestAnimationFrame(() => navOverlay.classList.add('is-visible'));
  }

  function hideOverlay() {
    if (!navOverlay) return;
    navOverlay.classList.remove('is-visible');
    const onEnd = () => {
      if (!navOverlay.classList.contains('is-visible')) {
        navOverlay.setAttribute('hidden', '');
      }
      navOverlay.removeEventListener('transitionend', onEnd);
    };
    navOverlay.addEventListener('transitionend', onEnd);
  }

  function openDropdown(item) {
    if (activeDropdown && activeDropdown !== item) {
      closeDropdown(activeDropdown, false);
    }

    const panel = getPanel(item);
    const trigger = getTrigger(item);
    if (!panel || !trigger) return;

    panel.removeAttribute('hidden');
    requestAnimationFrame(() => panel.classList.add('is-open'));
    trigger.setAttribute('aria-expanded', 'true');
    item.classList.add(item.classList.contains('nav-item--has-mega') ? 'is-mega-open' : 'is-dropdown-open');
    activeDropdown = item;

    if (isXMAX(panel) && !isMobile()) {
      showOverlay();
    }
  }

  function closeDropdown(item, hideOverlayFlag = true) {
    const panel = getPanel(item);
    const trigger = getTrigger(item);
    if (!panel || !trigger) return;

    panel.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    item.classList.remove('is-mega-open', 'is-dropdown-open');

    const onEnd = () => {
      if (!panel.classList.contains('is-open')) {
        panel.setAttribute('hidden', '');
      }
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd);

    if (activeDropdown === item) {
      activeDropdown = null;
    }

    if (hideOverlayFlag && !isMobile()) {
      hideOverlay();
    }
  }

  function closeAllDropdowns() {
    navItems.forEach((item) => closeDropdown(item, false));
    hideOverlay();
  }

  function clearTimers() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    openTimer = null;
    closeTimer = null;
  }

  function handleMouseEnter(item) {
    if (isMobile()) return;
    clearTimers();
    openTimer = setTimeout(() => openDropdown(item), HOVER_DELAY_OPEN);
  }

  function handleMouseLeave(item) {
    if (isMobile()) return;
    clearTimers();
    closeTimer = setTimeout(() => closeDropdown(item), HOVER_DELAY_CLOSE);
  }

  function handleTriggerClick(e, item) {
    if (!isMobile()) return;

    e.preventDefault();
    const panel = getPanel(item);
    const isOpen = panel?.classList.contains('is-open');

    closeAllDropdowns();
    if (!isOpen) {
      openDropdown(item);
    }
  }

  function handleTriggerKeydown(e, item) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();

    const panel = getPanel(item);
    const isOpen = panel?.classList.contains('is-open');

    if (isMobile()) {
      closeAllDropdowns();
      if (!isOpen) openDropdown(item);
    } else {
      isOpen ? closeDropdown(item) : openDropdown(item);
    }
  }

  function handleGlobalKeydown(e) {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      if (navMenu.classList.contains('is-open')) {
        toggleMobileNav(false);
        navToggle.focus();
      }
    }
  }

  function handleClickOutside(e) {
    if (!nav.contains(e.target) && e.target !== navOverlay) {
      closeAllDropdowns();
      if (isMobile() && navMenu.classList.contains('is-open')) {
        toggleMobileNav(false);
      }
    }
  }

  function handleResize() {
    clearTimers();
    if (!isMobile()) {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-locked');
    }
    closeAllDropdowns();
  }

  function handleScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);

    if (!isMobile() && activeDropdown) {
      closeAllDropdowns();
    }
  }

  // --- Nested panel switching ---
  function activateNestedPanel(menu, panelId) {
    const cats = menu.querySelectorAll('.mega-nested__cat');
    const panels = menu.querySelectorAll('.mega-nested__panel');

    cats.forEach((cat) => {
      const isTarget = cat.dataset.panel === panelId;
      cat.classList.toggle('is-active', isTarget);
      cat.setAttribute('aria-expanded', String(isTarget));
    });

    panels.forEach((panel) => {
      const isTarget = panel.id === panelId;
      panel.classList.toggle('is-active', isTarget);
      if (isMobile()) {
        if (isTarget) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      } else {
        panel.removeAttribute('hidden');
      }
    });
  }

  function initNestedMenu(menu) {
    const cats = menu.querySelectorAll('.mega-nested__cat');
    if (!cats.length) return;

    const firstPanelId = cats[0].dataset.panel;
    activateNestedPanel(menu, firstPanelId);

    cats.forEach((cat) => {
      const panelId = cat.dataset.panel;

      cat.addEventListener('mouseenter', () => {
        if (!isMobile()) {
          activateNestedPanel(menu, panelId);
        }
      });

      cat.addEventListener('click', (e) => {
        if (!isMobile()) return;
        e.preventDefault();
        e.stopPropagation();
        const isActive = cat.classList.contains('is-active');
        if (isActive) {
          cat.classList.remove('is-active');
          cat.setAttribute('aria-expanded', 'false');
          const panel = menu.querySelector(`#${panelId}`);
          if (panel) {
            panel.classList.remove('is-active');
            panel.setAttribute('hidden', '');
          }
          return;
        }
        activateNestedPanel(menu, panelId);
      });

      cat.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        activateNestedPanel(menu, panelId);
      });
    });
  }

  navToggle.addEventListener('click', () => toggleMobileNav());

  if (navOverlay) {
    navOverlay.addEventListener('click', closeAllDropdowns);
  }

  navItems.forEach((item) => {
    const trigger = getTrigger(item);
    const panel = getPanel(item);

    item.addEventListener('mouseenter', () => handleMouseEnter(item));
    item.addEventListener('mouseleave', () => handleMouseLeave(item));

    trigger.addEventListener('click', (e) => handleTriggerClick(e, item));
    trigger.addEventListener('keydown', (e) => handleTriggerKeydown(e, item));

    panel.addEventListener('mouseenter', () => {
      if (!isMobile()) clearTimers();
    });
    panel.addEventListener('mouseleave', () => handleMouseLeave(item));
  });

  nestedMenus.forEach(initNestedMenu);

  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
})();
