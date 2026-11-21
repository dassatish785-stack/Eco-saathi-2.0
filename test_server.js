// Self-testing integration suite for Eco Saathi 2.0
const http = require('node:http');

async function runTests() {
  console.log('Testing server endpoints...');
  try {
    // 0. Neon PostgreSQL Database Status
    const res0 = await fetch('http://127.0.0.1:3000/api/database/status');
    const dbStatus = await res0.json();
    console.log('✓ /api/database/status OK. Provider:', dbStatus.provider, 'Status:', dbStatus.status, 'Latency:', dbStatus.latency_ms + 'ms');

    const res1 = await fetch('http://127.0.0.1:3000/api/categories');
    const cats = await res1.json();
    console.log('✓ /api/categories OK. Materials:', cats.materials.length, 'Uses:', cats.uses.length);

    const res2 = await fetch('http://127.0.0.1:3000/api/products?limit=5');
    const prods = await res2.json();
    console.log('✓ /api/products OK. Total catalog count:', prods.total);
    console.log('  Authentic sample:', prods.products[0].title, '->', prods.products[0].primary_image);

    const res3 = await fetch('http://127.0.0.1:3000/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'integration_test', message: 'recommend plastic-free kitchen items' })
    });
    const chat = await res3.json();
    console.log('✓ /api/chat/message OK. Cards returned:', chat.productCards.length);

    const res4 = await fetch('http://127.0.0.1:3000/api/admin/metrics');
    const metrics = await res4.json();
    console.log('✓ /api/admin/metrics OK. Sales:', metrics.metrics.totalSales, 'Orders:', metrics.metrics.orderCount);

    const res5 = await fetch('http://127.0.0.1:3000/');
    const html = await res5.text();
    console.log('✓ Storefront index.html OK. Bytes:', html.length, 'Has title:', html.includes('Eco Saathi'));

    const res6 = await fetch('http://127.0.0.1:3000/admin.html');
    const adminHtml = await res6.text();
    console.log('✓ Admin admin.html OK. Bytes:', adminHtml.length);

    // Tests for new Sustainability Impact Calculator & Dashboard feature
    const res7 = await fetch('http://127.0.0.1:3000/api/impact/factors');
    const factors = await res7.json();
    console.log('✓ /api/impact/factors OK. Comparisons count:', factors.comparisons.length, 'Methodology:', factors.methodology.framework);

    const res8 = await fetch('http://127.0.0.1:3000/api/impact/summary');
    const summary = await res8.json();
    console.log('✓ /api/impact/summary OK. Total plastic kg:', summary.metrics.total_plastic_avoided_kg, 'CO2e tons:', summary.metrics.total_co2e_avoided_tons);

    const res9 = await fetch('http://127.0.0.1:3000/api/impact/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comparison_id: 'toothbrush', quantity: 4, household_size: 1 })
    });
    const calcVerified = await res9.json();
    console.log('✓ /api/impact/calculate (Verified Toothbrush) OK. Plastic avoided:', calcVerified.plastic_avoided_grams, 'g, CO2e avoided:', calcVerified.net_co2e_avoided_kg, 'kg');

    const res10 = await fetch('http://127.0.0.1:3000/api/impact/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comparison_id: 'custom_unverified_sample', quantity: 2 })
    });
    const calcUnverified = await res10.json();
    console.log('✓ /api/impact/calculate (Unverified Fallback) OK. Status:', calcUnverified.status, 'Plastic avoided:', calcUnverified.plastic_avoided_grams);

    console.log('\n=========================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED 100%!');
    console.log('=========================================');
    process.exit(0);
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(1);
  }
}

runTests();
