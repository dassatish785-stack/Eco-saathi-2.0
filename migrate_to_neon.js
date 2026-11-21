const https = require('https');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const NEON_CONN_STR = 'postgresql://neondb_owner:npg_1xB8CRmXQryw@ep-nameless-dust-benollhl-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';
const NEON_HOST = 'ep-nameless-dust-benollhl-pooler.c-9.us-east-2.aws.neon.tech';

function queryNeon(sql, params = []) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql, params });
    const options = {
      hostname: NEON_HOST,
      port: 443,
      path: '/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Neon-Connection-String': NEON_CONN_STR
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400 || json.error) {
            reject(new Error(json.message || json.error || `HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const tableDefinitions = [
  `CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(32) NOT NULL,
    description TEXT,
    icon VARCHAR(64)
  );`,

  `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    handle VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    material_id VARCHAR(64) NOT NULL REFERENCES categories(id),
    use_category_id VARCHAR(64) NOT NULL REFERENCES categories(id),
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    stock INTEGER NOT NULL DEFAULT 20,
    sku VARCHAR(64) NOT NULL,
    weight_grams INTEGER DEFAULT 150,
    hsn_code VARCHAR(32) DEFAULT '44219990',
    eco_impact_badge VARCHAR(255),
    plastic_saved_desc TEXT,
    care_instructions TEXT,
    craft_origin VARCHAR(255) DEFAULT 'Bhubaneswar, Odisha',
    featured SMALLINT DEFAULT 0,
    bestseller SMALLINT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary SMALLINT DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 20,
    option1_name VARCHAR(64),
    option1_value VARCHAR(64)
  );`,

  `CREATE TABLE IF NOT EXISTS pincodes (
    pincode VARCHAR(10) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    serviceable SMALLINT DEFAULT 1,
    cod_available SMALLINT DEFAULT 1,
    delivery_days INTEGER DEFAULT 3
  );`,

  `CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_pincode VARCHAR(10) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    shipping_fee NUMERIC(10, 2) DEFAULT 0,
    gst_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(32) DEFAULT 'pending',
    fulfillment_status VARCHAR(32) DEFAULT 'processing',
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    product_title VARCHAR(255) NOT NULL,
    variant_title VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    hsn_code VARCHAR(32)
  );`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_city VARCHAR(100) DEFAULT 'Bhubaneswar',
    rating INTEGER NOT NULL,
    title VARCHAR(255),
    comment TEXT NOT NULL,
    verified_purchase SMALLINT DEFAULT 1,
    status VARCHAR(32) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS corporate_leads (
    id VARCHAR(64) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    budget_per_hamper NUMERIC(10, 2),
    required_date VARCHAR(64),
    product_interests TEXT,
    customization_notes TEXT,
    status VARCHAR(32) DEFAULT 'new',
    quote_amount NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS corporate_inquiries (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    quantity INTEGER DEFAULT 50,
    required_date VARCHAR(64),
    message TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS impact_factors (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    conventional_name VARCHAR(255) NOT NULL,
    conventional_material VARCHAR(100) NOT NULL,
    conventional_plastic_weight_grams NUMERIC(10, 2),
    conventional_co2e_kg NUMERIC(10, 4),
    sustainable_product_id VARCHAR(64) REFERENCES products(id),
    sustainable_name VARCHAR(255) NOT NULL,
    sustainable_material VARCHAR(100) NOT NULL,
    sustainable_co2e_kg NUMERIC(10, 4),
    expected_lifespan_days INTEGER,
    lifetime_assumptions TEXT,
    plastic_avoided_per_unit_grams NUMERIC(10, 2),
    net_co2e_avoided_per_unit_kg NUMERIC(10, 4),
    data_status VARCHAR(64) DEFAULT 'verified',
    data_source TEXT NOT NULL,
    citation TEXT NOT NULL,
    unit_of_measurement VARCHAR(64) NOT NULL,
    image_url TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS customer_impact_logs (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(100),
    comparison_id VARCHAR(100),
    quantity_replaced INTEGER NOT NULL,
    plastic_saved_grams NUMERIC(10, 2) NOT NULL,
    co2e_saved_kg NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64),
    status VARCHAR(32) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    tool_calls TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`
];

async function runMigration() {
  console.log("=================================================");
  console.log("Connecting to Neon PostgreSQL...");
  console.log("Host:", NEON_HOST);
  console.log("=================================================");

  // 1. Test connection
  const ping = await queryNeon('SELECT NOW() as now, version() as version;');
  console.log("✓ Connected to Neon PostgreSQL successfully!");
  console.log("Server version:", ping.rows[0].version.split('\n')[0]);

  // 2. Create PostgreSQL schema
  console.log("\nCreating PostgreSQL tables in Neon one by one...");
  for (const sql of tableDefinitions) {
    await queryNeon(sql);
  }
  console.log("✓ All PostgreSQL tables created successfully in Neon!");

  // 3. Migrate data from SQLite to Neon
  const sqliteDb = new DatabaseSync(path.join(__dirname, 'ecosaathi.db'));

  console.log("\nMigrating data from SQLite to Neon PostgreSQL...");

  // Categories
  const categories = sqliteDb.prepare('SELECT * FROM categories').all();
  console.log(`Migrating ${categories.length} categories...`);
  for (const c of categories) {
    await queryNeon(`
      INSERT INTO categories (id, name, slug, type, description, icon)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
    `, [c.id, c.name, c.slug, c.type, c.description, c.icon]);
  }
  console.log("✓ Categories migrated.");

  // Products
  const products = sqliteDb.prepare('SELECT * FROM products').all();
  console.log(`Migrating ${products.length} products with authentic ecosaathi.com photos...`);
  for (const p of products) {
    await queryNeon(`
      INSERT INTO products (
        id, title, handle, description, material_id, use_category_id, price, compare_at_price,
        stock, sku, weight_grams, hsn_code, eco_impact_badge, plastic_saved_desc,
        care_instructions, craft_origin, featured, bestseller, rating, reviews_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price,
        description = EXCLUDED.description, eco_impact_badge = EXCLUDED.eco_impact_badge;
    `, [
      p.id, p.title, p.handle, p.description, p.material_id, p.use_category_id,
      p.price, p.compare_at_price, p.stock, p.sku, p.weight_grams, p.hsn_code,
      p.eco_impact_badge, p.plastic_saved_desc, p.care_instructions, p.craft_origin,
      p.featured, p.bestseller, p.rating, p.reviews_count
    ]);
  }
  console.log("✓ Products migrated.");

  // Product Images
  const images = sqliteDb.prepare('SELECT * FROM product_images').all();
  console.log(`Migrating ${images.length} product images...`);
  for (const img of images) {
    await queryNeon(`
      INSERT INTO product_images (id, product_id, url, alt_text, is_primary)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, is_primary = EXCLUDED.is_primary;
    `, [img.id, img.product_id, img.url, img.alt_text, img.is_primary]);
  }
  console.log("✓ Product images migrated.");

  // Product Variants
  const variants = sqliteDb.prepare('SELECT * FROM product_variants').all();
  console.log(`Migrating ${variants.length} product variants...`);
  for (const v of variants) {
    await queryNeon(`
      INSERT INTO product_variants (id, product_id, title, sku, price, stock, option1_name, option1_value)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock;
    `, [v.id, v.product_id, v.title, v.sku, v.price, v.stock, v.option1_name, v.option1_value]);
  }
  console.log("✓ Product variants migrated.");

  // Pincodes
  const pincodes = sqliteDb.prepare('SELECT * FROM pincodes').all();
  console.log(`Migrating ${pincodes.length} pincodes...`);
  for (const pin of pincodes) {
    await queryNeon(`
      INSERT INTO pincodes (pincode, city, state, serviceable, cod_available, delivery_days)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (pincode) DO NOTHING;
    `, [pin.pincode, pin.city, pin.state, pin.serviceable, pin.cod_available, pin.delivery_days]);
  }
  console.log("✓ Pincodes migrated.");

  // Impact Factors
  const factors = sqliteDb.prepare('SELECT * FROM impact_factors').all();
  console.log(`Migrating ${factors.length} impact factor benchmarks...`);
  for (const f of factors) {
    await queryNeon(`
      INSERT INTO impact_factors (
        id, category, conventional_name, conventional_material,
        conventional_plastic_weight_grams, conventional_co2e_kg,
        sustainable_product_id, sustainable_name, sustainable_material,
        sustainable_co2e_kg, expected_lifespan_days, lifetime_assumptions,
        plastic_avoided_per_unit_grams, net_co2e_avoided_per_unit_kg,
        data_status, data_source, citation, unit_of_measurement, image_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT (id) DO UPDATE SET
        image_url = EXCLUDED.image_url,
        net_co2e_avoided_per_unit_kg = EXCLUDED.net_co2e_avoided_per_unit_kg;
    `, [
      f.id, f.category, f.conventional_name, f.conventional_material,
      f.conventional_plastic_weight_grams, f.conventional_co2e_kg,
      f.sustainable_product_id, f.sustainable_name, f.sustainable_material,
      f.sustainable_co2e_kg, f.expected_lifespan_days, f.lifetime_assumptions,
      f.plastic_avoided_per_unit_grams, f.net_co2e_avoided_per_unit_kg,
      f.data_status, f.data_source, f.citation, f.unit_of_measurement, f.image_url
    ]);
  }
  console.log("✓ Impact factors migrated.");

  // Reviews (recreate table with matching columns)
  await queryNeon('DROP TABLE IF EXISTS reviews CASCADE;');
  await queryNeon(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      customer_name VARCHAR(255) NOT NULL,
      customer_city VARCHAR(100) DEFAULT 'Bhubaneswar',
      rating INTEGER NOT NULL,
      title VARCHAR(255),
      comment TEXT NOT NULL,
      verified_purchase SMALLINT DEFAULT 1,
      status VARCHAR(32) DEFAULT 'approved',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const reviews = sqliteDb.prepare('SELECT * FROM reviews').all();
  console.log(`Migrating ${reviews.length} customer reviews...`);
  for (const r of reviews) {
    await queryNeon(`
      INSERT INTO reviews (id, product_id, customer_name, customer_city, rating, title, comment, verified_purchase, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING;
    `, [r.id, r.product_id, r.customer_name, r.customer_city || 'Bhubaneswar', r.rating, r.title, r.comment, r.verified_purchase, r.status]);
  }
  console.log("✓ Reviews migrated.");

  // Check counts in Neon
  console.log("\n=================================================");
  console.log("Verifying record counts in Neon PostgreSQL:");
  const tables = ['categories', 'products', 'product_images', 'product_variants', 'pincodes', 'impact_factors', 'reviews'];
  for (const t of tables) {
    const res = await queryNeon(`SELECT COUNT(*) as count FROM ${t};`);
    console.log(`- ${t}: ${res.rows[0].count} records`);
  }
  console.log("=================================================");
  console.log("Migration to Neon PostgreSQL completed with 100% success!");
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
