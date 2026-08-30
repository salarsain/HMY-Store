// ==========================================================================
// HMY Store — Admin Dashboard Logic (admin.js)
// Orders, Products CMS, Site Content Manager
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const sb = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

  // ── Auth check ──
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'index.html'; return; }

  // ── Logout ──
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut(); window.location.href = 'index.html';
  });

  // ── Toast ──
  function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type==='error'?'#E8505B':'#25D366'};color:#fff;padding:12px 20px;border-radius:8px;font-size:0.85rem;z-index:9999;animation:fadeIn 0.3s;box-shadow:0 4px 20px rgba(0,0,0,0.3);`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ══════════════════════════════════════
  // STATE
  // ══════════════════════════════════════
  let allOrders = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let deleteTarget = null; // { type: 'order'|'product', id }

  // ══════════════════════════════════════
  // TABS
  // ══════════════════════════════════════
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // ══════════════════════════════════════
  // ORDERS (existing logic preserved)
  // ══════════════════════════════════════
  async function fetchOrders() {
    try {
      const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      allOrders = data || [];
    } catch (err) {
      console.error('Fetch error:', err);
      allOrders = [];
    }
    updateStats();
    renderOrders();
    renderActivity();
    renderBreakdown();
    document.getElementById('lastUpdated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
  }

  document.getElementById('refreshBtn').addEventListener('click', fetchOrders);

  document.getElementById('orderSearch').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderOrders();
  });

  function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = allOrders.filter(o => o.created_at && o.created_at.startsWith(today));
    const pendingOrders = allOrders.filter(o => o.status === 'pending');
    const totalRevenue = allOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (parseFloat(o.total) || 0), 0);

    document.getElementById('statTotal').textContent = allOrders.length;
    document.getElementById('statToday').textContent = todayOrders.length;
    document.getElementById('statRevenue').textContent = 'Rs. ' + totalRevenue.toLocaleString();
    document.getElementById('statPending').textContent = pendingOrders.length;
  }

  function renderOrders() {
    const ordersBody = document.getElementById('ordersBody');
    const ordersEmpty = document.getElementById('ordersEmpty');

    let filtered = currentFilter === 'all' ? [...allOrders] : allOrders.filter(o => o.status === currentFilter);

    if (searchQuery) {
      filtered = filtered.filter(o =>
        (o.order_id || '').toLowerCase().includes(searchQuery) ||
        (o.customer_name || '').toLowerCase().includes(searchQuery) ||
        (o.phone || '').toLowerCase().includes(searchQuery) ||
        (o.email || '').toLowerCase().includes(searchQuery)
      );
    }

    if (!filtered.length) { ordersBody.innerHTML = ''; ordersEmpty.style.display = 'block'; return; }
    ordersEmpty.style.display = 'none';

    ordersBody.innerHTML = filtered.map(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      const itemCount = items.reduce((s, i) => s + (i.qty || 1), 0);
      const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' }) : '—';

      return `<tr>
        <td class="order-id-cell" data-id="${order.id}" title="Click to view details">${order.order_id || '—'}</td>
        <td>${order.customer_name || '—'}</td>
        <td><a href="tel:${order.phone}" style="color:var(--color-gold);text-decoration:none;">${order.phone || '—'}</a></td>
        <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
        <td style="font-weight:600;">Rs. ${(parseFloat(order.total) || 0).toLocaleString()}</td>
        <td><span class="status-badge ${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span></td>
        <td>${date}</td>
        <td style="display:flex;gap:4px;">
          <select class="status-select" data-id="${order.id}">
            ${['pending','confirmed','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
          </select>
          <button class="delete-order-btn" data-id="${order.id}" title="Delete" style="background:none;border:1px solid rgba(232,80,91,0.3);color:#E8505B;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.75rem;transition:all 0.2s;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

    // Status change
    ordersBody.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        try { await sb.from('orders').update({ status: sel.value }).eq('id', sel.dataset.id); await fetchOrders(); toast('Status updated'); } catch (e) { console.error(e); toast('Error updating status', 'error'); }
      });
    });

    // View detail
    ordersBody.querySelectorAll('.order-id-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const order = allOrders.find(o => String(o.id) === cell.dataset.id);
        if (order) showOrderDetail(order);
      });
    });

    // Delete buttons
    ordersBody.querySelectorAll('.delete-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteTarget = { type: 'order', id: btn.dataset.id };
        document.getElementById('deleteModalText').textContent = 'This order will be permanently deleted.';
        document.getElementById('deleteModal').classList.add('open');
      });
    });
  }

  // Order Detail Modal
  function showOrderDetail(order) {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderDetailContent');
    const items = Array.isArray(order.items) ? order.items : [];
    const date = order.created_at ? new Date(order.created_at).toLocaleString('en-PK', { dateStyle:'full', timeStyle:'short' }) : '—';

    content.innerHTML = `
      <button class="order-detail-close" onclick="document.getElementById('orderModal').classList.remove('open')"><i class="fa-solid fa-xmark"></i></button>
      <div class="order-detail-header">
        <h2>Order ${order.order_id || '—'}</h2>
        <div class="order-detail-date">${date}</div>
        <span class="status-badge ${order.status || 'pending'}" style="margin-top:8px;">${(order.status || 'pending').toUpperCase()}</span>
      </div>
      <div class="order-detail-section" style="margin-top:24px;">
        <h4>Customer Information</h4>
        <div class="order-detail-row"><span>Name</span><strong>${order.customer_name || '—'}</strong></div>
        <div class="order-detail-row"><span>Phone</span><strong><a href="tel:${order.phone}" style="color:var(--color-gold);text-decoration:none;">${order.phone || '—'}</a></strong></div>
        <div class="order-detail-row"><span>Email</span><strong>${order.email || '—'}</strong></div>
        <div class="order-detail-row"><span>Address</span><strong>${order.shipping_address || '—'}</strong></div>
        <div class="order-detail-row"><span>Payment</span><strong>${order.payment_method || 'Cash on Delivery'}</strong></div>
      </div>
      <div class="order-detail-section">
        <h4>Items (${items.length})</h4>
        ${items.map(item => `
          <div class="order-item-row">
            <img src="${item.image || ''}" alt="" class="order-item-img" onerror="this.style.display='none'">
            <div class="order-item-info">
              <div class="order-item-title">${item.title || '—'}</div>
              <div class="order-item-meta">${item.size || ''}${item.size && item.color ? ' / ' : ''}${item.color || ''} × ${item.qty || 1}</div>
            </div>
            <div class="order-item-price">Rs. ${((item.price||0)*(item.qty||1)).toLocaleString()}</div>
          </div>`).join('')}
      </div>
      <div class="order-detail-section">
        <h4>Payment Summary</h4>
        <div class="order-detail-row"><span>Subtotal</span><strong>Rs. ${(parseFloat(order.subtotal)||0).toLocaleString()}</strong></div>
        <div class="order-detail-row"><span>Shipping</span><strong>${parseFloat(order.shipping_cost)===0?'FREE':'Rs. '+(parseFloat(order.shipping_cost)||0).toLocaleString()}</strong></div>
        <div class="order-detail-row" style="font-size:1.1rem;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);"><span>Total</span><strong style="color:var(--color-gold);">Rs. ${(parseFloat(order.total)||0).toLocaleString()}</strong></div>
      </div>
      <div style="margin-top:20px;display:flex;gap:8px;">
        <a href="https://wa.me/${order.phone?.replace(/[^0-9]/g,'')}" target="_blank" class="admin-logout" style="padding:10px 20px;border-color:#25D366;color:#25D366;text-decoration:none;">
          <i class="fa-brands fa-whatsapp"></i> WhatsApp
        </a>
        <button onclick="window.print()" class="admin-logout" style="padding:10px 20px;">
          <i class="fa-solid fa-print"></i> Print
        </button>
      </div>`;
    modal.classList.add('open');
  }

  // Activity Feed
  function renderActivity() {
    const list = document.getElementById('activityList');
    const empty = document.getElementById('activityEmpty');
    if (!allOrders.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';

    const recent = allOrders.slice(0, 10);
    list.innerHTML = recent.map(o => {
      const time = o.created_at ? new Date(o.created_at).toLocaleString('en-PK', { dateStyle:'medium', timeStyle:'short' }) : '—';
      const statusColors = { pending:'#FFC107', confirmed:'#6495ED', shipped:'var(--color-gold)', delivered:'#25D366', cancelled:'#E8505B' };
      const color = statusColors[o.status] || '#FFC107';
      return `<div class="activity-item">
        <div class="activity-dot" style="background:${color};"></div>
        <div class="activity-info">
          <strong>${o.customer_name || 'Unknown'}</strong> placed order <span style="color:var(--color-gold);">${o.order_id || '—'}</span> — Rs. ${(parseFloat(o.total)||0).toLocaleString()}
          <div class="activity-time">${time}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Order Breakdown
  function renderBreakdown() {
    const el = document.getElementById('orderBreakdown');
    const statuses = ['pending','confirmed','shipped','delivered','cancelled'];
    const counts = statuses.map(s => ({ status: s, count: allOrders.filter(o => o.status === s).length }));
    const total = allOrders.length || 1;

    el.innerHTML = counts.map(c => {
      const pct = Math.round((c.count / total) * 100);
      const colors = { pending:'#FFC107', confirmed:'#6495ED', shipped:'#C9A96E', delivered:'#25D366', cancelled:'#E8505B' };
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <span style="width:80px;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);">${c.status}</span>
        <div style="flex:1;height:8px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${colors[c.status]};border-radius:4px;transition:width 0.5s ease;"></div>
        </div>
        <span style="width:50px;text-align:right;font-size:0.85rem;font-weight:600;color:var(--color-cream);">${c.count}</span>
      </div>`;
    }).join('');
  }

  // Filters
  document.getElementById('statusFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.status;
    renderOrders();
  });

  // Export CSV
  document.getElementById('exportBtn').addEventListener('click', () => {
    if (!allOrders.length) return;
    const headers = ['Order ID','Customer','Phone','Email','Address','Payment','Subtotal','Shipping','Total','Status','Date'];
    const rows = allOrders.map(o => [
      o.order_id, o.customer_name, o.phone, o.email,
      (o.shipping_address||'').replace(/,/g,';'), o.payment_method,
      o.subtotal, o.shipping_cost, o.total, o.status,
      o.created_at ? new Date(o.created_at).toLocaleDateString() : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v||''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hmy-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  });

  // Delete Confirmation (shared for orders + products)
  document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.remove('open');
    deleteTarget = null;
  });
  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deleteTarget) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

    if (deleteTarget.type === 'order') {
      try {
        await sb.from('orders').delete().eq('id', deleteTarget.id);
        await fetchOrders();
        toast('Order deleted');
      } catch (e) { console.error(e); toast('Error deleting order', 'error'); }
    } else if (deleteTarget.type === 'product') {
      deleteProductById(parseInt(deleteTarget.id));
      renderProductsTable();
      toast('Product deleted');
    }

    document.getElementById('deleteModal').classList.remove('open');
    btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
    deleteTarget = null;
  });

  // ══════════════════════════════════════
  // PRODUCTS CMS
  // ══════════════════════════════════════
  const STORAGE_KEY_PRODUCTS = 'hmy_products_custom';

  function getCustomProducts() {
    const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { return null; }
    }
    return null;
  }

  function getAllProducts() {
    return getCustomProducts() || [...PRODUCTS];
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }

  function deleteProductById(id) {
    const products = getAllProducts().filter(p => p.id !== id);
    saveProducts(products);
  }

  function renderProductsTable() {
    const body = document.getElementById('productsBody');
    const products = getAllProducts();
    const labels = CATEGORY_LABELS || {};

    body.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.images[0] || ''}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.1);" onerror="this.style.background='#1a1510';this.style.display='flex';this.alt='HMY';"></td>
        <td style="font-weight:500;color:var(--color-cream);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.title}</td>
        <td style="font-size:0.8rem;">${labels[p.category] || p.category}</td>
        <td style="font-weight:600;">Rs. ${(p.price||0).toLocaleString()}</td>
        <td style="color:var(--color-text-muted);text-decoration:line-through;font-size:0.8rem;">${p.originalPrice ? 'Rs. '+p.originalPrice.toLocaleString() : '—'}</td>
        <td>${p.badge ? `<span class="status-badge confirmed" style="font-size:0.6rem;">${p.badge}</span>` : '—'}</td>
        <td>${p.featured ? '<i class="fa-solid fa-star" style="color:var(--color-gold);"></i>' : '—'}</td>
        <td style="display:flex;gap:4px;">
          <button class="edit-product-btn" data-id="${p.id}" style="background:none;border:1px solid rgba(201,169,110,0.3);color:var(--color-gold);width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.75rem;">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="delete-product-btn" data-id="${p.id}" style="background:none;border:1px solid rgba(232,80,91,0.3);color:#E8505B;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.75rem;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Edit buttons
    body.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => openProductForm(parseInt(btn.dataset.id)));
    });

    // Delete buttons
    body.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteTarget = { type: 'product', id: btn.dataset.id };
        document.getElementById('deleteModalText').textContent = 'This product will be permanently removed.';
        document.getElementById('deleteModal').classList.add('open');
      });
    });
  }

  // ── Image Upload State ──
  let uploadedImages = []; // Array of base64 data URLs or regular URLs

  function renderUploadPreview() {
    const container = document.getElementById('uploadPreview');
    container.innerHTML = uploadedImages.map((src, i) => `
      <div class="upload-preview-item">
        <img src="${src}" alt="Image ${i+1}">
        <button type="button" class="remove-img" data-index="${i}"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join('');

    container.querySelectorAll('.remove-img').forEach(btn => {
      btn.addEventListener('click', () => {
        uploadedImages.splice(parseInt(btn.dataset.index), 1);
        renderUploadPreview();
      });
    });
  }

  // Compress and convert image to base64
  function compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800; // max width/height
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Upload zone events
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('pf_imageUpload');

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) { toast('Image too large (max 2MB): ' + file.name, 'error'); continue; }
      const base64 = await compressImage(file);
      uploadedImages.push(base64);
    }
    renderUploadPreview();
  });

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files);
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) { toast('Image too large (max 2MB): ' + file.name, 'error'); continue; }
      const base64 = await compressImage(file);
      uploadedImages.push(base64);
    }
    fileInput.value = '';
    renderUploadPreview();
  });

  // Product Form
  function openProductForm(editId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productFormTitle');
    const form = document.getElementById('productForm');

    uploadedImages = []; // Reset

    if (editId) {
      const p = getAllProducts().find(x => x.id === editId);
      if (!p) return;
      title.textContent = 'Edit Product';
      document.getElementById('pf_id').value = p.id;
      document.getElementById('pf_title').value = p.title;
      document.getElementById('pf_category').value = p.category;
      document.getElementById('pf_badge').value = p.badge || '';
      document.getElementById('pf_price').value = p.price;
      document.getElementById('pf_originalPrice').value = p.originalPrice || '';
      document.getElementById('pf_description').value = p.description || '';
      uploadedImages = [...(p.images || [])]; // Load existing images
      document.getElementById('pf_sizes').value = (p.sizes || []).join(', ');
      document.getElementById('pf_colors').value = (p.colors || []).map(c => `${c.name}:${c.hex}`).join(', ');
      document.getElementById('pf_fabric').value = p.fabric || '';
      document.getElementById('pf_care').value = p.care || '';
      document.getElementById('pf_featured').checked = p.featured || false;
      document.getElementById('pf_inStock').checked = p.inStock !== false;
    } else {
      title.textContent = 'Add New Product';
      form.reset();
      document.getElementById('pf_id').value = '';
      document.getElementById('pf_inStock').checked = true;
    }

    renderUploadPreview();
    modal.classList.add('open');
  }

  document.getElementById('addProductBtn').addEventListener('click', () => openProductForm());

  document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const products = getAllProducts();
    const editId = document.getElementById('pf_id').value;
    const categoryLabels = CATEGORY_LABELS || {};

    const category = document.getElementById('pf_category').value;
    const colorsRaw = document.getElementById('pf_colors').value;
    const colors = colorsRaw ? colorsRaw.split(',').map(c => {
      const parts = c.trim().split(':');
      return { name: parts[0]?.trim() || '', hex: parts[1]?.trim() || '#000' };
    }).filter(c => c.name) : [];

    const productData = {
      title: document.getElementById('pf_title').value,
      slug: document.getElementById('pf_title').value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-'),
      category: category,
      categoryLabel: categoryLabels[category] || category,
      price: parseInt(document.getElementById('pf_price').value) || 0,
      originalPrice: parseInt(document.getElementById('pf_originalPrice').value) || null,
      rating: 4.5,
      reviews: 0,
      badge: document.getElementById('pf_badge').value || '',
      images: [...uploadedImages],
      sizes: document.getElementById('pf_sizes').value.split(',').map(s => s.trim()).filter(Boolean),
      colors: colors,
      description: document.getElementById('pf_description').value || '',
      fabric: document.getElementById('pf_fabric').value || '',
      care: document.getElementById('pf_care').value || '',
      featured: document.getElementById('pf_featured').checked,
      inStock: document.getElementById('pf_inStock').checked
    };

    if (editId) {
      // Edit existing
      const idx = products.findIndex(p => p.id === parseInt(editId));
      if (idx !== -1) {
        productData.id = parseInt(editId);
        productData.rating = products[idx].rating;
        productData.reviews = products[idx].reviews;
        products[idx] = productData;
      }
    } else {
      // Add new
      const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
      productData.id = maxId + 1;
      products.push(productData);
    }

    saveProducts(products);
    renderProductsTable();
    document.getElementById('productModal').classList.remove('open');
    toast(editId ? 'Product updated!' : 'Product added!');
  });

  // ══════════════════════════════════════
  // SITE CONTENT CMS
  // ══════════════════════════════════════
  const STORAGE_KEY_CONTENT = 'hmy_site_content';

  const DEFAULT_ANNOUNCEMENTS = [
    'CASH ON DELIVERY AVAILABLE NATIONWIDE',
    'ORDER VIA WHATSAPP — INSTANT CONFIRMATION',
    'FREE DELIVERY ON ORDERS OVER PKR 5,000',
    'EASY RETURNS WITHIN 7 DAYS'
  ];

  const DEFAULT_HERO = [
    { video: 'videos/hero-1.mp4', eyebrow: 'THE ART OF EASTERN LUXURY', heading: 'Discover HMY —<br>Where Tradition Meets Class', btnText: 'SHOP COLLECTION', btnLink: 'shop.html' },
    { video: 'videos/hero-2.mp4', eyebrow: "MEN'S COLLECTION", heading: 'Royal Kurtas &<br>Premium Fabrics', btnText: 'SHOP MEN', btnLink: 'shop.html?cat=men-stitched' },
    { video: 'videos/hero-3.mp4', eyebrow: "WOMEN'S COLLECTION", heading: 'Luxury Chiffon &<br>Velvet Pret', btnText: 'SHOP WOMEN', btnLink: 'shop.html?cat=women-stitched' }
  ];

  const DEFAULT_STORY = {
    video: 'https://www.pexels.com/download/video/10547950/',
    heading: 'Our Heritage',
    text: 'HMY was born from a passion for preserving the art of Eastern craftsmanship. Every stitch, every fragrance, every fabric in our collection tells a story of heritage, precision, and royal luxury. From the ateliers of Lahore to your doorstep — we bring you fashion that transcends seasons.'
  };

  function getSiteContent() {
    const stored = localStorage.getItem(STORAGE_KEY_CONTENT);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { return null; }
    }
    return null;
  }

  function saveSiteContent(content) {
    localStorage.setItem(STORAGE_KEY_CONTENT, JSON.stringify(content));
  }

  function getCurrentContent() {
    return getSiteContent() || {
      announcements: [...DEFAULT_ANNOUNCEMENTS],
      hero: DEFAULT_HERO.map(h => ({...h})),
      story: {...DEFAULT_STORY}
    };
  }

  // ── Announcement Bar Editor ──
  function renderAnnouncementEditor() {
    const content = getCurrentContent();
    const container = document.getElementById('announcementItems');

    container.innerHTML = content.announcements.map((text, i) => `
      <div class="cms-list-item">
        <input type="text" value="${text}" class="cms-input announcement-input" data-index="${i}" style="flex:1;">
        <button class="cms-remove-btn" data-index="${i}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join('');

    // Remove buttons
    container.querySelectorAll('.cms-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = getCurrentContent();
        c.announcements.splice(parseInt(btn.dataset.index), 1);
        saveSiteContent(c);
        renderAnnouncementEditor();
      });
    });
  }

  document.getElementById('addAnnouncementBtn').addEventListener('click', () => {
    const input = document.getElementById('newAnnouncementText');
    const text = input.value.trim();
    if (!text) return;
    const content = getCurrentContent();
    content.announcements.push(text);
    saveSiteContent(content);
    input.value = '';
    renderAnnouncementEditor();
  });

  document.getElementById('saveAnnouncementBtn').addEventListener('click', () => {
    const content = getCurrentContent();
    const inputs = document.querySelectorAll('.announcement-input');
    content.announcements = Array.from(inputs).map(inp => inp.value.trim()).filter(Boolean);
    saveSiteContent(content);
    toast('Announcement bar saved!');
  });

  document.getElementById('resetAnnouncementBtn').addEventListener('click', () => {
    const content = getCurrentContent();
    content.announcements = [...DEFAULT_ANNOUNCEMENTS];
    saveSiteContent(content);
    renderAnnouncementEditor();
    toast('Announcement bar reset to default');
  });

  // ══════════════════════════════════════
  // IndexedDB for Video Storage
  // ══════════════════════════════════════
  const DB_NAME = 'hmy_videos_db';
  const DB_STORE = 'videos';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveVideo(key, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getVideo(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteVideo(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── Hero Videos Editor ──
  function renderHeroEditor() {
    const content = getCurrentContent();
    const container = document.getElementById('heroEditors');

    container.innerHTML = content.hero.map((panel, i) => `
      <div class="cms-hero-panel">
        <h4 style="color:var(--color-gold);font-size:0.8rem;letter-spacing:0.1em;margin-bottom:12px;">PANEL ${i + 1}</h4>
        <div class="cms-field">
          <label>Video</label>
          <div class="upload-zone hero-video-upload" data-index="${i}" style="padding:14px;margin-bottom:8px;">
            <i class="fa-solid fa-video" style="font-size:1rem;color:var(--color-gold);margin-bottom:4px;"></i>
            <p style="font-size:0.8rem;color:var(--color-text-light);">Click to upload video</p>
            <input type="file" class="hero-video-file" data-index="${i}" accept="video/*" style="display:none;">
          </div>
          <div class="hero-video-preview" id="heroVideoPreview${i}" style="margin-bottom:8px;"></div>
          <input type="text" class="cms-input hero-video" data-index="${i}" value="${panel.video || ''}" placeholder="Or paste URL">
        </div>
        <div class="cms-field"><label>Eyebrow Text</label><input type="text" class="cms-input hero-eyebrow" data-index="${i}" value="${panel.eyebrow || ''}"></div>
        <div class="cms-field"><label>Heading (use &lt;br&gt; for line break)</label><input type="text" class="cms-input hero-heading" data-index="${i}" value="${panel.heading || ''}"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="cms-field"><label>Button Text</label><input type="text" class="cms-input hero-btn-text" data-index="${i}" value="${panel.btnText || ''}"></div>
          <div class="cms-field"><label>Button Link</label><input type="text" class="cms-input hero-btn-link" data-index="${i}" value="${panel.btnLink || ''}"></div>
        </div>
      </div>
    `).join('');

    // Upload zone clicks
    container.querySelectorAll('.hero-video-upload').forEach(zone => {
      const i = zone.dataset.index;
      const fileInput = zone.querySelector('.hero-video-file');
      zone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) { toast('Video too large (max 50MB)', 'error'); return; }
        toast('Uploading video...');
        await saveVideo('hero-video-' + i, file);
        showHeroVideoPreview(i, file);
        document.querySelector(`.hero-video[data-index="${i}"]`).value = `[UPLOADED: ${file.name}]`;
        toast('Video uploaded for Panel ' + (parseInt(i)+1) + '!');
      });
    });

    // Check for existing uploaded videos
    [0,1,2].forEach(async (i) => {
      const blob = await getVideo('hero-video-' + i);
      if (blob) showHeroVideoPreview(i, blob);
    });
  }

  function showHeroVideoPreview(index, blob) {
    const container = document.getElementById('heroVideoPreview' + index);
    if (!container) return;
    const url = URL.createObjectURL(blob);
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);">
        <video src="${url}" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" muted></video>
        <span style="font-size:0.75rem;color:var(--color-gold);flex:1;"><i class="fa-solid fa-check-circle"></i> Video uploaded</span>
        <button type="button" class="cms-remove-btn" onclick="this.closest('.cms-field').querySelector('.hero-video').value='';this.parentElement.remove();" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
  }

  document.getElementById('saveHeroBtn').addEventListener('click', () => {
    const content = getCurrentContent();
    content.hero = [0, 1, 2].map(i => ({
      video: document.querySelector(`.hero-video[data-index="${i}"]`)?.value || '',
      eyebrow: document.querySelector(`.hero-eyebrow[data-index="${i}"]`)?.value || '',
      heading: document.querySelector(`.hero-heading[data-index="${i}"]`)?.value || '',
      btnText: document.querySelector(`.hero-btn-text[data-index="${i}"]`)?.value || '',
      btnLink: document.querySelector(`.hero-btn-link[data-index="${i}"]`)?.value || ''
    }));
    saveSiteContent(content);
    toast('Hero videos saved!');
  });

  document.getElementById('resetHeroBtn').addEventListener('click', async () => {
    const content = getCurrentContent();
    content.hero = DEFAULT_HERO.map(h => ({...h}));
    saveSiteContent(content);
    // Remove uploaded videos
    for (let i = 0; i < 3; i++) await deleteVideo('hero-video-' + i);
    renderHeroEditor();
    toast('Hero videos reset to default');
  });

  // ── Story Editor ──
  function renderStoryEditor() {
    const content = getCurrentContent();
    document.getElementById('storyVideoUrl').value = content.story.video || '';
    document.getElementById('storyHeading').value = content.story.heading || '';
    document.getElementById('storyText').value = content.story.text || '';

    // Check for existing uploaded story video
    getVideo('story-video').then(blob => {
      if (blob) showStoryVideoPreview(blob);
    });
  }

  // Story video upload
  const storyVideoZone = document.getElementById('storyVideoZone');
  const storyVideoFile = document.getElementById('storyVideoFile');
  storyVideoZone.addEventListener('click', () => storyVideoFile.click());
  storyVideoFile.addEventListener('change', async () => {
    const file = storyVideoFile.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast('Video too large (max 50MB)', 'error'); return; }
    toast('Uploading story video...');
    await saveVideo('story-video', file);
    showStoryVideoPreview(file);
    document.getElementById('storyVideoUrl').value = `[UPLOADED: ${file.name}]`;
    toast('Story video uploaded!');
  });

  function showStoryVideoPreview(blob) {
    const container = document.getElementById('storyVideoPreview');
    if (!container) return;
    const url = URL.createObjectURL(blob);
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);">
        <video src="${url}" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" muted></video>
        <span style="font-size:0.75rem;color:var(--color-gold);flex:1;"><i class="fa-solid fa-check-circle"></i> Video uploaded</span>
        <button type="button" class="cms-remove-btn" onclick="document.getElementById('storyVideoUrl').value='';this.parentElement.remove();" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
  }

  document.getElementById('saveStoryBtn').addEventListener('click', () => {
    const content = getCurrentContent();
    content.story = {
      video: document.getElementById('storyVideoUrl').value.trim(),
      heading: document.getElementById('storyHeading').value.trim(),
      text: document.getElementById('storyText').value.trim()
    };
    saveSiteContent(content);
    toast('Story section saved!');
  });

  document.getElementById('resetStoryBtn').addEventListener('click', async () => {
    const content = getCurrentContent();
    content.story = {...DEFAULT_STORY};
    saveSiteContent(content);
    await deleteVideo('story-video');
    renderStoryEditor();
    toast('Story section reset to default');
  });

  // ══════════════════════════════════════
  // MODALS CLOSE
  // ══════════════════════════════════════
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('orderModal').classList.remove('open');
      document.getElementById('deleteModal').classList.remove('open');
      document.getElementById('productModal').classList.remove('open');
    }
  });
  ['orderModal', 'deleteModal', 'productModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => {
      if (e.target.id === id) e.target.classList.remove('open');
    });
  });

  // ══════════════════════════════════════
  // INIT
  // ══════════════════════════════════════
  await fetchOrders();
  renderProductsTable();
  renderAnnouncementEditor();
  renderHeroEditor();
  renderStoryEditor();
});
