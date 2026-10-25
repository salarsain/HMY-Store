// ==========================================================================
// HMY Store — Admin Dashboard Logic (admin.js)
// Orders, Products CMS, Category images, Site Content (all saved to Supabase)
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
      try {
        await deleteProductCloud(parseInt(deleteTarget.id));
        renderProductsTable();
        toast('Product deleted from all devices');
      } catch (e) { console.error(e); toast('Error deleting product: ' + (e.message || e), 'error'); }
    }

    document.getElementById('deleteModal').classList.remove('open');
    btn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
    deleteTarget = null;
  });

  // ══════════════════════════════════════
  // CLOUD HELPERS (Supabase DB + Storage)
  // Everything saved here is visible on ALL devices.
  // ══════════════════════════════════════
  const BUCKET = 'store-media';
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let adminProducts = [];
  let productsInitialized = false;
  let siteContent = null;
  let categoryImages = {};

  function getLegacyLocalProducts() {
    try { const s = localStorage.getItem('hmy_products_custom'); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }

  function showCloudWarning(msg) {
    if (document.getElementById('cloudWarning')) return;
    const bar = document.createElement('div');
    bar.id = 'cloudWarning';
    bar.style.cssText = 'background:rgba(232,80,91,0.12);border:1px solid #E8505B;color:#ffb3b8;padding:14px 18px;border-radius:8px;margin:0 0 16px;font-size:0.85rem;line-height:1.5;';
    bar.innerHTML = '<strong>Cloud database not ready.</strong> ' + esc(msg) + ' Run <code>supabase/schema.sql</code> in Supabase → SQL Editor, then refresh this page.';
    document.querySelector('.admin-tabs').insertAdjacentElement('beforebegin', bar);
  }

  async function loadCloudData() {
    const [prodRes, contentRes] = await Promise.all([
      sb.from('products').select('id,data').order('id', { ascending: true }),
      sb.from('site_content').select('key,value')
    ]);
    if (prodRes.error || contentRes.error) {
      const err = prodRes.error || contentRes.error;
      console.error('Cloud load error:', err);
      showCloudWarning(err.message || 'Tables are missing.');
      adminProducts = getLegacyLocalProducts() || [...PRODUCTS];
      return false;
    }
    const kv = {};
    contentRes.data.forEach(r => { kv[r.key] = r.value; });
    productsInitialized = !!kv.products_initialized;
    siteContent = kv.content || null;
    categoryImages = kv.category_images || {};
    if (productsInitialized) {
      adminProducts = prodRes.data.map(r => ({ ...r.data, id: r.id }));
    } else {
      // Not in the cloud yet: show this device's old products (or the defaults)
      adminProducts = getLegacyLocalProducts() || [...PRODUCTS];
    }
    return true;
  }

  async function uploadToStorage(blob, folder) {
    const type = blob.type || 'application/octet-stream';
    const ext = (type.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace('quicktime', 'mov').replace('x-matroska', 'mkv');
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { cacheControl: '31536000', contentType: type });
    if (error) throw error;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // Resize big photos but NEVER crop them. PNG/WebP keep transparency.
  function compressImage(file, MAX = 1400) {
    return new Promise((resolve, reject) => {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Image compression failed')),
          keepAlpha ? 'image/png' : 'image/jpeg', 0.86);
      };
      img.onerror = () => reject(new Error('Not a valid image file'));
      img.src = objUrl;
    });
  }

  async function dataUrlToBlob(u) { return (await fetch(u)).blob(); }

  // First time only: copy the current product list (defaults or this device's old list) to the cloud.
  async function ensureSeeded() {
    if (productsInitialized) return;
    toast('First-time setup: moving products to the cloud...');
    const list = [];
    for (const p of adminProducts) {
      const copy = { ...p, images: [...(p.images || [])] };
      for (let i = 0; i < copy.images.length; i++) {
        if (String(copy.images[i]).startsWith('data:')) {
          copy.images[i] = await uploadToStorage(await dataUrlToBlob(copy.images[i]), 'products');
        }
      }
      list.push(copy);
    }
    const rows = list.map(({ id, ...data }) => ({ id, data }));
    const r1 = await sb.from('products').upsert(rows);
    if (r1.error) throw r1.error;
    const r2 = await sb.from('site_content').upsert({ key: 'products_initialized', value: true });
    if (r2.error) throw r2.error;
    adminProducts = list;
    productsInitialized = true;
    renderSeedBanner();
    renderProductsTable();
  }

  async function saveProductCloud(product) {
    await ensureSeeded();
    const { id, ...data } = product;
    const { error } = await sb.from('products').upsert({ id, data, updated_at: new Date().toISOString() });
    if (error) throw error;
    const idx = adminProducts.findIndex(p => p.id === id);
    if (idx === -1) adminProducts.push(product); else adminProducts[idx] = product;
  }

  async function deleteProductCloud(id) {
    await ensureSeeded();
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) throw error;
    adminProducts = adminProducts.filter(p => p.id !== id);
  }

  function renderSeedBanner() {
    const el = document.getElementById('seedBanner');
    if (!el) return;
    if (productsInitialized) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div style="background:rgba(201,169,110,0.10);border:1px solid var(--color-gold);padding:14px 18px;border-radius:8px;margin-bottom:16px;font-size:0.85rem;color:var(--color-cream);display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <span style="flex:1;min-width:220px;">These products are NOT in the cloud yet, so other devices still see the default list. Save once to publish them everywhere.</span>
        <button type="button" class="export-btn" id="seedNowBtn" style="border-color:var(--color-gold);color:var(--color-gold);"><i class="fa-solid fa-cloud-arrow-up"></i> Publish to cloud now</button>
      </div>`;
    document.getElementById('seedNowBtn').addEventListener('click', async () => {
      try { await ensureSeeded(); toast('Products are now live on all devices!'); }
      catch (e) { console.error(e); toast('Failed: ' + (e.message || e), 'error'); }
    });
  }

  // ══════════════════════════════════════
  // PRODUCTS CMS (cloud)
  // ══════════════════════════════════════
  function getAllProducts() { return adminProducts; }

  function renderProductsTable() {
    const body = document.getElementById('productsBody');
    const products = getAllProducts();
    const labels = CATEGORY_LABELS || {};

    body.innerHTML = products.map(p => `
      <tr>
        <td><img src="${esc((p.images && p.images[0]) || '')}" alt="" style="width:50px;height:62px;object-fit:contain;background:#111;border-radius:6px;border:1px solid rgba(255,255,255,0.1);" onerror="this.style.opacity=0.2;"></td>
        <td style="font-weight:500;color:var(--color-cream);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.title)}</td>
        <td style="font-size:0.8rem;">${esc(labels[p.category] || p.category)}</td>
        <td style="font-weight:600;">Rs. ${(p.price || 0).toLocaleString()}</td>
        <td style="color:var(--color-text-muted);text-decoration:line-through;font-size:0.8rem;">${p.originalPrice ? 'Rs. ' + p.originalPrice.toLocaleString() : '—'}</td>
        <td>${p.badge ? `<span class="status-badge confirmed" style="font-size:0.6rem;">${esc(p.badge)}</span>` : '—'}</td>
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

    body.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => openProductForm(parseInt(btn.dataset.id)));
    });
    body.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteTarget = { type: 'product', id: btn.dataset.id };
        document.getElementById('deleteModalText').textContent = 'This product will be permanently removed from the store (all devices).';
        document.getElementById('deleteModal').classList.add('open');
      });
    });
  }

  // ── Image Upload State (public URLs from Supabase Storage) ──
  let uploadedImages = [];

  function renderUploadPreview() {
    const container = document.getElementById('uploadPreview');
    container.innerHTML = uploadedImages.map((src, i) => `
      <div class="upload-preview-item">
        <img src="${esc(src)}" alt="Image ${i + 1}" style="object-fit:contain;background:#111;">
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

  async function addProductImages(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) { toast('Image too large (max 8MB): ' + file.name, 'error'); continue; }
      try {
        toast('Uploading ' + file.name + '...');
        const blob = await compressImage(file, 1400);
        uploadedImages.push(await uploadToStorage(blob, 'products'));
        renderUploadPreview();
      } catch (e) {
        console.error(e);
        toast('Upload failed: ' + (e.message || e), 'error');
      }
    }
  }

  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('pf_imageUpload');
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    await addProductImages(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files);
    fileInput.value = '';
    await addProductImages(files);
  });

  // Product Form
  function openProductForm(editId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productFormTitle');
    const form = document.getElementById('productForm');

    uploadedImages = [];

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
      uploadedImages = [...(p.images || [])];
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

  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
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
      const old = adminProducts.find(p => p.id === parseInt(editId));
      productData.id = parseInt(editId);
      productData.rating = old ? old.rating : 4.5;
      productData.reviews = old ? old.reviews : 0;
    } else {
      productData.id = adminProducts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    }

    const original = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    try {
      await saveProductCloud(productData);
      renderProductsTable();
      document.getElementById('productModal').classList.remove('open');
      toast(editId ? 'Product updated on all devices!' : 'Product added on all devices!');
    } catch (err) {
      console.error(err);
      toast('Save failed: ' + (err.message || err), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = original;
    }
  });

  // ══════════════════════════════════════
  // CATEGORY IMAGES (page banner + home showcase card)
  // Saved to the cloud immediately after upload.
  // ══════════════════════════════════════
  const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS || {}).filter(k => k !== 'all');

  function effectiveCategoryImage(key, kind) {
    const ci = categoryImages[key] || {};
    return ci[kind] || ci[kind === 'hero' ? 'card' : 'hero'] || CATEGORY_IMAGES[key] || '';
  }

  async function saveCategoryImages(next) {
    const { error } = await sb.from('site_content').upsert({ key: 'category_images', value: next, updated_at: new Date().toISOString() });
    if (error) throw error;
    categoryImages = next;
  }

  const catFileInput = document.createElement('input');
  catFileInput.type = 'file';
  catFileInput.accept = 'image/*';
  catFileInput.style.display = 'none';
  document.body.appendChild(catFileInput);
  let catTarget = null;

  catFileInput.addEventListener('change', async () => {
    const file = catFileInput.files[0];
    catFileInput.value = '';
    if (!file || !catTarget) return;
    const { key, kind } = catTarget;
    if (file.size > 10 * 1024 * 1024) { toast('Image too large (max 10MB)', 'error'); return; }
    try {
      toast('Uploading image...');
      const blob = await compressImage(file, kind === 'hero' ? 2000 : 1200);
      const url = await uploadToStorage(blob, 'categories');
      const next = { ...categoryImages, [key]: { ...(categoryImages[key] || {}), [kind]: url } };
      await saveCategoryImages(next);
      renderCategoryImageEditor();
      toast('Saved! Visible on all devices.');
    } catch (e) {
      console.error(e);
      toast('Upload failed: ' + (e.message || e), 'error');
    }
  });

  function renderCategoryImageEditor() {
    const el = document.getElementById('categoryImageEditors');
    if (!el) return;
    el.innerHTML = CATEGORY_KEYS.map(key => {
      const ci = categoryImages[key] || {};
      const slot = (kind, title, hint) => `
        <div class="cat-img-slot">
          <label>${title}</label>
          <div class="cat-img-preview ${kind}"><img src="${esc(effectiveCategoryImage(key, kind))}" alt=""></div>
          <div class="cat-img-hint">${hint}${ci[kind] ? '' : ' — not uploaded yet'}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" class="export-btn cat-upload-btn" data-key="${key}" data-kind="${kind}"><i class="fa-solid fa-upload"></i> Upload</button>
            ${ci[kind] ? `<button type="button" class="export-btn cat-remove-btn" data-key="${key}" data-kind="${kind}" style="border-color:#E8505B;color:#E8505B;"><i class="fa-solid fa-xmark"></i> Remove</button>` : ''}
          </div>
        </div>`;
      return `
        <div class="cat-img-row">
          <h4>${esc(CATEGORY_LABELS[key])}</h4>
          <div class="cat-img-slots">
            ${slot('hero', 'Page Banner', 'Wide image, about 1600×600')}
            ${slot('card', 'Home Showcase Card', 'Landscape, about 800×600')}
          </div>
        </div>`;
    }).join('');

    el.querySelectorAll('.cat-upload-btn').forEach(btn => {
      btn.addEventListener('click', () => { catTarget = { key: btn.dataset.key, kind: btn.dataset.kind }; catFileInput.click(); });
    });
    el.querySelectorAll('.cat-remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { key, kind } = btn.dataset;
        const entry = { ...(categoryImages[key] || {}) };
        delete entry[kind];
        const next = { ...categoryImages };
        if (Object.keys(entry).length) next[key] = entry; else delete next[key];
        try { await saveCategoryImages(next); renderCategoryImageEditor(); toast('Image removed'); }
        catch (e) { console.error(e); toast('Failed: ' + (e.message || e), 'error'); }
      });
    });
  }

  // ══════════════════════════════════════
  // SITE CONTENT CMS (cloud)
  // ══════════════════════════════════════
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

  function getCurrentContent() {
    const base = {
      announcements: [...DEFAULT_ANNOUNCEMENTS],
      hero: DEFAULT_HERO.map(h => ({ ...h })),
      story: { ...DEFAULT_STORY }
    };
    return siteContent ? { ...base, ...siteContent } : base;
  }

  async function saveSiteContent(content) {
    const { error } = await sb.from('site_content').upsert({ key: 'content', value: content, updated_at: new Date().toISOString() });
    if (error) throw error;
    siteContent = content;
  }

  async function trySaveContent(content, okMsg) {
    try { await saveSiteContent(content); toast(okMsg); return true; }
    catch (e) { console.error(e); toast('Save failed: ' + (e.message || e), 'error'); return false; }
  }

  // ── Announcement Bar Editor ──
  function renderAnnouncementEditor() {
    const content = getCurrentContent();
    const container = document.getElementById('announcementItems');

    container.innerHTML = content.announcements.map((text, i) => `
      <div class="cms-list-item">
        <input type="text" value="${esc(text)}" class="cms-input announcement-input" data-index="${i}" style="flex:1;">
        <button class="cms-remove-btn" data-index="${i}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join('');

    container.querySelectorAll('.cms-remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const c = getCurrentContent();
        c.announcements.splice(parseInt(btn.dataset.index), 1);
        if (await trySaveContent(c, 'Announcement removed')) renderAnnouncementEditor();
      });
    });
  }

  document.getElementById('addAnnouncementBtn').addEventListener('click', async () => {
    const input = document.getElementById('newAnnouncementText');
    const text = input.value.trim();
    if (!text) return;
    const content = getCurrentContent();
    content.announcements.push(text);
    if (await trySaveContent(content, 'Announcement added')) { input.value = ''; renderAnnouncementEditor(); }
  });

  document.getElementById('saveAnnouncementBtn').addEventListener('click', async () => {
    const content = getCurrentContent();
    content.announcements = Array.from(document.querySelectorAll('.announcement-input')).map(inp => inp.value.trim()).filter(Boolean);
    await trySaveContent(content, 'Announcement bar saved!');
  });

  document.getElementById('resetAnnouncementBtn').addEventListener('click', async () => {
    const content = getCurrentContent();
    content.announcements = [...DEFAULT_ANNOUNCEMENTS];
    if (await trySaveContent(content, 'Announcement bar reset to default')) renderAnnouncementEditor();
  });

  // ── Hero Videos Editor (videos are uploaded to cloud storage) ──
  function videoPreviewHTML(url, onRemoveJs) {
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);">
        <video src="${esc(url)}" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" muted preload="metadata"></video>
        <span style="font-size:0.75rem;color:var(--color-gold);flex:1;"><i class="fa-solid fa-check-circle"></i> Video ready — press Save to publish</span>
        <button type="button" class="cms-remove-btn" onclick="${onRemoveJs}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
  }

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
            <p style="font-size:0.8rem;color:var(--color-text-light);">Click to upload video (max 50MB)</p>
            <input type="file" class="hero-video-file" data-index="${i}" accept="video/*" style="display:none;">
          </div>
          <div class="hero-video-preview" id="heroVideoPreview${i}" style="margin-bottom:8px;"></div>
          <input type="text" class="cms-input hero-video" data-index="${i}" value="${esc(panel.video || '')}" placeholder="Or paste URL">
        </div>
        <div class="cms-field"><label>Eyebrow Text</label><input type="text" class="cms-input hero-eyebrow" data-index="${i}" value="${esc(panel.eyebrow || '')}"></div>
        <div class="cms-field"><label>Heading (use &lt;br&gt; for line break)</label><input type="text" class="cms-input hero-heading" data-index="${i}" value="${esc(panel.heading || '')}"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="cms-field"><label>Button Text</label><input type="text" class="cms-input hero-btn-text" data-index="${i}" value="${esc(panel.btnText || '')}"></div>
          <div class="cms-field"><label>Button Link</label><input type="text" class="cms-input hero-btn-link" data-index="${i}" value="${esc(panel.btnLink || '')}"></div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.hero-video-upload').forEach(zone => {
      const i = zone.dataset.index;
      const input = zone.querySelector('.hero-video-file');
      zone.addEventListener('click', () => input.click());
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('change', async () => {
        const file = input.files[0];
        input.value = '';
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) { toast('Video too large (max 50MB)', 'error'); return; }
        try {
          toast('Uploading video... please wait');
          const url = await uploadToStorage(file, 'videos');
          document.querySelector(`.hero-video[data-index="${i}"]`).value = url;
          document.getElementById('heroVideoPreview' + i).innerHTML =
            videoPreviewHTML(url, `document.querySelector('.hero-video[data-index=&quot;${i}&quot;]').value='';this.closest('.hero-video-preview').innerHTML='';`);
          toast('Video uploaded for Panel ' + (parseInt(i) + 1) + ' — press Save Hero Videos');
        } catch (e) { console.error(e); toast('Video upload failed: ' + (e.message || e), 'error'); }
      });
    });

    content.hero.forEach((panel, i) => {
      if (/^https?:\/\//.test(panel.video || '') && /\.(mp4|webm|mov)(\?|$)/i.test(panel.video)) {
        document.getElementById('heroVideoPreview' + i).innerHTML =
          videoPreviewHTML(panel.video, `document.querySelector('.hero-video[data-index=&quot;${i}&quot;]').value='';this.closest('.hero-video-preview').innerHTML='';`);
      }
    });
  }

  document.getElementById('saveHeroBtn').addEventListener('click', async () => {
    const content = getCurrentContent();
    content.hero = [0, 1, 2].map(i => ({
      video: document.querySelector(`.hero-video[data-index="${i}"]`)?.value.trim() || '',
      eyebrow: document.querySelector(`.hero-eyebrow[data-index="${i}"]`)?.value || '',
      heading: document.querySelector(`.hero-heading[data-index="${i}"]`)?.value || '',
      btnText: document.querySelector(`.hero-btn-text[data-index="${i}"]`)?.value || '',
      btnLink: document.querySelector(`.hero-btn-link[data-index="${i}"]`)?.value || ''
    }));
    await trySaveContent(content, 'Hero videos saved on all devices!');
  });

  document.getElementById('resetHeroBtn').addEventListener('click', async () => {
    const content = getCurrentContent();
    content.hero = DEFAULT_HERO.map(h => ({ ...h }));
    if (await trySaveContent(content, 'Hero videos reset to default')) renderHeroEditor();
  });

  // ── Story Editor ──
  function renderStoryEditor() {
    const content = getCurrentContent();
    document.getElementById('storyVideoUrl').value = content.story.video || '';
    document.getElementById('storyHeading').value = content.story.heading || '';
    document.getElementById('storyText').value = content.story.text || '';
    const prev = document.getElementById('storyVideoPreview');
    prev.innerHTML = '';
    if (/^https?:\/\/.+\.(mp4|webm|mov)(\?|$)/i.test(content.story.video || '')) {
      prev.innerHTML = videoPreviewHTML(content.story.video, `document.getElementById('storyVideoUrl').value='';this.closest('#storyVideoPreview').innerHTML='';`);
    }
  }

  const storyVideoZone = document.getElementById('storyVideoZone');
  const storyVideoFile = document.getElementById('storyVideoFile');
  storyVideoZone.addEventListener('click', () => storyVideoFile.click());
  storyVideoFile.addEventListener('click', (e) => e.stopPropagation());
  storyVideoFile.addEventListener('change', async () => {
    const file = storyVideoFile.files[0];
    storyVideoFile.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast('Video too large (max 50MB)', 'error'); return; }
    try {
      toast('Uploading story video... please wait');
      const url = await uploadToStorage(file, 'videos');
      document.getElementById('storyVideoUrl').value = url;
      document.getElementById('storyVideoPreview').innerHTML =
        videoPreviewHTML(url, `document.getElementById('storyVideoUrl').value='';this.closest('#storyVideoPreview').innerHTML='';`);
      toast('Story video uploaded — press Save Story');
    } catch (e) { console.error(e); toast('Video upload failed: ' + (e.message || e), 'error'); }
  });

  document.getElementById('saveStoryBtn').addEventListener('click', async () => {
    const content = getCurrentContent();
    content.story = {
      video: document.getElementById('storyVideoUrl').value.trim(),
      heading: document.getElementById('storyHeading').value.trim(),
      text: document.getElementById('storyText').value.trim()
    };
    await trySaveContent(content, 'Story section saved on all devices!');
  });

  document.getElementById('resetStoryBtn').addEventListener('click', async () => {
    const content = getCurrentContent();
    content.story = { ...DEFAULT_STORY };
    if (await trySaveContent(content, 'Story section reset to default')) renderStoryEditor();
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
  await loadCloudData();
  await fetchOrders();
  renderSeedBanner();
  renderProductsTable();
  renderCategoryImageEditor();
  renderAnnouncementEditor();
  renderHeroEditor();
  renderStoryEditor();
});
