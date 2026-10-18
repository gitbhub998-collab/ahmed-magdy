const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const loader = $('#loader');
const percent = $('#percent');
const loadingBar = $('#loading-bar');
const loadingTrack = loadingBar?.parentElement;
const loadingStatus = $('#loadingStatus');
const helloText = $('#helloText');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const minimumLoaderDuration = 3500;

if (loader) {
  const loaderStartedAt = performance.now();
  const header = $('header');
  const main = $('main');
  const shutters = [...loader.querySelectorAll('.loader-shutter')];
  const heroImage = $('.hero-portrait');
  const backgroundImage = new Image();
  header?.setAttribute('inert', '');
  main?.setAttribute('inert', '');
  document.body.classList.add('site-loading');

  const waitForImage = (image, source) => new Promise(resolve => {
    let settled = false;
    const finish = loaded => {
      if (settled) return;
      settled = true;
      resolve({ loaded });
    };
    if (!image) {
      finish(false);
      return;
    }
    if (image.complete && image.currentSrc) {
      finish(image.naturalWidth > 0);
      return;
    }
    image.addEventListener('load', () => finish(image.naturalWidth > 0), { once: true });
    image.addEventListener('error', () => finish(false), { once: true });
    if (source) image.src = source;
  });

  let completedTasks = 0;
  const loadingTasks = [
    ['Profile photo', waitForImage(heroImage, null)],
    ['Railway background', waitForImage(backgroundImage, new URL('assets/back.avif', document.baseURI).href)],
    ['Page resources', document.readyState === 'complete'
      ? Promise.resolve({ loaded: true })
      : new Promise(resolve => window.addEventListener('load', () => resolve({ loaded: true }), { once: true }))],
    ['Typography', document.fonts
      ? document.fonts.ready.then(() => ({ loaded: true }), () => ({ loaded: false }))
      : Promise.resolve({ loaded: true })]
  ];
  const updateLoadingProgress = () => {
    const progress = Math.round(completedTasks / loadingTasks.length * 100);
    if (percent) percent.textContent = `${progress}%`;
    if (loadingBar) loadingBar.style.width = `${progress}%`;
    loadingTrack?.setAttribute('aria-valuenow', String(progress));
    if (loadingStatus) loadingStatus.textContent = `LOADING RESOURCES ${completedTasks} / ${loadingTasks.length}`;
  };

  const typeHello = () => new Promise(resolve => {
    if (!helloText || prefersReducedMotion.matches) {
      if (helloText) helloText.textContent = 'hello';
      resolve();
      return;
    }

    const greeting = 'hello';
    let character = 0;
    const typeNextCharacter = () => {
      helloText.textContent = greeting.slice(0, ++character);
      if (character < greeting.length) {
        window.setTimeout(typeNextCharacter, 115);
      } else {
        resolve();
      }
    };
    typeNextCharacter();
  });

  const finishLoading = failedTasks => {
    if (failedTasks.length) {
      console.error(`Portfolio resources failed to load: ${failedTasks.join(', ')}`);
      if (loadingStatus) loadingStatus.textContent = 'SOME VISUALS COULD NOT BE LOADED';
    } else if (loadingStatus) {
      loadingStatus.textContent = 'PORTFOLIO READY';
    }

    let siteRevealed = false;
    const revealSite = () => {
      if (siteRevealed) return;
      siteRevealed = true;
      loader.remove();
      document.body.classList.remove('site-loading');
      header?.removeAttribute('inert');
      main?.removeAttribute('inert');
    };

    if (prefersReducedMotion.matches || shutters.length === 0) {
      revealSite();
      return;
    }

    let remainingShutters = shutters.length;
    const onShutterOpen = event => {
      if (event.propertyName !== 'transform') return;
      remainingShutters--;
      if (remainingShutters === 0) revealSite();
    };
    shutters.forEach(shutter => shutter.addEventListener('transitionend', onShutterOpen));
    loader.getBoundingClientRect();
    window.setTimeout(() => {
      loader.classList.add('is-opening');
      window.setTimeout(revealSite, 1200);
    }, 30);
  };

  const trackedTasks = loadingTasks.map(async ([name, task]) => {
    const result = await task;
    completedTasks++;
    updateLoadingProgress();
    return result.loaded ? null : name;
  });
  updateLoadingProgress();
  Promise.all([typeHello(), Promise.all(trackedTasks)])
    .then(([, results]) => {
      if (prefersReducedMotion.matches) {
        finishLoading(results.filter(Boolean));
        return;
      }
      const remainingTime = Math.max(0, minimumLoaderDuration - (performance.now() - loaderStartedAt));
      window.setTimeout(() => finishLoading(results.filter(Boolean)), remainingTime);
    });
}

const currentYear = $('#currentYear');
if (currentYear) currentYear.textContent = new Date().getFullYear();

const menu = $('#menuPanel');
const menuButton = $('#menuButton');
const closeMenuButton = $('#closeMenu');
const menuBackdrop = $('#menuBackdrop');
let lastFocusedElement = null;

const setMenuState = isOpen => {
  if (!menu || !menuButton) return;
  menu.classList.toggle('open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
  menu.setAttribute('aria-hidden', String(!isOpen));
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  menu.toggleAttribute('inert', !isOpen);
  if (isOpen) {
    lastFocusedElement = document.activeElement;
    setTimeout(() => closeMenuButton?.focus(), 150);
  } else if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
};

menuButton?.addEventListener('click', () => setMenuState(!menu?.classList.contains('open')));
closeMenuButton?.addEventListener('click', () => setMenuState(false));
menuBackdrop?.addEventListener('click', () => setMenuState(false));

$$('[data-close]').forEach(link => link.addEventListener('click', () => {
  const target = document.querySelector(link.getAttribute('href'));
  setMenuState(false);
  if (target instanceof HTMLElement) {
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
}));

document.addEventListener('keydown', event => {
  if (!menu?.classList.contains('open')) return;
  if (event.key === 'Escape') {
    setMenuState(false);
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = menu.querySelectorAll('a[href], button:not([disabled])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

$$('.service-head').forEach(button => button.addEventListener('click', () => {
  const item = button.closest('.service-item');
  const body = document.getElementById(button.getAttribute('aria-controls'));
  if (!item || !body) return;
  const isExpanded = item.classList.toggle('active');
  button.setAttribute('aria-expanded', String(isExpanded));
  body.setAttribute('aria-hidden', String(!isExpanded));
}));

const preview = $('#previewImage');
const previewFrame = preview?.closest('.work-preview');
const previewTitle = $('#previewTitle');
const previewMessage = $('#previewMessage');
let activeProjectRow = null;
let hoveredProjectRow = null;
let focusedProjectRow = null;
let preferredProjectRow = null;
let previewRequest = 0;

const showProject = row => {
  const request = ++previewRequest;
  const src = row.dataset.image;
  if (!preview || !previewFrame) return;

  activeProjectRow = row;
  const title = row.querySelector('h3')?.textContent.trim();
  preview.classList.remove('show');
  preview.removeAttribute('src');
  previewFrame.classList.remove('has-image');
  preview.setAttribute('aria-hidden', 'true');
  preview.alt = title ? `${title} project` : 'Project preview';
  if (previewTitle) previewTitle.textContent = title || 'PROJECT PREVIEW';

  if (!src) {
    if (previewMessage) previewMessage.textContent = 'PROJECT IMAGE NOT AVAILABLE';
    return;
  }

  if (previewMessage) previewMessage.textContent = 'LOADING PROJECT IMAGE';

  const requestedImage = new Image();
  const showLoadedPreview = () => {
    if (request !== previewRequest || activeProjectRow !== row) return;
    preview.src = src;
    previewFrame.classList.add('has-image');
    preview.classList.add('show');
    preview.setAttribute('aria-hidden', 'false');
    if (previewMessage) previewMessage.textContent = 'PREVIEW READY';
  };
  requestedImage.onload = showLoadedPreview;
  requestedImage.onerror = () => {
    if (request === previewRequest && activeProjectRow === row) {
      preview.classList.remove('show');
      previewFrame.classList.remove('has-image');
      preview.setAttribute('aria-hidden', 'true');
      if (previewMessage) previewMessage.textContent = 'PROJECT IMAGE COULD NOT BE LOADED';
    }
  };
  requestedImage.src = src;
  if (requestedImage.complete && requestedImage.naturalWidth > 0) showLoadedPreview();
};

const hidePreview = () => {
  if (!activeProjectRow || !preview) return;
  previewRequest++;
  activeProjectRow = null;
  preview.classList.remove('show');
  previewFrame?.classList.remove('has-image');
  preview.setAttribute('aria-hidden', 'true');
  if (previewTitle) previewTitle.textContent = 'SELECT A PROJECT';
  if (previewMessage) previewMessage.textContent = 'CHOOSE A PROJECT TO VIEW ITS IMAGE';
};

const updatePreview = () => {
  const row = preferredProjectRow || focusedProjectRow || hoveredProjectRow;
  if (row) showProject(row);
  else hidePreview();
};

$$('.work-row').forEach(row => {
  row.addEventListener('mouseenter', () => {
    hoveredProjectRow = row;
    preferredProjectRow = row;
    updatePreview();
  });
  row.addEventListener('mouseleave', () => {
    hoveredProjectRow = null;
    if (preferredProjectRow === row) preferredProjectRow = focusedProjectRow;
    updatePreview();
  });
  row.addEventListener('focus', () => {
    focusedProjectRow = row;
    preferredProjectRow = row;
    updatePreview();
  });
  row.addEventListener('blur', () => {
    focusedProjectRow = null;
    if (preferredProjectRow === row) preferredProjectRow = hoveredProjectRow;
    updatePreview();
  });
  row.addEventListener('click', event => {
    event.preventDefault();
    focusedProjectRow = row;
    preferredProjectRow = row;
    updatePreview();
    $('.work-preview')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest'
    });
  });
});

const sections = $$('main > section[id]');
const navLinks = $$('.menu-panel nav a[href^="#"], .desktop-nav a[href^="#"]');
const updateActiveNavigation = () => {
  const anchor = window.innerHeight * .35;
  let activeSection = sections[0];
  sections.forEach(section => {
    if (section.getBoundingClientRect().top <= anchor) activeSection = section;
  });
  navLinks.forEach(link => {
    if (link.getAttribute('href') === `#${activeSection?.id}`) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const backToTop = $('#backToTop');
let scrollQueued = false;
const updateScrollState = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(100, (window.scrollY / maxScroll) * 100) : 0;
  document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
  document.body.classList.toggle('scrolled', window.scrollY > 30);
  backToTop?.classList.toggle('visible', window.scrollY > 500);
  updateActiveNavigation();
  scrollQueued = false;
};

window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  window.requestAnimationFrame(updateScrollState);
}, { passive: true });
window.addEventListener('hashchange', updateActiveNavigation);
updateScrollState();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('revealed');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .08, rootMargin: '0px 0px -35px 0px' });
$$('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${(index % 4) * 22}ms`;
  revealObserver.observe(element);
});

const deferredImages = $$('img[data-src]');
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const image = entry.target;
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
      imageObserver.unobserve(image);
    });
  }, { rootMargin: '500px 0px' });
  deferredImages.forEach(image => imageObserver.observe(image));
} else {
  deferredImages.forEach(image => {
    image.src = image.dataset.src;
    image.removeAttribute('data-src');
  });
}
