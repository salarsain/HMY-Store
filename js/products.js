// ==========================================================================
// HMY Store V2 â€” Product Catalog (Enhanced)
// Includes sizes, colors, multiple images, detailed info
// ==========================================================================

const PRODUCTS = [
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MEN â€” STITCHED â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    id: 1,
    title: 'HMY Royal Embroidered Kurta Set',
    slug: 'royal-embroidered-kurta-set',
    category: 'men-stitched',
    categoryLabel: 'Men â€” Stitched',
    price: 6500,
    originalPrice: 8500,
    rating: 4.9,
    reviews: 128,
    badge: 'Bestseller',
    images: [
      'https://placehold.co/800x1000/1A1A1A/C9A96E?text=Royal+Kurta&font=playfair-display',
      'https://placehold.co/800x1000/1B2A4A/C9A96E?text=Royal+Kurta+2&font=playfair-display',
      'https://placehold.co/800x1000/4A5530/C9A96E?text=Royal+Kurta+3&font=playfair-display'
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Navy', hex: '#1B2A4A' },
      { name: 'Olive', hex: '#4A5530' }
    ],
    description: 'Premium hand-embellished collar cotton kurta with tailored slim trousers, crafted with royal luxury styling.',
    fabric: '100% Premium Egyptian Cotton with hand-embroidered collar and cuffs',
    care: 'Dry clean recommended. Iron on low heat. Store on hanger.',
    inStock: true,
    featured: true
  },
  {
    id: 2,
    title: 'HMY Classic Silk Waistcoat',
    slug: 'classic-silk-waistcoat',
    category: 'men-stitched',
    categoryLabel: 'Men â€” Stitched',
    price: 4200,
    originalPrice: 5500,
    rating: 4.7,
    reviews: 62,
    badge: 'Trending',
    images: [
      'https://placehold.co/800x1000/6B1D2A/C9A96E?text=Silk+Waistcoat&font=playfair-display',
      'https://placehold.co/800x1000/1A1A1A/C9A96E?text=Silk+Waistcoat+2&font=playfair-display'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Burgundy', hex: '#6B1D2A' },
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Gold', hex: '#C9A96E' }
    ],
    description: 'Formal Jacquard raw silk waistcoat with metallic monogram buttons. Adds supreme elegance to any festive outfit.',
    fabric: 'Jacquard Raw Silk with metallic HMY monogram buttons',
    care: 'Dry clean only. Do not iron directly on embroidery.',
    inStock: true,
    featured: false
  },
  {
    id: 3,
    title: 'HMY Platinum Shalwar Kameez',
    slug: 'platinum-shalwar-kameez',
    category: 'men-stitched',
    categoryLabel: 'Men â€” Stitched',
    price: 5800,
    originalPrice: 7200,
    rating: 4.8,
    reviews: 89,
    badge: 'Premium',
    images: [
      'https://placehold.co/800x1000/F5F0E8/1A1A1A?text=Shalwar+Kameez&font=playfair-display',
      'https://placehold.co/800x1000/87CEEB/1A1A1A?text=Shalwar+Kameez+2&font=playfair-display'
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'White', hex: '#F5F0E8' },
      { name: 'Sky Blue', hex: '#87CEEB' },
      { name: 'Sage', hex: '#9CAF88' }
    ],
    description: 'Ultra-premium wash-and-wear fabric shalwar kameez with minimalist embroidered neckline. Everyday luxury.',
    fabric: 'Premium Wash & Wear Blended Fabric with silk embroidery thread',
    care: 'Machine washable cold. Tumble dry low. Iron medium heat.',
    inStock: true,
    featured: true
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MEN â€” UNSTITCHED â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    id: 4,
    title: 'HMY Premium Egyptian Cotton (4.5m)',
    slug: 'premium-egyptian-cotton',
    category: 'men-unstitched',
    categoryLabel: 'Men â€” Unstitched',
    price: 4800,
    originalPrice: 6500,
    rating: 4.8,
    reviews: 94,
    badge: 'Pure Cotton',
    images: [
      'https://placehold.co/800x1000/F5F0E8/3C3C3C?text=Egyptian+Cotton&font=playfair-display',
      'https://placehold.co/800x1000/B0ADA8/1A1A1A?text=Egyptian+Cotton+2&font=playfair-display'
    ],
    sizes: ['4.5m', '5m'],
    colors: [
      { name: 'Off-White', hex: '#F5F0E8' },
      { name: 'Light Grey', hex: '#B0ADA8' },
      { name: 'Charcoal', hex: '#3C3C3C' }
    ],
    description: 'Unstitched ultra-soft Egyptian long-staple cotton with a silky luster finish. Ideal for all seasons.',
    fabric: '100% Egyptian Long-Staple Cotton (60s count) â€” Premium Giza Quality',
    care: 'Machine washable. Iron on medium heat. Recommended: professional stitching.',
    inStock: true,
    featured: true
  },
  {
    id: 5,
    title: 'HMY Luxury Lawn 3-Piece (4.5m)',
    slug: 'luxury-lawn-3piece',
    category: 'men-unstitched',
    categoryLabel: 'Men â€” Unstitched',
    price: 3200,
    originalPrice: 4500,
    rating: 4.6,
    reviews: 76,
    badge: 'Summer',
    images: [
      'https://placehold.co/800x1000/D4BC8A/1A1A1A?text=Luxury+Lawn&font=playfair-display'
    ],
    sizes: ['4.5m'],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Beige', hex: '#D4BC8A' }
    ],
    description: 'Premium lawn fabric â€” breathable, lightweight, and perfect for summer. Comes with matching shalwar piece.',
    fabric: 'Premium Swiss Lawn â€” 100% Cotton',
    care: 'Machine washable cold. Hang dry. Iron medium heat.',
    inStock: true,
    featured: false
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• WOMEN â€” STITCHED â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    id: 6,
    title: 'HMY Pret Velvet Kurti',
    slug: 'pret-velvet-kurti',
    category: 'women-stitched',
    categoryLabel: 'Women â€” Stitched',
    price: 7500,
    originalPrice: 9900,
    rating: 4.9,
    reviews: 145,
    badge: 'New Arrival',
    images: [
      'https://placehold.co/800x1000/6B1D2A/C9A96E?text=Velvet+Kurti&font=playfair-display',
      'https://placehold.co/800x1000/2E5A45/C9A96E?text=Velvet+Kurti+2&font=playfair-display'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Maroon', hex: '#6B1D2A' },
      { name: 'Emerald', hex: '#2E5A45' },
      { name: 'Midnight Blue', hex: '#1B2A4A' }
    ],
    description: 'Rich micro-velvet ready-to-wear kurta with antique tilla embroidery along neckline and bell sleeves.',
    fabric: 'Premium Micro Velvet with hand-worked tilla and zardozi embroidery',
    care: 'Dry clean only. Store flat. Keep away from direct sunlight.',
    inStock: true,
    featured: true
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• WOMEN â€” UNSTITCHED â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    id: 7,
    title: 'HMY Luxury Chiffon Embroidered 3-Piece',
    slug: 'luxury-chiffon-3piece',
    category: 'women-unstitched',
    categoryLabel: 'Women â€” Unstitched',
    price: 9500,
    originalPrice: 13000,
    rating: 5.0,
    reviews: 210,
    badge: 'Festive Exclusive',
    images: [
      'https://placehold.co/800x1000/D4848A/1A1A1A?text=Chiffon+3-Piece&font=playfair-display',
      'https://placehold.co/800x1000/FFDAB9/1A1A1A?text=Chiffon+3-Piece+2&font=playfair-display'
    ],
    sizes: ['Unstitched (3-Piece)'],
    colors: [
      { name: 'Rose Pink', hex: '#D4848A' },
      { name: 'Peach', hex: '#FFDAB9' },
      { name: 'Ice Blue', hex: '#A8D8EA' }
    ],
    description: 'Intricately embroidered chiffon shirt with zari organza dupatta and raw silk trousers. Perfect for weddings.',
    fabric: 'Pure Chiffon shirt + Organza Dupatta + Raw Silk Trouser',
    care: 'Dry clean only. Handle embroidery with care.',
    inStock: true,
    featured: true
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PERFUMES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    id: 8,
    title: 'HMY Royal Oud Eau de Parfum (100ml)',
    slug: 'royal-oud-edp',
    category: 'perfumes',
    categoryLabel: 'Perfumes',
    price: 8900,
    originalPrice: 11500,
    rating: 4.9,
    reviews: 310,
    badge: 'Signature',
    images: [
      'https://placehold.co/800x1000/1A1A1A/C9A96E?text=Royal+Oud+EDP&font=playfair-display',
      'https://placehold.co/800x1000/2A1A0A/C9A96E?text=Royal+Oud+2&font=playfair-display'
    ],
    sizes: ['50ml', '100ml'],
    colors: [],
    description: 'Opulent blend of aged Cambodian oud, smoky woods, damask rose, and sensual amber. 18+ hours projection.',
    fabric: 'Top: Saffron, Rose | Heart: Oud, Sandalwood | Base: Amber, Musk',
    care: 'Store in cool dry place. Keep away from sunlight.',
    inStock: true,
    featured: true
  },
  {
    id: 9,
    title: 'HMY Velvet Amber Luxury EDP (100ml)',
    slug: 'velvet-amber-edp',
    category: 'perfumes',
    categoryLabel: 'Perfumes',
    price: 7900,
    originalPrice: 9900,
    rating: 4.8,
    reviews: 178,
    badge: 'Top Rated',
    images: [
      'https://placehold.co/800x1000/3C2A1A/C9A96E?text=Velvet+Amber&font=playfair-display',
      'https://placehold.co/800x1000/2A1A0A/C9A96E?text=Velvet+Amber+2&font=playfair-display'
    ],
    sizes: ['50ml', '100ml'],
    colors: [],
    description: 'Warm golden amber with vanilla bean, bergamot top notes, and French lavender undertones.',
    fabric: 'Top: Bergamot, Lavender | Heart: Amber, Vanilla | Base: Tonka, Cedar',
    care: 'Store in cool dry place. Keep away from sunlight.',
    inStock: true,
    featured: false
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ISLAMIC TOPIS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    id: 10,
    title: 'HMY Handcrafted Omani Royal Topi',
    slug: 'omani-royal-topi',
    category: 'islamic-topis',
    categoryLabel: 'Islamic Topis',
    price: 2200,
    originalPrice: 3000,
    rating: 4.9,
    reviews: 86,
    badge: 'Handmade',
    images: [
      'https://placehold.co/800x1000/F5F0E8/1A1A1A?text=Omani+Topi&font=playfair-display',
      'https://placehold.co/800x1000/1A1A1A/C9A96E?text=Omani+Topi+2&font=playfair-display'
    ],
    sizes: ['S (54cm)', 'M (56cm)', 'L (58cm)', 'XL (60cm)'],
    colors: [
      { name: 'White/Gold', hex: '#F5F0E8' },
      { name: 'Black/Gold', hex: '#1A1A1A' }
    ],
    description: 'Traditional Omani style prayer cap with gold-thread needlework and breathable inner lining.',
    fabric: 'Premium Cotton with 24K gold-plated thread embroidery',
    care: 'Hand wash cold. Reshape while damp. Do not bleach.',
    inStock: true,
    featured: false
  },
  {
    id: 11,
    title: 'HMY Premium Velvet Turkish Cap',
    slug: 'velvet-turkish-cap',
    category: 'islamic-topis',
    categoryLabel: 'Islamic Topis',
    price: 1850,
    originalPrice: 2500,
    rating: 4.7,
    reviews: 95,
    badge: 'Comfort Fit',
    images: [
      'https://placehold.co/800x1000/6B1D2A/C9A96E?text=Turkish+Cap&font=playfair-display'
    ],
    sizes: ['S (54cm)', 'M (56cm)', 'L (58cm)'],
    colors: [
      { name: 'Maroon', hex: '#6B1D2A' },
      { name: 'Navy', hex: '#1B2A4A' },
      { name: 'Black', hex: '#1A1A1A' }
    ],
    description: 'Soft plush velvet Turkish fez topi with stretchable brim and moisture-wicking comfort.',
    fabric: 'Premium Italian Velvet with cotton inner lining',
    care: 'Hand wash cold. Air dry. Do not iron velvet surface.',
    inStock: true,
    featured: false
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SPECIAL ATTAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  {
    id: 12,
    title: 'HMY Special Dehn Al Oud Royale (12ml)',
    slug: 'dehn-al-oud-royale',
    category: 'special-attar',
    categoryLabel: 'Special Attar',
    price: 5800,
    originalPrice: 7500,
    rating: 5.0,
    reviews: 240,
    badge: 'Pure Non-Alcoholic',
    images: [
      'https://placehold.co/800x1000/2A1A0A/C9A96E?text=Dehn+Al+Oud&font=playfair-display',
      'https://placehold.co/800x1000/1A1A1A/C9A96E?text=Dehn+Al+Oud+2&font=playfair-display'
    ],
    sizes: ['6ml', '12ml'],
    colors: [],
    description: '100% pure concentrated perfume oil from aged wild agarwood. Rich, woody, deep balsamic aroma.',
    fabric: 'Source: Wild Agarwood (Aquilaria) | Aged: 15+ years | Region: Assam, India',
    care: 'Store in cool dark place. Apply on pulse points. Keep bottle sealed.',
    inStock: true,
    featured: true
  },
  {
    id: 13,
    title: 'HMY Royal Kasturi Musk Attar (12ml)',
    slug: 'kasturi-musk-attar',
    category: 'special-attar',
    categoryLabel: 'Special Attar',
    price: 4500,
    originalPrice: 6000,
    rating: 4.8,
    reviews: 164,
    badge: 'Special Distillate',
    images: [
      'https://placehold.co/800x1000/1A1A1A/C9A96E?text=Kasturi+Musk&font=playfair-display'
    ],
    sizes: ['6ml', '12ml'],
    colors: [],
    description: 'Exquisite sweet black musk blend with velvety sandalwood undertones. Completely alcohol-free.',
    fabric: 'Source: Natural Black Musk + Mysore Sandalwood | Distillation: Traditional Deg',
    care: 'Store in cool dark place. Apply on pulse points.',
    inStock: true,
    featured: false
  },
  {
    id: 14,
    title: 'HMY Ruh Khus Pure Vetiver Oil (12ml)',
    slug: 'ruh-khus-vetiver',
    category: 'special-attar',
    categoryLabel: 'Special Attar',
    price: 3800,
    originalPrice: 5000,
    rating: 4.9,
    reviews: 112,
    badge: 'Cooling & Fresh',
    images: [
      'https://placehold.co/800x1000/2E5A45/C9A96E?text=Ruh+Khus&font=playfair-display'
    ],
    sizes: ['6ml', '12ml'],
    colors: [],
    description: 'Traditional copper deg-bapka distilled pure green vetiver roots. Calming, earthy, long-lasting.',
    fabric: 'Source: Kannauj Vetiver Roots | Distillation: Traditional Copper Deg-Bapka',
    care: 'Store in cool dark place. Apply on clothes or skin.',
    inStock: true,
    featured: false
  }
];
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Helper: Get active product list (localStorage override or defaults)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function _getActiveProducts() {
  try {
    const custom = localStorage.getItem('hmy_products_custom');
    if (custom) return JSON.parse(custom);
  } catch (e) {}
  return PRODUCTS;
}

// Get product by ID
function getProductById(id) {
  return _getActiveProducts().find(p => p.id === parseInt(id));
}

// Get product by slug
function getProductBySlug(slug) {
  return _getActiveProducts().find(p => p.slug === slug);
}

// Get products by category
function getProductsByCategory(category) {
  const products = _getActiveProducts();
  if (category === 'all') return products;
  return products.filter(p => p.category === category);
}

// Get featured products
function getFeaturedProducts() {
  return _getActiveProducts().filter(p => p.featured);
}

// Search products
function searchProducts(query) {
  const q = query.toLowerCase();
  return _getActiveProducts().filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.categoryLabel.toLowerCase().includes(q)
  );
}

// Sort products
function sortProducts(products, sortBy) {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-low':  return sorted.sort((a, b) => a.price - b.price);
    case 'price-high': return sorted.sort((a, b) => b.price - a.price);
    case 'rating':     return sorted.sort((a, b) => b.rating - a.rating);
    case 'newest':     return sorted.sort((a, b) => b.id - a.id);
    default:           return sorted; // 'featured' â€” original order
  }
}

// Category labels map
const CATEGORY_LABELS = {
  'all':              'All Products',
  'men-stitched':     'Men â€” Stitched',
  'men-unstitched':   'Men â€” Unstitched',
  'women-stitched':   'Women â€” Stitched',
  'women-unstitched': 'Women â€” Unstitched',
  'perfumes':         'Perfumes',
  'islamic-topis':    'Islamic Topis',
  'special-attar':    'Special Attar'
};

// Category images for showcase
const CATEGORY_IMAGES = {
  'men-stitched':     'https://placehold.co/800x600/1A1A1A/C9A96E?text=Men+Stitched&font=playfair-display',
  'men-unstitched':   'https://placehold.co/800x600/1B2A4A/C9A96E?text=Men+Unstitched&font=playfair-display',
  'women-stitched':   'https://placehold.co/800x600/6B1D2A/C9A96E?text=Women+Stitched&font=playfair-display',
  'women-unstitched': 'https://placehold.co/800x600/D4848A/1A1A1A?text=Women+Unstitched&font=playfair-display',
  'perfumes':         'https://placehold.co/800x600/2A1A0A/C9A96E?text=Perfumes&font=playfair-display',
  'islamic-topis':    'https://placehold.co/800x600/F5F0E8/1A1A1A?text=Islamic+Topis&font=playfair-display',
  'special-attar':    'https://placehold.co/800x600/1A1A1A/C9A96E?text=Special+Attar&font=playfair-display'
};

