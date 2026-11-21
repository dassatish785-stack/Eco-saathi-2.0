// Eco Saathi 2.0 - AI Shopping Assistant Engine ("Saathi AI")
const { getDb } = require('./db.js');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Load approved knowledge base
const kbPath = path.join(__dirname, 'knowledge_base.json');
let knowledgeBase = {};
try {
  knowledgeBase = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
} catch (e) {
  console.error('Error loading knowledge base:', e);
}

// Session rate limiting in-memory store
const sessionRateLimits = new Map();

function checkRateLimit(sessionId) {
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxRequests = 20;

  let record = sessionRateLimits.get(sessionId);
  if (!record) {
    record = { count: 1, resetAt: now + limitWindow };
    sessionRateLimits.set(sessionId, record);
    return true;
  }

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + limitWindow;
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Tool 1: search_products
function searchProductsTool({ query = '', material = '', category = '', maxPrice = null, limit = 4 }) {
  const db = getDb();
  let sql = `
    SELECT p.*, c1.name as material_name, c2.name as use_category_name,
           (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    JOIN categories c1 ON p.material_id = c1.id
    JOIN categories c2 ON p.use_category_id = c2.id
    WHERE 1=1
  `;
  const params = [];

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR c1.name LIKE ? OR c2.name LIKE ?)`;
    params.push(q, q, q, q);
  }

  if (material) {
    sql += ` AND (c1.slug = ? OR c1.id = ?)`;
    params.push(material, material);
  }

  if (category) {
    sql += ` AND (c2.slug = ? OR c2.id = ?)`;
    params.push(category, category);
  }

  if (maxPrice && !isNaN(maxPrice)) {
    sql += ` AND p.price <= ?`;
    params.push(parseFloat(maxPrice));
  }

  sql += ` ORDER BY p.featured DESC, p.rating DESC LIMIT ?`;
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    handle: r.handle,
    price: r.price,
    mrp: r.compare_at_price,
    material: r.material_name,
    category: r.use_category_name,
    stock: r.stock,
    ecoBadge: r.eco_impact_badge,
    image: r.primary_image || 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=400&q=80',
    rating: r.rating
  }));
}

// Tool 2: get_product_details
function getProductDetailsTool({ handle_or_id }) {
  const db = getDb();
  const prod = db.prepare(`
    SELECT p.*, c1.name as material_name, c2.name as use_category_name,
           (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    JOIN categories c1 ON p.material_id = c1.id
    JOIN categories c2 ON p.use_category_id = c2.id
    WHERE p.id = ? OR p.handle = ?
  `).get(handle_or_id, handle_or_id);

  if (!prod) return null;

  const variants = db.prepare(`SELECT * FROM product_variants WHERE product_id = ?`).all(prod.id);
  const images = db.prepare(`SELECT url, alt_text FROM product_images WHERE product_id = ?`).all(prod.id);

  return {
    ...prod,
    variants,
    images
  };
}

// Tool 3: check_pincode
function checkPincodeTool({ pincode }) {
  const db = getDb();
  const cleanPin = (pincode || '').toString().trim();
  const pinRecord = db.prepare(`SELECT * FROM pincodes WHERE pincode = ?`).get(cleanPin);

  if (pinRecord) {
    return {
      pincode: pinRecord.pincode,
      city: pinRecord.city,
      state: pinRecord.state,
      serviceable: !!pinRecord.serviceable,
      codAvailable: !!pinRecord.cod_available,
      estimatedDeliveryDays: pinRecord.delivery_days,
      freeShippingThreshold: knowledgeBase.shipping_policy.free_threshold
    };
  }

  // Default Pan-India coverage for other 6-digit Indian pincodes
  if (/^[1-9][0-9]{5}$/.test(cleanPin)) {
    const isOdisha = cleanPin.startsWith('75') || cleanPin.startsWith('76');
    return {
      pincode: cleanPin,
      city: isOdisha ? 'Odisha Region' : 'India Destination',
      state: isOdisha ? 'Odisha' : 'India',
      serviceable: true,
      codAvailable: true,
      estimatedDeliveryDays: isOdisha ? 2 : 4,
      freeShippingThreshold: knowledgeBase.shipping_policy.free_threshold
    };
  }

  return {
    pincode: cleanPin,
    serviceable: false,
    message: 'Invalid 6-digit Indian postal pincode. Please enter a valid PIN.'
  };
}

// Tool 4: get_order_status
function getOrderStatusTool({ order_number, phone_or_email }) {
  const db = getDb();
  const order = db.prepare(`
    SELECT * FROM orders WHERE order_number = ? OR id = ?
  `).get(order_number, order_number);

  if (!order) {
    return {
      found: false,
      message: `No order found matching "${order_number}". Please check your order ID from your confirmation email/WhatsApp.`
    };
  }

  // Verification step for security (PRD FR-18)
  if (phone_or_email) {
    const term = phone_or_email.trim().toLowerCase();
    const phoneMatch = order.customer_phone.includes(term);
    const emailMatch = order.customer_email.toLowerCase().includes(term);
    if (!phoneMatch && !emailMatch) {
      return {
        found: true,
        verified: false,
        message: 'Order number found, but the phone or email does not match our records for security. Please provide the contact information used during checkout.'
      };
    }
  }

  let items = [];
  try { items = JSON.parse(order.items); } catch(e) {}

  return {
    found: true,
    verified: true,
    orderNumber: order.order_number,
    status: order.order_status,
    total: order.total,
    itemCount: items.length,
    courier: order.courier_name,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    createdAt: order.created_at
  };
}

// Tool 5: create_handoff
function createHandoffTool({ session_id, contact, reason, summary }) {
  const db = getDb();
  const ticketId = 'tic_' + crypto.randomBytes(6).toString('hex');

  db.prepare(`
    INSERT INTO handoff_tickets (id, session_id, customer_contact, reason, summary, status)
    VALUES (?, ?, ?, ?, ?, 'open')
  `).run(ticketId, session_id || 'session_web', contact || 'Not provided', reason || 'Customer requested human assistance', summary || 'Chat handoff requested');

  return {
    ticketId,
    status: 'transferred',
    whatsappNumber: knowledgeBase.brand.whatsapp,
    whatsappUrl: `https://wa.me/919437012345?text=${encodeURIComponent(`Hi Eco Saathi Support team, I need assistance regarding Ticket #${ticketId}. Summary: ${summary || reason}`)}`,
    supportHours: knowledgeBase.brand.hours
  };
}

// Built-in Intelligent Dialogue Engine
async function processAssistantMessage({ sessionId, message, customerContext = {} }) {
  const db = getDb();

  // Rate limit check
  if (!checkRateLimit(sessionId)) {
    return {
      text: "You are sending messages too quickly. Please wait a moment before sending another message.",
      productCards: [],
      toolCalls: []
    };
  }

  const rawMsg = (message || '').trim();
  const lowerMsg = rawMsg.toLowerCase();

  // Ensure chat session exists
  db.prepare(`
    INSERT OR IGNORE INTO chat_sessions (id, status, created_at)
    VALUES (?, 'active', datetime('now'))
  `).run(sessionId);

  // Save user message to database
  const userMsgId = 'msg_' + crypto.randomBytes(8).toString('hex');
  db.prepare(`
    INSERT INTO chat_messages (id, session_id, sender, message, tool_calls)
    VALUES (?, ?, 'user', ?, null)
  `).run(userMsgId, sessionId, rawMsg);

  let replyText = '';
  let productCards = [];
  let toolCalls = [];

  // Check 1: Hand-off request (PRD FR-19)
  if (
    lowerMsg.includes('human') ||
    lowerMsg.includes('person') ||
    lowerMsg.includes('agent') ||
    lowerMsg.includes('representative') ||
    lowerMsg.includes('whatsapp') ||
    lowerMsg.includes('speak to') ||
    lowerMsg.includes('call me') ||
    lowerMsg.includes('complaint') ||
    lowerMsg.includes('damaged') ||
    lowerMsg.includes('refund dispute')
  ) {
    const handoff = createHandoffTool({
      session_id: sessionId,
      contact: customerContext.phone || customerContext.email || 'Web Chat Visitor',
      reason: 'User requested human support or reported an issue',
      summary: rawMsg
    });

    toolCalls.push({ name: 'create_handoff', result: handoff });
    replyText = `I have created a priority support ticket (**#${handoff.ticketId}**) for our Bhubaneswar team.\n\nYou can connect directly with our support specialists on WhatsApp right now or wait for our reply during working hours (${handoff.supportHours}):\n\n👉 [**Chat with our Human Support on WhatsApp**](${handoff.whatsappUrl})`;

    // Save assistant reply
    saveAssistantMessage(sessionId, replyText, toolCalls);
    return { text: replyText, productCards: [], toolCalls };
  }

  // Check 2: Order status lookup (PRD FR-18)
  const orderMatch = rawMsg.match(/eco[-_\s]?\d{4}[-_\s]?\d+/i) || rawMsg.match(/#?(\d{4,8})/);
  if (lowerMsg.includes('order') || lowerMsg.includes('track') || lowerMsg.includes('status') || orderMatch) {
    let orderNum = orderMatch ? orderMatch[0].replace(/\s+/g, '-').toUpperCase() : null;
    if (orderNum && !orderNum.startsWith('ECO')) {
      orderNum = 'ECO-2026-' + orderNum.replace('#', '');
    }

    if (orderNum) {
      const orderRes = getOrderStatusTool({
        order_number: orderNum,
        phone_or_email: customerContext.phone || customerContext.email || null
      });
      toolCalls.push({ name: 'get_order_status', args: { order_number: orderNum }, result: orderRes });

      if (orderRes.found) {
        replyText = `📦 **Order Status for ${orderRes.orderNumber}**:\n\n` +
          `• **Current Status**: **${orderRes.status.toUpperCase()}**\n` +
          `• **Total**: ₹${orderRes.total}\n` +
          `• **Courier Partner**: ${orderRes.courier || 'Shiprocket / Delhivery'}\n` +
          (orderRes.trackingNumber ? `• **Tracking Number**: \`${orderRes.trackingNumber}\`\n` : '') +
          (orderRes.trackingUrl ? `• **Live Courier Link**: [Track Shipment on Courier Portal](${orderRes.trackingUrl})\n\n` : '\n') +
          `Need help with this delivery? Type "Talk to a person" to message our support team on WhatsApp.`;
        saveAssistantMessage(sessionId, replyText, toolCalls);
        return { text: replyText, productCards: [], toolCalls };
      } else {
        replyText = `I couldn't locate an order with number **${orderNum}**.\n\nPlease check your confirmation SMS/email or enter your registered phone number so I can look it up!`;
        saveAssistantMessage(sessionId, replyText, toolCalls);
        return { text: replyText, productCards: [], toolCalls };
      }
    } else {
      replyText = `I would love to help you track your parcel! 🚚\n\nPlease share your **Order Number** (e.g. \`ECO-2026-8941\`) and registered phone number.`;
      saveAssistantMessage(sessionId, replyText, toolCalls);
      return { text: replyText, productCards: [], toolCalls };
    }
  }

  // Check 3: Pincode serviceability & delivery check (PRD FR-11)
  const pinMatch = rawMsg.match(/\b([1-9][0-9]{5})\b/);
  if (lowerMsg.includes('pincode') || lowerMsg.includes('pin code') || lowerMsg.includes('delivery time') || lowerMsg.includes('deliver to') || pinMatch) {
    const pin = pinMatch ? pinMatch[1] : null;
    if (pin) {
      const pinRes = checkPincodeTool({ pincode: pin });
      toolCalls.push({ name: 'check_pincode', args: { pincode: pin }, result: pinRes });

      if (pinRes.serviceable) {
        replyText = `✅ **Great news! Pincode ${pinRes.pincode} (${pinRes.city}, ${pinRes.state}) is fully serviceable!**\n\n` +
          `• **Estimated Delivery**: ${pinRes.estimatedDeliveryDays} business days directly from our Bhubaneswar workshop.\n` +
          `• **Cash on Delivery (COD)**: ${pinRes.codAvailable ? 'Available' : 'Prepaid only'}\n` +
          `• **Free Shipping**: Available on all orders over ₹${pinRes.freeShippingThreshold} (Standard shipping is ₹60 for smaller orders).`;
      } else {
        replyText = `Sorry, pincode **${pin}** could not be verified. We ship to over 19,000+ Indian pin codes via Shiprocket and Delhivery. Please double check the 6 digits.`;
      }
      saveAssistantMessage(sessionId, replyText, toolCalls);
      return { text: replyText, productCards: [], toolCalls };
    }
  }

  // Check 4: Shipping & Delivery Questions (PRD FR-17)
  if (lowerMsg.includes('shipping') || lowerMsg.includes('delivery charge') || lowerMsg.includes('free ship') || lowerMsg.includes('how long')) {
    replyText = `🚚 **Shipping Policy Summary**:\n\n` +
      `• **Free Shipping**: On all orders over **₹${knowledgeBase.shipping_policy.free_threshold}** across India.\n` +
      `• **Standard Shipping**: Flat ₹${knowledgeBase.shipping_policy.standard_charge} for orders under ₹499.\n` +
      `• **Delivery Timelines**:\n` +
      `   - Inside Odisha: 1 to 2 business days\n` +
      `   - Metro Cities: 2 to 3 business days\n` +
      `   - Rest of India: 3 to 5 business days\n` +
      `• **Delivery Partners**: ${knowledgeBase.shipping_policy.shipping_partners.join(', ')}.\n` +
      `• **Cash on Delivery**: Available across all serviceable Indian pincodes!`;
    saveAssistantMessage(sessionId, replyText, toolCalls);
    return { text: replyText, productCards: [], toolCalls };
  }

  // Check 5: Returns & Refunds Policy Questions (PRD FR-17)
  if (lowerMsg.includes('return') || lowerMsg.includes('refund') || lowerMsg.includes('exchange') || lowerMsg.includes('cancel')) {
    replyText = `🌿 **Eco Saathi Return & Refund Policy**:\n\n` +
      `• **7-Day Window**: You can request a return within 7 days of delivery for damaged, defective, or incorrect items.\n` +
      `• **Hygiene Policy**: Due to natural health and sanitation standards, oral care items (toothbrushes, tongue cleaners) cannot be returned once unsealed unless damaged in transit.\n` +
      `• **Hassle-free Pickup**: Free return courier pickup is booked at your doorstep.\n` +
      `• **Prompt Refund**: Processed within 48 hours of item receipt directly to your original payment method or bank account for COD.`;
    saveAssistantMessage(sessionId, replyText, toolCalls);
    return { text: replyText, productCards: [], toolCalls };
  }

  // Check 6: Materials & Care questions (PRD FR-17)
  if (lowerMsg.includes('bamboo') || lowerMsg.includes('sabai') || lowerMsg.includes('neem') || lowerMsg.includes('jute') || lowerMsg.includes('care') || lowerMsg.includes('material')) {
    let careMatch = null;
    for (const m of knowledgeBase.materials_and_care) {
      if (lowerMsg.includes(m.material.toLowerCase().split(' ')[0])) {
        careMatch = m;
        break;
      }
    }

    if (careMatch) {
      replyText = `🍃 **${careMatch.material} Craft & Care Guide**:\n\n` +
        `• **Origin**: ${careMatch.origin}\n` +
        `• **Key Benefits**: ${careMatch.benefits}\n` +
        `• **Care Instructions**: ${careMatch.care}\n\n` +
        `Would you like me to recommend our best-selling ${careMatch.material} items?`;

      // Fetch top 3 items of this material
      const items = searchProductsTool({ query: careMatch.material.split(' ')[0], limit: 3 });
      productCards = items;
      toolCalls.push({ name: 'search_products', args: { query: careMatch.material.split(' ')[0] }, count: items.length });

      saveAssistantMessage(sessionId, replyText, toolCalls);
      return { text: replyText, productCards, toolCalls };
    }
  }

  // Check 7: Corporate Gifting & Bulk enquiries (PRD FR-27)
  if (lowerMsg.includes('corporate') || lowerMsg.includes('bulk') || lowerMsg.includes('wholesale') || lowerMsg.includes('hamper') || lowerMsg.includes('custom logo')) {
    replyText = `🎁 **Eco Saathi Corporate & Bulk Gifting**:\n\n` +
      `We create customized sustainable gifts for corporate milestones, Diwali, employee kits, and conferences with:\n` +
      `• **Laser Logo Engraving**: On authentic bamboo flasks, desk docks & pens\n` +
      `• **Discounts**: 15% to 35% tier discounts based on quantity (MOQ: 25)\n` +
      `• **GST Input Tax Credit**: Full GST compliance with your company GSTIN\n` +
      `• **Presentation**: Handwoven Mayurbhanj Sabai grass keepsake boxes\n\n` +
      `Would you like to browse our corporate hampers below or fill our 1-minute quote request form on the Corporate Gifting page?`;

    productCards = searchProductsTool({ category: 'use_gifting', limit: 3 });
    saveAssistantMessage(sessionId, replyText, toolCalls);
    return { text: replyText, productCards, toolCalls };
  }

  // Check 8: Product Discovery / Recommendation (PRD FR-16)
  let budget = null;
  const budgetMatch = rawMsg.match(/(?:under|below|budget of|within|less than)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) || rawMsg.match(/(\d+)\s*(?:rs|rupees|inr|bucks)/i);
  if (budgetMatch) {
    budget = parseFloat(budgetMatch[1]);
  }

  let searchCategory = '';
  let searchMaterial = '';
  let searchQ = '';

  if (lowerMsg.includes('kitchen') || lowerMsg.includes('cook') || lowerMsg.includes('spatula') || lowerMsg.includes('roti')) {
    searchCategory = 'use_kitchen';
  } else if (lowerMsg.includes('oral') || lowerMsg.includes('tooth') || lowerMsg.includes('brush')) {
    searchCategory = 'use_oral';
  } else if (lowerMsg.includes('home') || lowerMsg.includes('decor') || lowerMsg.includes('basket') || lowerMsg.includes('planter')) {
    searchCategory = 'use_home';
  } else if (lowerMsg.includes('gift') || lowerMsg.includes('hamper') || lowerMsg.includes('birthday') || lowerMsg.includes('festival')) {
    searchCategory = 'use_gifting';
  } else if (lowerMsg.includes('comb') || lowerMsg.includes('hair') || lowerMsg.includes('loofah') || lowerMsg.includes('personal') || lowerMsg.includes('skin')) {
    searchCategory = 'use_personal';
  }

  if (lowerMsg.includes('bamboo')) searchMaterial = 'mat_bamboo';
  else if (lowerMsg.includes('sabai')) searchMaterial = 'mat_sabai';
  else if (lowerMsg.includes('neem')) searchMaterial = 'mat_neem';
  else if (lowerMsg.includes('jute')) searchMaterial = 'mat_jute';
  else if (lowerMsg.includes('candle') || lowerMsg.includes('organic')) searchMaterial = 'mat_organic';

  // Extract core keywords if not covered
  if (!searchCategory && !searchMaterial) {
    const cleanWords = lowerMsg.replace(/recommend|show|find|suggest|me|some|the|best|items|products|sustainable|eco|friendly|plastic|free/g, '').trim();
    if (cleanWords.length > 2) {
      searchQ = cleanWords;
    }
  }

  const results = searchProductsTool({
    query: searchQ,
    category: searchCategory,
    material: searchMaterial,
    maxPrice: budget,
    limit: 3
  });

  toolCalls.push({
    name: 'search_products',
    args: { query: searchQ, category: searchCategory, material: searchMaterial, maxPrice: budget },
    count: results.length
  });

  if (results.length > 0) {
    replyText = `Here are my top handcrafted recommendations based on your preferences${budget ? ` within ₹${budget}` : ''}:\n\n` +
      `Each item is 100% plastic-free and directly supports artisan clusters across Odisha. You can add them straight to your cart below!`;
    productCards = results;
  } else {
    // Fallback search
    const popularItems = searchProductsTool({ limit: 3 });
    replyText = `I couldn't find an exact match for "${rawMsg}" within those constraints, but here are our most popular artisan creations:`;
    productCards = popularItems;
  }

  saveAssistantMessage(sessionId, replyText, toolCalls);
  return { text: replyText, productCards, toolCalls };
}

function saveAssistantMessage(sessionId, message, toolCalls) {
  const db = getDb();
  const id = 'msg_' + crypto.randomBytes(8).toString('hex');
  db.prepare(`
    INSERT INTO chat_messages (id, session_id, sender, message, tool_calls)
    VALUES (?, ?, 'assistant', ?, ?)
  `).run(id, sessionId, message, JSON.stringify(toolCalls || []));
}

module.exports = {
  processAssistantMessage,
  searchProductsTool,
  getProductDetailsTool,
  checkPincodeTool,
  getOrderStatusTool,
  createHandoffTool,
  knowledgeBase
};
