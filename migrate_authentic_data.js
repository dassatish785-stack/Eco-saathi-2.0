const fs = require('fs');
const path = require('path');
const db = require('./db').getDb();

// 1. Create table for corporate inquiries if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS corporate_inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT,
    quantity INTEGER DEFAULT 50,
    required_date TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("Verified corporate_inquiries table.");

// 2. Load authentic catalog
const authenticProducts = JSON.parse(fs.readFileSync('scratch/authentic_catalog_clean.json', 'utf8'));

// Exact mapping from our DB existing products to authentic images and details
const existingProductImageMap = {
  // Oral Care
  'prod_01': {
    title: 'Pack of 4 Charcoal Bamboo Toothbrush for Adults',
    price: 180,
    mrp: 200,
    images: [
      'https://typof.co/stores/5638/iOU0b9MUj8Sbme65.webp',
      'https://typof.co/stores/5638/sxx6sRmUZK9pIZPz.webp'
    ]
  },
  'prod_02': {
    title: 'Pack of 4 Natural Bamboo Toothbrush for Adults',
    price: 180,
    mrp: 200,
    images: [
      'https://typof.co/stores/5638/qBpRl0OCvMAiaPjC.webp'
    ]
  },
  'prod_03': {
    title: 'Handcrafted Bamboo Travel Toothbrush Case',
    price: 180,
    mrp: 249,
    images: [
      'https://typof.co/stores/5638/2octQ1BBdyDbxzda.webp'
    ]
  },
  'prod_05': {
    title: 'Pack of 6 Bamboo Straws & 1 Cleaner',
    price: 99,
    mrp: 120,
    images: [
      'https://typof.co/stores/5638/MKF0tvnf.webp',
      'https://typof.co/stores/5638/Xa4Gro9s.webp'
    ]
  },
  'prod_06': {
    title: 'Bamboo Water Bottle - 450 ML Insulated Flask',
    price: 679,
    mrp: 800,
    images: [
      'https://typof.co/stores/5638/cg6wr81cqiYodO3N.webp',
      'https://typof.co/stores/5638/t30OoqGfZ2uak3vA.webp',
      'https://typof.co/stores/5638/iBU861wh6IywcN5h.webp'
    ]
  },
  'prod_07': {
    title: 'Bamboo Mobile Amplifier / Acoustic Speaker Dock',
    price: 319,
    mrp: 339,
    images: [
      'https://typof.co/stores/5638/WPdcPcBb.webp'
    ]
  },
  'prod_08': {
    title: 'Eco-Friendly Bamboo Safety Razor',
    price: 75,
    mrp: 99,
    images: [
      'https://typof.co/stores/5638/1Uv01wXj.webp'
    ]
  },
  // Sabai Grass
  'prod_09': {
    title: 'Handcrafted Sabai Grass Hamper Basket with Lid',
    price: 699,
    mrp: 749,
    images: [
      'https://typof.co/stores/5638/O19i3vZD.webp',
      'https://typof.co/stores/5638/fKigXvSn.webp'
    ]
  },
  'prod_10': {
    title: 'Handwoven Sabai Grass Planter Basket',
    price: 729,
    mrp: 749,
    images: [
      'https://typof.co/stores/5638/8K9Bl4SaQ9ZEhyfv.webp',
      'https://typof.co/stores/5638/SCv54LPYwHApLk2O.webp'
    ]
  },
  'prod_11': {
    title: 'Handwoven Sabai Grass Coasters - Set of 6 with Holder',
    price: 379,
    mrp: 399,
    images: [
      'https://typof.co/stores/5638/1MGs8jpZF6tDWrqg.webp'
    ]
  },
  'prod_13': {
    title: 'Handwoven Light Green Sabai Grass Handbag',
    price: 1249,
    mrp: 1299,
    images: [
      'https://typof.co/stores/5638/zKhhmgFC.webp'
    ]
  },
  // Jute & Juco
  'prod_17': {
    title: 'Juco Lunch & Daily Shopping Tote Bag',
    price: 379,
    mrp: 399,
    images: [
      'https://typof.co/stores/5638/W9ZllzX6KaVOrw53.webp',
      'https://typof.co/stores/5638/rfejclqOkpjnJPxn.webp'
    ]
  },
  'prod_18': {
    title: 'Juco Executive Laptop Messenger Bag',
    price: 2000,
    mrp: 2499,
    images: [
      'https://typof.co/stores/5638/sxwhGX1fx1C7ajeO.webp',
      'https://typof.co/stores/5638/oUKPPsM4sozcUwwE.webp'
    ]
  },
  // Neem Wood
  'prod_22': {
    title: 'Neem Wood Handle Comb (Detangler)',
    price: 130,
    mrp: 140,
    images: [
      'https://typof.co/stores/5638/h3osGaXW2MRPRCZy.webp'
    ]
  },
  'prod_23': {
    title: 'Neem Wood Regular Wide-Tooth Comb',
    price: 130,
    mrp: 140,
    images: [
      'https://typof.co/stores/5638/ZcsyEA2fF6zrMJZ6.webp'
    ]
  },
  'prod_24': {
    title: 'Neem Wood Shampoo Comb',
    price: 100,
    mrp: 110,
    images: [
      'https://typof.co/stores/5638/Qq2dhGVmPreS9Bs2.webp'
    ]
  },
  'prod_25': {
    title: 'Neem Wood Pocket Comb (Handy Travel Size)',
    price: 55,
    mrp: 60,
    images: [
      'https://typof.co/stores/5638/qesLN1GYsaMXg1M6.webp'
    ]
  },
  'prod_26': {
    title: 'Neem Wood Beard & Moustache Styling Comb',
    price: 75,
    mrp: 80,
    images: [
      'https://typof.co/stores/5638/ZcsyEA2fF6zrMJZ6.webp'
    ]
  }
};

// Update existing products with authentic images
const updateProdStmt = db.prepare('UPDATE products SET title = ?, price = ?, compare_at_price = ? WHERE id = ?');
const deleteImgStmt = db.prepare('DELETE FROM product_images WHERE product_id = ?');
const insertImgStmt = db.prepare('INSERT INTO product_images (id, product_id, url, alt_text, is_primary) VALUES (?, ?, ?, ?, ?)');

let updatedCount = 0;
for (const [id, data] of Object.entries(existingProductImageMap)) {
  const check = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (check) {
    updateProdStmt.run(data.title, data.price, data.mrp, id);
    deleteImgStmt.run(id);
    data.images.forEach((imgUrl, i) => {
      insertImgStmt.run(`img_${id}_${i+1}`, id, imgUrl, data.title, i === 0 ? 1 : 0);
    });
    updatedCount++;
  }
}
console.log(`Updated ${updatedCount} existing products with authentic ecosaathi.com photos and prices.`);

// 3. New Authentic Products from ecosaathi.com that were missing
const newAuthenticProducts = [
  {
    id: 'prod_eco_53130',
    title: 'Pack of 4 Wheat Straw Toothbrush',
    handle: 'pack-of-4-wheat-straw-toothbrush',
    desc: 'Biodegradable toothbrush handles made from natural agricultural wheat straw bioplastic. Ergonomic handle with ultra-fine charcoal bristles to clean gently between teeth while eliminating fossil plastics.',
    material_id: 'mat_organic',
    use_category_id: 'use_oral',
    price: 219,
    compare_at_price: 240,
    stock: 50,
    sku: 'ECO-WHT-001',
    weight_grams: 80,
    hsn_code: '96032100',
    eco_impact_badge: '100% Wheat Bioplastic Handle',
    plastic_saved_desc: 'Replaces 4 single-use plastic toothbrushes per pack',
    care_instructions: 'Keep in an open, dry toothbrush holder. Replace every 3 months.',
    craft_origin: 'Eco Saathi Circular Workshop, Odisha',
    featured: 1,
    bestseller: 1,
    rating: 4.8,
    reviews_count: 32,
    images: ['https://typof.co/stores/5638/uTHAdQXrknymRLhM.webp']
  },
  {
    id: 'prod_eco_50902',
    title: 'Bamboo Tongue Cleaner - Pack of 4 Pcs',
    handle: 'bamboo-tongue-cleaner-pack-of-4',
    desc: 'Handcrafted seasoned bamboo tongue scrapers. Smooth curved edges designed to remove oral toxins, freshen breath naturally, and maintain oral hygiene without harsh plastic scrapers.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_oral',
    price: 158,
    compare_at_price: 160,
    stock: 65,
    sku: 'ECO-BAM-TC4',
    weight_grams: 40,
    hsn_code: '44219990',
    eco_impact_badge: 'Plastic-Free Oral Hygiene',
    plastic_saved_desc: 'Replaces 4 plastic tongue scrapers',
    care_instructions: 'Rinse with warm water and wipe dry after each use.',
    craft_origin: 'Nayagarh Bamboo Cluster, Odisha',
    featured: 0,
    bestseller: 1,
    rating: 4.7,
    reviews_count: 19,
    images: [
      'https://typof.co/stores/5638/mAZ6Fp6D.webp',
      'https://typof.co/stores/5638/g3hSz1nb.webp',
      'https://typof.co/stores/5638/HuPq21r0BVXJSonD.webp'
    ]
  },
  {
    id: 'prod_eco_35117',
    title: 'Bamboo Water Bottle - 500 ML (Thermos Flask)',
    handle: 'bamboo-water-bottle-500ml',
    desc: 'Premium natural bamboo outer casing with double-walled 304 food-grade stainless steel interior and removable tea infuser strainer. Keeps beverages hot or cold for 12+ hours with zero plastic contact.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_kitchen',
    price: 879,
    compare_at_price: 1000,
    stock: 40,
    sku: 'ECO-BAM-BOT500',
    weight_grams: 420,
    hsn_code: '96170011',
    eco_impact_badge: 'Zero Plastic Beverage Container',
    plastic_saved_desc: 'Replaces 300+ disposable PET bottles annually',
    care_instructions: 'Hand-wash steel interior. Wipe exterior bamboo with damp cloth and oil occasionally.',
    craft_origin: 'Bhubaneswar, Odisha',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 57,
    images: [
      'https://typof.co/stores/5638/wP65ZUdnUgADBF9G.webp',
      'https://typof.co/stores/5638/kNxQZIQmAguPSjig.webp',
      'https://typof.co/stores/5638/9UY8aZbMpLGwN6D9.webp'
    ]
  },
  {
    id: 'prod_eco_223915',
    title: 'Organic Loofah (Rectangular) - Pack of 3 Pcs',
    handle: 'organic-loofah-rectangular-pack-of-3',
    desc: '100% natural dried Ridge Gourd (Luffa) bath scrubber with soft cotton border and hanging rope. Gently exfoliates dead skin cells, stimulates blood circulation, and composts naturally in soil after use.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 199,
    compare_at_price: 249,
    stock: 80,
    sku: 'ECO-LOOF-REC',
    weight_grams: 90,
    hsn_code: '14049090',
    eco_impact_badge: '100% Plant Fiber & Compostable',
    plastic_saved_desc: 'Eliminates microplastic shedding from synthetic nylon loofahs',
    care_instructions: 'Hang dry in a well-ventilated area after showering.',
    craft_origin: 'Organic Farmer Cooperatives, Odisha',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 44,
    images: [
      'https://typof.co/stores/5638/g587ffXjXcKua4DU.webp',
      'https://typof.co/stores/5638/SHNuTEsDbquQDznR.webp'
    ]
  },
  {
    id: 'prod_eco_190079',
    title: 'Organic Loofah (Round Scrub Pads) - Pack of 3 Pcs',
    handle: 'organic-loofah-round-pack-of-3',
    desc: 'Circular pure plant luffa body scrubbers with hand-strap back. Ideal for face care, body wash lathering, and completely biodegradable zero-waste bathing.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 199,
    compare_at_price: 249,
    stock: 75,
    sku: 'ECO-LOOF-RND',
    weight_grams: 85,
    hsn_code: '14049090',
    eco_impact_badge: 'Biodegradable Bath Scrubber',
    plastic_saved_desc: 'Replaces 3 synthetic plastic shower poufs',
    care_instructions: 'Rinse thoroughly and hang dry in sunlight periodically.',
    craft_origin: 'Odisha Rural Natural Fiber Project',
    featured: 0,
    bestseller: 1,
    rating: 4.8,
    reviews_count: 28,
    images: [
      'https://typof.co/stores/5638/HpifWCoo2KvljjQN.webp',
      'https://typof.co/stores/5638/Lm9NMfvZIqtH1GMa.webp'
    ]
  },
  {
    id: 'prod_eco_223916',
    title: 'Organic Loofah (Cylindrical Whole Gourd) - Pack of 3 Pcs',
    handle: 'organic-loofah-cylindrical-pack-of-3',
    desc: 'Whole cylindrical natural loofah gourds with hanging loop. Great for deep body cleansing and scrubbing back and shoulders naturally.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 199,
    compare_at_price: 249,
    stock: 60,
    sku: 'ECO-LOOF-CYL',
    weight_grams: 110,
    hsn_code: '14049090',
    eco_impact_badge: 'Farm Grown Exfoliator',
    plastic_saved_desc: 'Zero plastic packaging and zero microplastics',
    care_instructions: 'Hang dry after each wash.',
    craft_origin: 'Rural Farmer Collective, Odisha',
    featured: 0,
    bestseller: 0,
    rating: 4.7,
    reviews_count: 15,
    images: [
      'https://typof.co/stores/5638/VNFjpb0Q6Ks1EoIq.webp',
      'https://typof.co/stores/5638/ncaH8yMuGCb9TS5a.webp'
    ]
  },
  {
    id: 'prod_eco_223917',
    title: 'Organic Loofah - Set of 3 Varieties',
    handle: 'organic-loofah-set-of-3-varieties',
    desc: 'Assorted gift set featuring 1 Rectangular Scrub, 1 Round Pad, and 1 Cylindrical Loofah. Discover your family’s favorite natural shower companion.',
    material_id: 'mat_organic',
    use_category_id: 'use_gifting',
    price: 209,
    compare_at_price: 249,
    stock: 55,
    sku: 'ECO-LOOF-VAR',
    weight_grams: 120,
    hsn_code: '14049090',
    eco_impact_badge: 'Zero-Waste Shower Routine',
    plastic_saved_desc: 'Replaces 3 synthetic bath sponges',
    care_instructions: 'Hang dry in airy space.',
    craft_origin: 'Odisha Natural Artisans',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 36,
    images: [
      'https://typof.co/stores/5638/W1VWgeIuJTIHBtIU.webp',
      'https://typof.co/stores/5638/GC26WCDRb1ZgvHed.webp'
    ]
  },
  {
    id: 'prod_eco_236124',
    title: 'Bamboo Cotton Earbuds (White) - Pack of 3 (300 Buds)',
    handle: 'bamboo-cotton-earbuds-white-pack-of-3',
    desc: 'Sturdy seasoned bamboo sticks tipped with 100% pure organic soft cotton. Packed in biodegradable paper boxes. Perfect for personal hygiene, cosmetics, and craft touch-ups.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_personal',
    price: 165,
    compare_at_price: 195,
    stock: 90,
    sku: 'ECO-BAM-BUD-W',
    weight_grams: 140,
    hsn_code: '56012110',
    eco_impact_badge: '100% Plastic-Free Stem',
    plastic_saved_desc: 'Saves 300 plastic swab sticks from choking marine life',
    care_instructions: 'Store in dry place away from direct moisture.',
    craft_origin: 'Eco Saathi Workshop, Bhubaneswar',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 53,
    images: ['https://typof.co/stores/5638/429f28wml3vn6gDp.webp']
  },
  {
    id: 'prod_eco_236125',
    title: 'Premium Bamboo Earbuds (Blue Cotton) - Pack of 3 (300 Buds)',
    handle: 'premium-bamboo-earbuds-blue-pack-of-3',
    desc: 'Naturally dyed sky-blue pure cotton buds with biodegradable bamboo stick cores. Chemical-free and gentle on delicate skin.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_personal',
    price: 240,
    compare_at_price: 285,
    stock: 50,
    sku: 'ECO-BAM-BUD-B',
    weight_grams: 140,
    hsn_code: '56012110',
    eco_impact_badge: 'Natural Botanical Dye',
    plastic_saved_desc: 'Saves 300 plastic swab sticks',
    care_instructions: 'Keep box sealed when not in use.',
    craft_origin: 'Eco Saathi Workshop, Bhubaneswar',
    featured: 0,
    bestseller: 0,
    rating: 4.8,
    reviews_count: 22,
    images: ['https://typof.co/stores/5638/i8dBkEeLPxwUQD2H.webp']
  },
  {
    id: 'prod_eco_236126',
    title: 'Premium Bamboo Earbuds (Green Cotton) - Pack of 3 (300 Buds)',
    handle: 'premium-bamboo-earbuds-green-pack-of-3',
    desc: 'Earth green naturally tinted soft cotton swabs on bamboo stems. 100% compostable in home compost within 4 months.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_personal',
    price: 240,
    compare_at_price: 285,
    stock: 45,
    sku: 'ECO-BAM-BUD-G',
    weight_grams: 140,
    hsn_code: '56012110',
    eco_impact_badge: 'Home Compostable Swabs',
    plastic_saved_desc: 'Saves 300 plastic swab sticks',
    care_instructions: 'Keep dry.',
    craft_origin: 'Eco Saathi Workshop, Bhubaneswar',
    featured: 0,
    bestseller: 0,
    rating: 4.8,
    reviews_count: 18,
    images: ['https://typof.co/stores/5638/FqAmV9paM5tB0sSB.webp']
  },
  {
    id: 'prod_eco_236127',
    title: 'Premium Bamboo Earbuds (Pink Cotton) - Pack of 3 (300 Buds)',
    handle: 'premium-bamboo-earbuds-pink-pack-of-3',
    desc: 'Soft blush pink organic cotton tipped bamboo swabs. Completely free from bleaching agents and plastics.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_personal',
    price: 240,
    compare_at_price: 285,
    stock: 50,
    sku: 'ECO-BAM-BUD-P',
    weight_grams: 140,
    hsn_code: '56012110',
    eco_impact_badge: 'Bleach-Free Organic Cotton',
    plastic_saved_desc: 'Saves 300 plastic swab sticks',
    care_instructions: 'Keep dry.',
    craft_origin: 'Eco Saathi Workshop, Bhubaneswar',
    featured: 0,
    bestseller: 0,
    rating: 4.8,
    reviews_count: 20,
    images: ['https://typof.co/stores/5638/eyRoAd5GsDNdRimn.webp']
  },
  {
    id: 'prod_eco_35115',
    title: 'Bamboo Clothes Hanger',
    handle: 'bamboo-clothes-hanger',
    desc: 'Sturdy, ergonomically contoured seasoned bamboo clothes hanger with 360-degree swivel steel hook. Preserves coat shoulders without bending or cracking like cheap brittle plastics.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_home',
    price: 169,
    compare_at_price: 179,
    stock: 60,
    sku: 'ECO-BAM-HNG',
    weight_grams: 150,
    hsn_code: '44219990',
    eco_impact_badge: 'Solid Timber Bamboo Hanger',
    plastic_saved_desc: 'Replaces fragile polystyrene plastic hangers',
    care_instructions: 'Wipe with dry cloth.',
    craft_origin: 'Nayagarh Bamboo Cluster, Odisha',
    featured: 0,
    bestseller: 0,
    rating: 4.7,
    reviews_count: 14,
    images: [
      'https://typof.co/stores/5638/ZRfU40Fm.webp',
      'https://typof.co/stores/5638/gLj54iID.webp'
    ]
  },
  {
    id: 'prod_eco_35114',
    title: 'Bamboo Ball Pen - Pack of 2 Pcs',
    handle: 'bamboo-ball-pen-pack-of-2',
    desc: 'Refillable natural bamboo barrel ballpoint pens with smooth writing blue ink. Hand-turned bamboo body feels warm in hand and replaces throwaway plastic stationery.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_gifting',
    price: 159,
    compare_at_price: 180,
    stock: 80,
    sku: 'ECO-BAM-PEN2',
    weight_grams: 50,
    hsn_code: '96081019',
    eco_impact_badge: 'Refillable Bamboo Barrel',
    plastic_saved_desc: 'Replaces disposable polypropylene pens',
    care_instructions: 'Refill with standard ballpoint refills when ink is finished.',
    craft_origin: 'Ghatikia Workshop, Bhubaneswar',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 41,
    images: ['https://typof.co/stores/5638/2octQ1BBdyDbxzda.webp']
  },
  {
    id: 'prod_eco_259016',
    title: 'Organic Handmade Neem Soap (Pack of 4 Pcs)',
    handle: 'organic-handmade-neem-soap-pack-of-4',
    desc: 'Cold-pressed organic artisan bath bars made with pure fresh Neem leaf extract, cold-pressed coconut oil, and unrefined shea butter. Naturally antibacterial, relieves acne, and leaves skin refreshed without SLS, parabens, or synthetic fragrance.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 280,
    compare_at_price: 300,
    stock: 70,
    sku: 'ECO-SOP-NEEM4',
    weight_grams: 400,
    hsn_code: '34011110',
    eco_impact_badge: 'Cold-Pressed Herbal Bath Bar',
    plastic_saved_desc: 'Replaces 4 plastic liquid body-wash bottles',
    care_instructions: 'Keep on a well-draining wooden soap dish between uses.',
    craft_origin: 'Rural Herbal Cooperative, Odisha',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 62,
    images: [
      'https://typof.co/stores/5638/zesYuqT82MchgbqG.webp',
      'https://typof.co/stores/5638/yKATsR1PHVO43VS8.webp'
    ]
  },
  {
    id: 'prod_eco_259017',
    title: 'Organic Handmade Aloe Vera Soap (Pack of 4 Pcs)',
    handle: 'organic-handmade-aloe-vera-soap-pack-of-4',
    desc: 'Soothing ultra-moisturizing organic soap infused with pure farm-harvested Aloe Vera gel, vitamin E, and sweet almond oil. Deeply hydrates sensitive and dry skin.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 280,
    compare_at_price: 300,
    stock: 65,
    sku: 'ECO-SOP-ALOE4',
    weight_grams: 400,
    hsn_code: '34011110',
    eco_impact_badge: 'Fresh Farm Aloe Vera Gel',
    plastic_saved_desc: 'Eliminates plastic shower gel bottles',
    care_instructions: 'Store on a slotted wooden dish.',
    craft_origin: 'Rural Herbal Cooperative, Odisha',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 48,
    images: [
      'https://typof.co/stores/5638/bwhTxSRgZIuXwx4u.webp',
      'https://typof.co/stores/5638/VAKcIEB8ohzavfwr.webp'
    ]
  },
  {
    id: 'prod_eco_259015',
    title: 'Organic Handmade Turmeric & Honey Soap (Pack of 4 Pcs)',
    handle: 'organic-handmade-turmeric-honey-soap-pack-of-4',
    desc: 'Brightening Ayurvedic cold-process soap made with wild forest honey and organically cultivated Kasturi turmeric. Evens out skin tone, reduces pigmentation, and imparts a natural golden glow.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 299,
    compare_at_price: 320,
    stock: 60,
    sku: 'ECO-SOP-TURM4',
    weight_grams: 400,
    hsn_code: '34011110',
    eco_impact_badge: 'Wild Forest Honey & Turmeric',
    plastic_saved_desc: 'Zero plastic bottle packaging',
    care_instructions: 'Keep dry after shower.',
    craft_origin: 'Kandhamal Organic Collective, Odisha',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 51,
    images: [
      'https://typof.co/stores/5638/ZJo9VsSOHcfxtnGH.webp',
      'https://typof.co/stores/5638/7BTJ2If3LkuvQwdf.webp'
    ]
  },
  {
    id: 'prod_eco_259014',
    title: 'Organic Handmade Charcoal Soap (Pack of 4 Pcs)',
    handle: 'organic-handmade-charcoal-soap-pack-of-4',
    desc: 'Activated coconut shell charcoal soap that draws out deep pores impurities, environmental pollution particles, and excess sebum for clear, refreshed skin.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 299,
    compare_at_price: 320,
    stock: 55,
    sku: 'ECO-SOP-CHAR4',
    weight_grams: 400,
    hsn_code: '34011110',
    eco_impact_badge: 'Activated Coconut Charcoal',
    plastic_saved_desc: 'Replaces 4 bottles of body wash',
    care_instructions: 'Keep dry after shower.',
    craft_origin: 'Rural Herbal Cooperative, Odisha',
    featured: 0,
    bestseller: 1,
    rating: 4.8,
    reviews_count: 39,
    images: [
      'https://typof.co/stores/5638/j05WfiJ7QuZoldKW.webp',
      'https://typof.co/stores/5638/hnGomFniuzbjEK1h.webp'
    ]
  },
  {
    id: 'prod_eco_259013',
    title: 'Organic Handmade Sandalwood Soap (Pack of 4 Pcs)',
    handle: 'organic-handmade-sandalwood-soap-pack-of-4',
    desc: 'Luxurious therapeutic soap crafted with pure sandalwood oil and botanical extracts. Calming classic fragrance that leaves skin silky smooth and naturally scented.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 299,
    compare_at_price: 320,
    stock: 50,
    sku: 'ECO-SOP-SAND4',
    weight_grams: 400,
    hsn_code: '34011110',
    eco_impact_badge: 'Pure Sandalwood Extract',
    plastic_saved_desc: 'Zero plastic waste packaging',
    care_instructions: 'Keep dry after use.',
    craft_origin: 'Rural Herbal Cooperative, Odisha',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 45,
    images: [
      'https://typof.co/stores/5638/SbaoEM15C4YIZmto.webp',
      'https://typof.co/stores/5638/upudFsqbtNNif3ER.webp'
    ]
  },
  {
    id: 'prod_eco_259012',
    title: 'Organic Handmade Lavender Soap (Pack of 4 Pcs)',
    handle: 'organic-handmade-lavender-soap-pack-of-4',
    desc: 'Relaxing aromatherapy soap scented with pure lavender essential oil. Calms nerves, relieves stress after a long day, and nourishes skin with rich natural botanicals.',
    material_id: 'mat_organic',
    use_category_id: 'use_personal',
    price: 299,
    compare_at_price: 320,
    stock: 50,
    sku: 'ECO-SOP-LAV4',
    weight_grams: 400,
    hsn_code: '34011110',
    eco_impact_badge: 'Aromatherapy Lavender Essential Oil',
    plastic_saved_desc: 'Replaces 4 bottles of liquid body wash',
    care_instructions: 'Keep dry after shower.',
    craft_origin: 'Rural Herbal Cooperative, Odisha',
    featured: 0,
    bestseller: 1,
    rating: 4.8,
    reviews_count: 37,
    images: [
      'https://typof.co/stores/5638/Y7cUK6VZNcNC6uqa.webp',
      'https://typof.co/stores/5638/KaR5daqgBpD1Qyj6.webp'
    ]
  },
  {
    id: 'prod_eco_259011',
    title: 'Wheat Straw Flat Toothbrush (Pack of 6 Pcs)',
    handle: 'wheat-straw-flat-toothbrush-pack-of-6',
    desc: 'Value family pack of 6 flat-handle eco toothbrushes made from upcycled agricultural wheat straw biocomposite. Ultra-light, strong, and reduces reliance on petroleum-based plastics.',
    material_id: 'mat_organic',
    use_category_id: 'use_oral',
    price: 174,
    compare_at_price: 180,
    stock: 70,
    sku: 'ECO-WHT-FLAT6',
    weight_grams: 90,
    hsn_code: '96032100',
    eco_impact_badge: 'Agricultural Straw Upcycled',
    plastic_saved_desc: 'Replaces 6 conventional plastic toothbrushes',
    care_instructions: 'Store upright in open airflow.',
    craft_origin: 'Eco Saathi Circular Workshop, Odisha',
    featured: 1,
    bestseller: 1,
    rating: 4.8,
    reviews_count: 29,
    images: [
      'https://typof.co/stores/5638/mKQDooGuj6om4JHN.webp',
      'https://typof.co/stores/5638/gOfVE7QDnTWJqpIA.webp'
    ]
  },
  {
    id: 'prod_eco_239069',
    title: 'Premium Neem Wood Fanch Comb',
    handle: 'premium-neem-wood-fanch-comb',
    desc: 'Intricately carved artisan neem wood comb designed for deep scalp massage, detangling thick curls, and stimulating healthy root growth naturally.',
    material_id: 'mat_neem',
    use_category_id: 'use_personal',
    price: 280,
    compare_at_price: 300,
    stock: 45,
    sku: 'ECO-NEEM-FANCH',
    weight_grams: 80,
    hsn_code: '44219990',
    eco_impact_badge: 'Medicinal Neem Wood',
    plastic_saved_desc: 'Replaces static-inducing plastic hair combs',
    care_instructions: 'Oil with pure coconut or mustard oil monthly. Do not soak in water.',
    craft_origin: 'Khandagiri Woodcraft Cluster, Odisha',
    featured: 1,
    bestseller: 0,
    rating: 4.9,
    reviews_count: 24,
    images: ['https://typof.co/stores/5638/4ux7J7FmhOFOjCDh.webp']
  },
  {
    id: 'prod_eco_239068',
    title: 'Neem Wood Bina Comb',
    handle: 'neem-wood-bina-comb',
    desc: 'Compact curved neem comb with fine rounded teeth. Gentle on hair cuticles, prevents static, and reduces hair breakage and dandruff.',
    material_id: 'mat_neem',
    use_category_id: 'use_personal',
    price: 140,
    compare_at_price: 150,
    stock: 55,
    sku: 'ECO-NEEM-BINA',
    weight_grams: 60,
    hsn_code: '44219990',
    eco_impact_badge: 'Anti-Static & Dandruff Relief',
    plastic_saved_desc: '100% natural seasoned neem wood',
    care_instructions: 'Wipe clean with cloth.',
    craft_origin: 'Khandagiri Woodcraft Cluster, Odisha',
    featured: 0,
    bestseller: 1,
    rating: 4.8,
    reviews_count: 31,
    images: ['https://typof.co/stores/5638/eTIyuaHUEYnljEaQ.webp']
  },
  {
    id: 'prod_eco_238981',
    title: 'Bamboo Facial Tissues - Pack of 100 Pulls (3 Ply) - Pack of 2 Pcs',
    handle: 'bamboo-facial-tissues-100-pulls-3-ply-pack-of-2',
    desc: 'Silky soft, 3-ply facial wipes made from 100% sustainably grown bamboo pulp. Chlorine bleach-free, hypoallergenic, super-absorbent, and saves trees from deforestation.',
    material_id: 'mat_bamboo',
    use_category_id: 'use_personal',
    price: 300,
    compare_at_price: 298,
    stock: 65,
    sku: 'ECO-BAM-TISS2',
    weight_grams: 350,
    hsn_code: '48182000',
    eco_impact_badge: 'Tree-Free Bamboo Pulp',
    plastic_saved_desc: 'Saves forest trees and eliminates virgin wood pulp',
    care_instructions: 'Store in dry place.',
    craft_origin: 'Eco Saathi Paper Workshop, Bhubaneswar',
    featured: 1,
    bestseller: 1,
    rating: 4.9,
    reviews_count: 38,
    images: [
      'https://typof.co/stores/5638/zqImZF0We1WhZTbj.webp',
      'https://typof.co/stores/5638/6GFScf9v7sFrYd56.webp'
    ]
  }
];

const insertNewProdStmt = db.prepare(`
  INSERT OR REPLACE INTO products (
    id, title, handle, description, material_id, use_category_id, price, compare_at_price,
    stock, sku, weight_grams, hsn_code, eco_impact_badge, plastic_saved_desc,
    care_instructions, craft_origin, featured, bestseller, rating, reviews_count
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  )
`);

let insertedNewCount = 0;
for (const p of newAuthenticProducts) {
  insertNewProdStmt.run(
    p.id, p.title, p.handle, p.desc, p.material_id, p.use_category_id,
    p.price, p.compare_at_price, p.stock, p.sku, p.weight_grams, p.hsn_code,
    p.eco_impact_badge, p.plastic_saved_desc, p.care_instructions, p.craft_origin,
    p.featured, p.bestseller, p.rating, p.reviews_count
  );

  deleteImgStmt.run(p.id);
  p.images.forEach((imgUrl, i) => {
    insertImgStmt.run(`img_${p.id}_${i+1}`, p.id, imgUrl, p.title, i === 0 ? 1 : 0);
  });
  insertedNewCount++;
}
console.log(`Inserted/updated ${insertedNewCount} new authentic products from ecosaathi.com.`);

// 4. Update impact_data.json and impact_factors with authentic images
const impactDataFile = path.join(__dirname, 'impact_data.json');
if (fs.existsSync(impactDataFile)) {
  const impactData = JSON.parse(fs.readFileSync(impactDataFile, 'utf8'));
  const authenticImpactImages = {
    'factor_toothbrush': 'https://typof.co/stores/5638/iOU0b9MUj8Sbme65.webp',
    'factor_comb': 'https://typof.co/stores/5638/h3osGaXW2MRPRCZy.webp',
    'factor_bag': 'https://typof.co/stores/5638/W9ZllzX6KaVOrw53.webp',
    'factor_bottle': 'https://typof.co/stores/5638/cg6wr81cqiYodO3N.webp',
    'factor_placemat': 'https://typof.co/stores/5638/1MGs8jpZF6tDWrqg.webp'
  };

  impactData.comparisons.forEach(c => {
    if (authenticImpactImages[c.id]) {
      c.sustainable_product.image = authenticImpactImages[c.id];
      db.prepare('UPDATE impact_factors SET image_url = ? WHERE id = ?').run(authenticImpactImages[c.id], c.id);
    }
  });

  fs.writeFileSync(impactDataFile, JSON.stringify(impactData, null, 2), 'utf8');
  console.log("Updated impact_data.json and impact_factors table with authentic ecosaathi.com product images.");
}

const totalProds = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
console.log(`\nMigration completed successfully! Total products in catalog now: ${totalProds}`);
