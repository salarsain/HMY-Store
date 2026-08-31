// ==========================================================================
// HMY Store — Virtual Try-On Logic (tryon.js)
// Uses CatVTON via Gradio JS Client for AI-powered virtual try-on
// ==========================================================================

const TryOn = {
  SPACE_URL: 'zhengchong/CatVTON',
  
  // State
  personImage: null,     // File/Blob
  garmentImage: null,    // File/Blob
  selectedProductId: null,
  resultImage: null,

  init() {
    this.setupPersonUpload();
    this.setupGarmentSection();
    this.setupGenerateBtn();
    this.loadProducts();
    this.checkUrlParams();
  },

  // ── Person Photo Upload ──
  setupPersonUpload() {
    const zone = document.getElementById('personUploadZone');
    const input = document.getElementById('personFileInput');
    const preview = document.getElementById('personPreview');

    if (!zone) return;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this.setPersonImage(file);
    });

    input.addEventListener('change', () => {
      if (input.files[0]) this.setPersonImage(input.files[0]);
    });

    // Remove button
    document.getElementById('removePersonImg')?.addEventListener('click', () => {
      this.personImage = null;
      zone.style.display = 'flex';
      preview.style.display = 'none';
      this.updateGenerateBtn();
    });
  },

  setPersonImage(file) {
    this.personImage = file;
    const zone = document.getElementById('personUploadZone');
    const preview = document.getElementById('personPreview');
    const img = preview.querySelector('img');

    const url = URL.createObjectURL(file);
    img.src = url;
    zone.style.display = 'none';
    preview.style.display = 'block';
    this.updateGenerateBtn();
  },

  // ── Garment Section ──
  setupGarmentSection() {
    // Garment upload
    const garmentUpload = document.getElementById('garmentUploadBtn');
    const garmentInput = document.getElementById('garmentFileInput');

    if (garmentUpload) {
      garmentUpload.addEventListener('click', () => garmentInput.click());
    }

    if (garmentInput) {
      garmentInput.addEventListener('change', () => {
        if (garmentInput.files[0]) this.setGarmentFromFile(garmentInput.files[0]);
      });
    }

    // Remove garment preview
    document.getElementById('removeGarmentImg')?.addEventListener('click', () => {
      this.garmentImage = null;
      this.selectedProductId = null;
      document.getElementById('garmentPreview').style.display = 'none';
      document.getElementById('garmentSelector').style.display = 'block';
      document.querySelectorAll('.tryon-product-thumb').forEach(t => t.classList.remove('selected'));
      this.updateGenerateBtn();
    });
  },

  setGarmentFromFile(file) {
    this.garmentImage = file;
    this.selectedProductId = null;
    const preview = document.getElementById('garmentPreview');
    const img = preview.querySelector('img');
    const selector = document.getElementById('garmentSelector');

    img.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    selector.style.display = 'none';
    document.querySelectorAll('.tryon-product-thumb').forEach(t => t.classList.remove('selected'));
    this.updateGenerateBtn();
  },

  async setGarmentFromProduct(productId) {
    const products = typeof _getActiveProducts === 'function' ? _getActiveProducts() : PRODUCTS;
    const product = products.find(p => p.id === productId);
    if (!product || !product.images || !product.images.length) return;

    this.selectedProductId = productId;

    // Highlight selected
    document.querySelectorAll('.tryon-product-thumb').forEach(t => t.classList.remove('selected'));
    document.querySelector(`.tryon-product-thumb[data-id="${productId}"]`)?.classList.add('selected');

    // Load the product image as a blob
    try {
      const imgUrl = product.images[0];
      
      // If it's a data URL (base64), convert to blob
      if (imgUrl.startsWith('data:')) {
        const resp = await fetch(imgUrl);
        this.garmentImage = await resp.blob();
      } else {
        // External URL — fetch and convert
        const resp = await fetch(imgUrl);
        this.garmentImage = await resp.blob();
      }

      const preview = document.getElementById('garmentPreview');
      const img = preview.querySelector('img');
      img.src = product.images[0];
      preview.style.display = 'block';
      document.getElementById('garmentSelector').style.display = 'none';
    } catch (e) {
      console.error('Failed to load garment image:', e);
      // Fallback: use the image URL directly
      this.garmentImage = product.images[0];
      const preview = document.getElementById('garmentPreview');
      const img = preview.querySelector('img');
      img.src = product.images[0];
      preview.style.display = 'block';
      document.getElementById('garmentSelector').style.display = 'none';
    }
    
    this.updateGenerateBtn();
  },

  // ── Load Products into Grid ──
  loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const products = typeof _getActiveProducts === 'function' ? _getActiveProducts() : PRODUCTS;
    // Filter only clothing items (not perfumes, attars, topis)
    const clothing = products.filter(p => 
      ['men-stitched', 'men-unstitched', 'women-stitched', 'women-unstitched'].includes(p.category)
    );

    grid.innerHTML = clothing.map(p => `
      <div class="tryon-product-thumb" data-id="${p.id}" title="${p.title}">
        <img src="${p.images[0]}" alt="${p.title}" loading="lazy">
      </div>
    `).join('');

    grid.querySelectorAll('.tryon-product-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this.setGarmentFromProduct(parseInt(thumb.dataset.id));
      });
    });
  },

  // ── Check URL params (from product page) ──
  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (productId) {
      setTimeout(() => this.setGarmentFromProduct(parseInt(productId)), 500);
    }
  },

  // ── Generate Button ──
  setupGenerateBtn() {
    const btn = document.getElementById('generateBtn');
    if (!btn) return;

    btn.addEventListener('click', () => this.generate());
  },

  updateGenerateBtn() {
    const btn = document.getElementById('generateBtn');
    if (!btn) return;
    btn.disabled = !(this.personImage && this.garmentImage);
  },

  // ── AI Generation ──
  async generate() {
    if (!this.personImage || !this.garmentImage) return;

    const btn = document.getElementById('generateBtn');
    const loading = document.getElementById('tryonLoading');
    const result = document.getElementById('tryonResult');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING...';
    loading.classList.add('active');
    result.classList.remove('active');

    const clothType = document.getElementById('clothType')?.value || 'upper';

    try {
      // Import Gradio client
      const { Client } = await import('https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js');
      
      // Update progress
      document.getElementById('progressText').textContent = 'Connecting to AI model...';
      
      const app = await Client.connect(this.SPACE_URL);
      
      document.getElementById('progressText').textContent = 'Uploading images...';

      // Prepare person image as blob
      let personBlob = this.personImage;
      if (!(personBlob instanceof Blob)) {
        const resp = await fetch(personBlob);
        personBlob = await resp.blob();
      }

      // Prepare garment image as blob
      let garmentBlob = this.garmentImage;
      if (!(garmentBlob instanceof Blob)) {
        const resp = await fetch(garmentBlob);
        garmentBlob = await resp.blob();
      }

      document.getElementById('progressText').textContent = 'AI is generating your try-on... (30-90 seconds)';

      // Call CatVTON API
      // Parameters: person_image, mask (auto), garment, cloth_type, steps, cfg, seed
      const prediction = await app.predict('/submit', [
        personBlob,       // Person image
        { background: personBlob, layers: [], composite: null },  // Mask (auto-generate)
        garmentBlob,       // Garment image
        clothType,         // Cloth type: upper/lower/overall
        50,                // Inference steps
        2.5,               // CFG
        42                 // Seed
      ]);

      // Get result
      if (prediction && prediction.data && prediction.data[0]) {
        const resultUrl = prediction.data[0].url || prediction.data[0];
        this.showResult(resultUrl);
      } else {
        throw new Error('No result returned from AI model');
      }

    } catch (error) {
      console.error('Try-on error:', error);
      
      // Show error with helpful message
      loading.classList.remove('active');
      result.classList.add('active');
      
      document.getElementById('resultImage').innerHTML = `
        <div style="padding:40px;text-align:center;">
          <i class="fa-solid fa-exclamation-triangle" style="font-size:2rem;color:#E8505B;margin-bottom:12px;"></i>
          <h3 style="color:var(--color-cream);font-size:1rem;margin-bottom:8px;">AI Model Busy</h3>
          <p style="color:var(--color-text-muted);font-size:0.85rem;line-height:1.6;">
            The free AI model is currently busy or in a queue.<br>
            Please try again in a few moments.<br>
            <small style="opacity:0.6;">${error.message || 'Connection error'}</small>
          </p>
        </div>`;
      document.getElementById('resultTitle').innerHTML = '<i class="fa-solid fa-exclamation-circle"></i> Error';
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> TRY IT ON';
    loading.classList.remove('active');
  },

  showResult(imageUrl) {
    const result = document.getElementById('tryonResult');
    const resultImg = document.getElementById('resultImage');
    const loading = document.getElementById('tryonLoading');

    this.resultImage = imageUrl;
    resultImg.innerHTML = `<img src="${imageUrl}" alt="Virtual Try-On Result">`;
    loading.classList.remove('active');
    result.classList.add('active');
    document.getElementById('resultTitle').innerHTML = '<i class="fa-solid fa-sparkles"></i> YOUR VIRTUAL TRY-ON';

    // Scroll to result
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Setup action buttons
    document.getElementById('downloadResult')?.addEventListener('click', () => this.downloadResult());
    document.getElementById('retryResult')?.addEventListener('click', () => {
      result.classList.remove('active');
    });
  },

  downloadResult() {
    if (!this.resultImage) return;
    const a = document.createElement('a');
    a.href = this.resultImage;
    a.download = 'hmy-tryon-result.png';
    a.click();
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  TryOn.init();
});
