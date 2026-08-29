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

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateUI();
});
