// ==========================================================================
// HMY Store V2 — Shop Page Logic (shop.js)
// Category filtering, search, sort, product grid rendering
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ── Toast ──
  function toast(msg) {
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    c.appendChild(el); setTimeout(() => el.remove(), 3000);
  }

  // ── Parse URL params ──
  const params = new URLSearchParams(window.location.search);
  let currentCategory = params.get('cat') || 'all';
  let currentSearch = params.get('search') || '';
  let currentSort = 'featured';

  // ── DOM ──
  const productsGrid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const shopCount = document.getElementById('shopCount');
  const shopPageTitle = document.getElementById('shopPageTitle');
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
  const shopHeroImg = document.getElementById('shopHeroImg');
  const activeFilterWrap = document.getElementById('activeFilterWrap');
  const activeFilterText = document.getElementById('activeFilterText');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const sortSelect = document.getElementById('sortSelect');
  const searchInput = document.getElementById('searchInput');

  // Set initial search value
  if (currentSearch && searchInput) searchInput.value = currentSearch;

  // ── Render Products ──
  function renderProducts() {
    let products;

    if (currentSearch) {
      products = searchProducts(currentSearch);
      shopPageTitle.textContent = `Results for "${currentSearch}"`;
      breadcrumbCurrent.textContent = 'Search';
      activeFilterWrap.style.display = 'none';
    } else if (currentCategory !== 'all') {
      products = getProductsByCategory(currentCategory);
      const label = CATEGORY_LABELS[currentCategory] || currentCategory;
      shopPageTitle.textContent = label;
      breadcrumbCurrent.textContent = label;
      activeFilterWrap.style.display = 'inline-flex';
      activeFilterText.textContent = label;
      // Update hero image
      if (CATEGORY_IMAGES[currentCategory]) {
        shopHeroImg.src = CATEGORY_IMAGES[currentCategory];
      }
    } else {
      products = getProductsByCategory('all');
      shopPageTitle.textContent = 'Shop All';
      breadcrumbCurrent.textContent = 'Shop All';
      activeFilterWrap.style.display = 'none';
    }

    // Sort
    products = sortProducts(products, currentSort);

    // Count
    shopCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

    // Empty state
    if (products.length === 0) {
      productsGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    // Render cards
    productsGrid.innerHTML = products.map(p => `
      <div class="product-card">
        <a href="product.html?id=${p.id}" class="card-media img-zoom-container">
          ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
          <img src="${p.images[0]}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg,#1a1510,#2a2218)'; this.parentElement.innerHTML += '<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:#C9A96E;font-size:2.5rem;font-family:Playfair Display,serif;letter-spacing:0.2em;\\'>HMY</div>';">
          <div class="card-actions">
            <button class="btn-primary btn-full quick-add-btn" data-id="${p.id}">
              <i class="fa-solid fa-bag-shopping"></i> QUICK ADD
            </button>
          </div>
        </a>
        <div class="card-body">
          <div class="card-category">${p.categoryLabel}</div>
          <a href="product.html?id=${p.id}" class="card-title hover-underline">${p.title}</a>
          <div class="card-pricing">
            <span class="card-price">${formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="card-original-price">${formatPrice(p.originalPrice)}</span>` : ''}
            ${p.originalPrice ? `<span class="card-discount">${Math.round((1 - p.price/p.originalPrice)*100)}% OFF</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    // Quick add buttons
    productsGrid.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const product = getProductById(btn.dataset.id);
        if (!product) return;
        Cart.addItem(product, product.sizes[0] || '', product.colors[0]?.name || '');
        toast(`${product.title} added to bag`);
      });
    });

    // Trigger stagger animation
    productsGrid.classList.remove('visible');
    void productsGrid.offsetWidth;
    productsGrid.classList.add('visible');
  }

  // ── Event Listeners ──
  sortSelect?.addEventListener('change', () => {
    currentSort = sortSelect.value;
    renderProducts();
  });

  clearFilterBtn?.addEventListener('click', () => {
    currentCategory = 'all';
    currentSearch = '';
    window.history.replaceState({}, '', 'shop.html');
    renderProducts();
  });

  resetFiltersBtn?.addEventListener('click', () => {
    currentCategory = 'all';
    currentSearch = '';
    window.history.replaceState({}, '', 'shop.html');
    renderProducts();
  });

  // ── Search ──
  const searchToggle = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchCloseBtn = document.getElementById('searchCloseBtn');

  searchToggle?.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    setTimeout(() => searchInput.focus(), 300);
  });
  searchCloseBtn?.addEventListener('click', () => searchOverlay.classList.remove('open'));

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      currentSearch = searchInput.value.trim();
      currentCategory = 'all';
      window.history.replaceState({}, '', `shop.html?search=${encodeURIComponent(currentSearch)}`);
      searchOverlay.classList.remove('open');
      renderProducts();
    }
  });

  // ── Mobile Menu ──
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileMenu = document.getElementById('closeMobileMenu');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileOverlay = document.getElementById('mobileOverlay');

  function closeMobile() { mobileDrawer.classList.remove('open'); mobileOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  mobileMenuBtn?.addEventListener('click', () => { mobileDrawer.classList.add('open'); mobileOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; });
  closeMobileMenu?.addEventListener('click', closeMobile);
  mobileOverlay?.addEventListener('click', closeMobile);

  document.querySelectorAll('.mobile-accordion-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.nextElementSibling.classList.toggle('open');
      const icon = btn.querySelector('i');
      icon.classList.toggle('fa-plus'); icon.classList.toggle('fa-minus');
    });
  });

  // ── Cart Drawer ──
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawerBody = document.getElementById('cartDrawerBody');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const whatsappCheckoutBtn = document.getElementById('whatsappCheckoutBtn');

  function openCart() { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; renderCartDrawer(); }
  function closeCart() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow = ''; }

  openCartBtn?.addEventListener('click', openCart);
  closeCartBtn?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  clearCartBtn?.addEventListener('click', () => { Cart.clear(); renderCartDrawer(); toast('Bag cleared'); });
  whatsappCheckoutBtn?.addEventListener('click', () => { if (Cart.getCount() > 0) Cart.openWhatsApp(); });

  function renderCartDrawer() {
    const items = Cart.getItems();
    document.getElementById('cartSubtotal').textContent = formatPrice(Cart.getSubtotal());
    const ship = Cart.getShipping();
    document.getElementById('cartShipping').textContent = Cart.getSubtotal() === 0 ? 'Rs. 0' : ship === 0 ? 'FREE' : formatPrice(ship);
    document.getElementById('cartTotal').textContent = formatPrice(Cart.getTotal());

    if (!items.length) {
      cartDrawerBody.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon"><i class="fa-solid fa-bag-shopping"></i></div><p>Your bag is empty.</p></div>';
      whatsappCheckoutBtn.disabled = true; whatsappCheckoutBtn.style.opacity = '0.4'; clearCartBtn.style.display = 'none';
      return;
    }
    whatsappCheckoutBtn.disabled = false; whatsappCheckoutBtn.style.opacity = '1'; clearCartBtn.style.display = 'block';

    cartDrawerBody.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-meta">${item.size || ''}${item.size && item.color ? ' / ' : ''}${item.color || ''}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div class="qty-selector" style="margin-top:6px;">
            <button class="qty-btn" data-action="dec" data-key="${item.key}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-key="${item.key}">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-key="${item.key}"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `).join('');

    cartDrawerBody.querySelectorAll('.qty-btn').forEach(b => b.addEventListener('click', () => { if(b.dataset.action==='inc') Cart.increment(b.dataset.key); else Cart.decrement(b.dataset.key); renderCartDrawer(); }));
    cartDrawerBody.querySelectorAll('.cart-item-remove').forEach(b => b.addEventListener('click', () => { Cart.removeItem(b.dataset.key); renderCartDrawer(); toast('Item removed'); }));
  }

  // ── Escape Key ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCart(); closeMobile(); searchOverlay?.classList.remove('open'); document.body.style.overflow = ''; }
  });

  // ── Announcement hide on scroll ──
  const announcementBar = document.getElementById('announcementBar');
  const siteHeader = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) { announcementBar.style.transform = 'translateY(-100%)'; siteHeader.style.top = '0'; }
    else { announcementBar.style.transform = 'translateY(0)'; siteHeader.style.top = '36px'; }
  }, { passive: true });

  // ── Init ──
  renderProducts();
  renderCartDrawer();
});
