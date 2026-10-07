document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCopyrightYear();
  
  // Check page context
  const isHomePage = document.querySelector('[data-page="home"]') !== null;
  const isNewsPage = document.querySelector('[data-page="news"]') !== null;
  const isGalleryPage = document.querySelector('[data-page="gallery"]') !== null;

  if (isHomePage) {
    loadAchievements();
    loadNews(3); // Max 3 news on homepage
    loadSponsors();
  } else if (isNewsPage) {
    loadNews(0); // Load all items on news page
  } else if (isGalleryPage) {
    loadPhotogallery();
  }

  initModal();
  initLightbox();
});

// Detect current page language from <html lang="...">
function getCurrentLang() {
  const htmlLang = document.documentElement.getAttribute('lang') || 'it';
  return htmlLang.toLowerCase().startsWith('en') ? 'en' : 'it';
}

// Dynamic copyright year
function initCopyrightYear() {
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// Trophy Cup SVG icon
function getTrophyIconSvg() {
  return `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9C6 13.97 10.03 18 15 18M18 9C18 13.97 13.97 18 9 18M12 18V21M8 21H16M4 4H20V9C20 13.42 16.42 17 12 17C7.58 17 4 13.42 4 9V4Z"/><circle cx="12" cy="9" r="2"/></svg>`;
}

// Navbar logic (fallback if standard header is used without site-header)
function initNavbar() {
  if (document.querySelector('site-header')) return;

  const header = document.querySelector('.header');
  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.nav-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  }
}

// Data fetching utility
async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error loading JSON from ${url}:`, error);
    return null;
  }
}

// Load and render achievements
async function loadAchievements() {
  const container = document.getElementById('achievements-track');
  if (!container) return;

  const isEn = getCurrentLang() === 'en';
  const results = await fetchJSON('content/results.json');
  if (!results || !Array.isArray(results)) {
    const errorMsg = isEn ? 'Unable to load achievements.' : 'Impossibile caricare i risultati.';
    container.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">${errorMsg}</p>`;
    return;
  }

  container.innerHTML = results.map(item => {
    const title = (isEn && item.title_en) ? item.title_en : item.title;
    const location = (isEn && item.location_en) ? item.location_en : item.location;
    const description = (isEn && item.description_en) ? item.description_en : item.description;

    return `
      <article class="achievement-card">
        <div>
          <div class="achievement-icon">${getTrophyIconSvg()}</div>
          <div class="achievement-year"><span class="achievement-year-only">${item.year}</span> — ${location}</div>
          <h3 class="achievement-title">${title}</h3>
        </div>
        <p class="achievement-desc">${description}</p>
      </article>
    `;
  }).join('');

  initAchievementsControls();
}

// Achievements scroll controls
function initAchievementsControls() {
  const track = document.getElementById('achievements-track');
  const prevBtn = document.getElementById('achievements-prev');
  const nextBtn = document.getElementById('achievements-next');

  if (!track || !prevBtn || !nextBtn) return;

  const getScrollAmount = () => {
    const card = track.querySelector('.achievement-card');
    return card ? card.offsetWidth + 20 : 320;
  };

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
  });

  const updateButtonsState = () => {
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    prevBtn.style.opacity = track.scrollLeft <= 5 ? '0.4' : '1';
    prevBtn.style.pointerEvents = track.scrollLeft <= 5 ? 'none' : 'auto';

    nextBtn.style.opacity = track.scrollLeft >= maxScrollLeft - 5 ? '0.4' : '1';
    nextBtn.style.pointerEvents = track.scrollLeft >= maxScrollLeft - 5 ? 'none' : 'auto';
  };

  track.addEventListener('scroll', updateButtonsState);
  window.addEventListener('resize', updateButtonsState);
  updateButtonsState();
}

// Date formatter
function formatDate(dateString, isEn = false) {
  if (!dateString) return '';
  const date = new Date(dateString + (dateString.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(date.getTime())) return dateString;

  if (isEn) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  const formatted = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);

  return formatted.replace(/\b[a-zà-ù]+\b/gi, (word) => {
    const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
    if (months.includes(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });
}

// Load and render news
let allNewsData = [];

async function loadNews(limit = 0) {
  const container = document.getElementById('news-grid');
  if (!container) return;

  const isEn = getCurrentLang() === 'en';
  const newsData = await fetchJSON('content/news.json');
  if (!newsData || !Array.isArray(newsData)) {
    const emptyMsg = isEn ? 'No news available at the moment.' : 'Nessuna notizia disponibile al momento.';
    container.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">${emptyMsg}</p>`;
    return;
  }

  allNewsData = newsData.map(item => {
    const title = (isEn && item.title_en) ? item.title_en : item.title;
    const category = (isEn && item.category_en) ? item.category_en : item.category;
    const summary = (isEn && item.summary_en) ? item.summary_en : item.summary;
    const content = (isEn && item.content_en) ? item.content_en : item.content;

    return {
      ...item,
      displayTitle: title,
      displayCategory: category,
      displaySummary: summary,
      displayContent: content,
      formattedDate: formatDate(item.date, isEn)
    };
  });

  const itemsToRender = limit > 0 ? allNewsData.slice(0, limit) : allNewsData;

  renderNewsCards(itemsToRender, container);

  // Bind Search Filter if present (news page)
  const searchInput = document.getElementById('news-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = allNewsData.filter(item => 
        item.displayTitle.toLowerCase().includes(query) || 
        item.displaySummary.toLowerCase().includes(query) ||
        item.displayCategory.toLowerCase().includes(query)
      );
      renderNewsCards(filtered, container);
    });
  }
}

function renderNewsCards(items, container) {
  const isEn = getCurrentLang() === 'en';
  if (items.length === 0) {
    const noNewsFound = isEn ? 'No news found.' : 'Nessuna notizia trovata.';
    container.innerHTML = `<p style="color:var(--text-muted); padding: 2rem; text-align:center; grid-column: 1/-1;">${noNewsFound}</p>`;
    return;
  }

  const readMoreText = isEn ? 'Read more' : 'Leggi tutto';

  container.innerHTML = items.map(item => `
    <article class="news-card" data-news-id="${item.id}">
      <div class="news-card-img-wrap">
        <img src="${item.image}" alt="${item.displayTitle}" class="news-card-img" loading="lazy" />
        <span class="news-card-category">${item.displayCategory}</span>
      </div>
      <div class="news-card-body">
        <div class="news-card-date">${item.formattedDate || item.date}</div>
        <h3 class="news-card-title">${item.displayTitle}</h3>
        <p class="news-card-excerpt">${item.displaySummary}</p>
        <span class="news-card-readmore">
          ${readMoreText}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </div>
    </article>
  `).join('');

  // Attach click listener for popup modal
  container.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', () => {
      const newsId = card.getAttribute('data-news-id');
      const newsItem = allNewsData.find(n => n.id === newsId);
      if (newsItem) {
        openNewsModal(newsItem);
      }
    });
  });
}

// News modal dialog handler
function initModal() {
  const dialog = document.getElementById('news-modal');
  if (!dialog) return;

  const closeBtn = dialog.querySelector('.modal-close-btn');

  closeBtn?.addEventListener('click', () => dialog.close());

  // Close when clicking on backdrop outside modal-content
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    
    if (!isInDialog || e.target === dialog) {
      dialog.close();
    }
  });

  // Re-enable background scrolling on dialog close
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });
}

function openNewsModal(newsItem) {
  const dialog = document.getElementById('news-modal');
  if (!dialog) return;

  const modalImg = dialog.querySelector('#modal-img');
  const modalCategory = dialog.querySelector('#modal-category');
  const modalDate = dialog.querySelector('#modal-date');
  const modalTitle = dialog.querySelector('#modal-title');
  const modalText = dialog.querySelector('#modal-text');

  if (modalImg) modalImg.src = newsItem.image;
  if (modalCategory) modalCategory.textContent = newsItem.displayCategory || newsItem.category;
  if (modalDate) modalDate.textContent = newsItem.formattedDate || formatDate(newsItem.date, getCurrentLang() === 'en');
  if (modalTitle) modalTitle.textContent = newsItem.displayTitle || newsItem.title;
  if (modalText) modalText.innerHTML = newsItem.displayContent || newsItem.content;

  document.body.classList.add('modal-open');
  dialog.showModal();
}

// Load and render sponsors
async function loadSponsors() {
  const container = document.getElementById('sponsors-grid');
  if (!container) return;

  const isEn = getCurrentLang() === 'en';
  const sponsors = await fetchJSON('content/sponsors.json');
  if (!sponsors || !Array.isArray(sponsors)) {
    const errorMsg = isEn ? 'Unable to load sponsors.' : 'Impossibile caricare i partner.';
    container.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">${errorMsg}</p>`;
    return;
  }

  container.innerHTML = sponsors.map(item => `
    <a href="${item.website || '#'}" ${item.website && item.website !== '#' ? 'target="_blank" rel="noopener"' : ''} class="sponsor-card ${item.tier === 'Main Partner' ? 'main-partner' : ''}" title="${item.name}">
      <img src="${item.logo}" alt="${item.name}" loading="lazy" />
    </a>
  `).join('');
}

// Photogallery loader & auto-discovery
async function loadPhotogallery() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  const isEn = getCurrentLang() === 'en';
  galleryImagesList = [];
  container.innerHTML = ''; // Clear initial "Loading..." message

  const appendPhotoItem = (src) => {
    const index = galleryImagesList.length;
    galleryImagesList.push(src);

    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('data-index', index);
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Photo ${index + 1}`);

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Smilebots Academy Photo ${index + 1}`;
    img.className = 'gallery-img';
    img.loading = 'lazy';

    item.appendChild(img);

    const openHandler = () => {
      const idx = parseInt(item.getAttribute('data-index'), 10);
      if (!isNaN(idx)) openLightboxByIndex(idx);
    };

    item.addEventListener('click', openHandler);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openHandler();
      }
    });

    container.appendChild(item);
  };

  let listImages = [];

  // Strategy 1: Attempt to fetch directory listing if server supports it (Apache/Nginx/etc.)
  try {
    const response = await fetch('/src/photogallery/', { cache: 'no-cache' });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await response.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));
        listImages = links
          .map(a => a.getAttribute('href'))
          .filter(href => href && /^\d+\.jpg$/i.test(href.replace(/^.*[\\/]/, '')))
          .map(href => {
            if (href.startsWith('http') || href.startsWith('/')) return href;
            return '/src/photogallery/' + href.replace(/^\.?\//, '');
          })
          .sort((a, b) => {
            const numA = parseInt(a.replace(/^.*[\\/]/, '').split('.')[0], 10);
            const numB = parseInt(b.replace(/^.*[\\/]/, '').split('.')[0], 10);
            return numA - numB;
          });
      }
    }
  } catch (e) {
    console.debug('Direct directory listing unavailable, checking sequential files:', e);
  }

  // Strategy 2: If directory listing not available, check content/photogallery.json if populated
  if (listImages.length === 0) {
    const manifest = await fetchJSON('content/photogallery.json');
    if (manifest && Array.isArray(manifest) && manifest.length > 0) {
      listImages = manifest.map(img => img.startsWith('/') ? img : '/src/photogallery/' + img);
    }
  }

  // If we already have the full list from directory or manifest, render them immediately
  if (listImages.length > 0) {
    listImages.forEach(src => appendPhotoItem(src));
    return;
  }

  // Strategy 3: Sequentially probe 1.jpg, 2.jpg... and append each one immediately to DOM as it arrives
  let index = 1;
  let keepChecking = true;

  while (keepChecking) {
    const src = `/src/photogallery/${index}.jpg`;
    const exists = await new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });

    if (exists) {
      appendPhotoItem(src);
      index++;
    } else {
      // Stopped at the first non-existent image (e.g. 21.jpg)
      keepChecking = false;
    }
  }

  if (galleryImagesList.length === 0) {
    const emptyMsg = isEn ? 'No pictures available in the gallery yet.' : 'Nessuna foto disponibile nella galleria al momento.';
    container.innerHTML = `<p style="color:var(--text-muted); padding: 2rem; text-align:center; grid-column: 1/-1;">${emptyMsg}</p>`;
  }
}

// Lightbox State
let galleryImagesList = [];
let currentLightboxIndex = -1;

// Lightbox Modal Handler
function initLightbox() {
  const dialog = document.getElementById('lightbox-modal');
  if (!dialog) return;

  const closeBtn = dialog.querySelector('.lightbox-close-btn');
  const prevBtn = dialog.querySelector('#lightbox-prev');
  const nextBtn = dialog.querySelector('#lightbox-next');

  closeBtn?.addEventListener('click', () => dialog.close());
  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });
  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    currentLightboxIndex = -1;
  });

  // Keyboard navigation with ArrowLeft / ArrowRight
  window.addEventListener('keydown', (e) => {
    if (!dialog.open) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateLightbox(1);
    }
  });
}

function openLightboxByIndex(index) {
  const dialog = document.getElementById('lightbox-modal');
  if (!dialog || galleryImagesList.length === 0) return;

  currentLightboxIndex = (index + galleryImagesList.length) % galleryImagesList.length;
  updateLightboxContent();

  if (!dialog.open) {
    document.body.classList.add('modal-open');
    dialog.showModal();
  }
}

function navigateLightbox(direction) {
  if (galleryImagesList.length <= 1) return;
  openLightboxByIndex(currentLightboxIndex + direction);
}

function updateLightboxContent() {
  const dialog = document.getElementById('lightbox-modal');
  if (!dialog || currentLightboxIndex < 0 || currentLightboxIndex >= galleryImagesList.length) return;

  const img = dialog.querySelector('#lightbox-img');
  const counter = dialog.querySelector('#lightbox-counter');
  const prevBtn = dialog.querySelector('#lightbox-prev');
  const nextBtn = dialog.querySelector('#lightbox-next');

  const src = galleryImagesList[currentLightboxIndex];
  if (img) {
    img.src = src;
    img.alt = `Smilebots Academy Photo ${currentLightboxIndex + 1}`;
  }

  if (counter) {
    counter.textContent = `${currentLightboxIndex + 1} / ${galleryImagesList.length}`;
  }

  const showNav = galleryImagesList.length > 1;
  if (prevBtn) prevBtn.style.display = showNav ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = showNav ? 'flex' : 'none';
}
