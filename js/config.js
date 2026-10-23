// ==========================================================================
// HMY Store V2 — Configuration
// Supabase + WhatsApp + Store Settings
// ==========================================================================

const CONFIG = {
  // Supabase
  supabase: {
    url: 'https://jlplcmgeezkmkylbmfyc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscGxjbWdlZXprbWt5bGJtZnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDQzNTIsImV4cCI6MjEwMzMyMDM1Mn0.jmwPpzRcShYxjjebX5iB1t0HS4NsgF_yh8_U1_9qH7M'
  },

  // WhatsApp (owner's number — international format without +)
  whatsapp: {
    number: '923128464742',  // UPDATE THIS: owner's WhatsApp number
    businessName: 'HMY Store'
  },

  // Store Info
  store: {
    name: 'HMY',
    tagline: 'Luxury Eastern Fashion & Royal Fragrances',
    currency: 'Rs.',
    freeShippingThreshold: 5000,
    shippingCost: 250
  }
};

// Format currency
function formatPrice(amount) {
  return CONFIG.store.currency + ' ' + amount.toLocaleString();
}

// Calculate shipping
function calculateShipping(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= CONFIG.store.freeShippingThreshold ? 0 : CONFIG.store.shippingCost;
}

// Generate order ID
function generateOrderId() {
  return 'HMY-' + Math.floor(10000 + Math.random() * 90000);
}
