// ==========================================================================
// HMY Store V2 — Cart Logic (cart.js)
// Shared across all pages — localStorage persistent
// ==========================================================================

const Cart = {
  STORAGE_KEY: 'hmy_cart_v2',

  // Get cart from localStorage
  getItems() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  // Save cart to localStorage
  save(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateUI();
    // Dispatch custom event for any page-specific listeners
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items } }));
  },

  // Add item to cart
  addItem(product, selectedSize, selectedColor, qty = 1) {
    const items = this.getItems();
    // Check if same product + size + color exists
    const key = `${product.id}-${selectedSize}-${selectedColor}`;
    const existing = items.find(i => i.key === key);

    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        key,
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        size: selectedSize,
        color: selectedColor,
        qty
      });
    }

    this.save(items);
    return items;
  },

  // Remove item by key
  removeItem(key) {
    let items = this.getItems();
    items = items.filter(i => i.key !== key);
    this.save(items);
    return items;
  },

  // Update quantity
  updateQty(key, newQty) {
    const items = this.getItems();
    const item = items.find(i => i.key === key);
    if (item) {
      if (newQty <= 0) {
        return this.removeItem(key);
      }
      item.qty = newQty;
      this.save(items);
    }
    return items;
  },

  // Increment quantity
  increment(key) {
    const items = this.getItems();
    const item = items.find(i => i.key === key);
    if (item) {
      item.qty++;
      this.save(items);
    }
    return items;
  },

  // Decrement quantity
  decrement(key) {
    const items = this.getItems();
    const item = items.find(i => i.key === key);
    if (item) {
      item.qty--;
      if (item.qty <= 0) return this.removeItem(key);
      this.save(items);
    }
    return items;
  },

  // Clear cart
  clear() {
    this.save([]);
  },

  // Get total item count
  getCount() {
    return this.getItems().reduce((sum, i) => sum + i.qty, 0);
  },

  // Get subtotal
  getSubtotal() {
    return this.getItems().reduce((sum, i) => sum + (i.price * i.qty), 0);
  },

  // Get shipping
  getShipping() {
    return calculateShipping(this.getSubtotal());
  },

  // Get grand total
  getTotal() {
    return this.getSubtotal() + this.getShipping();
  },

  // Update all cart count badges on the page
  updateUI() {
    const count = this.getCount();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.classList.toggle('empty', count === 0);
      // Bounce animation
      el.classList.remove('cart-bounce');
      void el.offsetWidth; // trigger reflow
      if (count > 0) el.classList.add('cart-bounce');
    });
  },

  // Build WhatsApp message
  buildWhatsAppMessage() {
    const items = this.getItems();
    if (!items.length) return '';

    let msg = `🛍️ *NEW ORDER — ${CONFIG.store.name} Store*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📦 *Order Items:*\n`;

    items.forEach((item, i) => {
      msg += `\n${i + 1}. *${item.title}*\n`;
      if (item.size) msg += `   Size: ${item.size}`;
      if (item.color) msg += ` | Color: ${item.color}`;
      msg += ` | Qty: ${item.qty}\n`;
      msg += `   Price: ${formatPrice(item.price * item.qty)}\n`;
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 Subtotal: ${formatPrice(this.getSubtotal())}\n`;
    msg += `🚚 Shipping: ${this.getShipping() === 0 ? 'FREE' : formatPrice(this.getShipping())}\n`;
    msg += `💵 *Total: ${formatPrice(this.getTotal())}*\n\n`;
    msg += `📍 Payment: Cash on Delivery (COD)\n`;
    msg += `📍 My Location: [Please type your delivery address here]\n\n`;
    msg += `✅ Please confirm my order!`;

    return msg;
  },

  // Open WhatsApp with pre-filled message
  openWhatsApp() {
    const msg = this.buildWhatsAppMessage();
    if (!msg) return;
    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${CONFIG.whatsapp.number}?text=${encoded}`;
    window.open(url, '_blank');
  },

  // Build order payload for Supabase
  buildOrderPayload() {
    const items = this.getItems();
    return {
      order_id: generateOrderId(),
      customer_name: '',  // will be filled if form exists
      phone: '',
      email: '',
      shipping_address: '',
      payment_method: 'Cash on Delivery (COD)',
      items: items.map(i => ({
        id: i.id,
        title: i.title,
        price: i.price,
        qty: i.qty,
        size: i.size,
        color: i.color,
        image: i.image
      })),
      subtotal: this.getSubtotal(),
      shipping_cost: this.getShipping(),
      total: this.getTotal(),
      status: 'pending'
    };
  }
};

// ==========================================================================
// Theme Manager (Dark by Default, Light V1 Inspired)
// ==========================================================================
const ThemeManager = {
  KEY: 'hmy_theme_v2',

  init() {
    const saved = localStorage.getItem(this.KEY) || 'dark';
    this.apply(saved);

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#themeToggleBtn') || e.target.closest('.theme-toggle-btn');
      if (btn) {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.apply(next);
      }
    });
  },

  apply(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(this.KEY, theme);

    // Update icons
    document.querySelectorAll('#themeToggleBtn i, .theme-toggle-btn i').forEach(icon => {
      if (theme === 'light') {
        icon.className = 'fa-solid fa-sun';
      } else {
        icon.className = 'fa-solid fa-moon';
      }
    });
  }
};

// Apply saved theme immediately to prevent flashing
(() => {
  const saved = localStorage.getItem('hmy_theme_v2') || 'dark';
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

// ==========================================================================
// Splash / Loading Screen Manager
// ==========================================================================
const SplashManager = {
  init() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;

    const bar = document.getElementById('splashLoaderBar');
    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.random() * 25;
      if (progress > 90) progress = 90;
      if (bar) bar.style.width = `${progress}%`;
    }, 120);

    const finish = () => {
      clearInterval(interval);
      if (bar) bar.style.width = '100%';
      setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
          splash.style.display = 'none';
        }, 800);
      }, 350);
    };

    if (document.readyState === 'complete') {
      setTimeout(finish, 800);
    } else {
      window.addEventListener('load', () => {
        setTimeout(finish, 800);
      });
    }

    // Safety fallback (maximum 3.5s splash)
    setTimeout(finish, 3500);
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateUI();
  ThemeManager.init();
  SplashManager.init();
  CMSContent.init();
});

// ==========================================================================
// CMS Content Loader — reads admin overrides from localStorage + IndexedDB
// ==========================================================================
const CMSContent = {
  STORAGE_KEY: 'hmy_site_content',
  DB_NAME: 'hmy_videos_db',
  DB_STORE: 'videos',

  async init() {
    this.applyFromLocalStorage();
    await this.applyUploadedVideos();
  },

  applyFromLocalStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return;

    try {
      const content = JSON.parse(stored);
      this.applyAnnouncements(content.announcements);
      this.applyHero(content.hero);
      this.applyStory(content.story);
    } catch (e) {
      console.warn('CMS content parse error:', e);
    }
  },

  // IndexedDB helper
  _openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(this.DB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async _getVideo(key) {
    try {
      const db = await this._openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.DB_STORE, 'readonly');
        const req = tx.objectStore(this.DB_STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch { return null; }
  },

  async applyUploadedVideos() {
    // Hero videos from IndexedDB
    for (let i = 0; i < 3; i++) {
      const blob = await this._getVideo('hero-video-' + i);
      if (blob) {
        const el = document.getElementById('heroPanel' + i);
        if (el) {
          const videoEl = el.querySelector('video');
          if (videoEl) {
            const url = URL.createObjectURL(blob);
            videoEl.innerHTML = `<source src="${url}" type="video/mp4">`;
            videoEl.load();
          }
        }
      }
    }

    // Story video from IndexedDB
    const storyBlob = await this._getVideo('story-video');
    if (storyBlob) {
      const storySection = document.getElementById('story');
      if (storySection) {
        const videoEl = storySection.querySelector('video');
        if (videoEl) {
          const url = URL.createObjectURL(storyBlob);
          videoEl.innerHTML = `<source src="${url}" type="video/mp4">`;
          videoEl.load();
        }
      }
    }
  },

  applyAnnouncements(announcements) {
    if (!announcements || !announcements.length) return;
    const bar = document.getElementById('announcementBar');
    if (!bar) return;

    const track = bar.querySelector('.marquee-track');
    if (!track) return;

    const items = announcements.map(text => `<span class="ticker-item">${text}</span><span class="ticker-item">★</span>`).join('');
    track.innerHTML = items + items;
  },

  applyHero(hero) {
    if (!hero || !hero.length) return;

    hero.forEach((panel, i) => {
      const el = document.getElementById('heroPanel' + i);
      if (!el) return;

      // Only update video from URL if not an uploaded file
      if (panel.video && !panel.video.startsWith('[UPLOADED')) {
        const video = el.querySelector('video source');
        if (video && video.getAttribute('src') !== panel.video) {
          video.setAttribute('src', panel.video);
          const videoEl = el.querySelector('video');
          if (videoEl) videoEl.load();
        }
      }

      const eyebrow = el.querySelector('.hero-eyebrow');
      const heading = el.querySelector('.hero-heading');
      const btn = el.querySelector('.btn-primary');

      if (eyebrow && panel.eyebrow) eyebrow.textContent = panel.eyebrow;
      if (heading && panel.heading) heading.innerHTML = panel.heading;
      if (btn && panel.btnText) btn.textContent = panel.btnText;
      if (btn && panel.btnLink) btn.setAttribute('href', panel.btnLink);
    });
  },

  applyStory(story) {
    if (!story) return;

    // Only update video from URL if not an uploaded file
    if (story.video && !story.video.startsWith('[UPLOADED')) {
      const storySection = document.getElementById('story');
      if (storySection) {
        const video = storySection.querySelector('video source');
        if (video && video.getAttribute('src') !== story.video) {
          video.setAttribute('src', story.video);
          const videoEl = storySection.querySelector('video');
          if (videoEl) videoEl.load();
        }
      }
    }

    if (story.heading) {
      const heading = document.querySelector('.story-text .section-heading');
      if (heading) heading.textContent = story.heading;
    }

    if (story.text) {
      const paragraph = document.querySelector('.story-text p');
      if (paragraph) paragraph.textContent = story.text;
    }
  }
};
