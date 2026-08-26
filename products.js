// HMY Luxury Store - Product Catalog
const productsData = [
  // Men (Stitched & Unstitched)
  {
    id: 1,
    title: "HMY Royal Embroidered Kurta Set",
    category: "men-stitched",
    categoryLabel: "Men (Stitched)",
    price: 65.00,
    originalPrice: 85.00,
    rating: 4.9,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=600&auto=format&fit=crop&q=80",
    badge: "Bestseller",
    description: "Premium hand-embellished collar cotton kurta with tailored slim trousers, crafted with royal luxury styling."
  },
  {
    id: 2,
    title: "HMY Premium Egyptian Cotton (4.5m)",
    category: "men-unstitched",
    categoryLabel: "Men (Unstitched)",
    price: 48.00,
    originalPrice: 65.00,
    rating: 4.8,
    reviews: 94,
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80",
    badge: "Pure Cotton",
    description: "Unstitched ultra-soft Egyptian long-staple cotton with a silky luster finish. Ideal for all seasons."
  },
  {
    id: 3,
    title: "HMY Classic Silk Waistcoat",
    category: "men-stitched",
    categoryLabel: "Men (Stitched)",
    price: 42.00,
    originalPrice: 55.00,
    rating: 4.7,
    reviews: 62,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
    badge: "Trending",
    description: "Formal Jacquard raw silk waistcoat with metallic monogram buttons. Adds supreme elegance to any festive outfit."
  },

  // Women (Stitched & Unstitched)
  {
    id: 4,
    title: "HMY Luxury Chiffon Embroidered 3-Piece",
    category: "women-unstitched",
    categoryLabel: "Women (Unstitched)",
    price: 95.00,
    originalPrice: 130.00,
    rating: 5.0,
    reviews: 210,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
    badge: "Festive Exclusive",
    description: "Intricately embroidered chiffon shirt with zari organza dupatta and raw silk trousers. Perfect for weddings and celebrations."
  },
  {
    id: 5,
    title: "HMY Pret Velvet Kurti (Stitched)",
    category: "women-stitched",
    categoryLabel: "Women (Stitched)",
    price: 75.00,
    originalPrice: 99.00,
    rating: 4.9,
    reviews: 145,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
    badge: "New Arrival",
    description: "Rich micro-velvet ready-to-wear kurta with antique tilla embroidery along neckline and bell sleeves."
  },

  // Perfumes
  {
    id: 6,
    title: "HMY Royal Oud Eau de Parfum (100ml)",
    category: "perfumes",
    categoryLabel: "Perfumes",
    price: 89.00,
    originalPrice: 115.00,
    rating: 4.9,
    reviews: 310,
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80",
    badge: "Signature Fragrance",
    description: "Opulent blend of aged Cambodian oud, smoky woods, damask rose, and sensual amber. Long-lasting luxury projection (18+ hours)."
  },
  {
    id: 7,
    title: "HMY Velvet Amber Luxury EDP (100ml)",
    category: "perfumes",
    categoryLabel: "Perfumes",
    price: 79.00,
    originalPrice: 99.00,
    rating: 4.8,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80",
    badge: "Top Rated",
    description: "Warm golden amber infused with vanilla bean, bergamot top notes, and French lavender undertones."
  },

  // Islamic Topis
  {
    id: 8,
    title: "HMY Handcrafted Omani Royal Topi",
    category: "islamic-topis",
    categoryLabel: "Islamic Topis",
    price: 22.00,
    originalPrice: 30.00,
    rating: 4.9,
    reviews: 86,
    image: "https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=600&auto=format&fit=crop&q=80",
    badge: "Handmade",
    description: "Traditional Omani style structured prayer cap featuring detailed gold-thread needlework and breathable inner lining."
  },
  {
    id: 9,
    title: "HMY Premium Velvet Turkish Cap",
    category: "islamic-topis",
    categoryLabel: "Islamic Topis",
    price: 18.50,
    originalPrice: 25.00,
    rating: 4.7,
    reviews: 95,
    image: "https://images.unsplash.com/photo-1509783236416-c9ad59bae472?w=600&auto=format&fit=crop&q=80",
    badge: "Comfort Fit",
    description: "Soft plush velvet Turkish fez topi with stretchable brim and moisture-wicking comfort."
  },

  // Special Attar
  {
    id: 10,
    title: "HMY Special Dehn Al Oud Royale (12ml)",
    category: "special-attar",
    categoryLabel: "Special Attar",
    price: 58.00,
    originalPrice: 75.00,
    rating: 5.0,
    reviews: 240,
    image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=600&auto=format&fit=crop&q=80",
    badge: "Pure Non-Alcoholic",
    description: "100% pure concentrated perfume oil made from aged wild agarwood trees. Rich, woody, deep balsamic aroma."
  },
  {
    id: 11,
    title: "HMY Royal Kasturi Musk Attar (12ml)",
    category: "special-attar",
    categoryLabel: "Special Attar",
    price: 45.00,
    originalPrice: 60.00,
    rating: 4.8,
    reviews: 164,
    image: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=600&auto=format&fit=crop&q=80",
    badge: "Special Distillate",
    description: "Exquisite sweet black musk blend with velvety sandalwood undertones. Completely alcohol-free."
  },
  {
    id: 12,
    title: "HMY Ruh Khus Pure Vetiver Oil (12ml)",
    category: "special-attar",
    categoryLabel: "Special Attar",
    price: 38.00,
    originalPrice: 50.00,
    rating: 4.9,
    reviews: 112,
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=80",
    badge: "Cooling & Fresh",
    description: "Traditional copper deg-bapka distilled pure green vetiver roots. Calming, earthy, and long-lasting."
  }
];
