// ==========================================================================
// HMY Store V2 — Product Detail Page Logic (product-detail.js)
// Gallery, size/color selectors, add-to-bag, related products
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ── Toast ──
  function toast(msg) {
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    c.appendChild(el); setTimeout(() => el.remove(), 3000);
  }

  // ── Get product from URL ──
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const product = getProductById(productId);

  if (!product) {
    document.getElementById('productDetailGrid').innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon"><i class="fa-solid fa-box-open"></i></div>
        <h3>Product Not Found</h3>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <a href="shop.html" class="btn-primary" style="margin-top: 16px;">BROWSE PRODUCTS</a>
      </div>`;
    return;
  }

  // ── Update page title & breadcrumb ──
  document.title = `${product.title} — HMY`;
  document.getElementById('breadcrumbProduct').textContent = product.title;

  // ── State ──
  let selectedSize = '';
  let selectedColor = '';
  let selectedQty = 1;
  let mainImageIndex = 0;

  // ── Render Product Detail ──
  const grid = document.getElementById('productDetailGrid');

  function renderProduct() {
    const savings = product.originalPrice ? product.originalPrice - product.price : 0;
    const savingsPercent = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

    grid.innerHTML = `
      <!-- Gallery -->
      <div class="product-gallery reveal-left">
        <div class="product-gallery-thumbs" id="galleryThumbs">
          ${product.images.map((img, i) => `
            <img src="${img}" alt="" class="product-gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
          `).join('')}
        </div>
        <div class="product-gallery-main" id="galleryMain">
          <img src="${product.images[0]}" alt="${product.title}" id="mainImage">
        </div>
      </div>

      <!-- Info -->
      <div class="product-info reveal-right">
        ${product.badge ? `<span class="tag tag-gold">${product.badge}</span>` : ''}

        <h1 class="product-info-title">${product.title}</h1>

        <div class="product-info-pricing">
          <span class="product-info-price">${formatPrice(product.price)}</span>
          ${product.originalPrice ? `<span class="product-info-original">${formatPrice(product.originalPrice)}</span>` : ''}
          ${savingsPercent > 0 ? `<span class="product-info-save">SAVE ${savingsPercent}%</span>` : ''}
        </div>

        <p class="product-info-desc">${product.description}</p>

        <!-- Color Selector -->
        ${product.colors.length > 0 ? `
          <div class="product-selector-group">
            <div class="product-selector-label">COLOR: <span id="selectedColorLabel">Select a color</span></div>
            <div class="color-selector" id="colorSelector">
              ${product.colors.map(c => `
                <button class="color-swatch" data-color="${c.name}" style="background-color: ${c.hex};" title="${c.name}"></button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Size Selector -->
        <div class="product-selector-group">
          <div class="product-selector-label">SIZE: <span id="selectedSizeLabel">Select a size</span></div>
          <div class="size-selector" id="sizeSelector">
            ${product.sizes.map(s => `
              <button class="size-option" data-size="${s}">${s}</button>
            `).join('')}
          </div>
        </div>

        <!-- Quantity + Add to Bag -->
        <div class="product-add-row">
          <div class="qty-selector">
            <button class="qty-btn" id="qtyDec">−</button>
            <span class="qty-value" id="qtyDisplay">1</span>
            <button class="qty-btn" id="qtyInc">+</button>
          </div>
          <button class="btn-primary" id="addToBagBtn" disabled>
            <i class="fa-solid fa-bag-shopping"></i> SELECT OPTIONS
          </button>
        </div>

        <!-- WhatsApp Direct -->
        <button class="btn-whatsapp btn-full" id="buyNowWhatsApp" style="margin-top: 8px;" disabled>
          <i class="fa-brands fa-whatsapp"></i> BUY NOW VIA WHATSAPP
        </button>

        ${['men-stitched','men-unstitched','women-stitched','women-unstitched'].includes(product.category) ? `
        <a href="tryon.html?product=${product.id}" class="btn-outline btn-full" style="margin-top: 8px;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">
          <i class="fa-solid fa-wand-magic-sparkles"></i> VIRTUAL TRY-ON
        </a>
        ` : ''}

        <!-- Product Details Accordion -->
        <div class="product-accordion">
          <div class="product-accordion-item">
            <button class="product-accordion-trigger">
              Details <i class="fa-solid fa-chevron-down" style="font-size: 0.7em;"></i>
            </button>
            <div class="product-accordion-content open">
              <div class="product-accordion-body">
                <p>${product.description}</p>
                <p style="margin-top: 8px;"><strong>Category:</strong> ${product.categoryLabel}</p>
              </div>
            </div>
          </div>
          <div class="product-accordion-item">
            <button class="product-accordion-trigger">
              Fabric & Material <i class="fa-solid fa-chevron-down" style="font-size: 0.7em;"></i>
            </button>
            <div class="product-accordion-content">
              <div class="product-accordion-body">
                <p>${product.fabric}</p>
              </div>
            </div>
          </div>
          <div class="product-accordion-item">
            <button class="product-accordion-trigger">
              Care Instructions <i class="fa-solid fa-chevron-down" style="font-size: 0.7em;"></i>
            </button>
            <div class="product-accordion-content">
              <div class="product-accordion-body">
                <p>${product.care}</p>
              </div>
            </div>
          </div>
          <div class="product-accordion-item">
            <button class="product-accordion-trigger">
              Shipping & Returns <i class="fa-solid fa-chevron-down" style="font-size: 0.7em;"></i>
            </button>
            <div class="product-accordion-content">
              <div class="product-accordion-body">
                <p>• Free delivery on orders over Rs. 5,000</p>
                <p>• Standard delivery: Rs. 250 (3-5 business days)</p>
                <p>• Cash on Delivery available nationwide</p>
                <p>• 7-day return policy for unused items</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // ── Gallery Interactions ──
    const thumbs = document.querySelectorAll('.product-gallery-thumb');
    const mainImage = document.getElementById('mainImage');

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImage.src = product.images[parseInt(thumb.dataset.index)];
      });
    });

    // ── Color Selector ──
    const colorSelector = document.getElementById('colorSelector');
    const selectedColorLabel = document.getElementById('selectedColorLabel');

    if (colorSelector) {
      colorSelector.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          colorSelector.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          selectedColor = swatch.dataset.color;
          selectedColorLabel.textContent = selectedColor;
          updateAddButton();
        });
      });
    } else {
      // No colors needed
      selectedColor = '';
    }

    // ── Size Selector ──
    const sizeSelector = document.getElementById('sizeSelector');
    const selectedSizeLabel = document.getElementById('selectedSizeLabel');

    sizeSelector.querySelectorAll('.size-option').forEach(opt => {
      opt.addEventListener('click', () => {
        sizeSelector.querySelectorAll('.size-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedSize = opt.dataset.size;
        selectedSizeLabel.textContent = selectedSize;
        updateAddButton();
      });
    });

    // ── Quantity ──
    const qtyDec = document.getElementById('qtyDec');
    const qtyInc = document.getElementById('qtyInc');
    const qtyDisplay = document.getElementById('qtyDisplay');

    qtyDec.addEventListener('click', () => {
      if (selectedQty > 1) { selectedQty--; qtyDisplay.textContent = selectedQty; }
    });
    qtyInc.addEventListener('click', () => {
      if (selectedQty < 10) { selectedQty++; qtyDisplay.textContent = selectedQty; }
    });

    // ── Add to Bag Button State ──
    const addToBagBtn = document.getElementById('addToBagBtn');
    const buyNowBtn = document.getElementById('buyNowWhatsApp');

    function updateAddButton() {
      const needsColor = product.colors.length > 0;
      const sizeSelected = selectedSize !== '';
      const colorSelected = !needsColor || selectedColor !== '';

      if (sizeSelected && colorSelected) {
        addToBagBtn.disabled = false;
        addToBagBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> ADD TO BAG';
        buyNowBtn.disabled = false;
      } else {
        addToBagBtn.disabled = true;
        let missing = [];
        if (!sizeSelected) missing.push('size');
        if (needsColor && !colorSelected) missing.push('color');
        addToBagBtn.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> SELECT ${missing.join(' & ').toUpperCase()}`;
        buyNowBtn.disabled = true;
      }
    }

    // ── Add to Bag ──
    addToBagBtn.addEventListener('click', () => {
      if (addToBagBtn.disabled) return;
      Cart.addItem(product, selectedSize, selectedColor, selectedQty);
      toast(`${product.title} added to bag`);

      // Visual feedback
      addToBagBtn.innerHTML = '<i class="fa-solid fa-check"></i> ADDED!';
      addToBagBtn.style.background = '#25D366';
      addToBagBtn.style.borderColor = '#25D366';
      setTimeout(() => {
        addToBagBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> ADD TO BAG';
        addToBagBtn.style.background = '';
        addToBagBtn.style.borderColor = '';
      }, 1500);
    });

    // ── Buy Now via WhatsApp ──
    buyNowBtn.addEventListener('click', () => {
      if (buyNowBtn.disabled) return;
      // Add item then open WhatsApp
      Cart.addItem(product, selectedSize, selectedColor, selectedQty);
      Cart.openWhatsApp();
    });

    // ── Accordion ──
    document.querySelectorAll('.product-accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const content = trigger.nextElementSibling;
        content.classList.toggle('open');
        const icon = trigger.querySelector('i');
        if (content.classList.contains('open')) {
          icon.className = 'fa-solid fa-chevron-up';
          icon.style.fontSize = '0.7em';
        } else {
          icon.className = 'fa-solid fa-chevron-down';
          icon.style.fontSize = '0.7em';
        }
      });
    });

    // ── Scroll Reveal ──
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger').forEach(el => obs.observe(el));

    // Auto-select first color if only one
    if (product.colors.length === 1) {
      const firstSwatch = colorSelector?.querySelector('.color-swatch');
      if (firstSwatch) firstSwatch.click();
    }

    // Auto-select first size if only one
    if (product.sizes.length === 1) {
      const firstSize = sizeSelector.querySelector('.size-option');
      if (firstSize) firstSize.click();
    }
  }

  // ── Related Products ──
  function renderRelated() {
    const relatedGrid = document.getElementById('relatedGrid');
    if (!relatedGrid || !product) return;

    const related = getProductsByCategory(product.category)
      .filter(p => p.id !== product.id)
      .slice(0, 4);

    // If not enough in same category, fill from featured
    if (related.length < 4) {
      const extra = getFeaturedProducts()
        .filter(p => p.id !== product.id && !related.find(r => r.id === p.id))
        .slice(0, 4 - related.length);
      related.push(...extra);
    }

    relatedGrid.innerHTML = related.map(p => `
      <div class="product-card">
        <a href="product.html?id=${p.id}" class="card-media img-zoom-container">
          ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
          <img src="${p.images[0]}" alt="${p.title}" loading="lazy">
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
  }

  // ── Shared: Mobile Menu ──
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileMenu = document.getElementById('closeMobileMenu');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileOverlay = document.getElementById('mobileOverlay');
  function closeMobile() { mobileDrawer.classList.remove('open'); mobileOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  mobileMenuBtn?.addEventListener('click', () => { mobileDrawer.classList.add('open'); mobileOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; });
  closeMobileMenu?.addEventListener('click', closeMobile);
  mobileOverlay?.addEventListener('click', closeMobile);

  // ── Shared: Cart Drawer ──
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
      whatsappCheckoutBtn.disabled = true; whatsappCheckoutBtn.style.opacity = '0.4'; clearCartBtn.style.display = 'none'; return;
    }
    whatsappCheckoutBtn.disabled = false; whatsappCheckoutBtn.style.opacity = '1'; clearCartBtn.style.display = 'block';

    cartDrawerBody.innerHTML = items.map(item => `
      <div class="cart-item"><img src="${item.image}" alt="" class="cart-item-img"><div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-meta">${item.size || ''}${item.size && item.color ? ' / ' : ''}${item.color || ''}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="qty-selector" style="margin-top:6px;">
          <button class="qty-btn" data-action="dec" data-key="${item.key}">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-key="${item.key}">+</button>
        </div></div>
        <button class="cart-item-remove" data-key="${item.key}"><i class="fa-solid fa-trash-can"></i></button>
      </div>`).join('');

    cartDrawerBody.querySelectorAll('.qty-btn').forEach(b => b.addEventListener('click', () => { if(b.dataset.action==='inc') Cart.increment(b.dataset.key); else Cart.decrement(b.dataset.key); renderCartDrawer(); }));
    cartDrawerBody.querySelectorAll('.cart-item-remove').forEach(b => b.addEventListener('click', () => { Cart.removeItem(b.dataset.key); renderCartDrawer(); toast('Item removed'); }));
  }

  // ── Announcement hide ──
  const announcementBar = document.getElementById('announcementBar');
  const siteHeader = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) { announcementBar.style.transform = 'translateY(-100%)'; siteHeader.style.top = '0'; }
    else { announcementBar.style.transform = 'translateY(0)'; siteHeader.style.top = '36px'; }
  }, { passive: true });

  // ── Escape ──
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCart(); closeMobile(); document.body.style.overflow = ''; } });

  // ── Init ──
  renderProduct();
  renderRelated();
  renderCartDrawer();
});
