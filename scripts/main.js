document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCopyrightYear();
  
  // Check page context
  const isHomePage = document.querySelector('[data-page="home"]') !== null;
  const isNewsPage = document.querySelector('[data-page="news"]') !== null;

  if (isHomePage) {
    loadAchievements();
    loadNews(3); // Max 3 news on homepage
    loadSponsors();
  } else if (isNewsPage) {
    loadNews(0); // Load all items on news page
  }

  initModal();
});

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

// Navbar logic
function initNavbar() {
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

  const results = await fetchJSON('content/results.json');
  if (!results || !Array.isArray(results)) {
    container.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">Impossibile caricare i risultati.</p>`;
    return;
  }

  container.innerHTML = results.map(item => `
    <article class="achievement-card">
      <div>
        <div class="achievement-icon">${getTrophyIconSvg()}</div>
        <div class="achievement-year">${item.year} — ${item.location}</div>
        <h3 class="achievement-title">${item.title}</h3>
      </div>
      <p class="achievement-desc">${item.description}</p>
    </article>
  `).join('');

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
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + (dateString.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(date.getTime())) return dateString;

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

  const newsData = await fetchJSON('content/news.json');
  if (!newsData || !Array.isArray(newsData)) {
    container.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">Nessuna notizia disponibile al momento.</p>`;
    return;
  }

  allNewsData = newsData.map(item => ({
    ...item,
    formattedDate: item.formattedDate || formatDate(item.date)
  }));

  const itemsToRender = limit > 0 ? allNewsData.slice(0, limit) : allNewsData;

  renderNewsCards(itemsToRender, container);

  // Bind Search Filter if present (news page)
  const searchInput = document.getElementById('news-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = allNewsData.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.summary.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
      renderNewsCards(filtered, container);
    });
  }
}

function renderNewsCards(items, container) {
  if (items.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); padding: 2rem; text-align:center; grid-column: 1/-1;">Nessuna notizia trovata.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <article class="news-card" data-news-id="${item.id}">
      <div class="news-card-img-wrap">
        <img src="${item.image}" alt="${item.title}" class="news-card-img" loading="lazy" />
        <span class="news-card-category">${item.category}</span>
      </div>
      <div class="news-card-body">
        <div class="news-card-date">${item.formattedDate || item.date}</div>
        <h3 class="news-card-title">${item.title}</h3>
        <p class="news-card-excerpt">${item.summary}</p>
        <span class="news-card-readmore">
          Leggi tutto
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
  if (modalCategory) modalCategory.textContent = newsItem.category;
  if (modalDate) modalDate.textContent = newsItem.formattedDate || formatDate(newsItem.date);
  if (modalTitle) modalTitle.textContent = newsItem.title;
  if (modalText) modalText.innerHTML = newsItem.content;

  document.body.classList.add('modal-open');
  dialog.showModal();
}

// Load and render sponsors
async function loadSponsors() {
  const container = document.getElementById('sponsors-grid');
  if (!container) return;

  const sponsors = await fetchJSON('content/sponsors.json');
  if (!sponsors || !Array.isArray(sponsors)) {
    container.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">Impossibile caricare i partner.</p>`;
    return;
  }

  container.innerHTML = sponsors.map(item => `
    <a href="${item.website || '#'}" ${item.website && item.website !== '#' ? 'target="_blank" rel="noopener"' : ''} class="sponsor-card ${item.tier === 'Main Partner' ? 'main-partner' : ''}" title="${item.name}">
      <img src="${item.logo}" alt="${item.name}" loading="lazy" />
    </a>
  `).join('');
}
