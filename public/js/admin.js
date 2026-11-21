// Eco Saathi 2.0 - Staff & Owner Administration Dashboard Logic
const AdminApp = {
  state: {
    activeTab: 'overview',
    metrics: {},
    orders: [],
    products: [],
    leads: [],
    chatSessions: [],
    handoffTickets: [],
    reviews: []
  },

  async init() {
    this.setupTabs();
    await this.fetchMetrics();
    await this.fetchOrders();
    await this.fetchProducts();
    await this.fetchLeads();
    await this.fetchChatLogs();
    await this.fetchReviews();
  },

  setupTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });
  },

  switchTab(tabId) {
    this.state.activeTab = tabId;
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
      if (b.getAttribute('data-tab') === tabId) {
        b.className = 'admin-tab-btn flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-xs transition';
      } else {
        b.className = 'admin-tab-btn flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold text-xs transition';
      }
    });

    document.querySelectorAll('.admin-view-panel').forEach(p => p.classList.add('hidden'));
    const activePanel = document.getElementById(`panel_${tabId}`);
    if (activePanel) activePanel.classList.remove('hidden');
  },

  async fetchMetrics() {
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      this.state.metrics = data.metrics || {};

      document.getElementById('mTotalRevenue').innerText = `₹${(data.metrics.totalSales || 0).toLocaleString('en-IN')}`;
      document.getElementById('mTotalOrders').innerText = data.metrics.orderCount || 0;
      document.getElementById('mConversionRate').innerText = data.metrics.conversionRate || '3.4%';
      document.getElementById('mAiResolution').innerText = data.metrics.aiResolutionRate || '78%';
      document.getElementById('mActiveLeads').innerText = data.metrics.leadsCount || 0;
      document.getElementById('mLowStock').innerText = data.metrics.lowStockCount || 0;

      // Render recent orders table
      const tbody = document.getElementById('recentOrdersTbody');
      if (tbody && data.recentOrders) {
        tbody.innerHTML = data.recentOrders.map(o => `
          <tr class="border-b border-stone-100 hover:bg-stone-50">
            <td class="py-3 px-4 font-bold text-emerald-950">${o.order_number}</td>
            <td class="py-3 px-4">${o.customer_name}</td>
            <td class="py-3 px-4 font-semibold">₹${o.total}</td>
            <td class="py-3 px-4"><span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">${o.order_status}</span></td>
            <td class="py-3 px-4 text-stone-400 text-xs">${new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        `).join('');
      }
    } catch(e) {
      console.error(e);
    }
  },

  async fetchOrders() {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      this.state.orders = data.orders || [];
      this.renderOrdersTable();
    } catch(e) {
      console.error(e);
    }
  },

  renderOrdersTable() {
    const tbody = document.getElementById('allOrdersTbody');
    if (!tbody) return;

    tbody.innerHTML = this.state.orders.map(o => `
      <tr class="border-b border-stone-200 text-xs hover:bg-stone-50">
        <td class="py-3 px-4 font-bold text-stone-900">${o.order_number}</td>
        <td class="py-3 px-4">
          <div class="font-semibold text-stone-800">${o.customer_name}</div>
          <div class="text-stone-400 text-[11px]">${o.customer_phone}</div>
        </td>
        <td class="py-3 px-4">
          <span class="text-stone-600">${o.items ? o.items.length : 0} items</span>
        </td>
        <td class="py-3 px-4 font-bold text-emerald-950">₹${o.total}</td>
        <td class="py-3 px-4">
          <span class="bg-stone-100 font-semibold text-stone-700 px-2 py-0.5 rounded text-[10px] uppercase">${o.payment_method}</span>
        </td>
        <td class="py-3 px-4">
          <select onchange="AdminApp.updateOrderStatus('${o.id}', this.value)" class="text-xs p-1.5 border border-stone-300 rounded-lg bg-white font-semibold">
            <option value="confirmed" ${o.order_status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Packing / Processing</option>
            <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td class="py-3 px-4">
          <input
            type="text"
            value="${o.tracking_number || ''}"
            placeholder="Shiprocket AWBN..."
            class="p-1 border border-stone-200 rounded text-[11px] w-28"
            onblur="AdminApp.updateTracking('${o.id}', this.value)"
          />
        </td>
      </tr>
    `).join('');
  },

  async updateOrderStatus(orderId, status) {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      alert(`Order updated to ${status}. Customer notification triggered.`);
      this.fetchOrders();
    } catch(e) {}
  },

  async updateTracking(orderId, tracking_number) {
    if (!tracking_number) return;
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_number, courier_name: 'Shiprocket / Delhivery' })
      });
    } catch(e) {}
  },

  async fetchProducts() {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      this.state.products = data.products || [];
      this.renderProductsTable();
    } catch(e) {
      console.error(e);
    }
  },

  renderProductsTable() {
    const tbody = document.getElementById('allProductsTbody');
    if (!tbody) return;

    tbody.innerHTML = this.state.products.map(p => `
      <tr class="border-b border-stone-200 text-xs hover:bg-stone-50">
        <td class="py-3 px-4">
          <div class="flex items-center space-x-2.5">
            <img src="${p.primary_image || 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=100&q=80'}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div>
              <div class="font-bold text-stone-900">${p.title}</div>
              <div class="text-[10px] text-stone-400">SKU: ${p.sku}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-4"><span class="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">${p.material_name}</span></td>
        <td class="py-3 px-4 text-stone-600">${p.use_category_name}</td>
        <td class="py-3 px-4 font-bold text-emerald-950">₹${p.price}</td>
        <td class="py-3 px-4">
          <span class="${p.stock < 25 ? 'text-amber-600 font-bold' : 'text-stone-700'}">${p.stock} in stock</span>
        </td>
        <td class="py-3 px-4 text-amber-500 font-semibold">★ ${p.rating || 4.9} (${p.reviews_count})</td>
      </tr>
    `).join('');
  },

  async createNewProduct(e) {
    e.preventDefault();
    const title = document.getElementById('npTitle').value;
    const material_id = document.getElementById('npMaterial').value;
    const use_category_id = document.getElementById('npCategory').value;
    const price = document.getElementById('npPrice').value;
    const stock = document.getElementById('npStock').value;
    const sku = document.getElementById('npSku').value;
    const image_url = document.getElementById('npImage').value;
    const description = document.getElementById('npDesc').value;

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, material_id, use_category_id, price, stock, sku, image_url, description })
      });
      const data = await res.json();
      if (data.success) {
        alert('New sustainable product published successfully!');
        document.getElementById('addProductModal').classList.add('hidden');
        document.getElementById('addProductForm').reset();
        this.fetchProducts();
      }
    } catch(err) {
      alert('Error creating product');
    }
  },

  async fetchLeads() {
    try {
      const res = await fetch('/api/admin/corporate-leads');
      const data = await res.json();
      this.state.leads = data.leads || [];
      this.renderLeadsTable();
    } catch(e) {
      console.error(e);
    }
  },

  renderLeadsTable() {
    const tbody = document.getElementById('allLeadsTbody');
    if (!tbody) return;

    tbody.innerHTML = this.state.leads.map(l => `
      <tr class="border-b border-stone-200 text-xs hover:bg-stone-50">
        <td class="py-3 px-4 font-bold text-stone-900">${l.company_name}</td>
        <td class="py-3 px-4">
          <div class="font-semibold">${l.contact_person}</div>
          <div class="text-[11px] text-stone-400">${l.phone} · ${l.email}</div>
        </td>
        <td class="py-3 px-4 font-bold">${l.quantity} hampers</td>
        <td class="py-3 px-4 text-emerald-950 font-bold">₹${(l.quote_amount || 0).toLocaleString('en-IN')}</td>
        <td class="py-3 px-4">
          <select onchange="AdminApp.updateLeadStatus('${l.id}', this.value)" class="text-xs p-1.5 border border-stone-300 rounded-lg">
            <option value="new" ${l.status === 'new' ? 'selected' : ''}>New Lead</option>
            <option value="contacted" ${l.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="quote_sent" ${l.status === 'quote_sent' ? 'selected' : ''}>Quote Sent</option>
            <option value="approved" ${l.status === 'approved' ? 'selected' : ''}>Approved / Won</option>
            <option value="closed" ${l.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
        <td class="py-3 px-4 text-stone-600 max-w-xs truncate">${l.customization_notes || 'Standard Hamper'}</td>
      </tr>
    `).join('');
  },

  async updateLeadStatus(id, status) {
    await fetch(`/api/admin/corporate-leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  async fetchChatLogs() {
    try {
      const res = await fetch('/api/admin/chat-logs');
      const data = await res.json();
      this.state.chatSessions = data.sessions || [];
      this.state.handoffTickets = data.tickets || [];

      // Render handoff tickets
      const ticketsContainer = document.getElementById('handoffTicketsContainer');
      if (ticketsContainer) {
        ticketsContainer.innerHTML = this.state.handoffTickets.map(t => `
          <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between text-xs">
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-bold text-emerald-900">${t.id}</span>
                <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">${t.status}</span>
              </div>
              <p class="text-stone-700 mt-1">${t.summary}</p>
              <span class="text-[10px] text-stone-400">Contact: ${t.customer_contact} · ${new Date(t.created_at).toLocaleTimeString('en-IN')}</span>
            </div>
            <a href="https://wa.me/919437012345" target="_blank" class="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3 py-1.5 rounded-xl">
              Open WhatsApp
            </a>
          </div>
        `).join('');
      }
    } catch(e) {}
  },

  async fetchReviews() {
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      this.state.reviews = data.reviews || [];

      const rList = document.getElementById('adminReviewsList');
      if (rList) {
        rList.innerHTML = this.state.reviews.map(r => `
          <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex items-start justify-between text-xs">
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-bold text-stone-900">${r.customer_name}</span>
                <span class="text-amber-500 font-bold">★ ${r.rating}</span>
                <span class="text-stone-500">for <strong class="text-emerald-900">${r.product_title}</strong></span>
              </div>
              <p class="text-stone-700 mt-1">${r.comment}</p>
            </div>
            <div class="flex space-x-1.5">
              <button onclick="AdminApp.moderateReview('${r.id}', 'approved')" class="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold px-2.5 py-1 rounded-lg">Approve</button>
              <button onclick="AdminApp.moderateReview('${r.id}', 'rejected')" class="bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold px-2.5 py-1 rounded-lg">Reject</button>
            </div>
          </div>
        `).join('');
      }
    } catch(e) {}
  },

  async moderateReview(id, status) {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    this.fetchReviews();
  }
};

window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
