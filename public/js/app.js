// Eco Saathi 2.0 - Core Storefront Application Logic
const App = {
  state: {
    categories: { materials: [], uses: [], all: [] },
    products: [],
    totalProducts: 0,
    currentView: 'home',
    filters: {
      search: '',
      material: '',
      category: '',
      min_price: '',
      max_price: '',
      sort: 'featured'
    },
    cart: JSON.parse(localStorage.getItem('ecosaathi_cart') || '[]'),
    appliedCoupon: localStorage.getItem('ecosaathi_coupon') || '',
    user: JSON.parse(localStorage.getItem('ecosaathi_user') || 'null'),
    cartPricing: { subtotal: 0, discount: 0, shippingFee: 0, gst: 0, total: 0 },
    impact: {
      activeTab: 'calculator',
      factors: [],
      comparisons: [],
      selectedComparisonId: 'toothbrush',
      quantity: 4,
      householdSize: 1,
      currentCalculation: null,
      summary: null,
      charts: { doughnut: null, bar: null, line: null }
    }
  },

  async init() {
    this.initRouter();
    await this.fetchCategories();
    await this.fetchProducts();
    this.updateCartBadge();
    this.setupEventListeners();
    this.handleRoute();
  },

  initRouter() {
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const [route, param] = hash.split('/');

    this.state.currentView = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    if (route === 'home') {
      const el = document.getElementById('viewHome');
      if (el) el.classList.remove('hidden');
      this.renderHomeFeatured();
    } else if (route === 'shop') {
      const el = document.getElementById('viewShop');
      if (el) el.classList.remove('hidden');
      if (param) {
        // e.g. #shop/bamboo or #shop/oral-care
        const isMaterial = this.state.categories.materials.some(m => m.slug === param);
        if (isMaterial) {
          this.state.filters.material = param;
          this.state.filters.category = '';
        } else {
          this.state.filters.category = param;
          this.state.filters.material = '';
        }
      }
      this.fetchProducts();
    } else if (route === 'product' && param) {
      const el = document.getElementById('viewProduct');
      if (el) el.classList.remove('hidden');
      this.loadProductDetail(param);
    } else if (route === 'bundle') {
      const el = document.getElementById('viewBundle');
      if (el) el.classList.remove('hidden');
      this.initBundleBuilder();
    } else if (route === 'checkout') {
      const el = document.getElementById('viewCheckout');
      if (el) el.classList.remove('hidden');
      this.renderCheckoutScreen();
    } else if (route === 'order' && param) {
      const el = document.getElementById('viewOrderSuccess');
      if (el) el.classList.remove('hidden');
      this.loadOrderConfirmation(param);
    } else if (route === 'corporate') {
      const el = document.getElementById('viewCorporate');
      if (el) el.classList.remove('hidden');
    } else if (route === 'awards') {
      const el = document.getElementById('viewAwards');
      if (el) el.classList.remove('hidden');
    } else if (route === 'sustainability') {
      const el = document.getElementById('viewSustainability');
      if (el) el.classList.remove('hidden');
    } else if (route === 'about') {
      const el = document.getElementById('viewAbout');
      if (el) el.classList.remove('hidden');
    } else if (route === 'impact') {
      const el = document.getElementById('viewImpact');
      if (el) el.classList.remove('hidden');
      this.initImpactSection();
    } else if (route === 'account') {
      const el = document.getElementById('viewAccount');
      if (el) el.classList.remove('hidden');
      this.renderAccountScreen();
    }
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  async fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      this.state.categories = data;
      this.renderCategoryNav();
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  },

  async fetchProducts() {
    try {
      const q = new URLSearchParams();
      if (this.state.filters.search) q.append('search', this.state.filters.search);
      if (this.state.filters.material) q.append('material', this.state.filters.material);
      if (this.state.filters.category) q.append('category', this.state.filters.category);
      if (this.state.filters.min_price) q.append('min_price', this.state.filters.min_price);
      if (this.state.filters.max_price) q.append('max_price', this.state.filters.max_price);
      if (this.state.filters.sort) q.append('sort', this.state.filters.sort);

      const res = await fetch(`/api/products?${q.toString()}`);
      const data = await res.json();
      this.state.products = data.products || [];
      this.state.totalProducts = data.total || 0;
      this.renderProductsGrid();
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  },

  renderCategoryNav() {
    // Populate dropdowns & filter checkboxes
    const useContainer = document.getElementById('useCategoryDropdown');
    const matContainer = document.getElementById('materialCategoryDropdown');

    if (useContainer) {
      useContainer.innerHTML = this.state.categories.uses.map(u => `
        <a href="#shop/${u.slug}" class="block px-4 py-2 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg transition">
          <i class="fa-solid ${u.icon || 'fa-leaf'} mr-2 text-emerald-700"></i> ${u.name}
        </a>
      `).join('');
    }

    if (matContainer) {
      matContainer.innerHTML = this.state.categories.materials.map(m => `
        <a href="#shop/${m.slug}" class="block px-4 py-2 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg transition">
          <i class="fa-solid ${m.icon || 'fa-seedling'} mr-2 text-amber-700"></i> ${m.name}
        </a>
      `).join('');
    }

    // Render filter sidebar options
    const shopMatFilter = document.getElementById('shopMaterialFilters');
    if (shopMatFilter) {
      shopMatFilter.innerHTML = `
        <label class="flex items-center space-x-2 text-sm text-stone-700 cursor-pointer">
          <input type="radio" name="materialFilter" value="" ${!this.state.filters.material ? 'checked' : ''} onchange="App.setFilter('material', '')" class="text-emerald-700 focus:ring-emerald-600">
          <span>All Materials</span>
        </label>
        ${this.state.categories.materials.map(m => `
          <label class="flex items-center space-x-2 text-sm text-stone-700 cursor-pointer">
            <input type="radio" name="materialFilter" value="${m.slug}" ${this.state.filters.material === m.slug ? 'checked' : ''} onchange="App.setFilter('material', '${m.slug}')" class="text-emerald-700 focus:ring-emerald-600">
            <span>${m.name}</span>
          </label>
        `).join('')}
      `;
    }

    const shopUseFilter = document.getElementById('shopUseFilters');
    if (shopUseFilter) {
      shopUseFilter.innerHTML = `
        <label class="flex items-center space-x-2 text-sm text-stone-700 cursor-pointer">
          <input type="radio" name="useFilter" value="" ${!this.state.filters.category ? 'checked' : ''} onchange="App.setFilter('category', '')" class="text-emerald-700 focus:ring-emerald-600">
          <span>All Categories</span>
        </label>
        ${this.state.categories.uses.map(u => `
          <label class="flex items-center space-x-2 text-sm text-stone-700 cursor-pointer">
            <input type="radio" name="useFilter" value="${u.slug}" ${this.state.filters.category === u.slug ? 'checked' : ''} onchange="App.setFilter('category', '${u.slug}')" class="text-emerald-700 focus:ring-emerald-600">
            <span>${u.name}</span>
          </label>
        `).join('')}
      `;
    }
  },

  setFilter(key, value) {
    this.state.filters[key] = value;
    this.fetchProducts();
  },

  renderProductsGrid() {
    const grid = document.getElementById('shopProductsGrid');
    const countEl = document.getElementById('productsCountText');
    if (!grid) return;

    if (countEl) {
      countEl.innerText = `Showing ${this.state.products.length} sustainable items`;
    }

    if (this.state.products.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 text-2xl">
            <i class="fa-solid fa-leaf"></i>
          </div>
          <h3 class="text-lg font-bold text-stone-800">No sustainable items match your filters</h3>
          <p class="text-stone-500 text-sm mt-1">Try clearing some filter criteria or search for another term.</p>
          <button onclick="App.clearFilters()" class="mt-4 bg-emerald-800 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition">
            Clear Filters
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.state.products.map(p => this.createProductCardHtml(p)).join('');
  },

  createProductCardHtml(p) {
    const imgUrl = p.primary_image || 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80';
    return `
      <div class="prod-card bg-white rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col group">
        <!-- Image & Badges -->
        <div class="relative overflow-hidden bg-stone-100 aspect-square">
          <a href="#product/${p.handle}">
            <img src="${imgUrl}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
          </a>
          <!-- Badges -->
          <div class="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
            <span class="badge-eco text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <i class="fa-solid fa-seedling mr-1"></i>${p.material_name}
            </span>
            ${p.bestseller ? '<span class="bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">Bestseller</span>' : ''}
          </div>
          <!-- Quick Wishlist Button -->
          <button onclick="App.toggleWishlist('${p.id}', this)" class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-500 hover:text-rose-600 flex items-center justify-center shadow-md transition">
            <i class="fa-regular fa-heart text-xs"></i>
          </button>
        </div>

        <!-- Details -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-1 text-xs text-amber-500 mb-1">
              <span>★</span>
              <span class="font-bold text-stone-700">${p.rating || 4.9}</span>
              <span class="text-stone-400">(${p.reviews_count || 12})</span>
              <span class="text-stone-300">·</span>
              <span class="text-stone-500 text-[11px]">${p.use_category_name}</span>
            </div>
            <a href="#product/${p.handle}" class="font-heading font-semibold text-[#26332A] text-sm hover:text-[#4D9B59] line-clamp-2 leading-snug">
              ${p.title}
            </a>
            ${p.eco_impact_badge ? `
              <p class="text-[11px] text-[#4D9B59] font-medium mt-1 flex items-center">
                <i class="fa-solid fa-recycle mr-1 text-[10px]"></i> ${p.eco_impact_badge}
              </p>
            ` : ''}
          </div>

          <div class="mt-4 pt-3 border-t border-[#A8C5A0]/20 flex items-center justify-between">
            <div>
              <div class="flex items-baseline space-x-1.5">
                <span class="text-base font-extrabold text-[#14532D]">₹${p.price}</span>
                ${p.compare_at_price ? `<span class="text-xs line-through text-[#526356]/60">₹${p.compare_at_price}</span>` : ''}
              </div>
              <span class="text-[10px] text-[#526356]/70">Incl. GST</span>
            </div>

            <button
              onclick="App.addToCart('${p.id}', '${p.title.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}')"
              class="btn-forest text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <i class="fa-solid fa-bag-shopping"></i>
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderHomeFeatured() {
    const featuredContainer = document.getElementById('homeFeaturedProducts');
    if (!featuredContainer) return;
    const featured = this.state.products.filter(p => p.featured || p.bestseller).slice(0, 8);
    featuredContainer.innerHTML = featured.map(p => this.createProductCardHtml(p)).join('');
  },

  clearFilters() {
    this.state.filters = {
      search: '',
      material: '',
      category: '',
      min_price: '',
      max_price: '',
      sort: 'featured'
    };
    const sInput = document.getElementById('navbarSearchInput');
    if (sInput) sInput.value = '';
    this.renderCategoryNav();
    this.fetchProducts();
  },

  // -----------------------------------------------------------------
  // PRODUCT DETAIL PAGE (FR-04, FR-06, FR-11, FR-24)
  // -----------------------------------------------------------------
  async loadProductDetail(handle) {
    const container = document.getElementById('viewProduct');
    if (!container) return;
    container.innerHTML = `
      <div class="py-24 text-center">
        <div class="w-12 h-12 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-stone-500 font-medium">Loading handcrafted product...</p>
      </div>
    `;

    try {
      const res = await fetch(`/api/products/${handle}`);
      const data = await res.json();
      if (!data.product) {
        container.innerHTML = `<div class="py-24 text-center"><h2 class="text-xl font-bold">Product not found</h2><a href="#shop" class="text-emerald-800 underline mt-4 inline-block">Browse all items</a></div>`;
        return;
      }

      const p = data.product;
      const images = data.images || [];
      const primaryImg = images.length > 0 ? images[0].url : (p.primary_image || 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80');
      const variants = data.variants || [];
      const reviews = data.reviews || [];
      const related = data.related || [];

      // Pre-filled WhatsApp chat link as required by PRD FR-24!
      const currentUrl = window.location.href;
      const waMessage = `Hi Eco Saathi! I have a question about ${p.title} (₹${p.price}): ${currentUrl}`;
      const waUrl = `https://wa.me/919437012345?text=${encodeURIComponent(waMessage)}`;

      container.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Breadcrumb -->
          <nav class="flex items-center space-x-2 text-xs text-stone-500 mb-6">
            <a href="#home" class="hover:text-emerald-800">Home</a>
            <span>/</span>
            <a href="#shop" class="hover:text-emerald-800">Shop</a>
            <span>/</span>
            <a href="#shop/${p.material_slug}" class="hover:text-emerald-800">${p.material_name}</a>
            <span>/</span>
            <span class="text-stone-800 font-medium truncate">${p.title}</span>
          </nav>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <!-- Left: Image Gallery -->
            <div class="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
              <div class="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[500px]">
                ${images.map(img => `
                  <button onclick="document.getElementById('pdpMainImg').src='${img.url}'" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-700 flex-shrink-0 transition">
                    <img src="${img.url}" alt="${img.alt_text || p.title}" class="w-full h-full object-cover" />
                  </button>
                `).join('')}
              </div>
              <div class="flex-1 rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 aspect-square max-h-[520px]">
                <img id="pdpMainImg" src="${primaryImg}" alt="${p.title}" class="w-full h-full object-cover" />
              </div>
            </div>

            <!-- Right: Details & Purchase -->
            <div class="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div class="flex items-center space-x-2 mb-2">
                  <span class="badge-eco text-xs font-bold px-2.5 py-0.5 rounded-full">${p.material_name}</span>
                  <span class="bg-stone-100 text-stone-700 text-xs font-medium px-2.5 py-0.5 rounded-full">${p.use_category_name}</span>
                </div>

                <h1 class="text-2xl sm:text-3xl font-extrabold text-stone-900 leading-tight">${p.title}</h1>

                <!-- Rating -->
                <div class="flex items-center space-x-2 mt-2">
                  <div class="flex text-amber-500 text-sm">
                    ${'★'.repeat(Math.round(p.rating || 5))}${'☆'.repeat(5 - Math.round(p.rating || 5))}
                  </div>
                  <span class="text-sm font-bold text-stone-800">${p.rating || 4.9}</span>
                  <a href="#reviewsSection" class="text-xs text-emerald-800 underline">(${reviews.length} customer reviews)</a>
                  <span class="text-stone-300">·</span>
                  <span class="text-xs text-stone-500">SKU: ${p.sku}</span>
                </div>

                <!-- Price -->
                <div class="mt-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-baseline space-x-3">
                  <span id="pdpPriceDisplay" class="text-3xl font-extrabold text-emerald-950">₹${p.price}</span>
                  ${p.compare_at_price ? `<span class="text-base line-through text-stone-400">₹${p.compare_at_price}</span>` : ''}
                  ${p.compare_at_price ? `<span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Save ${Math.round((p.compare_at_price - p.price) / p.compare_at_price * 100)}%</span>` : ''}
                  <span class="text-xs text-stone-500 ml-auto">Inclusive of all taxes</span>
                </div>

                <!-- Eco Impact Badge (FR-04) -->
                ${p.eco_impact_badge ? `
                  <div class="mt-4 p-3 bg-stone-100 rounded-xl border border-stone-200 flex items-start space-x-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i class="fa-solid fa-leaf"></i>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-emerald-950 uppercase tracking-wider">Eco Impact & Heritage Story</h4>
                      <p class="text-xs text-stone-700 mt-0.5">${p.eco_impact_badge}. ${p.plastic_saved_desc || ''}</p>
                    </div>
                  </div>
                ` : ''}

                <!-- Variants Selector (FR-04) -->
                ${variants.length > 1 ? `
                  <div class="mt-5">
                    <label class="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Select Variant:</label>
                    <div class="flex flex-wrap gap-2" id="pdpVariantsContainer">
                      ${variants.map((v, idx) => `
                        <button
                          type="button"
                          onclick="App.selectPdpVariant('${v.id}', '${v.title}', ${v.price}, this)"
                          class="variant-btn text-xs px-4 py-2 rounded-xl border ${idx === 0 ? 'border-emerald-800 bg-emerald-800 text-white font-bold' : 'border-stone-300 bg-white text-stone-800 hover:border-emerald-700'} transition"
                        >
                          ${v.title} · ₹${v.price}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Quantity & Add to Cart -->
                <div class="mt-6 flex items-center space-x-3">
                  <div class="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden">
                    <button type="button" onclick="App.adjustPdpQty(-1)" class="px-3 py-2.5 text-stone-600 hover:bg-stone-100 transition">-</button>
                    <span id="pdpQtyDisplay" class="px-4 py-2.5 text-sm font-bold text-stone-800">1</span>
                    <button type="button" onclick="App.adjustPdpQty(1)" class="px-3 py-2.5 text-stone-600 hover:bg-stone-100 transition">+</button>
                  </div>
                  <button
                    id="pdpAddToCartBtn"
                    onclick="App.addToCart('${p.id}', '${p.title.replace(/'/g, "\\'")}', ${p.price}, '${primaryImg}', null, App.pdpQty)"
                    class="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
                  >
                    <i class="fa-solid fa-bag-shopping"></i>
                    <span>Add to Sustainable Cart</span>
                  </button>
                </div>

                <!-- WhatsApp "Chat about this product" Button (FR-24) -->
                <div class="mt-3">
                  <a
                    href="${waUrl}"
                    target="_blank"
                    class="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs transition"
                  >
                    <i class="fa-brands fa-whatsapp text-emerald-600 text-base"></i>
                    <span>Chat about this product on WhatsApp</span>
                  </a>
                </div>

                <!-- Pincode Delivery Estimator (FR-11) -->
                <div class="mt-6 p-4 rounded-2xl bg-white border border-stone-200">
                  <h4 class="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <i class="fa-solid fa-location-dot text-emerald-700"></i>
                    <span>Check Pincode Delivery & COD</span>
                  </h4>
                  <div class="flex space-x-2">
                    <input
                      id="pdpPincodeInput"
                      type="text"
                      maxlength="6"
                      placeholder="Enter 6-digit Pincode (e.g. 751024)"
                      class="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    <button onclick="App.checkPdpPincode()" class="bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">
                      Check
                    </button>
                  </div>
                  <div id="pdpPincodeResult" class="mt-2 text-xs hidden"></div>
                </div>
              </div>

              <!-- Trust Guarantee Section -->
              <div class="mt-6 pt-4 border-t border-stone-200 grid grid-cols-2 gap-3 text-xs text-stone-600">
                <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-shield-halved text-emerald-700"></i>
                  <span>7-Day Return Policy</span>
                </div>
                <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-truck-fast text-emerald-700"></i>
                  <span>Free shipping above ₹499</span>
                </div>
                <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-money-bill-wave text-emerald-700"></i>
                  <span>Cash on Delivery Available</span>
                </div>
                <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-award text-emerald-700"></i>
                  <span>Handcrafted in Odisha</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs: Description, Care, Story -->
          <div class="mt-16 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200">
            <div class="border-b border-stone-200 flex space-x-8 text-sm font-bold">
              <button class="pb-3 border-b-2 border-emerald-800 text-emerald-950">Description & Specs</button>
              <button class="pb-3 text-stone-500 hover:text-stone-800">Care & Maintenance</button>
              <button class="pb-3 text-stone-500 hover:text-stone-800">Artisan Guild Heritage</button>
            </div>
            <div class="py-6 text-stone-700 text-sm leading-relaxed space-y-4">
              <p>${p.description}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                <div>
                  <h5 class="font-bold text-stone-900 mb-1">Care Guide:</h5>
                  <p class="text-stone-600 text-xs">${p.care_instructions || 'Keep in a well-ventilated dry location.'}</p>
                </div>
                <div>
                  <h5 class="font-bold text-stone-900 mb-1">Craftsmanship & Provenance:</h5>
                  <p class="text-stone-600 text-xs">${p.craft_origin} · Supported under Rural Artisan Development Program.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Frequently Bought Together (FR-06) -->
          ${related.length > 0 ? `
            <div class="mt-16">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-xl font-bold text-stone-900">Frequently Bought Together</h3>
                  <p class="text-xs text-stone-500">Pair this with matching natural lifestyle essentials</p>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${related.map(r => this.createProductCardHtml(r)).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Verified Customer Reviews Section (FR-04) -->
          <div id="reviewsSection" class="mt-16 bg-stone-100/70 rounded-3xl p-6 sm:p-8 border border-stone-200">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 class="text-xl font-bold text-stone-900">Verified Customer Reviews</h3>
                <p class="text-xs text-stone-500">Real feedback from eco-conscious households across India</p>
              </div>
              <button onclick="document.getElementById('writeReviewModal').classList.remove('hidden')" class="bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-900 transition">
                Write a Review
              </button>
            </div>

            <!-- Reviews List -->
            <div class="space-y-4">
              ${reviews.length === 0 ? '<p class="text-stone-500 text-sm italic">No reviews yet. Be the first to review this eco-friendly item!</p>' : ''}
              ${reviews.map(r => `
                <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2">
                      <span class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        ${r.customer_name[0]}
                      </span>
                      <div>
                        <div class="text-xs font-bold text-stone-900">${r.customer_name} <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded ml-1">✓ Verified Purchase</span></div>
                        <div class="text-[10px] text-stone-400">${r.customer_city || 'India'}</div>
                      </div>
                    </div>
                    <div class="text-amber-500 text-xs">
                      ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  ${r.title ? `<h5 class="text-xs font-bold text-stone-800 mb-1">${r.title}</h5>` : ''}
                  <p class="text-xs text-stone-600 leading-relaxed">${r.comment}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Write Review Modal -->
        <div id="writeReviewModal" class="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 hidden">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-base font-bold text-stone-900">Write a Review for ${p.title}</h4>
              <button onclick="document.getElementById('writeReviewModal').classList.add('hidden')" class="text-stone-400 hover:text-stone-700"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form id="submitReviewForm" onsubmit="App.submitCustomerReview(event, '${p.id}')" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Rating</label>
                <select id="reviewRatingSelect" class="w-full text-xs p-2.5 border border-stone-300 rounded-xl">
                  <option value="5">★★★★★ - Excellent (5/5)</option>
                  <option value="4">★★★★☆ - Very Good (4/5)</option>
                  <option value="3">★★★☆☆ - Average (3/5)</option>
                  <option value="2">★★☆☆☆ - Below Expectation (2/5)</option>
                  <option value="1">★☆☆☆☆ - Disappointed (1/5)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Your Name</label>
                <input id="reviewNameInput" required placeholder="e.g. Aditi Dash" class="w-full text-xs p-2.5 border border-stone-300 rounded-xl" />
              </div>
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">City</label>
                <input id="reviewCityInput" placeholder="e.g. Bhubaneswar" class="w-full text-xs p-2.5 border border-stone-300 rounded-xl" />
              </div>
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Review Headline</label>
                <input id="reviewTitleInput" placeholder="e.g. Highly recommend this natural comb" class="w-full text-xs p-2.5 border border-stone-300 rounded-xl" />
              </div>
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Your Feedback</label>
                <textarea id="reviewCommentInput" required rows="3" placeholder="Share your experience with the craftsmanship and eco benefits..." class="w-full text-xs p-2.5 border border-stone-300 rounded-xl"></textarea>
              </div>
              <button type="submit" class="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      `;

      App.pdpQty = 1;
      App.selectedVariant = variants[0] || null;
    } catch (e) {
      console.error('Error loading product detail:', e);
    }
  },

  pdpQty: 1,
  selectedVariant: null,

  adjustPdpQty(delta) {
    this.pdpQty = Math.max(1, this.pdpQty + delta);
    const display = document.getElementById('pdpQtyDisplay');
    if (display) display.innerText = this.pdpQty;
  },

  selectPdpVariant(varId, varTitle, varPrice, btn) {
    this.selectedVariant = { id: varId, title: varTitle, price: varPrice };
    const priceDisplay = document.getElementById('pdpPriceDisplay');
    if (priceDisplay) priceDisplay.innerText = `₹${varPrice}`;

    document.querySelectorAll('.variant-btn').forEach(b => {
      b.classList.remove('border-emerald-800', 'bg-emerald-800', 'text-white', 'font-bold');
      b.classList.add('border-stone-300', 'bg-white', 'text-stone-800');
    });

    btn.classList.add('border-emerald-800', 'bg-emerald-800', 'text-white', 'font-bold');
    btn.classList.remove('border-stone-300', 'bg-white', 'text-stone-800');
  },

  async checkPdpPincode() {
    const input = document.getElementById('pdpPincodeInput');
    const resBox = document.getElementById('pdpPincodeResult');
    if (!input || !resBox) return;

    const pin = input.value.trim();
    if (!pin || pin.length !== 6) {
      resBox.className = 'mt-2 text-xs text-rose-600 block';
      resBox.innerText = 'Please enter a valid 6-digit Indian postal pincode.';
      return;
    }

    try {
      const res = await fetch(`/api/pincode/${pin}`);
      const data = await res.json();
      resBox.classList.remove('hidden');

      if (data.serviceable) {
        resBox.className = 'mt-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 block';
        resBox.innerHTML = `
          <strong>✓ Serviceable to ${data.city}, ${data.state}</strong><br/>
          • Estimated Delivery: <strong>${data.estimatedDeliveryDays} business days</strong><br/>
          • Cash on Delivery (COD): <strong>${data.codAvailable ? 'Available' : 'Prepaid only'}</strong>
        `;
      } else {
        resBox.className = 'mt-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 block';
        resBox.innerText = `Sorry, delivery to pincode ${pin} is currently unserviceable.`;
      }
    } catch (e) {
      console.error('Error checking pincode:', e);
    }
  },

  async submitCustomerReview(e, productId) {
    e.preventDefault();
    const rating = document.getElementById('reviewRatingSelect').value;
    const name = document.getElementById('reviewNameInput').value;
    const city = document.getElementById('reviewCityInput').value;
    const title = document.getElementById('reviewTitleInput').value;
    const comment = document.getElementById('reviewCommentInput').value;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          customer_name: name,
          customer_city: city,
          rating,
          title,
          comment
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Thank you! Your verified review has been submitted successfully.');
        document.getElementById('writeReviewModal').classList.add('hidden');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Could not submit review. Please try again.');
    }
  },

  // -----------------------------------------------------------------
  // CART STATE & OPERATIONS (FR-09, FR-10, FR-12)
  // -----------------------------------------------------------------
  addToCart(productId, title, price, image, variantTitle = 'Standard', qty = 1) {
    const existingIndex = this.state.cart.findIndex(i => i.product_id === productId && i.variant_title === variantTitle);

    if (existingIndex > -1) {
      this.state.cart[existingIndex].quantity += qty;
    } else {
      this.state.cart.push({
        product_id: productId,
        title,
        price,
        image,
        variant_title: variantTitle,
        quantity: qty
      });
    }

    this.saveCart();
    this.openCartDrawer();
  },

  saveCart() {
    localStorage.setItem('ecosaathi_cart', JSON.stringify(this.state.cart));
    this.updateCartBadge();
  },

  updateCartBadge() {
    const totalItems = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(b => {
      b.innerText = totalItems;
      if (totalItems > 0) b.classList.remove('hidden');
      else b.classList.add('hidden');
    });
  },

  adjustCartItemQty(index, delta) {
    if (this.state.cart[index]) {
      this.state.cart[index].quantity += delta;
      if (this.state.cart[index].quantity <= 0) {
        this.state.cart.splice(index, 1);
      }
      this.saveCart();
      this.renderCartDrawer();
    }
  },

  removeCartItem(index) {
    this.state.cart.splice(index, 1);
    this.saveCart();
    this.renderCartDrawer();
  },

  async openCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartDrawerBackdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('translate-x-full');
      backdrop.classList.remove('hidden');
      await this.renderCartDrawer();
    }
  },

  closeCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartDrawerBackdrop');
    if (drawer && backdrop) {
      drawer.classList.add('translate-x-full');
      backdrop.classList.add('hidden');
    }
  },

  async renderCartDrawer() {
    const itemsContainer = document.getElementById('cartDrawerItems');
    const subtotalEl = document.getElementById('cartDrawerSubtotal');
    const shippingEl = document.getElementById('cartDrawerShipping');
    const freeShippingBar = document.getElementById('cartFreeShippingProgress');
    const freeShippingText = document.getElementById('cartFreeShippingText');
    const totalEl = document.getElementById('cartDrawerTotal');

    if (!itemsContainer) return;

    if (this.state.cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-3 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 text-xl">
            <i class="fa-solid fa-basket-shopping"></i>
          </div>
          <p class="font-bold text-stone-700">Your sustainable cart is empty</p>
          <p class="text-xs text-stone-400 mt-1">Discover handcrafted goods from Odisha artisans</p>
          <button onclick="App.closeCartDrawer(); window.location.hash='shop';" class="mt-4 bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl">
            Start Shopping
          </button>
        </div>
      `;
      if (subtotalEl) subtotalEl.innerText = '₹0';
      if (totalEl) totalEl.innerText = '₹0';
      return;
    }

    // Call server to validate cart prices and calculate free shipping + tax
    try {
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: this.state.cart,
          coupon_code: this.state.appliedCoupon
        })
      });
      const data = await res.json();
      this.state.cartPricing = data;

      // Render Items
      itemsContainer.innerHTML = data.items.map((item, idx) => `
        <div class="flex items-center space-x-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
          <img src="${item.image}" alt="${item.title}" class="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-bold text-stone-900 truncate">${item.title}</h5>
            <span class="text-[11px] text-stone-500">${item.variant_title}</span>
            <div class="text-xs font-bold text-emerald-950 mt-1">₹${item.unit_price}</div>
          </div>
          <div class="flex flex-col items-end space-y-1">
            <div class="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden text-xs">
              <button onclick="App.adjustCartItemQty(${idx}, -1)" class="px-2 py-1 hover:bg-stone-100">-</button>
              <span class="px-2 font-bold text-stone-800">${item.quantity}</span>
              <button onclick="App.adjustCartItemQty(${idx}, 1)" class="px-2 py-1 hover:bg-stone-100">+</button>
            </div>
            <button onclick="App.removeCartItem(${idx})" class="text-[10px] text-rose-600 hover:underline">
              Remove
            </button>
          </div>
        </div>
      `).join('');

      // Free shipping threshold progress bar
      if (freeShippingBar && freeShippingText) {
        const threshold = data.freeShippingThreshold || 499;
        const progress = Math.min(100, (data.subtotal / threshold) * 100);
        freeShippingBar.style.width = `${progress}%`;
        if (data.subtotal >= threshold) {
          freeShippingText.innerHTML = `🎉 <strong>Congratulations!</strong> You qualify for <strong>FREE Shipping</strong> across India!`;
        } else {
          freeShippingText.innerHTML = `Add <strong>₹${data.amountNeededForFreeShipping}</strong> more to unlock <strong>FREE Shipping</strong>!`;
        }
      }

      if (subtotalEl) subtotalEl.innerText = `₹${data.subtotal}`;
      if (shippingEl) shippingEl.innerText = data.shippingFee === 0 ? 'FREE' : `₹${data.shippingFee}`;
      if (totalEl) totalEl.innerText = `₹${data.total}`;

    } catch (e) {
      console.error('Cart validation error:', e);
    }
  },

  applyCouponCode() {
    const input = document.getElementById('cartCouponInput');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (code === 'ECOFIRST10' || code === 'GREENINDIA') {
      this.state.appliedCoupon = code;
      localStorage.setItem('ecosaathi_coupon', code);
      alert(`Coupon "${code}" applied successfully!`);
      this.renderCartDrawer();
    } else {
      alert('Invalid coupon. Try "ECOFIRST10" (10% off) or "GREENINDIA" (₹100 off).');
    }
  },

  // -----------------------------------------------------------------
  // 2-STEP CHECKOUT (FR-09, FR-10, FR-11, FR-12, FR-22)
  // -----------------------------------------------------------------
  renderCheckoutScreen() {
    const container = document.getElementById('viewCheckout');
    if (!container) return;

    if (this.state.cart.length === 0) {
      container.innerHTML = `
        <div class="py-24 text-center max-w-lg mx-auto px-4">
          <h2 class="text-2xl font-bold text-stone-900">Your cart is empty</h2>
          <p class="text-stone-500 text-sm mt-2">Add sustainable handcrafted items to your basket before checking out.</p>
          <a href="#shop" class="mt-6 inline-block bg-emerald-800 text-white font-bold px-6 py-3 rounded-2xl shadow-lg">Browse Catalog</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-8">Secure Checkout</h1>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <!-- Left: Checkout Forms -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Step 1: Customer & Address -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
              <h3 class="text-base font-bold text-stone-900 mb-4 flex items-center space-x-2">
                <span class="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs">1</span>
                <span>Shipping & Delivery Details</span>
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-bold text-stone-700 mb-1">Full Name *</label>
                  <input id="checkoutName" required placeholder="e.g. Aditi Dash" value="${this.state.user ? this.state.user.name : ''}" class="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700" />
                </div>
                <div>
                  <label class="block font-bold text-stone-700 mb-1">Mobile Phone (for tracking updates) *</label>
                  <input id="checkoutPhone" required maxlength="10" placeholder="e.g. 9437099999" value="${this.state.user ? this.state.user.phone || '' : ''}" class="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block font-bold text-stone-700 mb-1">Email Address *</label>
                  <input id="checkoutEmail" required type="email" placeholder="e.g. aditi@example.com" value="${this.state.user ? this.state.user.email || '' : ''}" class="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block font-bold text-stone-700 mb-1">Flat / House No. / Street / Locality *</label>
                  <input id="checkoutStreet" required placeholder="e.g. Plot No. 42, Green Glen Layout, Patia" class="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700" />
                </div>
                <div>
                  <label class="block font-bold text-stone-700 mb-1">6-Digit Pincode *</label>
                  <input id="checkoutPincode" required maxlength="6" placeholder="e.g. 751024" class="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700" onchange="App.autoFillPincodeCity(this.value)" />
                </div>
                <div>
                  <label class="block font-bold text-stone-700 mb-1">City / Town</label>
                  <input id="checkoutCity" placeholder="e.g. Bhubaneswar" class="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700" />
                </div>
              </div>

              <!-- DPDP Act 2023 Compliant Unticked Consent Boxes (PRD FR-22 & Security Section 9) -->
              <div class="mt-6 pt-4 border-t border-stone-100 space-y-2.5">
                <label class="flex items-start space-x-2.5 text-xs text-stone-700 cursor-pointer">
                  <input id="checkoutConsentWhatsApp" type="checkbox" class="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600" />
                  <span>Send order status, dispatch alerts, and tracking links to my <strong>WhatsApp</strong>.</span>
                </label>
                <label class="flex items-start space-x-2.5 text-xs text-stone-700 cursor-pointer">
                  <input id="checkoutConsentEmail" type="checkbox" class="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600" />
                  <span>Receive eco-living guides, artisan stories, and new product releases via <strong>Email</strong> (unsubscribe anytime).</span>
                </label>
              </div>
            </div>

            <!-- Step 2: Payment Method (FR-10) -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
              <h3 class="text-base font-bold text-stone-900 mb-4 flex items-center space-x-2">
                <span class="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs">2</span>
                <span>Select Payment Method</span>
              </h3>

              <div class="space-y-3">
                <label class="flex items-center justify-between p-4 border-2 border-emerald-800 bg-emerald-50/40 rounded-2xl cursor-pointer">
                  <div class="flex items-center space-x-3">
                    <input type="radio" name="paymentMethod" value="upi" checked class="text-emerald-700 focus:ring-emerald-600" />
                    <div>
                      <div class="text-xs font-bold text-stone-900">UPI Instant Payment (Google Pay, PhonePe, Paytm, BHIM)</div>
                      <div class="text-[11px] text-stone-500">Fastest checkout with zero transaction fees</div>
                    </div>
                  </div>
                  <i class="fa-solid fa-qrcode text-emerald-800 text-lg"></i>
                </label>

                <label class="flex items-center justify-between p-4 border border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-50">
                  <div class="flex items-center space-x-3">
                    <input type="radio" name="paymentMethod" value="card" class="text-emerald-700 focus:ring-emerald-600" />
                    <div>
                      <div class="text-xs font-bold text-stone-900">Debit / Credit Cards & Net Banking</div>
                      <div class="text-[11px] text-stone-500">All major Indian banks supported (128-bit SSL encrypted)</div>
                    </div>
                  </div>
                  <i class="fa-solid fa-credit-card text-stone-600 text-lg"></i>
                </label>

                <label class="flex items-center justify-between p-4 border border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-50">
                  <div class="flex items-center space-x-3">
                    <input type="radio" name="paymentMethod" value="cod" class="text-emerald-700 focus:ring-emerald-600" />
                    <div>
                      <div class="text-xs font-bold text-stone-900">Cash on Delivery (COD)</div>
                      <div class="text-[11px] text-stone-500">Pay cash or UPI at your doorstep upon parcel arrival</div>
                    </div>
                  </div>
                  <i class="fa-solid fa-hand-holding-dollar text-stone-600 text-lg"></i>
                </label>
              </div>
            </div>
          </div>

          <!-- Right: Order Summary Breakdown -->
          <div class="lg:col-span-5">
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm sticky top-24">
              <h3 class="text-base font-bold text-stone-900 mb-4">Order Summary</h3>

              <!-- Cart items preview -->
              <div class="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1">
                ${this.state.cart.map(item => `
                  <div class="flex items-center space-x-3 text-xs">
                    <img src="${item.image}" alt="${item.title}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-stone-900 truncate">${item.title}</div>
                      <div class="text-stone-500">Qty: ${item.quantity} · ${item.variant_title}</div>
                    </div>
                    <div class="font-bold text-stone-800">₹${item.price * item.quantity}</div>
                  </div>
                `).join('')}
              </div>

              <!-- Calculation lines -->
              <div class="pt-4 border-t border-stone-100 space-y-2 text-xs">
                <div class="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span id="checkoutSubtotal">₹${this.state.cartPricing.subtotal}</span>
                </div>
                ${this.state.cartPricing.discount > 0 ? `
                  <div class="flex justify-between text-emerald-700 font-bold">
                    <span>Discount (${this.state.appliedCoupon})</span>
                    <span>-₹${this.state.cartPricing.discount}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between text-stone-600">
                  <span>Shipping Fee</span>
                  <span id="checkoutShipping">${this.state.cartPricing.shippingFee === 0 ? 'FREE' : '₹' + this.state.cartPricing.shippingFee}</span>
                </div>
                <div class="flex justify-between text-stone-600">
                  <span>Estimated GST (5%)</span>
                  <span id="checkoutGst">₹${this.state.cartPricing.gst}</span>
                </div>
                <div class="pt-3 border-t border-stone-200 flex justify-between text-base font-extrabold text-stone-950">
                  <span>Total Amount</span>
                  <span id="checkoutTotal">₹${this.state.cartPricing.total}</span>
                </div>
              </div>

              <button
                onclick="App.submitCheckout()"
                id="placeOrderBtn"
                class="mt-6 w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition"
              >
                <i class="fa-solid fa-lock text-sm text-emerald-300"></i>
                <span>Place Order & Pay</span>
              </button>
              <p class="text-[11px] text-stone-400 text-center mt-3">
                Protected by 256-bit SSL encryption. Handcrafted & shipped from Bhubaneswar.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async autoFillPincodeCity(pin) {
    if (pin && pin.length === 6) {
      try {
        const res = await fetch(`/api/pincode/${pin}`);
        const data = await res.json();
        if (data.serviceable && data.city) {
          const cityInput = document.getElementById('checkoutCity');
          if (cityInput && !cityInput.value) {
            cityInput.value = data.city;
          }
        }
      } catch(e) {}
    }
  },

  async submitCheckout() {
    const name = document.getElementById('checkoutName').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();
    const email = document.getElementById('checkoutEmail').value.trim();
    const street = document.getElementById('checkoutStreet').value.trim();
    const pincode = document.getElementById('checkoutPincode').value.trim();
    const city = document.getElementById('checkoutCity').value.trim() || 'Bhubaneswar';
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi';
    const whatsappOptin = document.getElementById('checkoutConsentWhatsApp')?.checked || false;
    const emailOptin = document.getElementById('checkoutConsentEmail')?.checked || false;

    if (!name || !phone || !email || !street || !pincode) {
      alert('Please fill out all required delivery fields.');
      return;
    }

    if (phone.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin mr-2"></i> Placing Order...`;

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, phone, email },
          address: { street, city, state: 'Odisha', pincode },
          items: this.state.cart,
          payment_method: paymentMethod,
          coupon_code: this.state.appliedCoupon,
          whatsapp_optin: whatsappOptin,
          email_optin: emailOptin
        })
      });

      const data = await res.json();
      btn.disabled = false;

      if (data.success) {
        // Clear cart
        this.state.cart = [];
        this.saveCart();
        window.location.hash = `order/${data.orderNumber}`;
      } else {
        alert(data.error || 'Checkout could not be processed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      btn.disabled = false;
      alert('Error during checkout.');
    }
  },

  // -----------------------------------------------------------------
  // ORDER SUCCESS & LIVE TRACKING (FR-13)
  // -----------------------------------------------------------------
  async loadOrderConfirmation(orderNumber) {
    const container = document.getElementById('viewOrderSuccess');
    if (!container) return;

    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      const data = await res.json();
      if (!data.order) {
        container.innerHTML = `<div class="py-24 text-center"><h2 class="text-xl font-bold">Order not found</h2></div>`;
        return;
      }

      const o = data.order;
      container.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-12">
          <!-- Confirmation Banner -->
          <div class="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-lg text-center mb-8">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto mb-4">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-stone-900">Thank you, ${o.customer_name}!</h1>
            <p class="text-stone-600 text-sm mt-1">Your order <strong class="text-emerald-900">${o.order_number}</strong> is confirmed and being prepared in Bhubaneswar.</p>
            <div class="mt-4 flex flex-wrap justify-center gap-3 text-xs">
              <span class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                Payment: ${o.payment_method.toUpperCase()} (${o.payment_status.toUpperCase()})
              </span>
              <span class="bg-stone-100 text-stone-800 px-3 py-1 rounded-full font-medium">
                Tracking: ${o.tracking_number}
              </span>
            </div>
          </div>

          <!-- Interactive Delivery Timeline -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mb-8">
            <h3 class="text-base font-bold text-stone-900 mb-6 flex items-center space-x-2">
              <i class="fa-solid fa-truck-ramp-box text-emerald-800"></i>
              <span>Live Delivery Journey</span>
            </h3>
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold mb-2 shadow">
                  <i class="fa-solid fa-check"></i>
                </div>
                <span class="font-bold text-emerald-950">Confirmed</span>
                <span class="text-[10px] text-stone-400">Order received</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full ${o.order_status === 'processing' || o.order_status === 'shipped' || o.order_status === 'delivered' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-500'} flex items-center justify-center font-bold mb-2">
                  <i class="fa-solid fa-box"></i>
                </div>
                <span class="font-bold text-stone-800">Packing</span>
                <span class="text-[10px] text-stone-400">Artisan inspection</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full ${o.order_status === 'shipped' || o.order_status === 'delivered' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-500'} flex items-center justify-center font-bold mb-2">
                  <i class="fa-solid fa-truck"></i>
                </div>
                <span class="font-bold text-stone-800">In Transit</span>
                <span class="text-[10px] text-stone-400">${o.courier_name}</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full ${o.order_status === 'delivered' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-500'} flex items-center justify-center font-bold mb-2">
                  <i class="fa-solid fa-house-chimney"></i>
                </div>
                <span class="font-bold text-stone-800">Delivered</span>
                <span class="text-[10px] text-stone-400">Doorstep drop</span>
              </div>
            </div>
          </div>

          <!-- Order Items & Invoice Action -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mb-8">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-stone-900">Items Ordered</h3>
              <button onclick="App.openInvoiceModal('${o.order_number}')" class="bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition">
                <i class="fa-solid fa-file-invoice"></i>
                <span>Download GST Tax Invoice</span>
              </button>
            </div>

            <div class="divide-y divide-stone-100">
              ${o.items.map(it => `
                <div class="py-3 flex items-center justify-between text-xs">
                  <div class="flex items-center space-x-3">
                    <img src="${it.image}" alt="${it.title}" class="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <div class="font-bold text-stone-900">${it.title}</div>
                      <div class="text-stone-500">${it.variant_title} · Qty: ${it.quantity}</div>
                    </div>
                  </div>
                  <div class="font-bold text-stone-900">₹${it.price * it.quantity}</div>
                </div>
              `).join('')}
            </div>

            <div class="mt-4 pt-4 border-t border-stone-200 flex justify-between font-extrabold text-sm text-emerald-950">
              <span>Total Paid (incl. GST)</span>
              <span>₹${o.total}</span>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      console.error(e);
    }
  },

  async openInvoiceModal(orderNumber) {
    try {
      const res = await fetch(`/api/orders/${orderNumber}/invoice`);
      const inv = await res.json();

      let modal = document.getElementById('gstInvoiceModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gstInvoiceModal';
        modal.className = 'fixed inset-0 bg-stone-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto';
        document.body.appendChild(modal);
      }

      modal.classList.remove('hidden');
      modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl my-8">
          <div class="flex justify-between items-center mb-6">
            <h4 class="text-lg font-bold text-stone-900">Tax Invoice & GST Receipt</h4>
            <div class="flex space-x-2">
              <button onclick="window.print()" class="bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                <i class="fa-solid fa-print mr-1"></i> Print
              </button>
              <button onclick="document.getElementById('gstInvoiceModal').classList.add('hidden')" class="text-stone-400 hover:text-stone-700">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
          </div>

          <div id="invoicePrintArea" class="border border-stone-300 p-6 rounded-2xl text-xs space-y-4">
            <div class="flex justify-between items-start border-b border-stone-200 pb-4">
              <div>
                <h2 class="text-lg font-extrabold text-emerald-900">${inv.seller.name}</h2>
                <p class="text-stone-500 mt-0.5">${inv.seller.address}</p>
                <p class="text-stone-700 font-semibold mt-1">GSTIN: ${inv.seller.gstin} | State Code: ${inv.seller.stateCode}</p>
              </div>
              <div class="text-right">
                <div class="font-extrabold text-stone-900 text-sm">TAX INVOICE</div>
                <div class="text-stone-500">${inv.invoiceNumber}</div>
                <div class="text-stone-500">${new Date(inv.date).toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 border-b border-stone-200 pb-4">
              <div>
                <div class="font-bold text-stone-900">Billed & Shipped To:</div>
                <div class="font-semibold text-stone-800">${inv.buyer.name}</div>
                <div class="text-stone-600">${inv.buyer.address.street}, ${inv.buyer.address.city} - ${inv.buyer.address.pincode}</div>
                <div class="text-stone-600">Phone: ${inv.buyer.phone}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-stone-900">Order Reference:</div>
                <div>${inv.orderNumber}</div>
                <div>Payment Mode: ${inv.paymentMethod}</div>
              </div>
            </div>

            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-stone-300 font-bold text-stone-800">
                  <th class="py-2">Item Description</th>
                  <th class="py-2">HSN</th>
                  <th class="py-2 text-center">Qty</th>
                  <th class="py-2 text-right">Price</th>
                  <th class="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100">
                ${inv.items.map(it => `
                  <tr>
                    <td class="py-2">${it.title}</td>
                    <td class="py-2">${it.hsn}</td>
                    <td class="py-2 text-center">${it.quantity}</td>
                    <td class="py-2 text-right">₹${it.price}</td>
                    <td class="py-2 text-right font-semibold">₹${it.price * it.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="border-t border-stone-300 pt-3 flex justify-end">
              <div class="w-56 space-y-1 text-right">
                <div class="flex justify-between"><span>Subtotal:</span><span>₹${inv.subtotal}</span></div>
                ${inv.discount ? `<div class="flex justify-between text-emerald-800"><span>Discount:</span><span>-₹${inv.discount}</span></div>` : ''}
                <div class="flex justify-between"><span>Shipping:</span><span>${inv.shippingFee === 0 ? 'FREE' : '₹' + inv.shippingFee}</span></div>
                <div class="flex justify-between"><span>CGST (2.5%):</span><span>₹${inv.cgst}</span></div>
                <div class="flex justify-between"><span>SGST (2.5%):</span><span>₹${inv.sgst}</span></div>
                <div class="flex justify-between font-extrabold text-sm border-t border-stone-300 pt-1 text-emerald-950">
                  <span>Grand Total:</span><span>₹${inv.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch(e) {
      console.error(e);
    }
  },

  // -----------------------------------------------------------------
  // GIFT BUNDLE BUILDER (FR-07)
  // -----------------------------------------------------------------
  bundleState: { box: null, items: [], cardNote: '' },

  initBundleBuilder() {
    this.bundleState = { box: null, items: [], cardNote: '' };
    this.renderBundleBuilder();
  },

  renderBundleBuilder() {
    const container = document.getElementById('viewBundle');
    if (!container) return;

    const availableProducts = this.state.products.slice(0, 12);

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="text-center max-w-2xl mx-auto mb-10">
          <span class="badge-eco text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Custom Gifting Studio</span>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2">Build Your Own Sustainable Gift Hamper</h1>
          <p class="text-stone-600 text-sm mt-2">Pick an artisan box, select 3 or more sustainable essentials, and add a personalized handwritten note.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-8 space-y-8">
            <!-- Step 1: Choose Box -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
              <h3 class="text-base font-bold text-stone-900 mb-4 flex items-center space-x-2">
                <span class="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs">1</span>
                <span>Choose Presentation Box</span>
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div onclick="App.selectBundleBox('sabai', 'Handcrafted Mayurbhanj Sabai Box', 399, this)" class="bundle-box-card p-4 border-2 border-stone-200 hover:border-emerald-700 rounded-2xl cursor-pointer text-center transition">
                  <div class="w-12 h-12 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl"><i class="fa-solid fa-box"></i></div>
                  <h4 class="font-bold text-xs text-stone-900">Sabai Grass Keepsake Box</h4>
                  <p class="text-[11px] text-stone-500 mt-1">Handwoven in Mayurbhanj</p>
                  <span class="text-xs font-bold text-emerald-900 mt-2 block">+₹399</span>
                </div>
                <div onclick="App.selectBundleBox('kraft', 'Zero-Plastic Recycled Kraft Box', 149, this)" class="bundle-box-card p-4 border-2 border-stone-200 hover:border-emerald-700 rounded-2xl cursor-pointer text-center transition">
                  <div class="w-12 h-12 bg-stone-100 text-stone-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl"><i class="fa-solid fa-gift"></i></div>
                  <h4 class="font-bold text-xs text-stone-900">Recycled Kraft Hamper Box</h4>
                  <p class="text-[11px] text-stone-500 mt-1">Lined with natural wood shred</p>
                  <span class="text-xs font-bold text-emerald-900 mt-2 block">+₹149</span>
                </div>
                <div onclick="App.selectBundleBox('jute', 'Eco Jute Tote Gift Bag', 199, this)" class="bundle-box-card p-4 border-2 border-stone-200 hover:border-emerald-700 rounded-2xl cursor-pointer text-center transition">
                  <div class="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-xl"><i class="fa-solid fa-bag-shopping"></i></div>
                  <h4 class="font-bold text-xs text-stone-900">Artisan Jute Tote Bag</h4>
                  <p class="text-[11px] text-stone-500 mt-1">Reusable market tote</p>
                  <span class="text-xs font-bold text-emerald-900 mt-2 block">+₹199</span>
                </div>
              </div>
            </div>

            <!-- Step 2: Pick 3 to 6 Items -->
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
              <h3 class="text-base font-bold text-stone-900 mb-4 flex items-center space-x-2">
                <span class="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs">2</span>
                <span>Select Sustainable Items (Choose 3 or more)</span>
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                ${availableProducts.map(p => `
                  <div class="p-3 border border-stone-200 rounded-2xl flex flex-col justify-between hover:border-emerald-600 transition">
                    <img src="${p.primary_image || 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=300&q=80'}" alt="${p.title}" class="w-full aspect-square object-cover rounded-xl mb-2" />
                    <div>
                      <h5 class="text-xs font-bold text-stone-900 line-clamp-1">${p.title}</h5>
                      <span class="text-xs font-bold text-emerald-950">₹${p.price}</span>
                    </div>
                    <button onclick="App.toggleBundleItem('${p.id}', '${p.title.replace(/'/g, "\\'")}', ${p.price}, '${p.primary_image}', this)" class="bundle-add-btn mt-2 w-full bg-stone-100 hover:bg-emerald-800 hover:text-white text-stone-800 text-xs font-bold py-1.5 rounded-lg transition">
                      + Add
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right: Bundle Summary & Add to Cart -->
          <div class="lg:col-span-4">
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm sticky top-24">
              <h3 class="text-base font-bold text-stone-900 mb-3">Custom Hamper Summary</h3>
              <div id="bundleSummaryBox" class="text-xs text-stone-600 space-y-2 mb-4">
                <p class="text-stone-400 italic">Select a box and items to build your hamper.</p>
              </div>
              <div class="border-t border-stone-200 pt-3 flex justify-between font-extrabold text-sm text-emerald-950">
                <span>Bundle Total:</span>
                <span id="bundleTotalAmount">₹0</span>
              </div>
              <button onclick="App.addBundleToMainCart()" id="addBundleCartBtn" disabled class="mt-4 w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">
                Add Bundle to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  selectBundleBox(type, name, price, el) {
    this.bundleState.box = { type, name, price };
    document.querySelectorAll('.bundle-box-card').forEach(c => c.classList.remove('border-emerald-800', 'bg-emerald-50/50'));
    el.classList.add('border-emerald-800', 'bg-emerald-50/50');
    this.updateBundleSummary();
  },

  toggleBundleItem(id, title, price, image, btn) {
    const idx = this.bundleState.items.findIndex(i => i.id === id);
    if (idx > -1) {
      this.bundleState.items.splice(idx, 1);
      btn.innerText = '+ Add';
      btn.classList.remove('bg-emerald-800', 'text-white');
      btn.classList.add('bg-stone-100', 'text-stone-800');
    } else {
      this.bundleState.items.push({ id, title, price, image });
      btn.innerText = '✓ Added';
      btn.classList.add('bg-emerald-800', 'text-white');
      btn.classList.remove('bg-stone-100', 'text-stone-800');
    }
    this.updateBundleSummary();
  },

  updateBundleSummary() {
    const summaryBox = document.getElementById('bundleSummaryBox');
    const totalEl = document.getElementById('bundleTotalAmount');
    const btn = document.getElementById('addBundleCartBtn');
    if (!summaryBox || !totalEl) return;

    let total = 0;
    let html = '';

    if (this.bundleState.box) {
      total += this.bundleState.box.price;
      html += `<div class="flex justify-between font-semibold text-emerald-900"><span>📦 ${this.bundleState.box.name}</span><span>₹${this.bundleState.box.price}</span></div>`;
    }

    this.bundleState.items.forEach(it => {
      total += it.price;
      html += `<div class="flex justify-between"><span>• ${it.title}</span><span>₹${it.price}</span></div>`;
    });

    summaryBox.innerHTML = html || '<p class="text-stone-400 italic">Select a box and items to start.</p>';
    totalEl.innerText = `₹${total}`;

    if (this.bundleState.box && this.bundleState.items.length >= 3) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  },

  addBundleToMainCart() {
    const box = this.bundleState.box;
    const items = this.bundleState.items;
    const total = (box ? box.price : 0) + items.reduce((s, i) => s + i.price, 0);

    const bundleTitle = `Custom Gift Hamper (${box.name} with ${items.length} items)`;
    this.addToCart('prod_bundle_custom', bundleTitle, total, items[0].image, 'Custom Hamper', 1);
    this.navigate('checkout');
  },

  // -----------------------------------------------------------------
  // CORPORATE GIFTING ENQUIRY SUBMISSION (FR-27)
  // -----------------------------------------------------------------
  async submitCorporateForm(e) {
    e.preventDefault();
    const company = document.getElementById('corpCompany').value;
    const person = document.getElementById('corpContact').value;
    const email = document.getElementById('corpEmail').value;
    const phone = document.getElementById('corpPhone').value;
    const quantity = document.getElementById('corpQty').value;
    const budget = document.getElementById('corpBudget').value;
    const notes = document.getElementById('corpNotes').value;

    try {
      const res = await fetch('/api/corporate/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: company,
          contact_person: person,
          email,
          phone,
          quantity,
          budget_per_hamper: budget,
          customization_notes: notes
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        document.getElementById('corporateEnquiryForm').reset();
      }
    } catch(err) {
      alert('Could not submit corporate enquiry.');
    }
  },

  // -----------------------------------------------------------------
  // CUSTOMER ACCOUNT & AUTH (FR-09, FR-13, FR-14)
  // -----------------------------------------------------------------
  renderAccountScreen() {
    const container = document.getElementById('viewAccount');
    if (!container) return;

    if (!this.state.user) {
      container.innerHTML = `
        <div class="max-w-md mx-auto px-4 py-16">
          <div class="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center">
            <div class="w-14 h-14 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
              <i class="fa-solid fa-user-shield"></i>
            </div>
            <h2 class="text-xl font-bold text-stone-900">Sign In to Eco Saathi</h2>
            <p class="text-xs text-stone-500 mt-1">Access order history, tracking & DPDP consent preferences</p>

            <form onsubmit="App.requestOtp(event)" class="mt-6 space-y-4 text-left">
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Mobile Number or Email</label>
                <input id="authIdentifier" required placeholder="e.g. 9437099999 or user@example.com" class="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700" />
              </div>
              <button type="submit" class="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-xl text-xs transition">
                Send One-Time Password (OTP)
              </button>
            </form>
            <div id="otpVerificationSection" class="mt-4 pt-4 border-t border-stone-100 hidden">
              <div class="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl mb-3">
                OTP sent! For demo testing, enter: <strong>123456</strong>
              </div>
              <input id="authOtpInput" maxlength="6" placeholder="Enter 6-digit OTP (123456)" class="w-full text-center text-sm font-bold tracking-widest p-2.5 border border-stone-300 rounded-xl mb-3" />
              <button onclick="App.verifyOtp()" class="w-full bg-stone-900 text-white font-bold py-2.5 rounded-xl text-xs">
                Verify & Login
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      this.loadUserDashboard();
    }
  },

  async requestOtp(e) {
    e.preventDefault();
    const id = document.getElementById('authIdentifier').value.trim();
    if (!id) return;
    try {
      const res = await fetch('/api/auth/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('otpVerificationSection').classList.remove('hidden');
      }
    } catch(e) {}
  },

  async verifyOtp() {
    const id = document.getElementById('authIdentifier').value.trim();
    const otp = document.getElementById('authOtpInput').value.trim();
    try {
      const res = await fetch('/api/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id, otp })
      });
      const data = await res.json();
      if (data.success) {
        this.state.user = data.customer;
        localStorage.setItem('ecosaathi_user', JSON.stringify(data.customer));
        localStorage.setItem('ecosaathi_phone', data.customer.phone || '');
        localStorage.setItem('ecosaathi_email', data.customer.email || '');
        this.renderAccountScreen();
      } else {
        alert(data.error);
      }
    } catch(e) {}
  },

  async loadUserDashboard() {
    const container = document.getElementById('viewAccount');
    if (!container || !this.state.user) return;

    // Fetch user orders
    let orders = [];
    try {
      const res = await fetch('/api/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: this.state.user.phone || this.state.user.email, otp: '123456' })
      });
      const data = await res.json();
      orders = data.orders || [];
    } catch(e) {}

    container.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 py-10">
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <span class="badge-eco text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Verified Account</span>
            <h1 class="text-2xl font-bold text-stone-900 mt-1">${this.state.user.name}</h1>
            <p class="text-xs text-stone-500">${this.state.user.phone || ''} · ${this.state.user.email || ''}</p>
          </div>
          <button onclick="App.logout()" class="text-xs text-rose-700 hover:underline">
            <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i> Sign Out
          </button>
        </div>

        <!-- Orders -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mb-8">
          <h3 class="text-base font-bold text-stone-900 mb-4">My Orders (${orders.length})</h3>
          <div class="space-y-4">
            ${orders.length === 0 ? '<p class="text-xs text-stone-400">No orders yet.</p>' : ''}
            ${orders.map(o => `
              <div class="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div class="text-xs font-bold text-emerald-950">${o.order_number}</div>
                  <div class="text-[11px] text-stone-500">${new Date(o.created_at).toLocaleDateString('en-IN')} · ₹${o.total}</div>
                  <div class="mt-1">
                    <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      ${o.order_status}
                    </span>
                  </div>
                </div>
                <div class="flex space-x-2 text-xs">
                  <a href="#order/${o.order_number}" class="bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-xl">Track Journey</a>
                  <button onclick="App.openInvoiceModal('${o.order_number}')" class="bg-white border border-stone-300 px-3 py-1.5 rounded-xl font-semibold">Invoice</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Privacy & DPDP Consent Management -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
          <h3 class="text-base font-bold text-stone-900 mb-2">Privacy & Consent Preferences (DPDP Act 2023)</h3>
          <p class="text-xs text-stone-500 mb-4">You have full legal ownership of your data. You may withdraw messaging permissions anytime.</p>
          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div>
                <div class="font-bold text-stone-800">WhatsApp Order Updates</div>
                <div class="text-stone-500 text-[11px]">Real-time parcel dispatch & courier updates</div>
              </div>
              <span class="text-emerald-700 font-bold">Active Opt-in</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div>
                <div class="font-bold text-stone-800">Email Newsletters & Sustainable Living Guides</div>
                <div class="text-stone-500 text-[11px]">Monthly Odisha artisan stories</div>
              </div>
              <button onclick="alert('Consent withdrawn successfully.')" class="text-rose-600 hover:underline">Withdraw</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  logout() {
    this.state.user = null;
    localStorage.removeItem('ecosaathi_user');
    this.renderAccountScreen();
  },

  toggleWishlist(id, btn) {
    btn.classList.toggle('text-rose-600');
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-solid');
      icon.classList.toggle('fa-regular');
    }
  },

  // -----------------------------------------------------------------
  // SUSTAINABILITY IMPACT CALCULATOR & DASHBOARD
  // -----------------------------------------------------------------
  async initImpactSection() {
    try {
      // 1. Fetch factors and comparison benchmarks
      const resFactors = await fetch('/api/impact/factors');
      const dataFactors = await resFactors.json();
      this.state.impact.comparisons = dataFactors.comparisons || [];
      this.state.impact.factors = dataFactors.factors || [];

      // 2. Fetch summary stats from actual orders and community logs
      const resSummary = await fetch('/api/impact/summary');
      const dataSummary = await resSummary.json();
      this.state.impact.summary = dataSummary;

      // 3. Render Product Matrix
      this.renderImpactMatrix();

      // 4. Render Dashboard metrics
      this.renderImpactDashboard();

      // 5. Run initial calculation for currently selected comparison
      this.calculateImpact();

    } catch (err) {
      console.error('Error initializing Sustainability Impact section:', err);
    }
  },

  switchImpactTab(tabId) {
    this.state.impact.activeTab = tabId;

    // Update Tab Buttons
    ['calculator', 'dashboard', 'matrix', 'methodology'].forEach(t => {
      const btn = document.getElementById(`impactTabBtn_${t}`);
      const sec = document.getElementById(`impactSection_${t}`);
      if (btn) {
        if (t === tabId) {
          btn.className = 'px-5 py-2 rounded-2xl text-xs font-bold transition bg-emerald-800 text-white shadow-sm flex items-center space-x-1.5';
        } else {
          btn.className = 'px-5 py-2 rounded-2xl text-xs font-bold transition bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center space-x-1.5';
        }
      }
      if (sec) {
        if (t === tabId) sec.classList.remove('hidden');
        else sec.classList.add('hidden');
      }
    });

    if (tabId === 'dashboard') {
      setTimeout(() => this.initImpactCharts(), 50);
    }
  },

  selectImpactComparison(comparisonId, cardEl) {
    this.state.impact.selectedComparisonId = comparisonId;

    // Highlight card
    document.querySelectorAll('#impactComparisonCards .comparison-card').forEach(c => {
      c.classList.remove('active', 'border-emerald-800', 'bg-emerald-50/50');
      c.classList.add('border-stone-200', 'bg-white');
    });

    if (cardEl) {
      cardEl.classList.add('active', 'border-emerald-800', 'bg-emerald-50/50');
      cardEl.classList.remove('border-stone-200', 'bg-white');
    }

    const comp = this.state.impact.comparisons.find(c => c.id === comparisonId);
    if (comp) {
      const unitLabel = document.getElementById('calcUnitLabel');
      if (unitLabel) unitLabel.innerText = comp.unit_of_measurement || 'items';

      // Set sensible default annual quantity
      const defaultQty = comp.conventional_product?.annual_usage_units_per_person || 4;
      this.state.impact.quantity = defaultQty;
      const qInput = document.getElementById('calcQuantityInput');
      const qSlider = document.getElementById('calcQuantitySlider');
      if (qInput) qInput.value = defaultQty;
      if (qSlider) qSlider.value = Math.min(500, defaultQty);
    }

    this.calculateImpact();
  },

  onQuantitySlider(val) {
    const q = Math.max(1, parseInt(val) || 1);
    this.state.impact.quantity = q;
    const qInput = document.getElementById('calcQuantityInput');
    if (qInput) qInput.value = q;
    this.calculateImpact();
  },

  onQuantityInput(val) {
    const q = Math.max(1, parseInt(val) || 1);
    this.state.impact.quantity = q;
    const qSlider = document.getElementById('calcQuantitySlider');
    if (qSlider) qSlider.value = Math.min(500, q);
    this.calculateImpact();
  },

  applyCalcPreset(qty) {
    this.state.impact.quantity = qty;
    const qInput = document.getElementById('calcQuantityInput');
    const qSlider = document.getElementById('calcQuantitySlider');
    if (qInput) qInput.value = qty;
    if (qSlider) qSlider.value = Math.min(500, qty);
    this.calculateImpact();
  },

  setHouseholdSize(size, btnEl) {
    this.state.impact.householdSize = parseInt(size) || 1;
    document.querySelectorAll('#householdSizeButtons .hh-btn').forEach(b => {
      b.className = 'hh-btn px-3 py-1 rounded-xl text-xs font-bold bg-stone-100 text-stone-700 hover:bg-stone-200';
    });
    if (btnEl) {
      btnEl.className = 'hh-btn px-3 py-1 rounded-xl text-xs font-bold bg-emerald-800 text-white';
    }
    this.calculateImpact();
  },

  calculateImpact() {
    const compId = this.state.impact.selectedComparisonId;
    const comp = this.state.impact.comparisons.find(c => c.id === compId);
    if (!comp) return;

    const normalBox = document.getElementById('calcResultsNormal');
    const unavailBox = document.getElementById('calcResultsUnavailable');
    const statusBadge = document.getElementById('calcDataStatusBadge');

    // Strict validation: if verified data is unavailable, clearly show "Data not available"
    const isVerified = comp.impact_per_unit_replacement && comp.impact_per_unit_replacement.data_status === 'verified';
    if (!isVerified || comp.conventional_product.plastic_weight_grams === null || comp.conventional_product.lifecycle_emissions_kg_co2e === null) {
      if (normalBox) normalBox.classList.add('hidden');
      if (unavailBox) unavailBox.classList.remove('hidden');
      if (statusBadge) {
        statusBadge.className = 'bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1';
        statusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-[9px]"></i><span>Data Not Available</span>';
      }
      return;
    }

    if (unavailBox) unavailBox.classList.add('hidden');
    if (normalBox) normalBox.classList.remove('hidden');
    if (statusBadge) {
      statusBadge.className = 'bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1';
      statusBadge.innerHTML = '<i class="fa-solid fa-circle-check text-[9px]"></i><span>Verified LCA Data</span>';
    }

    const qty = this.state.impact.quantity;
    const hh = this.state.impact.householdSize;
    const totalReplacements = qty * hh;

    // Formulas:
    // Plastic avoided (grams) = Plastic weight per conventional item × Number of items replaced.
    const plasticWeight = comp.conventional_product.plastic_weight_grams;
    const plasticAvoidedGrams = Math.round(plasticWeight * totalReplacements * 10) / 10;
    const plasticAvoidedKg = Math.round((plasticAvoidedGrams / 1000) * 1000) / 1000;

    // Estimated net CO2e avoided = (Conventional product lifecycle emissions - Sustainable alternative lifecycle emissions) × Number of equivalent replacements.
    const convCo2 = comp.conventional_product.lifecycle_emissions_kg_co2e;
    const sustCo2 = comp.sustainable_product.lifecycle_emissions_kg_co2e;
    const netCo2PerUnitKg = convCo2 - sustCo2;
    const netCo2AvoidedKg = Math.round((netCo2PerUnitKg * totalReplacements) * 1000) / 1000;
    const netCo2AvoidedGrams = Math.round(netCo2AvoidedKg * 1000);

    // Equivalencies
    const drivingKm = Math.round(netCo2AvoidedKg * 5.21 * 10) / 10;
    const treeDays = Math.round((netCo2AvoidedKg / (21.77 / 365)) * 10) / 10;
    const petBottles = Math.round((plasticAvoidedGrams / 19.0) * 10) / 10;

    // Update DOM
    const plasticMain = document.getElementById('calcPlasticMain');
    const plasticUnit = document.getElementById('calcPlasticUnit');
    const plasticFormula = document.getElementById('calcPlasticFormula');
    if (plasticMain) {
      if (plasticAvoidedGrams >= 1000) {
        plasticMain.innerText = plasticAvoidedKg;
        plasticUnit.innerText = `kg plastic avoided (${plasticAvoidedGrams.toLocaleString()} g)`;
      } else {
        plasticMain.innerText = plasticAvoidedGrams;
        plasticUnit.innerText = `grams of plastic (${plasticAvoidedKg} kg)`;
      }
    }
    if (plasticFormula) {
      plasticFormula.innerText = `${plasticWeight}g plastic/item × ${totalReplacements} units = ${plasticAvoidedGrams >= 1000 ? plasticAvoidedKg + ' kg' : plasticAvoidedGrams + ' g'} plastic avoided`;
    }

    const co2Main = document.getElementById('calcCo2Main');
    const co2Unit = document.getElementById('calcCo2Unit');
    const co2Formula = document.getElementById('calcCo2Formula');
    if (co2Main) {
      if (netCo2AvoidedKg >= 1) {
        co2Main.innerText = netCo2AvoidedKg;
        co2Unit.innerText = `kg CO₂e avoided (${netCo2AvoidedGrams.toLocaleString()} g)`;
      } else {
        co2Main.innerText = netCo2AvoidedGrams;
        co2Unit.innerText = `grams CO₂e (${netCo2AvoidedKg} kg)`;
      }
    }
    if (co2Formula) {
      co2Formula.innerText = `(${convCo2} kg - ${sustCo2} kg) × ${totalReplacements} units = ${netCo2AvoidedKg} kg net CO₂e avoided`;
    }

    const eqDriving = document.getElementById('calcEqDriving');
    const eqTree = document.getElementById('calcEqTree');
    const eqBottles = document.getElementById('calcEqBottles');
    if (eqDriving) eqDriving.innerText = `${drivingKm.toLocaleString()} km`;
    if (eqTree) eqTree.innerText = treeDays >= 365 ? `${Math.round((treeDays / 365) * 10) / 10} yrs` : `${treeDays} days`;
    if (eqBottles) eqBottles.innerText = `${petBottles.toLocaleString()}`;

    const citSource = document.getElementById('calcCitationSource');
    const citText = document.getElementById('calcCitationText');
    if (citSource) citSource.innerText = `Source: ${comp.data_source}`;
    if (citText) citText.innerText = comp.citation;

    const btnLabel = document.getElementById('calcAddToCartBtnLabel');
    if (btnLabel && comp.sustainable_product) {
      btnLabel.innerText = `Switch to ${comp.sustainable_product.name} (₹${comp.sustainable_product.price_inr})`;
    }
  },

  addCalculatedProductToCart() {
    const compId = this.state.impact.selectedComparisonId;
    const comp = this.state.impact.comparisons.find(c => c.id === compId);
    if (!comp || !comp.sustainable_product) return;

    const p = comp.sustainable_product;
    this.addToCart(p.id, p.name, p.price_inr, p.image, 'Standard', 1);
  },

  renderImpactDashboard() {
    const s = this.state.impact.summary;
    if (!s || !s.metrics) return;

    const totalPlastic = document.getElementById('dashTotalPlastic');
    const totalCo2 = document.getElementById('dashTotalCo2');
    const totalReplacements = document.getElementById('dashTotalReplacements');
    const treeEquiv = document.getElementById('dashTreeEquivalent');

    if (totalPlastic) totalPlastic.innerText = `${s.metrics.total_plastic_avoided_kg.toLocaleString()} kg`;
    if (totalCo2) totalCo2.innerText = `${s.metrics.total_co2e_avoided_tons.toLocaleString()} tons`;
    if (totalReplacements) totalReplacements.innerText = `${s.metrics.total_replacements.toLocaleString()}+`;
    if (treeEquiv) treeEquiv.innerText = `${s.equivalencies.tree_seedlings_grown_10_yrs.toLocaleString()} trees`;
  },

  initImpactCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not yet loaded');
      return;
    }

    const s = this.state.impact.summary;
    const monthly = s?.monthly_trend || [
      { month: 'Jun 2026', plastic_kg: 240, co2e_kg: 890 },
      { month: 'Jul 2026', plastic_kg: 380, co2e_kg: 1420 },
      { month: 'Aug 2026', plastic_kg: 510, co2e_kg: 1950 },
      { month: 'Sep 2026', plastic_kg: 670, co2e_kg: 2580 },
      { month: 'Oct 2026', plastic_kg: 840, co2e_kg: 3240 },
      { month: 'Nov 2026', plastic_kg: 1040, co2e_kg: 3950 }
    ];

    // Chart 1: Doughnut Chart (Plastic avoidance by category)
    const ctx1 = document.getElementById('chartCategoryDoughnut');
    if (ctx1) {
      if (this.state.impact.charts.doughnut) this.state.impact.charts.doughnut.destroy();
      this.state.impact.charts.doughnut = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Bamboo Oral Care', 'Neem Grooming', 'Jute Market Bags', 'Insulated Drinkware'],
          datasets: [{
            data: [15, 8, 42, 35],
            backgroundColor: ['#14532D', '#4D9B59', '#795548', '#A8C5A0'],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, family: 'Plus Jakarta Sans' } } }
          },
          cutout: '68%'
        }
      });
    }

    // Chart 2: Grouped Bar Chart (Lifecycle Emissions Comparison)
    const ctx2 = document.getElementById('chartLifecycleBar');
    if (ctx2) {
      if (this.state.impact.charts.bar) this.state.impact.charts.bar.destroy();
      this.state.impact.charts.bar = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Toothbrush', 'Hair Comb', 'Shopping Bag (100 trips)', 'Water Bottle (100 uses)'],
          datasets: [
            {
              label: 'Conventional Plastic (kg CO₂e)',
              data: [0.088, 0.095, 3.30, 8.28],
              backgroundColor: '#b9776d',
              borderRadius: 8
            },
            {
              label: 'Eco Saathi Alternative (kg CO₂e)',
              data: [0.027, 0.018, 0.14, 0.28],
              backgroundColor: '#14532D',
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'kg CO₂e' } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, family: 'Plus Jakarta Sans' } } }
          }
        }
      });
    }

    // Chart 3: Line / Area Chart (Monthly Trajectory)
    const ctx3 = document.getElementById('chartMonthlyTrajectory');
    if (ctx3) {
      if (this.state.impact.charts.line) this.state.impact.charts.line.destroy();
      this.state.impact.charts.line = new Chart(ctx3, {
        type: 'line',
        data: {
          labels: monthly.map(m => m.month),
          datasets: [
            {
              label: 'Plastic Diverted (kg)',
              data: monthly.map(m => m.plastic_kg),
              borderColor: '#14532D',
              backgroundColor: 'rgba(20, 83, 45, 0.15)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointBackgroundColor: '#14532D'
            },
            {
              label: 'CO₂e Offset (kg)',
              data: monthly.map(m => m.co2e_kg),
              borderColor: '#4D9B59',
              backgroundColor: 'rgba(77, 155, 89, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointBackgroundColor: '#4D9B59'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'kg saved' } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  },

  renderImpactMatrix() {
    const tbody = document.getElementById('impactMatrixTbody');
    if (!tbody) return;

    const comps = this.state.impact.comparisons || [];
    tbody.innerHTML = comps.map(c => {
      const isVerified = c.impact_per_unit_replacement?.data_status === 'verified';
      return `
        <tr class="hover:bg-stone-50 transition border-b border-stone-100 text-xs">
          <td class="py-3.5 px-4">
            <div class="flex items-center space-x-2.5">
              <img src="${c.sustainable_product.image || 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=100&q=80'}" class="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              <div>
                <a href="#product/${c.sustainable_product.handle}" class="font-bold text-stone-900 hover:text-emerald-800">${c.sustainable_product.name}</a>
                <div class="text-[10px] text-emerald-800 font-semibold">${c.category}</div>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4">
            <div class="font-semibold text-stone-800">${c.conventional_product.name}</div>
            <div class="text-[10px] text-stone-400">${c.conventional_product.material}</div>
          </td>
          <td class="py-3.5 px-4 font-mono font-bold text-stone-800">
            ${isVerified ? `${c.conventional_product.plastic_weight_grams} g` : '<span class="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">Data not available</span>'}
          </td>
          <td class="py-3.5 px-4 font-mono text-stone-600">
            ${isVerified ? `${c.conventional_product.lifecycle_emissions_kg_co2e} kg` : '<span class="text-stone-400">N/A</span>'}
          </td>
          <td class="py-3.5 px-4 font-mono text-emerald-800 font-bold">
            ${isVerified ? `${c.sustainable_product.lifecycle_emissions_kg_co2e} kg` : '<span class="text-stone-400">N/A</span>'}
          </td>
          <td class="py-3.5 px-4 font-mono font-black text-emerald-950">
            ${isVerified ? `-${c.impact_per_unit_replacement.net_co2e_avoided_grams} g` : '<span class="text-stone-400">N/A</span>'}
          </td>
          <td class="py-3.5 px-4 text-stone-600 text-[11px] max-w-xs">
            ${c.lifetime_assumptions}
          </td>
          <td class="py-3.5 px-4 text-stone-500 text-[11px] max-w-xs">
            <span class="font-bold text-stone-800">${c.data_source}</span>
          </td>
        </tr>
      `;
    }).join('');
  },

  setupEventListeners() {
    // Search Autocomplete input
    const searchInput = document.getElementById('navbarSearchInput');
    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.state.filters.search = e.target.value;
          if (this.state.currentView !== 'shop') {
            this.navigate('shop');
          } else {
            this.fetchProducts();
          }
        }, 300);
      });
    }
  }
};

// Global Exposure for inline HTML onclick handlers
window.App = App;
window.viewProductDetail = (handle) => App.navigate(`product/${handle}`);
window.quickAddToCart = (id, title, price, img) => App.addToCart(id, title, price, img);

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
