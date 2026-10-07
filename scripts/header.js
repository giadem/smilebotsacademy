/**
 * Smilebots Academy - Centralized Header System
 * 
 * Defines <site-header> custom element.
 * Handles:
 * - Dynamic generation of header markup
 * - Active page line indicator
 * - Contextual language switcher (stays on the same page, only changes language)
 * - Mobile navigation drawer toggle
 * - Scroll blur/shadow effects
 */

(function () {
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      this.render();
      this.initEvents();
    }

    render() {
      // 1. Detect language from <html> tag or path
      const htmlLang = (document.documentElement.getAttribute('lang') || 'it').toLowerCase();
      const isEn = htmlLang.startsWith('en');

      // 2. Identify current page category
      const pathname = window.location.pathname.toLowerCase();
      const pageAttr = document.body?.getAttribute('data-page') || '';

      let activePage = 'home';
      if (pageAttr === 'news' || pathname.includes('news')) {
        activePage = 'news';
      } else if (pageAttr === 'gallery' || pathname.includes('photogallery') || pathname.includes('gallery')) {
        activePage = 'gallery';
      } else {
        activePage = 'home';
      }

      // 3. Compute reciprocal URLs for the Language Switcher so user stays on the exact same page
      let itUrl = '/';
      let enUrl = '/index_en';

      if (activePage === 'news') {
        itUrl = '/news';
        enUrl = '/news_en';
      } else if (activePage === 'gallery') {
        itUrl = '/photogallery';
        enUrl = '/photogallery_en';
      } else {
        itUrl = '/';
        enUrl = '/index_en';
      }

      // 4. Set links and localized labels
      const homeLink = isEn ? '/index_en' : '/';
      const aboutLink = isEn ? (activePage === 'home' ? '#about-us' : '/index_en#about-us') : (activePage === 'home' ? '#chi-siamo' : '/#chi-siamo');
      const newsLink = isEn ? '/news_en' : '/news';
      const galleryLink = isEn ? '/photogallery_en' : '/photogallery';
      const sponsorsLink = isEn ? (activePage === 'home' ? '#sponsors' : '/index_en#sponsors') : (activePage === 'home' ? '#sponsors' : '/#sponsors');

      const labels = isEn ? {
        home: 'Home',
        about: 'About Us',
        news: 'News',
        gallery: 'Gallery',
        sponsors: 'Sponsors',
        contact: 'Contact Us',
        ariaSwitcher: 'Language switcher',
        menu: 'Menu'
      } : {
        home: 'Home',
        about: 'Chi Siamo',
        news: 'News',
        gallery: 'Galleria',
        sponsors: 'Sponsor',
        contact: 'Contattaci',
        ariaSwitcher: 'Selettore lingua',
        menu: 'Menu'
      };

      // 5. Output markup
      this.innerHTML = `
        <header class="header">
          <div class="container nav-container">
            <a href="${homeLink}" class="logo">
              <img src="/src/smilebots_academy_logo.svg" alt="Smilebots Academy Logo" class="header-logo-img" />
            </a>

            <nav>
              <ul class="nav-menu">
                <li><a href="${homeLink}" class="nav-link ${activePage === 'home' ? 'active' : ''}">${labels.home}</a></li>
                <li><a href="${aboutLink}" class="nav-link">${labels.about}</a></li>
                <li><a href="${newsLink}" class="nav-link ${activePage === 'news' ? 'active' : ''}">${labels.news}</a></li>
                <li><a href="${galleryLink}" class="nav-link ${activePage === 'gallery' ? 'active' : ''}">${labels.gallery}</a></li>
                <li><a href="${sponsorsLink}" class="nav-link">${labels.sponsors}</a></li>
                <li><a href="mailto:smilebotsacademy@gmail.com" class="nav-cta">${labels.contact}</a></li>
              </ul>
            </nav>

            <div class="nav-actions">
              <div class="lang-switcher" aria-label="${labels.ariaSwitcher}">
                <a href="${itUrl}" class="lang-btn ${!isEn ? 'active' : ''}" title="Italiano">IT</a>
                <span class="lang-divider">|</span>
                <a href="${enUrl}" class="lang-btn ${isEn ? 'active' : ''}" title="English">EN</a>
              </div>

              <button class="mobile-toggle" aria-label="${labels.menu}">
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </header>
      `;
    }

    initEvents() {
      const header = this.querySelector('.header');
      const toggle = this.querySelector('.mobile-toggle');
      const menu = this.querySelector('.nav-menu');

      // Scroll effect
      window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
          header?.classList.add('scrolled');
        } else {
          header?.classList.remove('scrolled');
        }
      });

      // Mobile menu toggle
      if (toggle && menu) {
        toggle.addEventListener('click', () => {
          menu.classList.toggle('active');
        });

        // Close mobile drawer when clicking a link
        menu.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => {
            menu.classList.remove('active');
          });
        });
      }
    }
  }

  // Register Custom Element
  if (!customElements.get('site-header')) {
    customElements.define('site-header', SiteHeader);
  }
})();

