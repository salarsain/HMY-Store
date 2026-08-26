// ==========================================================================
// HMY Store — Ethnic-Inspired Interactive Script
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ---- State ----
  let cart = JSON.parse(localStorage.getItem('hmy_cart')) || [];
  let currentCategory = 'all';
  let currentSearch = '';
  let currentSort = 'featured';
  let currentSlide = 0;
  const totalSlides = 2;
  let sliderTimer;

  const categoryLabels = {
    'all': 'All Products',
    'men-stitched': 'Men — Stitched',
    'men-unstitched': 'Men — Unstitched',
    'women-stitched': 'Women — Stitched',
    'women-unstitched': 'Women — Unstitched',
    'perfumes': 'Perfumes',
    'islamic-topis': 'Islamic Topis',
    'special-attar': 'Special Attar'
  };

  // ---- DOM ----
  const productsGrid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const shopTitle = document.getElementById('shopTitle');
  const activeFilter = document.getElementById('activeFilter');
  const activeFilterText = document.getElementById('activeFilterText');
  const clearFilter = document.getElementById('clearFilter');
  const resetBtn = document.getElementById('resetBtn');
  const sortSelect = document.getElementById('sortSelect');
  const searchInput = document.getElementById('searchInput');

  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const drawerCount = document.getElementById('drawerCount');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartShipping = document.getElementById('cartShipping');
  const cartTotal = document.getElementById('cartTotal');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const quickViewModal = document.getElementById('quickViewModal');
  const quickViewBody = document.getElementById('quickViewBody');
  const closeQVBtn = document.getElementById('closeQVBtn');

  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const modalSub = document.getElementById('modalSub');
  const modalTotal = document.getElementById('modalTotal');

  const successModal = document.getElementById('successModal');
  const orderId = document.getElementById('orderId');
  const continueShopping = document.getElementById('continueShopping');

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileMenu = document.getElementById('closeMobileMenu');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileOverlay = document.getElementById('mobileOverlay');

  const searchToggle = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchCloseBtn = document.getElementById('searchCloseBtn');

  const newsletterForm = document.getElementById('newsletterForm');

  // ---- Helpers ----
  function fmt(n) { return 'Rs. ' + n.toLocaleString(); }

  function toast(msg) {
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function save() {
    localStorage.setItem('hmy_cart', JSON.stringify(cart));
    renderCart();
  }

  // ---- HERO: Scroll-based video panels (no JS slider needed) ----
  // Videos auto-play natively via HTML autoplay attribute
  // Scroll down to see next video panel

  // ---- PRODUCTS RENDER ----
  function renderProducts() {
    let items = productsData.filter(p => {
      const catMatch = currentCategory === 'all' || p.category === currentCategory;
      const searchMatch = !currentSearch || p.title.toLowerCase().includes(currentSearch.toLowerCase()) || p.description.toLowerCase().includes(currentSearch.toLowerCase());
      return catMatch && searchMatch;
    });

    if (currentSort === 'price-low') items.sort((a, b) => a.price - b.price);
    else if (currentSort === 'price-high') items.sort((a, b) => b.price - a.price);
    else if (currentSort === 'rating') items.sort((a, b) => b.rating - a.rating);

    // Update title
    if (currentCategory === 'all' && !currentSearch) {
      shopTitle.textContent = 'Featured Collection';
      activeFilter.style.display = 'none';
    } else if (currentSearch) {
      shopTitle.textContent = `Results for "${currentSearch}"`;
      activeFilter.style.display = 'none';
    } else {
      shopTitle.textContent = categoryLabels[currentCategory];
      activeFilter.style.display = 'flex';
      activeFilterText.textContent = categoryLabels[currentCategory];
    }

    productsGrid.innerHTML = '';
    if (items.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    items.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="card-img">
          ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
          <img src="${p.image}" alt="${p.title}" loading="lazy">
          <div class="card-quickview" data-id="${p.id}">QUICK VIEW</div>
        </div>
        <div class="card-info">
          <div class="card-category">${p.categoryLabel}</div>
          <div class="card-title">${p.title}</div>
          <div class="card-prices">
            <span class="card-price">${fmt(p.price)}</span>
            ${p.originalPrice ? `<span class="card-original">${fmt(p.originalPrice)}</span>` : ''}
          </div>
          <button class="card-add-btn" data-id="${p.id}">ADD TO BAG</button>
        </div>
      `;
      productsGrid.appendChild(card);
    });

    // Event listeners
    document.querySelectorAll('.card-quickview').forEach(el => {
      el.addEventListener('click', () => openQuickView(parseInt(el.dataset.id)));
    });
    document.querySelectorAll('.card-add-btn').forEach(el => {
      el.addEventListener('click', (e) => { e.stopPropagation(); addToCart(parseInt(el.dataset.id)); });
    });
  }

  // ---- CATEGORY SELECTION ----
  function setCategory(cat) {
    currentCategory = cat;
    renderProducts();
    // Close mobile menu
    mobileDrawer.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
    // Scroll to shop
    document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  }

  document.querySelectorAll('.cat-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setCategory(link.dataset.category);
    });
  });

  clearFilter.addEventListener('click', () => { currentCategory = 'all'; renderProducts(); });
  resetBtn.addEventListener('click', () => { currentCategory = 'all'; currentSearch = ''; searchInput.value = ''; renderProducts(); });

  sortSelect.addEventListener('change', () => { currentSort = sortSelect.value; renderProducts(); });

  searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value.trim();
    renderProducts();
  });

  // ---- SEARCH OVERLAY ----
  searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    searchInput.focus();
  });
  searchCloseBtn.addEventListener('click', () => {
    searchOverlay.classList.remove('open');
  });

  // ---- MOBILE MENU ----
  mobileMenuBtn.addEventListener('click', () => {
    mobileDrawer.classList.add('open');
    mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closeMobile() {
    mobileDrawer.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeMobileMenu.addEventListener('click', closeMobile);
  mobileOverlay.addEventListener('click', closeMobile);

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

  // ---- CART ----
  function addToCart(id) {
    const p = productsData.find(x => x.id === id);
    if (!p) return;
    const idx = cart.findIndex(x => x.id === id);
    if (idx > -1) cart[idx].qty++;
    else cart.push({ id: p.id, title: p.title, price: p.price, image: p.image, qty: 1 });
    save();
    toast(`${p.title} added to bag`);
  }

  function renderCart() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ship = sub > 5000 || sub === 0 ? 0 : 250;
    const grand = sub + ship;

    cartCount.textContent = total;
    drawerCount.textContent = total;
    cartSubtotal.textContent = fmt(sub);
    cartShipping.textContent = sub === 0 ? 'Rs. 0' : ship === 0 ? 'FREE' : fmt(ship);
    cartTotal.textContent = fmt(grand);

    if (!cart.length) {
      cartItems.innerHTML = '<div class="cart-empty">Your bag is empty.</div>';
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.4';
      clearCartBtn.style.display = 'none';
    } else {
      checkoutBtn.disabled = false;
      checkoutBtn.style.opacity = '1';
      clearCartBtn.style.display = 'block';
      cartItems.innerHTML = cart.map(i => `
        <div class="cart-item">
          <img src="${i.image}" class="cart-item-img" alt="">
          <div class="cart-item-info">
            <div class="cart-item-title">${i.title}</div>
            <div class="cart-item-price">${fmt(i.price)}</div>
            <div class="cart-item-qty">
              <button class="qty-btn dec" data-id="${i.id}">−</button>
              <span class="qty-num">${i.qty}</span>
              <button class="qty-btn inc" data-id="${i.id}">+</button>
            </div>
          </div>
          <button class="cart-item-remove" data-id="${i.id}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `).join('');

      cartItems.querySelectorAll('.inc').forEach(b => b.addEventListener('click', () => { const c = cart.find(x => x.id === +b.dataset.id); if (c) { c.qty++; save(); } }));
      cartItems.querySelectorAll('.dec').forEach(b => b.addEventListener('click', () => { const c = cart.find(x => x.id === +b.dataset.id); if (c) { c.qty--; if (c.qty <= 0) cart = cart.filter(x => x.id !== c.id); save(); } }));
      cartItems.querySelectorAll('.cart-item-remove').forEach(b => b.addEventListener('click', () => { cart = cart.filter(x => x.id !== +b.dataset.id); save(); }));
    }
  }

  function openCart() { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeCart() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow = ''; }

  openCartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  clearCartBtn.addEventListener('click', () => { cart = []; save(); toast('Bag cleared'); });

  // ---- QUICK VIEW ----
  function openQuickView(id) {
    const p = productsData.find(x => x.id === id);
    if (!p) return;
    quickViewBody.innerHTML = `
      <img src="${p.image}" class="qv-img" alt="${p.title}">
      <div class="qv-details">
        <div class="card-category">${p.categoryLabel}</div>
        <h3>${p.title}</h3>
        <div class="card-prices">
          <span class="card-price" style="font-size:1.2rem">${fmt(p.price)}</span>
          ${p.originalPrice ? `<span class="card-original">${fmt(p.originalPrice)}</span>` : ''}
        </div>
        <div class="qv-desc">${p.description}</div>
        <button class="btn-dark full-width" id="qvAddBtn">ADD TO BAG</button>
      </div>
    `;
    quickViewModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('qvAddBtn').addEventListener('click', () => { addToCart(p.id); quickViewModal.classList.remove('open'); document.body.style.overflow = ''; });
  }

  closeQVBtn.addEventListener('click', () => { quickViewModal.classList.remove('open'); document.body.style.overflow = ''; });
  quickViewModal.addEventListener('click', e => { if (e.target === quickViewModal) { quickViewModal.classList.remove('open'); document.body.style.overflow = ''; } });

  // ---- CHECKOUT ----
  checkoutBtn.addEventListener('click', () => {
    if (!cart.length) return;
    closeCart();
    const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ship = sub > 5000 ? 0 : 250;
    modalSub.textContent = fmt(sub);
    modalTotal.textContent = fmt(sub + ship);
    checkoutModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  closeCheckoutBtn.addEventListener('click', () => { checkoutModal.classList.remove('open'); document.body.style.overflow = ''; });
  checkoutModal.addEventListener('click', e => { if (e.target === checkoutModal) { checkoutModal.classList.remove('open'); document.body.style.overflow = ''; } });

  // ---- CHECKOUT: Supabase-Integrated Order Submission ----
  let isSubmittingOrder = false; // Duplicate submission guard

  function removeFormError() {
    const existing = checkoutForm.querySelector('.form-error');
    if (existing) existing.remove();
  }

  function showFormError(msg) {
    removeFormError();
    const errDiv = document.createElement('div');
    errDiv.className = 'form-error';
    errDiv.textContent = msg;
    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    checkoutForm.insertBefore(errDiv, submitBtn);
  }

  // Initialize Supabase client (uses the global `supabase` from CDN)
  const supabaseClient = (() => {
    const { url, anonKey } = SUPABASE_CONFIG;
    if (url && !url.includes('YOUR_PROJECT_ID') && anonKey && !anonKey.includes('YOUR_ANON_KEY')) {
      return supabase.createClient(url, anonKey);
    }
    return null;
  })();

  async function submitOrderToSupabase(orderData) {
    if (!supabaseClient) {
      throw new Error('Supabase is not configured. Please update supabase-config.js with your project credentials.');
    }

    const { data, error } = await supabaseClient
      .from('orders')
      .insert([orderData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to save order. Please try again.');
    }

    return data;
  }

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    removeFormError();

    // Prevent duplicate submissions
    if (isSubmittingOrder) return;

    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    // Gather form data
    const customerName = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const email = document.getElementById('orderEmail').value.trim();
    const address = document.getElementById('orderAddress').value.trim();
    const payMethod = document.getElementById('payMethod').value;

    // Client-side validation
    if (!customerName || !phone || !email || !address) {
      showFormError('Please fill in all required fields.');
      return;
    }

    // Lock submission
    isSubmittingOrder = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'PLACING ORDER...';

    // Calculate totals
    const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ship = sub > 5000 ? 0 : 250;
    const grand = sub + ship;

    // Generate unique order ID
    const orderIdStr = 'HMY-' + Math.floor(10000 + Math.random() * 90000);

    // Build order payload
    const orderPayload = {
      order_id: orderIdStr,
      customer_name: customerName,
      phone: phone,
      email: email,
      shipping_address: address,
      payment_method: payMethod,
      items: cart.map(i => ({
        id: i.id,
        title: i.title,
        price: i.price,
        qty: i.qty,
        image: i.image
      })),
      subtotal: sub,
      shipping_cost: ship,
      total: grand,
      status: 'pending'
    };

    try {
      await submitOrderToSupabase(orderPayload);

      // SUCCESS: DB write confirmed
      orderId.textContent = '#' + orderIdStr;
      checkoutForm.reset();
      checkoutModal.classList.remove('open');
      cart = [];
      save();
      successModal.classList.add('open');

    } catch (err) {
      // FAILURE: Show error, keep form data intact
      console.error('Order submission failed:', err);
      showFormError(err.message || 'Something went wrong. Please try again.');

    } finally {
      // Unlock submission
      isSubmittingOrder = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  continueShopping.addEventListener('click', () => { successModal.classList.remove('open'); document.body.style.overflow = ''; });
  successModal.addEventListener('click', e => { if (e.target === successModal) { successModal.classList.remove('open'); document.body.style.overflow = ''; } });

  // ---- NEWSLETTER ----
  newsletterForm.addEventListener('submit', e => {
    e.preventDefault();
    toast('Thank you for subscribing to HMY!');
    newsletterForm.reset();
  });

  // ---- ESCAPE KEY ----
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCart();
      closeMobile();
      [quickViewModal, checkoutModal, successModal].forEach(m => m.classList.remove('open'));
      searchOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // ---- HEADER SCROLL BEHAVIOR (transparent → solid) ----
  const header = document.getElementById('header');
  const topBar = document.querySelector('.top-bar');
  const heroSection = document.querySelector('.hero-scroll');

  function handleScroll() {
    if (!heroSection) return;
    const rect = heroSection.getBoundingClientRect();
    // When hero section scrolls out of view
    if (rect.bottom <= 0) {
      header.classList.add('scrolled');
      if (topBar) topBar.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
      if (topBar) topBar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ---- INIT ----
  renderProducts();
  renderCart();
});
