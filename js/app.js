// ==========================================================================
// HMY Store V2 — Landing Page Logic (app.js)
// Hero, featured products, category showcase, navigation, cart drawer
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════════════
  // TOAST
  // ══════════════════════════════════════
  function toast(msg) {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ══════════════════════════════════════
  // HERO: Video fallback + scroll dots
  // ══════════════════════════════════════
  const heroSection = document.getElementById('hero');
  const heroDots = document.querySelectorAll('.hero-dot');

  // Fallback: if video fails to load, show image
  document.querySelectorAll('.hero-panel').forEach(panel => {
    const video = panel.querySelector('video');
    const fallback = panel.querySelector('.hero-fallback');
    if (video && fallback) {
      video.addEventListener('error', () => {
        video.style.display = 'none';
        fallback.style.display = 'block';
      });
      // Also check if source has error
      const source = video.querySelector('source');
      if (source) {
        source.addEventListener('error', () => {
          video.style.display = 'none';
          fallback.style.display = 'block';
        });
      }
      // If video has no valid source, show fallback after timeout
      setTimeout(() => {
        if (video.readyState === 0 && video.networkState === 3) {
          video.style.display = 'none';
          fallback.style.display = 'block';
        }
      }, 2000);
    }
  });

  // Hero scroll: update dots
  if (heroSection) {
    const panels = heroSection.querySelectorAll('.hero-panel');

    const updateDots = () => {
      const scrollTop = heroSection.scrollTop;
      const panelHeight = heroSection.clientHeight;
      const activeIndex = Math.round(scrollTop / panelHeight);

      heroDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIndex);
      });
    };

    heroSection.addEventListener('scroll', updateDots, { passive: true });

    // Dot click → scroll to panel
    heroDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.panel);
        panels[index]?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ══════════════════════════════════════
  // HEADER: Transparent → Solid on scroll
  // ══════════════════════════════════════
  const header = document.getElementById('siteHeader');
  const announcementBar = document.getElementById('announcementBar');

  function handleHeaderScroll() {
    const scrollY = window.scrollY;
    const heroHeight = heroSection ? heroSection.offsetHeight : 0;

    if (scrollY > heroHeight - 100) {
      header.classList.remove('site-header--transparent');
      header.classList.add('site-header--solid');
    } else {
      header.classList.add('site-header--transparent');
      header.classList.remove('site-header--solid');
    }

    // Hide announcement bar on scroll
    if (scrollY > 50) {
      announcementBar.style.transform = 'translateY(-100%)';
      header.style.top = '0';
    } else {
      announcementBar.style.transform = 'translateY(0)';
      header.style.top = '36px';
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // ══════════════════════════════════════
  // MOBILE MENU
  // ══════════════════════════════════════
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileMenuBtn = document.getElementById('closeMobileMenu');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileOverlay = document.getElementById('mobileOverlay');

  function openMobile() {
    mobileDrawer.classList.add('open');
    mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMobile() {
    mobileDrawer.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  mobileMenuBtn?.addEventListener('click', openMobile);
  closeMobileMenuBtn?.addEventListener('click', closeMobile);
  mobileOverlay?.addEventListener('click', closeMobile);

  // Mobile accordion
  document.querySelectorAll('.mobile-accordion-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      content.classList.toggle('open');
      const icon = btn.querySelector('i');
      icon.classList.toggle('fa-plus');
      icon.classList.toggle('fa-minus');
    });
  });

  // ══════════════════════════════════════
  // SEARCH
  // ══════════════════════════════════════
  const searchToggle = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const searchInput = document.getElementById('searchInput');

  searchToggle?.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    setTimeout(() => searchInput.focus(), 300);
  });
  searchCloseBtn?.addEventListener('click', () => {
    searchOverlay.classList.remove('open');
  });

  // Search: enter key → go to shop page with query
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `shop.html?search=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });

  // ══════════════════════════════════════
  // CART DRAWER
  // ══════════════════════════════════════
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawerBody = document.getElementById('cartDrawerBody');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const whatsappCheckoutBtn = document.getElementById('whatsappCheckoutBtn');

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCartDrawer();
  }
  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  openCartBtn?.addEventListener('click', openCart);
  closeCartBtn?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  clearCartBtn?.addEventListener('click', () => {
    Cart.clear();
    renderCartDrawer();
    toast('Bag cleared');
  });
  whatsappCheckoutBtn?.addEventListener('click', () => {
    if (Cart.getCount() === 0) return;
    // Save order to Supabase first, then open WhatsApp
    saveOrderAndRedirect();
  });

  function renderCartDrawer() {
    const items = Cart.getItems();
    const subtotal = Cart.getSubtotal();
    const shipping = Cart.getShipping();
    const total = Cart.getTotal();

    document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
    document.getElementById('cartShipping').textContent = subtotal === 0 ? 'Rs. 0' : shipping === 0 ? 'FREE' : formatPrice(shipping);
    document.getElementById('cartTotal').textContent = formatPrice(total);

    if (!items.length) {
      cartDrawerBody.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon"><i class="fa-solid fa-bag-shopping"></i></div>
          <p>Your bag is empty.</p>
          <a href="shop.html" class="btn-underline" style="margin-top: 16px;">Start Shopping</a>
        </div>`;
      whatsappCheckoutBtn.disabled = true;
      whatsappCheckoutBtn.style.opacity = '0.4';
      clearCartBtn.style.display = 'none';
      return;
    }

    whatsappCheckoutBtn.disabled = false;
    whatsappCheckoutBtn.style.opacity = '1';
    clearCartBtn.style.display = 'block';

    cartDrawerBody.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-meta">${item.size || ''}${item.size && item.color ? ' / ' : ''}${item.color || ''}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div class="qty-selector" style="margin-top: 6px;">
            <button class="qty-btn" data-action="dec" data-key="${item.key}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-key="${item.key}">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-key="${item.key}"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `).join('');

    // Event listeners
    cartDrawerBody.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (btn.dataset.action === 'inc') Cart.increment(key);
        else Cart.decrement(key);
        renderCartDrawer();
      });
    });
    cartDrawerBody.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        Cart.removeItem(btn.dataset.key);
        renderCartDrawer();
        toast('Item removed');
      });
    });
  }

  // Save to Supabase then open WhatsApp
  async function saveOrderAndRedirect() {
    const btn = whatsappCheckoutBtn;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING...';

    try {
      const payload = Cart.buildOrderPayload();

      // Try to save to Supabase
      const { url, anonKey } = CONFIG.supabase;
      if (url && anonKey) {
        const sb = supabase.createClient(url, anonKey);
        await sb.from('orders').insert([payload]);
      }
    } catch (err) {
      console.warn('Order save warning:', err);
      // Continue to WhatsApp even if save fails
    }

    // Open WhatsApp
    Cart.openWhatsApp();

    // Clear cart after redirect
    setTimeout(() => {
      Cart.clear();
      renderCartDrawer();
      btn.disabled = false;
      btn.innerHTML = originalText;
      closeCart();
      toast('Order sent to WhatsApp!');
    }, 1500);
  }

  // Listen for cart updates from other components
  window.addEventListener('cart-updated', () => {
    if (cartDrawer.classList.contains('open')) {
      renderCartDrawer();
    }
  });

  // ══════════════════════════════════════
  // FEATURED PRODUCTS
  // ══════════════════════════════════════
  const featuredGrid = document.getElementById('featuredGrid');

  function renderFeaturedProducts() {
    const featured = getFeaturedProducts();
    if (!featuredGrid) return;

    featuredGrid.innerHTML = featured.map(p => `
      <div class="product-card">
        <a href="product.html?id=${p.id}" class="card-media img-zoom-container">
          ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
          <img src="${p.images[0]}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg,#1a1510,#2a2218)'; this.parentElement.innerHTML += '<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:#C9A96E;font-size:2.5rem;font-family:Playfair Display,serif;letter-spacing:0.2em;\\'>HMY</div>';">
          <div class="card-actions">
            <button class="btn-primary btn-full add-to-bag-btn" data-id="${p.id}">
              <i class="fa-solid fa-bag-shopping"></i> ADD TO BAG
            </button>
          </div>
        </a>
        <div class="card-body">
          <div class="card-category">${p.categoryLabel}</div>
          <a href="product.html?id=${p.id}" class="card-title hover-underline">${p.title}</a>
          <div class="card-pricing">
            <span class="card-price">${formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="card-original-price">${formatPrice(p.originalPrice)}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    // Add to bag buttons (uses first size + first color as default)
    featuredGrid.querySelectorAll('.add-to-bag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const product = getProductById(btn.dataset.id);
        if (!product) return;
        const defaultSize = product.sizes[0] || '';
        const defaultColor = product.colors[0]?.name || '';
        Cart.addItem(product, defaultSize, defaultColor);
        toast(`${product.title} added to bag`);
      });
    });
  }

  // ══════════════════════════════════════
  // CATEGORY SHOWCASE
  // ══════════════════════════════════════
  const categoryShowcase = document.getElementById('categoryShowcase');

  function renderCategoryShowcase() {
    if (!categoryShowcase) return;

    const categories = [
      { key: 'men-stitched', label: 'Men', title: 'Stitched Collection' },
      { key: 'women-unstitched', label: 'Women', title: 'Unstitched Luxury' },
      { key: 'perfumes', label: 'Fragrances', title: 'Royal Perfumes' },
      { key: 'special-attar', label: 'Pure Attar', title: 'Special Attars' }
    ];

    categoryShowcase.innerHTML = categories.map(cat => `
      <a href="shop.html?cat=${cat.key}" class="category-showcase-item img-zoom-container">
        <img src="${CATEGORY_IMAGES[cat.key]}" alt="${cat.title}" loading="lazy" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg,#1a1510,#2a2218)';">
        <div class="category-showcase-overlay">
          <span class="category-showcase-label">${cat.label}</span>
          <h3 class="category-showcase-title">${cat.title}</h3>
          <span class="btn-underline" style="align-self: flex-start;">EXPLORE</span>
        </div>
      </a>
    `).join('');
  }

  // ══════════════════════════════════════
  // SCROLL REVEAL (Intersection Observer)
  // ══════════════════════════════════════
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // ══════════════════════════════════════
  // NEWSLETTER
  // ══════════════════════════════════════
  const newsletterForm = document.getElementById('newsletterForm');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Thank you for subscribing to HMY!');
    newsletterForm.reset();
  });

  // ══════════════════════════════════════
  // ESCAPE KEY
  // ══════════════════════════════════════
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeMobile();
      searchOverlay?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // ══════════════════════════════════════
  // INIT
  // ══════════════════════════════════════
  renderFeaturedProducts();
  renderCategoryShowcase();
  renderCartDrawer();
});
