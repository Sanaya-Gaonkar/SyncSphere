import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding SyncSphere PIM database...');

  // 1. Settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeUrl: 'https://demo-store.woocommerce.com',
      consumerKey: 'ck_demo_9876543210abcdef9876543210abcdef98765432',
      consumerSecret: 'cs_demo_1234567890abcdef1234567890abcdef12345678',
      apiVersion: 'wc/v3',
      verifySsl: true,
      webhookSecret: 'whsec_demo_syncsphere_supersecret2026',
      isDemoMode: true,
      autoSyncOnSave: false,
    },
  });

  // 2. Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const editorPassword = await bcrypt.hash('editor123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@syncsphere.io' },
    update: {},
    create: {
      email: 'admin@syncsphere.io',
      password: adminPassword,
      name: 'Sarah Jenkins (Admin)',
      role: 'ADMIN',
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@syncsphere.io' },
    update: {},
    create: {
      email: 'editor@syncsphere.io',
      password: editorPassword,
      name: 'Marcus Vance (Editor)',
      role: 'EDITOR',
    },
  });
  const seedAlreadyRun = Boolean(
    await prisma.auditLog.findFirst({ where: { action: 'SYSTEM_SEEDED' } })
  );

  // 3. Categories
  const categoriesData = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets, compute devices, and peripherals' },
    { name: 'Audio', slug: 'audio', description: 'High-fidelity audio monitors and accessories' },
    { name: 'Apparel', slug: 'apparel', description: 'Everyday lifestyle clothing and outerwear' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Smart appliances, homeware, and decor' },
    { name: 'Accessories', slug: 'accessories', description: 'Bags, straps, charging cables, and mounts' },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 4. Attributes
  const attributesData = [
    { name: 'Color', slug: 'color', options: JSON.stringify(['Matte Black', 'Space Gray', 'Forest Green', 'Arctic White', 'Crimson Red']) },
    { name: 'Size', slug: 'size', options: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']) },
    { name: 'Material', slug: 'material', options: JSON.stringify(['Anodized Aluminum', 'Organic Cotton', 'Full Grain Leather', 'Stainless Steel']) },
    { name: 'Connectivity', slug: 'connectivity', options: JSON.stringify(['Bluetooth 5.3', 'Wi-Fi 6E', 'USB Type-C', '2.4GHz Wireless']) },
  ];

  for (const attr of attributesData) {
    await prisma.attribute.upsert({
      where: { slug: attr.slug },
      update: {},
      create: attr,
    });
  }

  // 5. Products
  const productsData = [
    {
      name: 'AcousticPro Studio Headphones Wireless',
      sku: 'AUD-AP-001',
      slug: 'acousticpro-studio-headphones-wireless',
      shortDescription: 'Professional wireless studio monitors with hybrid active noise cancellation.',
      description: 'Engineered with custom 45mm neodymium drivers, active noise cancellation, and up to 40 hours of continuous playback. Low-latency transmission mode delivers instant audio feedback for monitoring.',
      regularPrice: 249.99,
      salePrice: 219.99,
      costPrice: 110.00,
      stockQuantity: 48,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Audio', 'Electronics']),
      tags: JSON.stringify(['Wireless', 'Studio', 'ANC']),
      attributes: JSON.stringify([
        { name: 'Color', values: ['Matte Black', 'Space Gray'] },
        { name: 'Connectivity', values: ['Bluetooth 5.3', 'USB Type-C'] }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'
      ]),
      completenessScore: 100,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'IN_SYNC',
      remoteWooId: 1041,
      lastSyncedAt: new Date(Date.now() - 3600000 * 4),
    },
    {
      name: 'Apex Mechanical Keyboard RGB (Hot-Swappable)',
      sku: 'TECH-MK-002',
      slug: 'apex-mechanical-keyboard-rgb',
      shortDescription: 'Precision hot-swappable mechanical keyboard with per-key RGB backlighting.',
      description: 'Compact TKL form factor featuring factory-lubed linear switches, dual-layer sound-dampening foam, per-key RGB backlighting, and CNC anodized aluminum casing.',
      regularPrice: 139.99,
      salePrice: null,
      costPrice: 62.00,
      stockQuantity: 85,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Electronics', 'Accessories']),
      tags: JSON.stringify(['RGB', 'Gaming', 'Hot-Swap']),
      attributes: JSON.stringify([
        { name: 'Color', values: ['Space Gray'] },
        { name: 'Connectivity', values: ['USB Type-C', '2.4GHz Wireless'] }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800'
      ]),
      completenessScore: 100,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'IN_SYNC',
      remoteWooId: 1042,
      lastSyncedAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      name: 'HydroPulse Insulated Smart Bottle 750ml',
      sku: 'HOME-HP-003',
      slug: 'hydropulse-insulated-smart-bottle-750ml',
      shortDescription: 'Smart thermal flask with real-time temperature sensing and hydration reminders.',
      description: 'Double-wall vacuum insulation keeps liquids cold for 24h and piping hot for 12h. Integrated touch-sensitive OLED temperature display in the lid with customizable hydration reminders.',
      regularPrice: 54.50,
      salePrice: 49.00,
      costPrice: 21.00,
      stockQuantity: 12,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Home & Kitchen']),
      tags: JSON.stringify(['Smart', 'Eco-Friendly', 'Thermal']),
      attributes: JSON.stringify([
        { name: 'Color', values: ['Forest Green', 'Arctic White'] },
        { name: 'Material', values: ['Stainless Steel'] }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800'
      ]),
      completenessScore: 90,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'PENDING',
      remoteWooId: 1043,
      lastSyncedAt: new Date(Date.now() - 3600000 * 24),
    },
    {
      name: 'Nomad Canvas Commuter Backpack 24L',
      sku: 'APP-CB-004',
      slug: 'nomad-canvas-commuter-backpack-24l',
      shortDescription: 'Water-resistant natural canvas backpack with padded 16-inch laptop pocket.',
      description: 'Crafted from 100% weather-treated heavy duty canvas with solid brass buckles, magnetic quick-release clasps, and ergonomic air-mesh shoulder cushioning.',
      regularPrice: 89.00,
      salePrice: null,
      costPrice: 38.00,
      stockQuantity: 34,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Apparel', 'Accessories']),
      tags: JSON.stringify(['Travel', 'Canvas', 'Waterproof']),
      attributes: JSON.stringify([
        { name: 'Color', values: ['Forest Green', 'Matte Black'] },
        { name: 'Material', values: ['Organic Cotton'] }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'
      ]),
      completenessScore: 85,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'PENDING',
      remoteWooId: null,
      lastSyncedAt: null,
    },
    {
      name: 'Precision Stylus Pen Ultra-Low Latency',
      sku: 'ACC-SP-005',
      slug: 'precision-stylus-pen-ultra-low-latency',
      shortDescription: 'Pressure-sensitive active stylus pen with magnetic inductive charging.',
      description: 'Features 4096 levels of pressure sensitivity, palm rejection technology, and 9-hour battery life.',
      regularPrice: 45.00,
      salePrice: null,
      costPrice: 18.00,
      stockQuantity: 0,
      stockStatus: 'OUTOFSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Electronics']),
      tags: JSON.stringify(['Stylus', 'Digital']),
      attributes: JSON.stringify([]),
      images: JSON.stringify([]),
      completenessScore: 45,
      missingFields: JSON.stringify(['images', 'attributes']),
      status: 'DRAFT',
      syncStatus: 'DRAFT',
      remoteWooId: null,
      lastSyncedAt: null,
    },
    {
      name: 'EchoSphere 360 Bluetooth Speaker',
      sku: 'AUD-ES-006',
      slug: 'echosphere-360-bluetooth-speaker',
      shortDescription: 'Omnidirectional portable speaker with dual passive bass radiators.',
      description: 'Delivers immersive 360-degree acoustic dispersion with IP67 dust and water resistance, 18-hour continuous battery life, and party-link synchronization.',
      regularPrice: 129.99,
      salePrice: null,
      costPrice: 55.00,
      stockQuantity: 24,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Audio']),
      tags: JSON.stringify(['Portable', 'Waterproof', 'Bass']),
      attributes: JSON.stringify([
        { name: 'Color', values: ['Matte Black', 'Crimson Red'] }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800'
      ]),
      completenessScore: 90,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'CONFLICT',
      hasConflict: true,
      remoteWooId: 1046,
      lastSyncedAt: new Date(Date.now() - 3600000 * 12),
    },
    {
      name: 'Lumina Desk Task Lamp LED with Qi Charger',
      sku: 'HOME-LL-007',
      slug: 'lumina-desk-task-lamp-led-qi',
      shortDescription: 'Dimmable architectural lamp with integrated 15W Qi wireless charging pad.',
      description: 'Minimalist aluminum gooseneck lamp featuring 5 color temperature presets, stepless brightness touch slider, and integrated 15W fast inductive charger in base.',
      regularPrice: 79.99,
      salePrice: 69.99,
      costPrice: 32.00,
      stockQuantity: 18,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Home & Kitchen', 'Electronics']),
      tags: JSON.stringify(['Lamp', 'LED', 'Qi-Charger']),
      attributes: JSON.stringify([
        { name: 'Color', values: ['Space Gray', 'Arctic White'] }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'
      ]),
      completenessScore: 90,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'ERROR',
      remoteWooId: null,
      lastSyncedAt: null,
    },
    {
      name: 'Atlas 4K Streaming Webcam',
      sku: 'TECH-WC-008',
      slug: 'atlas-4k-streaming-webcam',
      shortDescription: '4K webcam with autofocus, dual microphones, and privacy shutter.',
      description: 'A crisp 4K webcam with fast autofocus, dual noise-reducing microphones, and a built-in privacy shutter for calls and live streaming.',
      regularPrice: 119.99,
      salePrice: 99.99,
      costPrice: 48,
      stockQuantity: 31,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Electronics', 'Accessories']),
      tags: JSON.stringify(['4K', 'Streaming', 'Work From Home']),
      attributes: JSON.stringify([{ name: 'Connectivity', values: ['USB Type-C'] }]),
      images: JSON.stringify(['https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800']),
      completenessScore: 95,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'PENDING',
      remoteWooId: null,
      lastSyncedAt: null,
    },
    {
      name: 'PulseFit Active Smartwatch',
      sku: 'TECH-SW-009',
      slug: 'pulsefit-active-smartwatch',
      shortDescription: 'Lightweight smartwatch with GPS, sleep tracking, and a bright AMOLED display.',
      description: 'Track daily movement, sleep, and GPS workouts with a bright always-on AMOLED display and five-day battery life.',
      regularPrice: 189,
      salePrice: 169,
      costPrice: 82,
      stockQuantity: 16,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Electronics', 'Accessories']),
      tags: JSON.stringify(['Fitness', 'GPS', 'Wearable']),
      attributes: JSON.stringify([{ name: 'Color', values: ['Matte Black', 'Arctic White'] }]),
      images: JSON.stringify(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']),
      completenessScore: 95,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'IN_SYNC',
      remoteWooId: 1048,
      lastSyncedAt: new Date(Date.now() - 3600000 * 8),
    },
    {
      name: 'AeroLite Packable Running Jacket',
      sku: 'APP-JK-010',
      slug: 'aerolite-packable-running-jacket',
      shortDescription: 'Weather-resistant running shell that packs into its own pocket.',
      description: 'A breathable, water-resistant running shell with reflective details, adjustable hood, and a pack-away chest pocket.',
      regularPrice: 94,
      salePrice: null,
      costPrice: 39,
      stockQuantity: 42,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Apparel']),
      tags: JSON.stringify(['Running', 'Lightweight', 'Outdoor']),
      attributes: JSON.stringify([
        { name: 'Color', values: ['Forest Green', 'Crimson Red'] },
        { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
      ]),
      images: JSON.stringify(['https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800']),
      completenessScore: 100,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'PENDING',
      remoteWooId: null,
      lastSyncedAt: null,
    },
    {
      name: 'Ember Stoneware Pour-Over Coffee Set',
      sku: 'HOME-CF-011',
      slug: 'ember-stoneware-pour-over-coffee-set',
      shortDescription: 'Hand-finished ceramic dripper and matching 600ml carafe.',
      description: 'A durable stoneware pour-over dripper and heat-safe carafe set, finished by hand for an easy daily coffee ritual.',
      regularPrice: 68,
      salePrice: 59,
      costPrice: 25,
      stockQuantity: 27,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Home & Kitchen']),
      tags: JSON.stringify(['Coffee', 'Ceramic', 'Gift']),
      attributes: JSON.stringify([{ name: 'Material', values: ['Stoneware'] }]),
      images: JSON.stringify(['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800']),
      completenessScore: 95,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'IN_SYNC',
      remoteWooId: 1049,
      lastSyncedAt: new Date(Date.now() - 3600000 * 6),
    },
    {
      name: 'Orbit 3-in-1 Foldable Wireless Charger',
      sku: 'ACC-CH-012',
      slug: 'orbit-3-in-1-foldable-wireless-charger',
      shortDescription: 'Foldable charging stand for phone, earbuds, and smartwatch.',
      description: 'A travel-ready 3-in-1 Qi charging station with a fold-flat hinge, non-slip base, and USB-C power input.',
      regularPrice: 74.99,
      salePrice: null,
      costPrice: 29,
      stockQuantity: 58,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Accessories', 'Electronics']),
      tags: JSON.stringify(['Wireless', 'Travel', 'Charging']),
      attributes: JSON.stringify([{ name: 'Connectivity', values: ['USB Type-C'] }]),
      images: JSON.stringify(['https://images.unsplash.com/photo-1609592806596-b43bada5a34a?w=800']),
      completenessScore: 90,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'PENDING',
      remoteWooId: null,
      lastSyncedAt: null,
    },
    {
      name: 'Summit Double-Wall Travel Tumbler',
      sku: 'HOME-TM-013',
      slug: 'summit-double-wall-travel-tumbler',
      shortDescription: 'Leak-resistant stainless steel tumbler that keeps drinks hot or cold.',
      description: 'Double-wall vacuum insulation, a splash-resistant lid, and a cup-holder friendly shape make this tumbler ready for daily commutes.',
      regularPrice: 34,
      salePrice: null,
      costPrice: 12,
      stockQuantity: 63,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Home & Kitchen', 'Accessories']),
      tags: JSON.stringify(['Reusable', 'Commuter', 'Insulated']),
      attributes: JSON.stringify([
        { name: 'Color', values: ['Midnight Blue', 'Arctic White'] },
        { name: 'Material', values: ['Stainless Steel'] },
      ]),
      images: JSON.stringify(['https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800']),
      completenessScore: 100,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'IN_SYNC',
      remoteWooId: 1050,
      lastSyncedAt: new Date(Date.now() - 3600000 * 3),
    },
    {
      name: 'FormFit 14-inch Laptop Sleeve',
      sku: 'ACC-LS-014',
      slug: 'formfit-14-inch-laptop-sleeve',
      shortDescription: 'Padded recycled-fabric sleeve with a soft lining and front pocket.',
      description: 'Protective 14-inch laptop sleeve made from recycled fabric, with a water-resistant finish and a convenient front accessory pocket.',
      regularPrice: 42,
      salePrice: 36,
      costPrice: 14,
      stockQuantity: 3,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Accessories', 'Apparel']),
      tags: JSON.stringify(['Laptop', 'Recycled', 'Travel']),
      attributes: JSON.stringify([{ name: 'Color', values: ['Space Gray', 'Forest Green'] }]),
      images: JSON.stringify(['https://images.unsplash.com/photo-1554456854-55a089fd4cb2?w=800']),
      completenessScore: 90,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'ERROR',
      remoteWooId: null,
      lastSyncedAt: null,
    },
    {
      name: 'StudioCast USB Condenser Microphone',
      sku: 'AUD-MC-015',
      slug: 'studiocast-usb-condenser-microphone',
      shortDescription: 'Plug-and-play USB microphone with gain control and desk stand.',
      description: 'Capture clear voice audio for podcasts and meetings with a cardioid condenser capsule, physical mute button, and USB-C connection.',
      regularPrice: 109,
      salePrice: 94,
      costPrice: 44,
      stockQuantity: 21,
      stockStatus: 'INSTOCK',
      manageStock: true,
      categories: JSON.stringify(['Audio', 'Electronics']),
      tags: JSON.stringify(['Podcast', 'USB', 'Creator']),
      attributes: JSON.stringify([{ name: 'Connectivity', values: ['USB Type-C'] }]),
      images: JSON.stringify(['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800']),
      completenessScore: 100,
      missingFields: JSON.stringify([]),
      status: 'PUBLISHED',
      syncStatus: 'PENDING',
      remoteWooId: null,
      lastSyncedAt: null,
    },
  ];

  for (const prod of productsData) {
    const created = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod,
    });

    // If Product 6 (EchoSphere), seed a ConflictLog for testing conflict resolution!
    if (
      prod.sku === 'AUD-ES-006' &&
      !(await prisma.conflictLog.findFirst({ where: { productId: created.id, status: 'OPEN' } }))
    ) {
      const conflictDiffs = [
        { field: 'regularPrice', local: 129.99, remote: 149.99 },
        { field: 'stockQuantity', local: 24, remote: 19 },
      ];

      const conflictLog = await prisma.conflictLog.create({
        data: {
          productId: created.id,
          status: 'OPEN',
          localData: JSON.stringify(created),
          remoteData: JSON.stringify({
            id: 1046,
            name: 'EchoSphere 360 Bluetooth Speaker',
            sku: 'AUD-ES-006',
            regular_price: '149.99',
            stock_quantity: 19,
            stock_status: 'instock',
          }),
          fieldDifferences: JSON.stringify(conflictDiffs),
        },
      });

      await prisma.product.update({
        where: { id: created.id },
        data: {
          conflictDetails: JSON.stringify({ conflictLogId: conflictLog.id, differences: conflictDiffs }),
        },
      });
    }
  }

  // 6. Initial Sync Jobs
  if (!seedAlreadyRun) await prisma.syncJob.create({
    data: {
      jobType: 'PUSH_PRODUCT',
      status: 'SUCCESS',
      isSimulated: true,
      affectedCount: 1,
      message: 'Product "AcousticPro Studio Headphones Wireless" synced to WooCommerce (Remote ID: 1041).',
      details: JSON.stringify({ remoteId: 1041, executionTimeMs: 420 }),
      completedAt: new Date(Date.now() - 3600000 * 4),
    },
  });

  if (!seedAlreadyRun) await prisma.syncJob.create({
    data: {
      jobType: 'PUSH_BULK',
      status: 'SUCCESS',
      isSimulated: true,
      affectedCount: 2,
      message: 'Bulk push complete: 2 products updated in WooCommerce.',
      details: JSON.stringify({ successCount: 2, failCount: 0 }),
      completedAt: new Date(Date.now() - 3600000 * 2),
    },
  });

  if (!seedAlreadyRun) await prisma.syncJob.create({
    data: {
      jobType: 'PUSH_PRODUCT',
      status: 'FAILED',
      isSimulated: true,
      affectedCount: 1,
      message: 'Failed to push "Lumina Desk Task Lamp LED": Timeout connecting to remote endpoint (simulated recovery available).',
      details: JSON.stringify({ error: 'Connection reset by peer at /wp-json/wc/v3/products', retriable: true }),
      retryCount: 1,
      maxRetries: 3,
      completedAt: new Date(Date.now() - 3600000 * 1),
    },
  });

  // 7. Initial Audit Log
  if (!seedAlreadyRun) await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: 'SYSTEM_SEEDED',
      entityType: 'SETTINGS',
      details: JSON.stringify({ message: 'Catalog seeded with standard PIM categories, attributes, and products.' }),
    },
  });

  console.log('[Seed] Database successfully seeded with products, categories, attributes, and jobs!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
