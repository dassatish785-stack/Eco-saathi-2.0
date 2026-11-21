// Eco Saathi 2.0 - Database Module (node:sqlite)
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, 'ecosaathi.db');
let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

function initDatabase() {
  const db = getDb();

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL, -- 'material' or 'use'
      description TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      material_id TEXT NOT NULL REFERENCES categories(id),
      use_category_id TEXT NOT NULL REFERENCES categories(id),
      price REAL NOT NULL,
      compare_at_price REAL,
      stock INTEGER NOT NULL DEFAULT 20,
      sku TEXT NOT NULL UNIQUE,
      weight_grams INTEGER DEFAULT 150,
      hsn_code TEXT DEFAULT '44219990',
      eco_impact_badge TEXT,
      plastic_saved_desc TEXT,
      care_instructions TEXT,
      craft_origin TEXT DEFAULT 'Bhubaneswar, Odisha',
      featured INTEGER DEFAULT 0,
      bestseller INTEGER DEFAULT 0,
      rating REAL DEFAULT 4.8,
      reviews_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      alt_text TEXT,
      is_primary INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      customer_city TEXT DEFAULT 'Bhubaneswar',
      rating INTEGER NOT NULL,
      title TEXT,
      comment TEXT NOT NULL,
      status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
      verified_purchase INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      role TEXT DEFAULT 'customer', -- 'customer', 'support', 'staff', 'owner'
      password_hash TEXT,
      whatsapp_consent INTEGER DEFAULT 0,
      email_consent INTEGER DEFAULT 0,
      consent_updated_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      coupon_code TEXT,
      shipping_fee REAL DEFAULT 0,
      tax_gst REAL NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'paid',
      payment_gateway_ref TEXT,
      order_status TEXT NOT NULL DEFAULT 'confirmed',
      courier_name TEXT,
      tracking_number TEXT,
      tracking_url TEXT,
      whatsapp_updates INTEGER DEFAULT 1,
      email_updates INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS corporate_leads (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      budget_per_hamper REAL,
      required_date TEXT,
      product_interests TEXT,
      customization_notes TEXT,
      status TEXT DEFAULT 'new',
      quote_amount REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_name TEXT,
      status TEXT DEFAULT 'active',
      rating INTEGER,
      feedback_comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      tool_calls TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS handoff_tickets (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      customer_contact TEXT,
      reason TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consent_logs (
      id TEXT PRIMARY KEY,
      customer_contact TEXT NOT NULL,
      channel TEXT NOT NULL,
      action TEXT NOT NULL,
      source TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pincodes (
      pincode TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      serviceable INTEGER DEFAULT 1,
      cod_available INTEGER DEFAULT 1,
      delivery_days INTEGER DEFAULT 3
    );

    CREATE TABLE IF NOT EXISTS impact_factors (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      conventional_name TEXT NOT NULL,
      conventional_material TEXT NOT NULL,
      conventional_plastic_weight_grams REAL,
      conventional_co2e_kg REAL,
      sustainable_product_id TEXT REFERENCES products(id),
      sustainable_name TEXT NOT NULL,
      sustainable_material TEXT NOT NULL,
      sustainable_co2e_kg REAL,
      expected_lifespan_days INTEGER,
      lifetime_assumptions TEXT,
      plastic_avoided_per_unit_grams REAL,
      net_co2e_avoided_per_unit_kg REAL,
      data_status TEXT DEFAULT 'verified',
      data_source TEXT NOT NULL,
      citation TEXT NOT NULL,
      unit_of_measurement TEXT NOT NULL,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS customer_impact_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      comparison_id TEXT,
      quantity_replaced INTEGER NOT NULL,
      plastic_saved_grams REAL NOT NULL,
      co2e_saved_kg REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for high performance search and lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_material ON products(material_id);
    CREATE INDEX IF NOT EXISTS idx_products_use ON products(use_category_id);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_phone, customer_email);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status);
    CREATE INDEX IF NOT EXISTS idx_impact_prod ON impact_factors(sustainable_product_id);
  `);

  seedData(db);
  seedImpactFactors(db);
  console.log('Database initialized and verified successfully.');
}

function seedImpactFactors(db) {
  try {
    const existing = db.prepare('SELECT COUNT(*) as count FROM impact_factors').get();
    if (existing && existing.count > 0) return;

    const dataFile = path.join(__dirname, 'impact_data.json');
    if (!fs.existsSync(dataFile)) return;

    const raw = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const comparisons = raw.comparisons || [];

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO impact_factors (
        id, category, conventional_name, conventional_material,
        conventional_plastic_weight_grams, conventional_co2e_kg,
        sustainable_product_id, sustainable_name, sustainable_material,
        sustainable_co2e_kg, expected_lifespan_days, lifetime_assumptions,
        plastic_avoided_per_unit_grams, net_co2e_avoided_per_unit_kg,
        data_status, data_source, citation, unit_of_measurement, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of comparisons) {
      insertStmt.run(
        c.id,
        c.category,
        c.conventional_product.name,
        c.conventional_product.material,
        c.conventional_product.plastic_weight_grams,
        c.conventional_product.lifecycle_emissions_kg_co2e,
        c.sustainable_product.id,
        c.sustainable_product.name,
        c.sustainable_product.material,
        c.sustainable_product.lifecycle_emissions_kg_co2e,
        c.sustainable_product.expected_lifespan_days,
        c.lifetime_assumptions,
        c.impact_per_unit_replacement.plastic_avoided_grams,
        c.impact_per_unit_replacement.net_co2e_avoided_kg,
        c.impact_per_unit_replacement.data_status,
        c.data_source,
        c.citation,
        c.unit_of_measurement,
        c.sustainable_product.image
      );
    }
    console.log(`Seeded ${comparisons.length} impact factor benchmarks from impact_data.json.`);
  } catch (err) {
    console.error('Error seeding impact factors:', err);
  }
}

function seedData(db) {
  // Check if categories exist
  const existingCat = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (existingCat.count > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial categories, products, and mock data...');

  // 1. Seed Categories (Material-based and Use-based)
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, type, description, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const categories = [
    // Use-based categories (PRD FR-01)
    ['use_oral', 'Oral Care', 'oral-care', 'use', 'Natural bamboo toothbrushes, copper cleaners and organic tooth powders', 'fa-tooth'],
    ['use_kitchen', 'Kitchen & Dining', 'kitchen', 'use', 'Neem wood cookware, coconut bowls, bamboo cutlery and reusable wraps', 'fa-utensils'],
    ['use_home', 'Home Decor & Living', 'home-decor', 'use', 'Handwoven Mayurbhanj Sabai grass baskets, planters, and jute organizers', 'fa-couch'],
    ['use_gifting', 'Eco Gifting & Hampers', 'gifting', 'use', 'Curated sustainable gift boxes for festivals, birthdays, and corporate celebrations', 'fa-gift'],
    ['use_personal', 'Personal Care & Wellness', 'personal-care', 'use', 'Neem combs, natural loofahs, ayurvedic wellness and plantable stationery', 'fa-spa'],

    // Material-based categories (The 5 core materials of Eco Saathi)
    ['mat_bamboo', 'Bamboo', 'bamboo', 'material', 'Fast-growing natural grass products handcrafted into everyday essentials', 'fa-leaf'],
    ['mat_sabai', 'Sabai Grass', 'sabai-grass', 'material', 'Wild harvested golden fiber woven by tribal women artisans of Mayurbhanj, Odisha', 'fa-feather-pointed'],
    ['mat_jute', 'Jute Fiber', 'jute', 'material', 'Durable, biodegradable golden fiber bags, planters and mats from coastal Odisha', 'fa-bag-shopping'],
    ['mat_neem', 'Neem Wood', 'neem-wood', 'material', 'Antiseptic, seasoned medicinal Neem wood combs, utensils and tableware', 'fa-tree'],
    ['mat_organic', 'Organic & Upcycled', 'organic', 'material', 'Upcycled coconut shells, clay, beeswax, plantable paper and natural wellness', 'fa-seedling']
  ];

  for (const c of categories) {
    insertCat.run(...c);
  }

  // 2. Seed 37 Products
  const insertProd = db.prepare(`
    INSERT INTO products (
      id, title, handle, description, material_id, use_category_id, price, compare_at_price,
      stock, sku, weight_grams, hsn_code, eco_impact_badge, plastic_saved_desc, care_instructions,
      craft_origin, featured, bestseller, rating, reviews_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertImg = db.prepare(`
    INSERT INTO product_images (id, product_id, url, alt_text, is_primary)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, product_id, title, sku, price, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const products = [
    // 1-8: Bamboo Products
    {
      id: 'prod_01',
      title: 'Biodegradable Bamboo Toothbrush (Adult Soft Bristles)',
      handle: 'biodegradable-bamboo-toothbrush',
      desc: 'Ergonomically shaped natural bamboo toothbrush with BPA-free charcoal-infused soft bristles. Water-resistant handle compostable in your garden.',
      mat: 'mat_bamboo',
      use: 'use_oral',
      price: 99,
      mrp: 149,
      stock: 120,
      sku: 'ECO-BAM-001',
      weight: 35,
      eco: 'Saves 4 plastic toothbrushes/year',
      plastic: '100% plastic-free handle, compostable in 6 months',
      care: 'Store upright in a dry holder. Replace every 3 months.',
      origin: 'Bhubaneswar Workshop, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.9,
      reviews: 48,
      img: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80',
      variants: [
        { title: 'Single Pack', sku: 'ECO-BAM-001-S', price: 99, stock: 80 },
        { title: 'Family Pack of 4', sku: 'ECO-BAM-001-F', price: 349, stock: 40 }
      ]
    },
    {
      id: 'prod_02',
      title: 'Kids Bamboo Toothbrush with Rainbow Extra-Soft Bristles',
      handle: 'kids-bamboo-toothbrush',
      desc: 'Specially designed for tender gums and small hands. Made from round-edged natural bamboo with ultra-gentle bristles.',
      mat: 'mat_bamboo',
      use: 'use_oral',
      price: 89,
      mrp: 120,
      stock: 75,
      sku: 'ECO-BAM-002',
      weight: 30,
      eco: 'Non-toxic, safe for children',
      plastic: 'Zero plastic waste packaging',
      care: 'Rinse thoroughly and keep dry.',
      origin: 'Khordha Artisans, Odisha',
      featured: 0,
      bestseller: 1,
      rating: 4.8,
      reviews: 26,
      img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Single Pack', sku: 'ECO-BAM-002-S', price: 89, stock: 75 }]
    },
    {
      id: 'prod_03',
      title: 'Handcrafted Bamboo Travel Toothbrush Case',
      handle: 'bamboo-travel-toothbrush-case',
      desc: 'Breathable bamboo cylinder case with ventilation holes at both ends. Prevents moisture build-up when travelling.',
      mat: 'mat_bamboo',
      use: 'use_oral',
      price: 180,
      mrp: 249,
      stock: 45,
      sku: 'ECO-BAM-003',
      weight: 60,
      eco: 'Replaces flimsy plastic travel tubes',
      plastic: '100% natural seasoned bamboo tube',
      care: 'Wipe dry with clean cloth.',
      origin: 'Bhubaneswar, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.7,
      reviews: 14,
      img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Standard Size', sku: 'ECO-BAM-003-STD', price: 180, stock: 45 }]
    },
    {
      id: 'prod_04',
      title: 'Zero-Waste Bamboo Cutlery Travel Set (Fork, Spoon, Knife, Chopsticks, Straw)',
      handle: 'bamboo-cutlery-travel-set',
      desc: 'Portable dining set packed in a washable cotton canvas pouch with metal carabiner. Perfect for office lunchboxes, travel and camping.',
      mat: 'mat_bamboo',
      use: 'use_kitchen',
      price: 349,
      mrp: 499,
      stock: 60,
      sku: 'ECO-BAM-004',
      weight: 120,
      eco: 'Eliminates hundreds of single-use plastic cutlery pieces',
      plastic: '100% organic treated bamboo, food grade finish',
      care: 'Hand wash with mild dish soap and air dry.',
      origin: 'Nayagarh Bamboo Cluster, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.9,
      reviews: 52,
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      variants: [
        { title: 'Natural Pouch', sku: 'ECO-BAM-004-NAT', price: 349, stock: 40 },
        { title: 'Olive Green Pouch', sku: 'ECO-BAM-004-GRN', price: 349, stock: 20 }
      ]
    },
    {
      id: 'prod_05',
      title: 'Natural Bamboo Straws with Coconut Fiber Cleaning Brush (Pack of 6)',
      handle: 'bamboo-straws-pack-of-6',
      desc: 'Smooth, polished reusable bamboo drinking straws suitable for hot beverages, smoothies, tender coconut water and cocktails.',
      mat: 'mat_bamboo',
      use: 'use_kitchen',
      price: 199,
      mrp: 299,
      stock: 85,
      sku: 'ECO-BAM-005',
      weight: 80,
      eco: 'Replaces harmful plastic straws forever',
      plastic: 'Zero microplastics, taste-neutral finish',
      care: 'Clean with included coconut fiber brush and air dry.',
      origin: 'Bhubaneswar, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.6,
      reviews: 19,
      img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Pack of 6 + Brush', sku: 'ECO-BAM-005-P6', price: 199, stock: 85 }]
    },
    {
      id: 'prod_06',
      title: 'Bamboo Insulated Flask Bottle with Tea Strainer (500ml)',
      handle: 'bamboo-insulated-flask-bottle',
      desc: 'Double-walled food-grade 304 stainless steel interior wrapped in an organic polished bamboo shell. Keeps drinks hot for 12 hours or cold for 24 hours.',
      mat: 'mat_bamboo',
      use: 'use_kitchen',
      price: 899,
      mrp: 1299,
      stock: 35,
      sku: 'ECO-BAM-006',
      weight: 420,
      eco: 'Diverts over 150 disposable bottles/year',
      plastic: '100% BPA Free leak-proof lid',
      care: 'Hand wash exterior. Dishwasher safe interior.',
      origin: 'Bhubaneswar, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.9,
      reviews: 64,
      img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: '500ml Standard', sku: 'ECO-BAM-006-500', price: 899, stock: 35 }]
    },
    {
      id: 'prod_07',
      title: 'Minimalist Bamboo Desk Organizer & Mobile Dock',
      handle: 'bamboo-desk-organizer-dock',
      desc: 'Elegant natural bamboo desktop dock with slots for smartphone, pens, sticky notes, and visiting cards. Laser-customizable for corporate gifting.',
      mat: 'mat_bamboo',
      use: 'use_home',
      price: 549,
      mrp: 799,
      stock: 40,
      sku: 'ECO-BAM-007',
      weight: 310,
      eco: 'Plastic-free workspace organization',
      plastic: 'Solid treated bamboo timber',
      care: 'Wipe with dry microfiber cloth.',
      origin: 'Cuttack Artisan Collective, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.8,
      reviews: 18,
      img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Natural Teak Finish', sku: 'ECO-BAM-007-NAT', price: 549, stock: 40 }]
    },
    {
      id: 'prod_08',
      title: 'Bamboo Acoustic Passive Sound Amplifier for Smartphones',
      handle: 'bamboo-acoustic-phone-amplifier',
      desc: 'Zero-electricity passive sound booster carved from thick natural bamboo stalk. Amplifies phone volume naturally with warm resonant acoustic resonance.',
      mat: 'mat_bamboo',
      use: 'use_home',
      price: 449,
      mrp: 650,
      stock: 30,
      sku: 'ECO-BAM-008',
      weight: 220,
      eco: 'Zero battery, zero electricity entertainment',
      plastic: '100% biodegradable native bamboo node',
      care: 'Keep in dry room environment.',
      origin: 'Bhubaneswar, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.7,
      reviews: 11,
      img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Standard Node (Fits all phones)', sku: 'ECO-BAM-008-STD', price: 449, stock: 30 }]
    },

    // 9-16: Sabai Grass Products (Handwoven in Mayurbhanj, Odisha)
    {
      id: 'prod_09',
      title: 'Handwoven Mayurbhanj Sabai Grass Storage Baskets with Lid (Set of 3)',
      handle: 'mayurbhanj-sabai-grass-storage-baskets-set-of-3',
      desc: 'Authentic round nesting baskets woven from wild-harvested Sabai grass by women self-help groups in Baripada, Mayurbhanj. Sturdy, lightweight and aesthetic.',
      mat: 'mat_sabai',
      use: 'use_home',
      price: 1199,
      mrp: 1699,
      stock: 25,
      sku: 'ECO-SAB-001',
      weight: 650,
      eco: 'Empowers rural tribal women artisans in Odisha',
      plastic: '100% natural botanical fiber and cotton binding',
      care: 'Dust with soft dry brush. Sun dry if damp.',
      origin: 'Baripada, Mayurbhanj, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 5.0,
      reviews: 73,
      img: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Set of 3 (S, M, L)', sku: 'ECO-SAB-001-SET', price: 1199, stock: 25 }]
    },
    {
      id: 'prod_10',
      title: 'Sabai Grass Bohemian Planter Basket (Dual Tone Natural & Earth Red)',
      handle: 'sabai-grass-boho-planter-basket',
      desc: 'Cozy artisanal planter cover handcrafted using braided Sabai rope dyed with eco-friendly mineral dyes. Elevates indoor succulents and monsteras.',
      mat: 'mat_sabai',
      use: 'use_home',
      price: 499,
      mrp: 699,
      stock: 45,
      sku: 'ECO-SAB-002',
      weight: 240,
      eco: 'Sustainable alternative to plastic indoor plant pots',
      plastic: 'Natural unbleached grass dyed with azo-free pigments',
      care: 'Use an internal saucer when watering plants.',
      origin: 'Mayurbhanj Women SHG, Odisha',
      featured: 1,
      bestseller: 0,
      rating: 4.8,
      reviews: 31,
      img: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
      variants: [
        { title: 'Medium (7 inch diameter)', sku: 'ECO-SAB-002-M', price: 499, stock: 25 },
        { title: 'Large (9 inch diameter)', sku: 'ECO-SAB-002-L', price: 649, stock: 20 }
      ]
    },
    {
      id: 'prod_11',
      title: 'Handcrafted Sabai Grass Roti Box & Tortilla Casserole with Lid',
      handle: 'sabai-grass-roti-casserole-box',
      desc: 'Traditional woven dining bread basket that keeps chapatis and rotis fresh and warm without trapping soggy condensation. Lined with organic cotton cloth.',
      mat: 'mat_sabai',
      use: 'use_kitchen',
      price: 649,
      mrp: 899,
      stock: 35,
      sku: 'ECO-SAB-003',
      weight: 320,
      eco: 'No plastic cling wraps or aluminum foils',
      plastic: '100% natural Sabai grass with removable cotton liner',
      care: 'Wash cotton liner separately. Wipe basket dry.',
      origin: 'Mayurbhanj, Odisha',
      featured: 0,
      bestseller: 1,
      rating: 4.9,
      reviews: 39,
      img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Standard 8-inch', sku: 'ECO-SAB-003-8IN', price: 649, stock: 35 }]
    },
    {
      id: 'prod_12',
      title: 'Artisanal Sabai Grass Dining Table Placemats & Coasters (Set of 6+6)',
      handle: 'sabai-grass-placemats-coasters-set',
      desc: 'Heat-resistant, spill-tolerant dining table set woven intricately in circular concentric mandala patterns. Adds earthy charm to your dining space.',
      mat: 'mat_sabai',
      use: 'use_kitchen',
      price: 799,
      mrp: 1150,
      stock: 30,
      sku: 'ECO-SAB-004',
      weight: 510,
      eco: 'Durable natural fibers replace plastic table mats',
      plastic: 'Zero synthetic polymers, withstands hot cooking pans',
      care: 'Spot clean with damp cloth, do not machine wash.',
      origin: 'Baripada, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.7,
      reviews: 22,
      img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Set of 6 Mats + 6 Coasters', sku: 'ECO-SAB-004-SET', price: 799, stock: 30 }]
    },
    {
      id: 'prod_13',
      title: 'Handcrafted Sabai Grass Chic Crossbody Sling Bag',
      handle: 'sabai-grass-chic-crossbody-sling-bag',
      desc: 'Trendy eco-chic circular sling purse made from braided Sabai fiber with genuine vegan leather straps and brass buckle clasp. Lined with kalamkari printed fabric.',
      mat: 'mat_sabai',
      use: 'use_personal',
      price: 949,
      mrp: 1399,
      stock: 20,
      sku: 'ECO-SAB-005',
      weight: 290,
      eco: 'Cruelty-free, plastic-free fashion accessory',
      plastic: 'Wild grass, organic cotton lining, metal hardware',
      care: 'Store in dust bag away from damp places.',
      origin: 'Mayurbhanj Artisan Cooperative, Odisha',
      featured: 1,
      bestseller: 0,
      rating: 4.9,
      reviews: 17,
      img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Natural Tan', sku: 'ECO-SAB-005-TAN', price: 949, stock: 20 }]
    },
    {
      id: 'prod_14',
      title: 'Large Sabai Grass Laundry & Toy Storage Hamper with Handles',
      handle: 'large-sabai-grass-laundry-hamper',
      desc: 'Spacious cylindrical floor hamper with reinforced woven handles. Excellent for organizing nursery toys, winter quilts, and weekly laundry.',
      mat: 'mat_sabai',
      use: 'use_home',
      price: 1499,
      mrp: 2199,
      stock: 18,
      sku: 'ECO-SAB-006',
      weight: 980,
      eco: 'Replaces bulky synthetic plastic laundry tubs',
      plastic: '100% compostable high-tensile Sabai grass',
      care: 'Aerate occasionally under sunlight.',
      origin: 'Mayurbhanj, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.8,
      reviews: 15,
      img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Large (16 x 14 inches)', sku: 'ECO-SAB-006-LRG', price: 1499, stock: 18 }]
    },
    {
      id: 'prod_15',
      title: 'Sabai Grass Handcrafted Keepsake Gift Box (Bhubaneswar Special)',
      handle: 'sabai-grass-handcrafted-gift-box',
      desc: 'Delicately woven gift box with fitted lid, tied with jute twine. Reusable as jewelry box or memory trunk long after the gift is received.',
      mat: 'mat_sabai',
      use: 'use_gifting',
      price: 399,
      mrp: 550,
      stock: 50,
      sku: 'ECO-SAB-007',
      weight: 180,
      eco: 'Zero waste wrapping: the box itself is a lifelong gift',
      plastic: 'No plastic tape or laminated paper required',
      care: 'Dust with soft dry cloth.',
      origin: 'Mayurbhanj / Bhubaneswar, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.9,
      reviews: 44,
      img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      variants: [
        { title: 'Square Box (8x8 inch)', sku: 'ECO-SAB-007-SQ', price: 399, stock: 30 },
        { title: 'Rectangular Box (10x6 inch)', sku: 'ECO-SAB-007-RC', price: 449, stock: 20 }
      ]
    },

    // 16-22: Jute Products
    {
      id: 'prod_16',
      title: 'Padded Jute Laptop Sleeve with Brass Zipper (13-15.6 inch)',
      handle: 'padded-jute-laptop-sleeve',
      desc: 'Professional eco-friendly laptop case made with dense golden jute weave, shock-absorbing organic cotton felt padding, and antique brass hardware.',
      mat: 'mat_jute',
      use: 'use_personal',
      price: 699,
      mrp: 999,
      stock: 40,
      sku: 'ECO-JUT-001',
      weight: 260,
      eco: 'Saves 200g of petroleum-based neoprene',
      plastic: '100% natural outer jute, organic fleece lining',
      care: 'Spot clean with mild soapy water.',
      origin: 'Kendrapara Jute Crafters, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.8,
      reviews: 51,
      img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      variants: [
        { title: '13-14 Inch Mac/PC', sku: 'ECO-JUT-001-13', price: 699, stock: 25 },
        { title: '15-15.6 Inch Standard', sku: 'ECO-JUT-001-15', price: 749, stock: 15 }
      ]
    },
    {
      id: 'prod_17',
      title: 'Heavy-Duty Reusable Jute Grocery & Market Bags (Pack of 3)',
      handle: 'heavy-duty-jute-grocery-bags-pack-of-3',
      desc: 'Spacious canvas-reinforced jute market totes with wide cotton padded handles that do not pinch your palms even when carrying 15kg of vegetables.',
      mat: 'mat_jute',
      use: 'use_kitchen',
      price: 399,
      mrp: 599,
      stock: 90,
      sku: 'ECO-JUT-002',
      weight: 410,
      eco: 'Replaces over 400 single-use polyethene bags per family/year',
      plastic: 'Zero plastic film, reinforced cross-stitched base',
      care: 'Wipe inside with damp cloth and dry in shade.',
      origin: 'Coastal Odisha Jute Collective',
      featured: 0,
      bestseller: 1,
      rating: 4.9,
      reviews: 87,
      img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Trio Pack (3 Earth Tones)', sku: 'ECO-JUT-002-P3', price: 399, stock: 90 }]
    },
    {
      id: 'prod_18',
      title: 'Handcrafted Jute Wine & Bottle Gift Tote Bag',
      handle: 'jute-wine-bottle-gift-bag',
      desc: 'Charming single-bottle tote bag with wooden bead drawstring. Fits standard wine bottles, olive oil bottles, or kombucha growlers for festive gifting.',
      mat: 'mat_jute',
      use: 'use_gifting',
      price: 149,
      mrp: 220,
      stock: 60,
      sku: 'ECO-JUT-003',
      weight: 90,
      eco: 'Biodegradable alternative to metallic gift wraps',
      plastic: '100% golden jute twine and natural wooden bead',
      care: 'Hand wash with mild detergent.',
      origin: 'Bhubaneswar, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.7,
      reviews: 13,
      img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Single Bottle Bag', sku: 'ECO-JUT-003-SGL', price: 149, stock: 60 }]
    },
    {
      id: 'prod_19',
      title: 'Eco-Friendly Jute & Natural Rubber Yoga Exercise Mat (6mm)',
      handle: 'jute-natural-rubber-yoga-mat',
      desc: 'Anti-slip yoga mat blending natural golden jute fiber mesh with sustainably tapped organic tree rubber base. Sweat-absorbent, grounded and free of toxic PVC.',
      mat: 'mat_jute',
      use: 'use_personal',
      price: 1399,
      mrp: 1999,
      stock: 22,
      sku: 'ECO-JUT-004',
      weight: 1800,
      eco: 'Zero PVC, Zero EVA, Zero toxic emissions',
      plastic: 'Biodegradable natural rubber + woven jute surface',
      care: 'Wipe with diluted tea tree oil water spray and air dry.',
      origin: 'Odisha Sustainable Crafts',
      featured: 1,
      bestseller: 0,
      rating: 4.9,
      reviews: 34,
      img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Standard 6ft x 2ft (6mm thick)', sku: 'ECO-JUT-004-6MM', price: 1399, stock: 22 }]
    },
    {
      id: 'prod_20',
      title: 'Multi-Pocket Jute Wall Hanging Wall Organizer',
      handle: 'multi-pocket-jute-wall-organizer',
      desc: 'Space-saving 6-pocket vertical organizer mounted on a seasoned bamboo rod. Convenient for mail, keys, sunglasses, charging cords and medicines.',
      mat: 'mat_jute',
      use: 'use_home',
      price: 449,
      mrp: 650,
      stock: 35,
      sku: 'ECO-JUT-005',
      weight: 290,
      eco: 'No plastic hooks or synthetic nylon racks',
      plastic: 'Natural unbleached jute canvas and bamboo pole',
      care: 'Spot clean and dust periodically.',
      origin: 'Khordha, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.6,
      reviews: 16,
      img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: '6-Pocket Classic', sku: 'ECO-JUT-005-6P', price: 449, stock: 35 }]
    },
    {
      id: 'prod_21',
      title: 'Breathable Jute Fabric Plant Grow Bags (Pack of 5, 12x12 inch)',
      handle: 'jute-fabric-plant-grow-bags-pack-of-5',
      desc: 'Air-pruning garden grow bags made from thick natural jute fabric. Promotes vigorous root branching and prevents root circling in balcony gardens.',
      mat: 'mat_jute',
      use: 'use_home',
      price: 349,
      mrp: 499,
      stock: 55,
      sku: 'ECO-JUT-006',
      weight: 380,
      eco: 'Biodegradable in soil after 2-3 gardening seasons',
      plastic: '100% plant fiber, replaces black HDPE plastic grow bags',
      care: 'Fill with potting mix and compost. Self-draining.',
      origin: 'Bhubaneswar, Odisha',
      featured: 0,
      bestseller: 1,
      rating: 4.8,
      reviews: 42,
      img: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Pack of 5 (12x12 in)', sku: 'ECO-JUT-006-P5', price: 349, stock: 55 }]
    },

    // 22-29: Neem Wood Products (Seasoned Medicinal Neem from Odisha)
    {
      id: 'prod_22',
      title: 'Medicinal Neem Wood Dual-Tooth Hair Detangler Comb',
      handle: 'medicinal-neem-wood-detangler-comb',
      desc: 'Carved from single block of seasoned Indian Neem (Azadirachta indica) tree wood. Seamless rounded teeth gently massage the scalp, reduce hair fall and static frizz.',
      mat: 'mat_neem',
      use: 'use_personal',
      price: 149,
      mrp: 220,
      stock: 140,
      sku: 'ECO-NEE-001',
      weight: 45,
      eco: 'Naturally anti-fungal, prevents dandruff and microplastic shedding',
      plastic: '100% solid seasoned medicinal neem timber',
      care: 'Do not soak in water. Oil occasionally with coconut or mustard oil.',
      origin: 'Dhenkanal Woodcraft Guild, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.9,
      reviews: 95,
      img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      variants: [
        { title: 'Wide-Tooth Detangler', sku: 'ECO-NEE-001-W', price: 149, stock: 80 },
        { title: 'Handle Styling Comb', sku: 'ECO-NEE-001-H', price: 169, stock: 60 }
      ]
    },
    {
      id: 'prod_23',
      title: 'Neem Wood Pocket Beard & Mustache Comb with Faux Leather Case',
      handle: 'neem-wood-pocket-beard-comb',
      desc: 'Compact pocket-sized fine-tooth comb handcrafted for grooming beards and hair on the move. Naturally infused with soothing herbal neem oils.',
      mat: 'mat_neem',
      use: 'use_personal',
      price: 129,
      mrp: 180,
      stock: 65,
      sku: 'ECO-NEE-002',
      weight: 30,
      eco: 'Anti-static, eliminates plastic beard combs',
      plastic: 'Natural neem wood with canvas travel sleeve',
      care: 'Keep in sleeve after use. Wipe clean.',
      origin: 'Bhubaneswar, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.7,
      reviews: 28,
      img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Pocket Size (4 inch)', sku: 'ECO-NEE-002-PKT', price: 129, stock: 65 }]
    },
    {
      id: 'prod_24',
      title: 'Handcrafted Neem Wood Kitchen Cooking Spatulas & Ladles Set (5 Pieces)',
      handle: 'neem-wood-cooking-spatulas-ladles-set-5-pieces',
      desc: 'Complete cookware set including frying spatula, soup ladle, slotted turners and curved serving spoon. Non-scratch on cast iron and non-stick pans.',
      mat: 'mat_neem',
      use: 'use_kitchen',
      price: 599,
      mrp: 850,
      stock: 50,
      sku: 'ECO-NEE-003',
      weight: 380,
      eco: 'Eliminates melted plastic nylon turners in hot curry pots',
      plastic: 'Zero synthetic varnishes, finished with edible walnut oil',
      care: 'Hand wash with mild detergent. Do not soak in sink.',
      origin: 'Dhenkanal, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.9,
      reviews: 67,
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Complete 5-Piece Set', sku: 'ECO-NEE-003-SET5', price: 599, stock: 50 }]
    },
    {
      id: 'prod_25',
      title: 'Neem Wood Roti Rolling Pin (Belan) & Board (Chakla) Set',
      handle: 'neem-wood-roti-belan-chakla-set',
      desc: 'Heavy, balanced traditional Indian rolling pin and pastry board carved from single mature neem wood trunk. Anti-bacterial wood prevents dough stickiness.',
      mat: 'mat_neem',
      use: 'use_kitchen',
      price: 699,
      mrp: 999,
      stock: 30,
      sku: 'ECO-NEE-004',
      weight: 850,
      eco: 'Generational longevity, zero chemical treatments',
      plastic: '100% natural seasoned neem wood',
      care: 'Wipe with damp sponge and dry immediately.',
      origin: 'Odisha Wood Artisans',
      featured: 0,
      bestseller: 0,
      rating: 4.8,
      reviews: 21,
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Belan + Chakla Set (10 inch board)', sku: 'ECO-NEE-004-SET', price: 699, stock: 30 }]
    },
    {
      id: 'prod_26',
      title: 'Neem Wood Natural Teething Ring Toy for Infants',
      handle: 'neem-wood-infant-teething-ring',
      desc: 'Smoothly buffed, silk-finish organic neem wood ring designed for soothing teething babies naturally. Non-toxic, free of phthalates, BPA and chemical glues.',
      mat: 'mat_neem',
      use: 'use_personal',
      price: 199,
      mrp: 299,
      stock: 40,
      sku: 'ECO-NEE-005',
      weight: 60,
      eco: 'Safe alternative to toxic plastic & silicone teething rings',
      plastic: 'Organic neem timber, natural cold-pressed olive oil seal',
      care: 'Clean with warm water and wipe dry.',
      origin: 'Bhubaneswar, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.9,
      reviews: 31,
      img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Standard Teething Ring', sku: 'ECO-NEE-005-STD', price: 199, stock: 40 }]
    },
    {
      id: 'prod_27',
      title: 'Self-Draining Slotted Neem Wood Soap Dish',
      handle: 'slotted-neem-wood-soap-dish',
      desc: 'Natural ribbed wooden soap saver with slotted channels that drain excess shower water quickly, extending the life of your organic cold-process soap bars.',
      mat: 'mat_neem',
      use: 'use_personal',
      price: 139,
      mrp: 199,
      stock: 80,
      sku: 'ECO-NEE-006',
      weight: 75,
      eco: 'Prevents soggy soap waste and eliminates plastic soap trays',
      plastic: 'Water-resistant seasoned neem wood',
      care: 'Rinse occasionally and let dry in airy spot.',
      origin: 'Bhubaneswar, Odisha',
      featured: 0,
      bestseller: 1,
      rating: 4.7,
      reviews: 43,
      img: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Single Soap Dish', sku: 'ECO-NEE-006-SGL', price: 139, stock: 80 }]
    },

    // 28-34: Organic Materials & Upcycled Kits
    {
      id: 'prod_28',
      title: 'Upcycled Handcrafted Coconut Shell Aromatic Candle (Lemongrass & Soy Wax)',
      handle: 'upcycled-coconut-shell-candle-lemongrass',
      desc: 'Real discarded coconut shells reclaimed from local Odisha temple offerings, cleaned, polished and poured with 100% natural soy wax and pure lemongrass essential oil.',
      mat: 'mat_organic',
      use: 'use_home',
      price: 299,
      mrp: 450,
      stock: 65,
      sku: 'ECO-ORG-001',
      weight: 230,
      eco: 'Upcycles temple bio-waste, burns clean without paraffin soot',
      plastic: 'Zero paraffin wax, lead-free unbleached cotton wick',
      care: 'Trim wick to 5mm before relighting. 30+ hours burn time.',
      origin: 'Puri / Bhubaneswar, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.9,
      reviews: 58,
      img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
      variants: [
        { title: 'Lemongrass Breeze', sku: 'ECO-ORG-001-LEM', price: 299, stock: 40 },
        { title: 'Mysore Sandalwood', sku: 'ECO-ORG-001-SAN', price: 349, stock: 25 }
      ]
    },
    {
      id: 'prod_29',
      title: 'Natural Coconut Coir Dishwashing Scrub Pads (Pack of 5)',
      handle: 'coconut-coir-dishwashing-scrub-pads-pack-of-5',
      desc: 'Plant-based scrub sponges made from coconut husk fibers bonded with natural rubber latex. Non-scratch on delicate glassware yet tough on greasy burnt pans.',
      mat: 'mat_organic',
      use: 'use_kitchen',
      price: 179,
      mrp: 250,
      stock: 95,
      sku: 'ECO-ORG-002',
      weight: 120,
      eco: 'Stops thousands of microplastic green Scotch-Brite fibers from entering rivers',
      plastic: '100% compostable in home compost bin',
      care: 'Rinse and squeeze dry after dishwashing.',
      origin: 'Coastal Odisha Coconut Farmers Guild',
      featured: 0,
      bestseller: 1,
      rating: 4.8,
      reviews: 62,
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Pack of 5 Pads', sku: 'ECO-ORG-002-P5', price: 179, stock: 95 }]
    },
    {
      id: 'prod_30',
      title: 'Natural Ridge Gourd Loofah Body Scrubbers (Pack of 3)',
      handle: 'natural-ridge-gourd-loofah-pack-of-3',
      desc: 'Sun-dried natural loofah gourds (Luffa aegyptiaca) with cotton hanging loop. Gently exfoliates dead skin cells and stimulates microcirculation in the shower.',
      mat: 'mat_organic',
      use: 'use_personal',
      price: 189,
      mrp: 275,
      stock: 70,
      sku: 'ECO-ORG-003',
      weight: 85,
      eco: 'Replaces plastic shower poufs that harbor mold',
      plastic: '100% whole dried vegetable vine sponge',
      care: 'Soak in warm water before first use. Hang to dry.',
      origin: 'Nayagarh Farms, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.7,
      reviews: 35,
      img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Pack of 3 Loofahs', sku: 'ECO-ORG-003-P3', price: 189, stock: 70 }]
    },
    {
      id: 'prod_31',
      title: 'Plantable Seed Pencils with Tomato, Basil & Marigold Seeds (Pack of 10)',
      handle: 'plantable-seed-pencils-pack-of-10',
      desc: 'Recycled paper pencils containing vegetable and flower seed capsules at the tip. When the pencil becomes too short to write, plant it in a pot and watch it sprout!',
      mat: 'mat_organic',
      use: 'use_gifting',
      price: 199,
      mrp: 299,
      stock: 110,
      sku: 'ECO-ORG-004',
      weight: 110,
      eco: 'Saves cedar wood forests; teaches kids sustainable circularity',
      plastic: 'Zero virgin wood, edible seed capsule, graphite 2B lead',
      care: 'Insert green tip into soil at 30-degree angle with water and sunlight.',
      origin: 'Bhubaneswar, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 4.9,
      reviews: 84,
      img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Box of 10 Seed Pencils', sku: 'ECO-ORG-004-B10', price: 199, stock: 110 }]
    },
    {
      id: 'prod_32',
      title: 'Plantable Wildflower Seed Paper Notebook (100 Blank Recycled Pages)',
      handle: 'plantable-seed-paper-notebook',
      desc: 'Eco notebook with seed-embedded handmade cotton rag cover and smooth recycled sketch paper pages. Bound with natural jute cord.',
      mat: 'mat_organic',
      use: 'use_gifting',
      price: 249,
      mrp: 350,
      stock: 45,
      sku: 'ECO-ORG-005',
      weight: 190,
      eco: 'Plant the front and back cover after completing the journal',
      plastic: 'Cotton rag waste paper, zero tree wood pulp',
      care: 'Keep in dry room environment.',
      origin: 'Bhubaneswar Paper Guild, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.8,
      reviews: 29,
      img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'A5 Size (100 Pages)', sku: 'ECO-ORG-005-A5', price: 249, stock: 45 }]
    },
    {
      id: 'prod_33',
      title: 'Ayurvedic Herbal Clay & Clove Tooth Powder (100g Glass Jar)',
      handle: 'ayurvedic-herbal-tooth-powder-100g',
      desc: 'Traditional Odia toothpowder formulated with bentonite clay, organic clove oil, cinnamon, rock salt and neem leaf. Strengthens gums and freshens breath.',
      mat: 'mat_organic',
      use: 'use_oral',
      price: 199,
      mrp: 299,
      stock: 60,
      sku: 'ECO-ORG-006',
      weight: 220,
      eco: 'Zero synthetic foaming agents (SLS) and zero plastic tubes',
      plastic: 'Reusable glass apothecary jar with metal twist lid',
      care: 'Dip damp toothbrush bristle lightly into powder.',
      origin: 'Puri Ayurvedic Collective, Odisha',
      featured: 0,
      bestseller: 0,
      rating: 4.8,
      reviews: 37,
      img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: '100g Glass Jar', sku: 'ECO-ORG-006-100G', price: 199, stock: 60 }]
    },
    {
      id: 'prod_34',
      title: 'Reusable Organic Beeswax Cotton Food Wraps (Pack of 3 Assorted Sizes)',
      handle: 'reusable-beeswax-cotton-food-wraps-pack-of-3',
      desc: 'Natural food wrap made with pure Odia forest beeswax, tree dammar resin and cold-pressed jojoba oil on organic cotton. Seals bowls, sandwiches, cheese and herbs.',
      mat: 'mat_organic',
      use: 'use_kitchen',
      price: 499,
      mrp: 699,
      stock: 40,
      sku: 'ECO-ORG-007',
      weight: 140,
      eco: 'Replaces miles of single-use toxic PVC cling film and aluminum foil',
      plastic: '100% natural and reusable for over 120 washes',
      care: 'Wash with cold water and mild soap. Do not expose to heat.',
      origin: 'Bhubaneswar, Odisha',
      featured: 1,
      bestseller: 0,
      rating: 4.9,
      reviews: 46,
      img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Assorted Pack (S, M, L)', sku: 'ECO-ORG-007-AST', price: 499, stock: 40 }]
    },

    // 35-37: Curated Bestselling Hampers & Kits
    {
      id: 'prod_35',
      title: 'The Zero-Waste Bathroom Starter Kit (Gift Box Edition)',
      handle: 'zero-waste-bathroom-starter-kit',
      desc: 'Everything you need to transform your bathroom into a plastic-free sanctuary. Includes 2 Bamboo Toothbrushes, 1 Bamboo Travel Case, 1 Neem Wood Comb, 1 Neem Soap Dish and 1 Ayurvedic Toothpowder.',
      mat: 'mat_bamboo',
      use: 'use_gifting',
      price: 699,
      mrp: 999,
      stock: 35,
      sku: 'ECO-KIT-001',
      weight: 480,
      eco: 'Complete lifestyle replacement in single box',
      plastic: 'Packed in zero-plastic corrugated gift box with kraft paper shred',
      care: 'See individual care guide included in box.',
      origin: 'Curated in Bhubaneswar, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 5.0,
      reviews: 89,
      img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Complete Gift Hamper', sku: 'ECO-KIT-001-BOX', price: 699, stock: 35 }]
    },
    {
      id: 'prod_36',
      title: 'Odisha Artisan Heritage Hamper (Handwoven Sabai Box + Coconut Candle + Jute Bag)',
      handle: 'odisha-artisan-heritage-hamper',
      desc: 'Our premier festive and corporate gift celebrating Odisha craftsmanship. Features a handcrafted Sabai Grass Box from Mayurbhanj, Lemongrass Coconut Candle, Neem Comb and Kendrapara Jute Tote.',
      mat: 'mat_sabai',
      use: 'use_gifting',
      price: 1299,
      mrp: 1899,
      stock: 25,
      sku: 'ECO-KIT-002',
      weight: 850,
      eco: 'Direct income support for 4 distinct artisan families in Odisha',
      plastic: '100% natural, biodegradable and reusable heritage craft',
      care: 'Keep in dry room environment.',
      origin: 'Mayurbhanj & Bhubaneswar, Odisha',
      featured: 1,
      bestseller: 1,
      rating: 5.0,
      reviews: 61,
      img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Deluxe Heritage Box', sku: 'ECO-KIT-002-DLX', price: 1299, stock: 25 }]
    },
    {
      id: 'prod_37',
      title: 'Plastic-Free Kitchen Makeover Box (Cookware & Cleaning Essentials)',
      handle: 'plastic-free-kitchen-makeover-box',
      desc: 'Say goodbye to plastic sponges and Teflon spoons. Includes 5 Neem Wood Spatulas, 1 Sabai Roti Basket, 5 Coir Scrub Pads and 3 Beeswax Wraps.',
      mat: 'mat_neem',
      use: 'use_kitchen',
      price: 1499,
      mrp: 2199,
      stock: 20,
      sku: 'ECO-KIT-003',
      weight: 920,
      eco: 'Eliminates microplastics from food prep and dishwashing',
      plastic: 'Zero plastics, packed in recycled paper box',
      care: 'Instructions booklet included.',
      origin: 'Handcrafted in Odisha',
      featured: 1,
      bestseller: 0,
      rating: 4.9,
      reviews: 43,
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      variants: [{ title: 'Full Kitchen Kit', sku: 'ECO-KIT-003-KIT', price: 1499, stock: 20 }]
    }
  ];

  for (const p of products) {
    insertProd.run(
      p.id,
      p.title,
      p.handle,
      p.desc,
      p.mat,
      p.use,
      p.price,
      p.mrp,
      p.stock,
      p.sku,
      p.weight,
      '44219990',
      p.eco,
      p.plastic,
      p.care,
      p.origin,
      p.featured,
      p.bestseller,
      p.rating,
      p.reviews
    );

    // Primary image
    insertImg.run(`img_${p.id}_1`, p.id, p.img, p.title, 1);

    // Variants
    for (const v of p.variants) {
      insertVariant.run(`var_${v.sku}`, p.id, v.title, v.sku, v.price, v.stock);
    }
  }

  // 3. Seed Reviews
  const insertRev = db.prepare(`
    INSERT INTO reviews (id, product_id, customer_name, customer_city, rating, title, comment, status, verified_purchase)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleReviews = [
    ['rev_1', 'prod_01', 'Priyanka Mohapatra', 'Bhubaneswar', 5, 'Best eco toothbrush ever!', 'I have been using plastic toothbrushes for years and felt guilty. This bamboo brush is smooth, doesn’t hurt the gums, and the charcoal bristles feel super clean!', 'approved', 1],
    ['rev_2', 'prod_01', 'Arun Kumar Jena', 'Cuttack', 5, 'Great quality bamboo', 'Supportive of local artisans. Handle feels sturdy and dries quickly in our coastal humidity.', 'approved', 1],
    ['rev_3', 'prod_09', 'Sneha Ray', 'Kolkata', 5, 'Stunning Mayurbhanj craft', 'The Sabai grass smell is so earthly and fresh. Placed them in my living room for storing throws and books. High recommendation!', 'approved', 1],
    ['rev_4', 'prod_22', 'Ritu Sharma', 'New Delhi', 5, 'Noticeable reduction in hair fall', 'The neem comb has no static shock in winters. You can tell it is authentic medicinal neem wood.', 'approved', 1],
    ['rev_5', 'prod_28', 'Debashis Pattnaik', 'Rourkela', 5, 'Wonderful aroma', 'The lemongrass coconut shell candle fills the room with a temple-like calm. Burns clean without black soot.', 'approved', 1]
  ];

  for (const r of sampleReviews) {
    insertRev.run(...r);
  }

  // 4. Seed Pincodes (Sample India & Odisha pincodes for delivery calculator)
  const insertPin = db.prepare(`
    INSERT OR REPLACE INTO pincodes (pincode, city, state, serviceable, cod_available, delivery_days)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const pincodes = [
    ['751024', 'Bhubaneswar (Patia/KIIT)', 'Odisha', 1, 1, 1],
    ['751001', 'Bhubaneswar (Old Town)', 'Odisha', 1, 1, 1],
    ['753001', 'Cuttack', 'Odisha', 1, 1, 1],
    ['757001', 'Baripada (Mayurbhanj)', 'Odisha', 1, 1, 2],
    ['769001', 'Rourkela', 'Odisha', 1, 1, 2],
    ['752001', 'Puri', 'Odisha', 1, 1, 1],
    ['110001', 'New Delhi (Connaught Place)', 'Delhi', 1, 1, 3],
    ['400001', 'Mumbai (Fort)', 'Maharashtra', 1, 1, 3],
    ['560001', 'Bengaluru', 'Karnataka', 1, 1, 3],
    ['700001', 'Kolkata', 'West Bengal', 1, 1, 2],
    ['600001', 'Chennai', 'Tamil Nadu', 1, 1, 3],
    ['500001', 'Hyderabad', 'Telangana', 1, 1, 3]
  ];

  for (const pin of pincodes) {
    insertPin.run(...pin);
  }

  // 5. Seed Initial Staff / Admin and Sample Orders
  const insertCust = db.prepare(`
    INSERT INTO customers (id, name, email, phone, role, password_hash, whatsapp_consent, email_consent, consent_updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insertCust.run('cust_admin', 'Eco Saathi Admin', 'admin@ecosaathi.com', '9876543210', 'owner', 'admin123', 1, 1);
  insertCust.run('cust_demo', 'Aditi Dash', 'aditi.buyer@example.com', '9437099999', 'customer', null, 1, 1);

  // Seed sample order for immediate order tracking demo
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, order_number, customer_id, customer_name, customer_email, customer_phone,
      shipping_address, items, subtotal, discount, coupon_code, shipping_fee, tax_gst, total,
      payment_method, payment_status, payment_gateway_ref, order_status, courier_name,
      tracking_number, tracking_url, whatsapp_updates, email_updates
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleItems = JSON.stringify([
    {
      product_id: 'prod_01',
      title: 'Biodegradable Bamboo Toothbrush (Adult Soft Bristles)',
      variant_title: 'Family Pack of 4',
      price: 349,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=400&q=80'
    },
    {
      product_id: 'prod_28',
      title: 'Upcycled Handcrafted Coconut Shell Aromatic Candle',
      variant_title: 'Lemongrass Breeze',
      price: 299,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80'
    }
  ]);

  const sampleAddress = JSON.stringify({
    full_name: 'Aditi Dash',
    phone: '9437099999',
    street: 'Plot No. 42, Green Glen Layout, Patia',
    city: 'Bhubaneswar',
    state: 'Odisha',
    pincode: '751024'
  });

  insertOrder.run(
    'ord_demo_1',
    'ECO-2026-8941',
    'cust_demo',
    'Aditi Dash',
    'aditi.buyer@example.com',
    '9437099999',
    sampleAddress,
    sampleItems,
    648,
    64.8,
    'ECOFIRST10',
    0,
    29.16,
    612.36,
    'upi',
    'paid',
    'pay_razorpay_94101',
    'shipped',
    'Shiprocket / Delhivery',
    'DEL-OD-89410293',
    'https://shiprocket.co/tracking/DEL-OD-89410293',
    1,
    1
  );

  // Seed sample corporate lead
  const insertLead = db.prepare(`
    INSERT INTO corporate_leads (
      id, company_name, contact_person, email, phone, quantity, budget_per_hamper,
      required_date, product_interests, customization_notes, status, quote_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLead.run(
    'lead_01',
    'Tata Consultancy Services (Bhubaneswar SEZ)',
    'Ramesh Ch. Nayak',
    'ramesh.nayak@tcs.example.com',
    '9438012345',
    150,
    750,
    '2026-11-20',
    'Desk Organizers, Bamboo Flasks, Seed Pencils',
    'Require laser engraved TCS logo on bamboo flasks and personalized welcome cards for new joiners.',
    'quote_sent',
    101250
  );

  console.log('Seeding completed successfully with 37 products, categories, reviews, pincodes, and orders.');
}

module.exports = {
  getDb,
  initDatabase
};
