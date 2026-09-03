// ==========================================================================
// HMY Store — Virtual Try-On Logic (tryon.js)
// Uses CatVTON (full body) + IDM-VTON (upper fallback) via Gradio JS Client
// ==========================================================================

const TryOn = {
  // HuggingFace token — stored in browser localStorage (not in code for security)
  // To set: open browser console (F12) → type: localStorage.setItem('hf_token', 'hf_YOUR_TOKEN')
  HF_TOKEN: localStorage.getItem('hf_token') || null,

  // Models: OOTDiffusion (full body best), CatVTON (full body), IDM-VTON (upper only)
  MODELS: [
    { name: 'OOTDiffusion', space: 'levihsu/OOTDiffusion', endpoint: '/process_dc' },
    { name: 'CatVTON', space: 'zhengchong/CatVTON', endpoint: '/submit_function' },
    { name: 'IDM-VTON', space: 'yisol/IDM-VTON', endpoint: '/tryon' }
  ],

  // State
  personImage: null,     // File/Blob
  garmentImage: null,    // File/Blob
  personDataUrl: null,   // For display
  garmentDataUrl: null,  // For display
  selectedProductId: null,
  resultImage: null,

  init() {
    this.setupPersonUpload();
    this.setupGarmentSection();
    this.setupGenerateBtn();
    this.loadProducts();
    this.checkUrlParams();
    console.log('[TryOn] Initialized');
  },

  // ── Convert file to data URL for display ──
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  // ── Convert any image blob to JPEG (strips alpha channel) ──
  blobToJpeg(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        // White background to replace transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((jpegBlob) => {
          if (jpegBlob) {
            console.log('[TryOn] Converted to JPEG:', jpegBlob.size, 'bytes');
            resolve(jpegBlob);
          } else {
            reject(new Error('Failed to convert image to JPEG'));
          }
        }, 'image/jpeg', 0.92);
      };
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = URL.createObjectURL(blob);
    });
  },

  // ── Convert blob to base64 data URL ──
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  // ── Analyze garment image pixels (extract colors, style info) ──
  analyzeGarmentPixels(blob) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 64; // Sample at 64x64 for speed
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Extract dominant colors
        const colorCounts = {};
        for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
          const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
          // Quantize to reduce colors
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }

        // Sort by frequency, get top 3 colors
        const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        const topColors = sorted.slice(0, 3).map(([rgb]) => {
          const [r, g, b] = rgb.split(',').map(Number);
          return this.rgbToColorName(r, g, b);
        });

        // Detect if garment has patterns/embroidery
        let variance = 0;
        for (let i = 0; i < pixels.length - 4; i += 4) {
          variance += Math.abs(pixels[i] - pixels[i+4]);
        }
        variance /= (pixels.length / 4);
        const hasPattern = variance > 30;

        resolve({
          colors: [...new Set(topColors)],
          hasPattern,
          isDetailed: variance > 50
        });
      };
      img.src = URL.createObjectURL(blob);
    });
  },

  // ── RGB to human-readable color name ──
  rgbToColorName(r, g, b) {
    const colors = [
      { name: 'white', r: 255, g: 255, b: 255 },
      { name: 'black', r: 0, g: 0, b: 0 },
      { name: 'dark navy blue', r: 0, g: 0, b: 128 },
      { name: 'royal blue', r: 64, g: 64, b: 224 },
      { name: 'deep red', r: 160, g: 0, b: 0 },
      { name: 'maroon', r: 128, g: 0, b: 0 },
      { name: 'dark green', r: 0, g: 96, b: 0 },
      { name: 'golden', r: 224, g: 192, b: 64 },
      { name: 'cream', r: 255, g: 240, b: 200 },
      { name: 'beige', r: 224, g: 200, b: 160 },
      { name: 'brown', r: 128, g: 64, b: 0 },
      { name: 'grey', r: 128, g: 128, b: 128 },
      { name: 'purple', r: 128, g: 0, b: 128 },
      { name: 'pink', r: 255, g: 128, b: 160 },
      { name: 'orange', r: 255, g: 160, b: 0 },
      { name: 'sky blue', r: 128, g: 192, b: 255 },
      { name: 'teal', r: 0, g: 128, b: 128 },
    ];
    let closest = colors[0];
    let minDist = Infinity;
    for (const c of colors) {
      const dist = Math.sqrt((r-c.r)**2 + (g-c.g)**2 + (b-c.b)**2);
      if (dist < minDist) { minDist = dist; closest = c; }
    }
    return closest.name;
  },

  // ── Pollinations.ai image-to-image try-on ──
  async tryPollinationsTryOn(personBlob, garmentBlob, clothType) {
    console.log('[TryOn] Attempting Pollinations.ai image-to-image...');
    document.getElementById('progressText').textContent = 'Pollinations AI: Analyzing garment pixels...';

    // Step 1: Analyze garment pixels for colors and patterns
    const garmentInfo = await this.analyzeGarmentPixels(garmentBlob);
    console.log('[TryOn] Garment analysis:', garmentInfo);

    const colorDesc = garmentInfo.colors.join(' and ');
    const patternDesc = garmentInfo.hasPattern 
      ? 'with intricate embroidery and detailed patterns' 
      : 'with a clean solid fabric';

    // Step 2: Convert person image to base64 for reference
    const personBase64 = await this.blobToBase64(personBlob);

    // Step 3: Build precise prompt with garment pixel analysis
    const clothPrompts = {
      upper: `wearing a ${colorDesc} colored kurta/shirt ${patternDesc}, same original trousers/pants`,
      lower: `same upper clothing, wearing ${colorDesc} colored shalwar/trousers ${patternDesc}`,
      overall: `wearing a full ${colorDesc} colored Pakistani outfit (kurta with shalwar) ${patternDesc}`
    };

    const prompt = `Reconstruct this exact same person with same face same pose same background, but now ${clothPrompts[clothType] || clothPrompts.overall}. Photorealistic, same person identity preserved, high quality fashion photography.`;

    document.getElementById('progressText').textContent = `Pollinations AI: Generating ${colorDesc} outfit... (15-30 sec)`;

    // Step 4: Use Pollinations with person image as reference
    const encodedPrompt = encodeURIComponent(prompt);
    const encodedImage = encodeURIComponent(personBase64);
    const seed = Math.floor(Math.random() * 999999);
    
    // Try with image reference parameter first
    let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&seed=${seed}&nologo=true&model=flux&image=${encodedImage}`;
    
    // If URL is too long (base64 is huge), fall back to prompt-only
    if (imageUrl.length > 8000) {
      console.log('[TryOn] Image URL too long, using prompt-only mode');
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&seed=${seed}&nologo=true&model=flux`;
    }

    console.log('[TryOn] Pollinations generating with colors:', garmentInfo.colors);

    // Step 5: Load generated image
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        reject(new Error('Pollinations timed out after 60 seconds'));
      }, 60000);

      img.onload = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          resolve(blob ? URL.createObjectURL(blob) : imageUrl);
        }, 'image/jpeg', 0.95);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Pollinations image failed to load'));
      };

      img.src = imageUrl;
    });
  },

  // ── Person Photo Upload ──
  setupPersonUpload() {
    const zone = document.getElementById('personUploadZone');
    const input = document.getElementById('personFileInput');
    const preview = document.getElementById('personPreview');

    if (!zone) return;

    zone.addEventListener('click', (e) => {
      e.stopPropagation();
      input.click();
    });
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
    const removeBtn = document.getElementById('removePersonImg');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.personImage = null;
        this.personDataUrl = null;
        zone.style.display = 'flex';
        preview.style.display = 'none';
        preview.querySelector('img').src = '';
        input.value = '';
        this.updateGenerateBtn();
      });
    }
  },

  async setPersonImage(file) {
    try {
      this.personImage = file;
      const dataUrl = await this.fileToDataUrl(file);
      this.personDataUrl = dataUrl;

      const zone = document.getElementById('personUploadZone');
      const preview = document.getElementById('personPreview');
      const img = preview.querySelector('img');

      img.onload = () => console.log('[TryOn] Person image loaded ok');
      img.onerror = () => console.error('[TryOn] Person image failed to load');
      img.src = dataUrl;
      zone.style.display = 'none';
      preview.style.display = 'block';
      this.updateGenerateBtn();
      console.log('[TryOn] Person image set, size:', file.size);
    } catch (err) {
      console.error('[TryOn] Error setting person image:', err);
    }
  },

  // ── Garment Section ──
  setupGarmentSection() {
    const garmentUpload = document.getElementById('garmentUploadBtn');
    const garmentInput = document.getElementById('garmentFileInput');

    if (garmentUpload) {
      garmentUpload.addEventListener('click', (e) => {
        e.stopPropagation();
        garmentInput.click();
      });
    }

    if (garmentInput) {
      garmentInput.addEventListener('change', () => {
        if (garmentInput.files[0]) this.setGarmentFromFile(garmentInput.files[0]);
      });
    }

    // Remove garment preview
    const removeBtn = document.getElementById('removeGarmentImg');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.garmentImage = null;
        this.garmentDataUrl = null;
        this.selectedProductId = null;
        document.getElementById('garmentPreview').style.display = 'none';
        document.getElementById('garmentPreview').querySelector('img').src = '';
        document.getElementById('garmentSelector').style.display = 'block';
        document.querySelectorAll('.tryon-product-thumb').forEach(t => t.classList.remove('selected'));
        if (garmentInput) garmentInput.value = '';
        this.updateGenerateBtn();
      });
    }
  },

  async setGarmentFromFile(file) {
    try {
      this.garmentImage = file;
      this.selectedProductId = null;
      const dataUrl = await this.fileToDataUrl(file);
      this.garmentDataUrl = dataUrl;

      const preview = document.getElementById('garmentPreview');
      const img = preview.querySelector('img');
      const selector = document.getElementById('garmentSelector');

      img.onload = () => console.log('[TryOn] Garment image loaded ok');
      img.onerror = () => console.error('[TryOn] Garment image failed to load');
      img.src = dataUrl;
      preview.style.display = 'block';
      selector.style.display = 'none';
      document.querySelectorAll('.tryon-product-thumb').forEach(t => t.classList.remove('selected'));
      this.updateGenerateBtn();
      console.log('[TryOn] Garment from file set, size:', file.size);
    } catch (err) {
      console.error('[TryOn] Error setting garment from file:', err);
    }
  },

  async setGarmentFromProduct(productId) {
    let products;
    try {
      products = typeof _getActiveProducts === 'function' ? _getActiveProducts() : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    } catch (e) {
      products = [];
    }
    const product = products.find(p => p.id === productId);
    if (!product || !product.images || !product.images.length) {
      console.warn('[TryOn] Product not found or no images:', productId);
      return;
    }

    this.selectedProductId = productId;

    // Highlight selected
    document.querySelectorAll('.tryon-product-thumb').forEach(t => t.classList.remove('selected'));
    document.querySelector(`.tryon-product-thumb[data-id="${productId}"]`)?.classList.add('selected');

    const imgUrl = product.images[0];
    const preview = document.getElementById('garmentPreview');
    const img = preview.querySelector('img');

    try {
      // Try to fetch the image as a blob
      if (imgUrl.startsWith('data:')) {
        // base64 data URL
        const resp = await fetch(imgUrl);
        this.garmentImage = await resp.blob();
        this.garmentDataUrl = imgUrl;
        img.src = imgUrl;
      } else {
        // Regular URL — try to load it
        const resp = await fetch(imgUrl, { mode: 'cors' });
        this.garmentImage = await resp.blob();
        this.garmentDataUrl = imgUrl;
        img.src = imgUrl;
      }
    } catch (e) {
      console.warn('[TryOn] Could not fetch image as blob, using URL:', e);
      this.garmentImage = imgUrl;
      this.garmentDataUrl = imgUrl;
      img.src = imgUrl;
    }

    img.onload = () => console.log('[TryOn] Garment product image loaded ok');
    img.onerror = () => {
      console.error('[TryOn] Garment product image failed to load, trying fallback');
      img.src = imgUrl;
    };

    preview.style.display = 'block';
    document.getElementById('garmentSelector').style.display = 'none';
    this.updateGenerateBtn();
    console.log('[TryOn] Garment from product set:', product.title);
  },

  // ── Load Products into Grid ──
  loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let products;
    try {
      products = typeof _getActiveProducts === 'function' ? _getActiveProducts() : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    } catch (e) {
      products = [];
    }

    // Filter only clothing items
    const clothing = products.filter(p =>
      ['men-stitched', 'men-unstitched', 'women-stitched', 'women-unstitched'].includes(p.category)
    );

    if (clothing.length === 0) {
      grid.innerHTML = '<p style="color:var(--color-text-muted);font-size:0.8rem;text-align:center;grid-column:1/-1;">No clothing products available. Upload a garment image below.</p>';
      return;
    }

    grid.innerHTML = clothing.map(p => `
      <div class="tryon-product-thumb" data-id="${p.id}" title="${p.title}">
        <img src="${p.images[0]}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'">
      </div>
    `).join('');

    grid.querySelectorAll('.tryon-product-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this.setGarmentFromProduct(parseInt(thumb.dataset.id));
      });
    });

    console.log('[TryOn] Loaded', clothing.length, 'products');
  },

  // ── Check URL params (from product page) ──
  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (productId) {
      console.log('[TryOn] Auto-selecting product from URL:', productId);
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
    const selectedModel = document.getElementById('aiModel')?.value || 'auto';

    try {
      // If user explicitly chose Pollinations, skip HuggingFace entirely
      if (selectedModel === 'Pollinations') {
        document.getElementById('progressText').textContent = 'Pollinations AI: Starting...';
        // Prepare images
        let personBlob = this.personImage;
        if (!(personBlob instanceof Blob)) { personBlob = await (await fetch(personBlob)).blob(); }
        personBlob = await this.blobToJpeg(personBlob);
        let garmentBlob = this.garmentImage;
        if (!(garmentBlob instanceof Blob)) { garmentBlob = await (await fetch(garmentBlob)).blob(); }
        garmentBlob = await this.blobToJpeg(garmentBlob);

        const polliResult = await this.tryPollinationsTryOn(personBlob, garmentBlob, clothType);
        console.log('[TryOn] Success with Pollinations AI!');
        this.showResult(polliResult);

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> TRY IT ON';
        loading.classList.remove('active');
        return;
      }

      document.getElementById('progressText').textContent = 'Loading AI engine...';

      // Import Gradio client via esm.sh (reliable ESM CDN)
      const gradioModule = await import('https://esm.sh/@gradio/client');
      const Client = gradioModule.Client || gradioModule.client || gradioModule.default?.Client;

      if (!Client) {
        throw new Error('Could not load Gradio Client library');
      }

      // Prepare person image as blob
      let personBlob = this.personImage;
      if (!(personBlob instanceof Blob)) {
        const resp = await fetch(personBlob);
        personBlob = await resp.blob();
      }
      // Convert to JPEG to strip alpha channel (fixes RGBA error)
      personBlob = await this.blobToJpeg(personBlob);

      // Prepare garment image as blob
      let garmentBlob = this.garmentImage;
      if (!(garmentBlob instanceof Blob)) {
        const resp = await fetch(garmentBlob);
        garmentBlob = await resp.blob();
      }
      // Convert to JPEG to strip alpha channel
      garmentBlob = await this.blobToJpeg(garmentBlob);

      // Filter models based on user selection and cloth type
      let modelsToTry = this.MODELS;
      if (selectedModel !== 'auto') {
        // User chose a specific HuggingFace model
        modelsToTry = this.MODELS.filter(m => m.name === selectedModel);
        console.log(`[TryOn] User selected model: ${selectedModel}`);
      } else if (clothType !== 'upper') {
        // Auto mode: skip IDM-VTON for lower/overall (Kolors + CatVTON remain)
        modelsToTry = this.MODELS.filter(m => m.name !== 'IDM-VTON');
        console.log(`[TryOn] Cloth type "${clothType}" — using Kolors + CatVTON (IDM-VTON skipped)`);
      }

      // Try each model in order until one works
      let prediction = null;
      let lastError = null;
      let usedModel = null;

      for (const model of modelsToTry) {
        try {
          document.getElementById('progressText').textContent = `Connecting to ${model.name}...`;
          console.log(`[TryOn] Trying model: ${model.name} (${model.space})`);

          const connectOpts = this.HF_TOKEN ? { hf_token: this.HF_TOKEN } : {};
          const app = await Client.connect(model.space, connectOpts);

          document.getElementById('progressText').textContent = `${model.name}: Uploading images...`;

          let args;
          if (model.name === 'OOTDiffusion') {
            // OOTDiffusion full-body: person, garment, category, images, steps, guidance, seed
            // Map our cloth types to OOTDiffusion categories
            const ootdCategory = clothType === 'lower' ? 'Lower-body' 
              : clothType === 'overall' ? 'Dress' 
              : 'Upper-body';
            args = [
              personBlob,        // Model image
              garmentBlob,       // Garment image
              ootdCategory,      // Garment category
              1,                 // Number of images
              30,                // Steps (higher = better quality)
              3.5,               // Guidance scale (higher = stronger garment match)
              -1                 // Seed (-1 = random)
            ];
          } else if (model.name === 'IDM-VTON') {
            // IDM-VTON params: person(ImageEditor), garment, description, auto_mask, crop, steps, seed
            args = [
              { background: personBlob, layers: [], composite: null },
              garmentBlob,
              'A garment',   // garment description
              true,          // auto mask
              false,         // crop
              30,            // denoise steps
              42             // seed
            ];
          } else {
            // CatVTON params: person(ImageEditor), garment, cloth_type, steps, cfg, seed
            args = [
              { background: personBlob, layers: [], composite: null },
              garmentBlob,
              clothType,
              50,
              2.5,
              42
            ];
          }

          document.getElementById('progressText').textContent = `${model.name}: Generating ${clothType} try-on... (30-90 seconds)`;

          prediction = await app.predict(model.endpoint, args);
          usedModel = model.name;
          break; // Success!

        } catch (modelErr) {
          console.warn(`[TryOn] ${model.name} failed:`, modelErr.message);
          lastError = modelErr;
          continue; // Try next model
        }
      }

      // Check result from HuggingFace models
      if (prediction && prediction.data && prediction.data[0]) {
        let resultUrl;
        const resultData = prediction.data[0];
        
        // OOTDiffusion returns gallery array: [{image:{url}}, ...]
        if (Array.isArray(resultData) && resultData[0]?.image?.url) {
          resultUrl = resultData[0].image.url;
        } else if (resultData?.image?.url) {
          resultUrl = resultData.image.url;
        } else {
          resultUrl = resultData.url || resultData;
        }
        
        console.log(`[TryOn] Success with ${usedModel}!`);
        this.showResult(resultUrl);
      } else {
        throw new Error(lastError?.message || 'All AI models are currently busy. Try again in a few minutes.');
      }

    } catch (error) {
      console.error('[TryOn] Generation error:', error);

      loading.classList.remove('active');
      result.classList.add('active');

      let errorMessage = error.message || 'Connection error';
      let helpText = 'The free AI model is currently busy or in a queue.';

      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        helpText = 'Could not connect to the AI server. Check your internet connection.';
      } else if (errorMessage.includes('queue') || errorMessage.includes('busy')) {
        helpText = 'The AI model has a queue. Please wait a moment and try again.';
      } else if (errorMessage.includes('Gradio')) {
        helpText = 'The AI engine failed to load. Try refreshing the page.';
      }

      document.getElementById('resultImage').innerHTML = `
        <div style="padding:40px;text-align:center;">
          <i class="fa-solid fa-exclamation-triangle" style="font-size:2rem;color:#E8505B;margin-bottom:12px;display:block;"></i>
          <h3 style="color:var(--color-cream);font-size:1rem;margin-bottom:8px;">AI Model Unavailable</h3>
          <p style="color:var(--color-text-muted);font-size:0.85rem;line-height:1.6;">
            ${helpText}<br>
            Please try again in a few moments.<br>
            <small style="opacity:0.6;">${errorMessage}</small>
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
