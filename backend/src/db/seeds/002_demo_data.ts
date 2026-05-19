import type { Knex } from 'knex';

/**
 * Demo seed — populates the database with realistic data so you can explore
 * the full app flow immediately after running `npm run seed`.
 *
 * What gets created:
 *   • 3 washermen with full pricing grids and varied availability
 *   • 5 customers, each linked to one of the washermen
 *   • 15 orders spread across all statuses (pending → delivered)
 *   • Order items using the price grids
 *   • Reviews for completed orders
 *   • Notifications for each user
 *
 * Phone numbers use the pattern 9000000001–9000000008.
 * OTPs are not relevant for seeded users — use the admin bypass in .env
 * or set OTP_BYPASS_CODE in your .env to log in directly.
 */

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function futureDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function pastDate(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function orderNumber(n: number) {
  return `DG${String(n).padStart(6, '0')}`;
}

function uniqueCode(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ─── seed ────────────────────────────────────────────────────────────────────

export async function seed(knex: Knex): Promise<void> {
  // ── 0. Truncate in FK-safe order ──────────────────────────────────────────
  await knex.raw('SET session_replication_role = replica');
  await knex('notifications').del();
  await knex('reviews').del();
  await knex('order_items').del();
  await knex('orders').del();
  await knex('price_grid').del();
  await knex('price_items').del();
  await knex('wash_types').del();
  await knex('favourites').del();
  await knex('customers').del();
  await knex('refresh_tokens').del();
  await knex('washermen').del();
  await knex.raw('SET session_replication_role = DEFAULT');

  // ── 1. Washermen ──────────────────────────────────────────────────────────
  const [w1Id, w2Id, w3Id] = await knex('washermen')
    .insert([
      {
        phone: '9000000001',
        name: 'Ramesh Sharma',
        business_name: 'Ramesh Laundry',
        area: 'Andheri West',
        address: 'Shop 4, Lokhandwala Market, Andheri West, Mumbai – 400053',
        unique_code: uniqueCode('RL'),
        is_available: true,
        avg_rating: 4.6,
        review_count: 0,
        is_active: true,
        created_at: daysAgo(120),
        updated_at: daysAgo(1),
      },
      {
        phone: '9000000002',
        name: 'Sunita Patel',
        business_name: 'Sunita Wash & Fold',
        area: 'Bandra East',
        address: 'Flat 2B, Linking Road, Bandra East, Mumbai – 400051',
        unique_code: uniqueCode('SW'),
        is_available: true,
        avg_rating: 4.2,
        review_count: 0,
        is_active: true,
        created_at: daysAgo(90),
        updated_at: daysAgo(2),
      },
      {
        phone: '9000000003',
        name: 'Mohammed Rafi',
        business_name: 'Rafi Dry Cleaners',
        area: 'Juhu',
        address: '12 Vile Parle Road, Juhu, Mumbai – 400049',
        unique_code: uniqueCode('RD'),
        is_available: false,
        avg_rating: 4.8,
        review_count: 0,
        is_active: true,
        created_at: daysAgo(200),
        updated_at: daysAgo(5),
      },
    ])
    .returning('id')
    .then((rows) => rows.map((r: { id: string }) => r.id));

  // ── 2. Wash Types (per washerman) ─────────────────────────────────────────
  const washTypeRows = await knex('wash_types')
    .insert([
      // Ramesh
      { washerman_id: w1Id, name: 'Wash & Fold', is_active: true, created_at: daysAgo(120), updated_at: daysAgo(120) },
      { washerman_id: w1Id, name: 'Iron Only', is_active: true, created_at: daysAgo(120), updated_at: daysAgo(120) },
      { washerman_id: w1Id, name: 'Wash & Iron', is_active: true, created_at: daysAgo(120), updated_at: daysAgo(120) },
      // Sunita
      { washerman_id: w2Id, name: 'Wash & Fold', is_active: true, created_at: daysAgo(90), updated_at: daysAgo(90) },
      { washerman_id: w2Id, name: 'Express Wash', is_active: true, created_at: daysAgo(90), updated_at: daysAgo(90) },
      // Rafi
      { washerman_id: w3Id, name: 'Dry Clean', is_active: true, created_at: daysAgo(200), updated_at: daysAgo(200) },
      { washerman_id: w3Id, name: 'Wash & Iron', is_active: true, created_at: daysAgo(200), updated_at: daysAgo(200) },
      { washerman_id: w3Id, name: 'Steam Press', is_active: true, created_at: daysAgo(200), updated_at: daysAgo(200) },
    ])
    .returning(['id', 'washerman_id', 'name']);

  const wtByWashermanAndName = (wId: string, name: string) =>
    washTypeRows.find((r: { id: string; washerman_id: string; name: string }) => r.washerman_id === wId && r.name === name)?.id as string;

  // ── 3. Price Items (per washerman) ───────────────────────────────────────
  const priceItemRows = await knex('price_items')
    .insert([
      // Ramesh
      { washerman_id: w1Id, item_name: 'Shirt', is_active: true, created_at: daysAgo(120), updated_at: daysAgo(120) },
      { washerman_id: w1Id, item_name: 'Trouser', is_active: true, created_at: daysAgo(120), updated_at: daysAgo(120) },
      { washerman_id: w1Id, item_name: 'Saree', is_active: true, created_at: daysAgo(120), updated_at: daysAgo(120) },
      { washerman_id: w1Id, item_name: 'Bed Sheet', is_active: true, created_at: daysAgo(120), updated_at: daysAgo(120) },
      { washerman_id: w1Id, item_name: 'Jeans', is_active: true, created_at: daysAgo(120), updated_at: daysAgo(120) },
      // Sunita
      { washerman_id: w2Id, item_name: 'Shirt', is_active: true, created_at: daysAgo(90), updated_at: daysAgo(90) },
      { washerman_id: w2Id, item_name: 'Kurti', is_active: true, created_at: daysAgo(90), updated_at: daysAgo(90) },
      { washerman_id: w2Id, item_name: 'Salwar', is_active: true, created_at: daysAgo(90), updated_at: daysAgo(90) },
      { washerman_id: w2Id, item_name: 'Dupatta', is_active: true, created_at: daysAgo(90), updated_at: daysAgo(90) },
      // Rafi
      { washerman_id: w3Id, item_name: 'Suit (2-pc)', is_active: true, created_at: daysAgo(200), updated_at: daysAgo(200) },
      { washerman_id: w3Id, item_name: 'Saree', is_active: true, created_at: daysAgo(200), updated_at: daysAgo(200) },
      { washerman_id: w3Id, item_name: 'Sherwani', is_active: true, created_at: daysAgo(200), updated_at: daysAgo(200) },
      { washerman_id: w3Id, item_name: 'Blazer', is_active: true, created_at: daysAgo(200), updated_at: daysAgo(200) },
      { washerman_id: w3Id, item_name: 'Trouser', is_active: true, created_at: daysAgo(200), updated_at: daysAgo(200) },
    ])
    .returning(['id', 'washerman_id', 'item_name']);

  const piByName = (wId: string, name: string) =>
    priceItemRows.find((r: { id: string; washerman_id: string; item_name: string }) => r.washerman_id === wId && r.item_name === name)?.id as string;

  // ── 4. Price Grid ─────────────────────────────────────────────────────────
  const priceGridRows: { price_item_id: string; wash_type_id: string; price_paise: number; is_active: boolean; updated_at: string }[] = [];

  // Ramesh: Shirt, Trouser, Saree, Bed Sheet, Jeans × Wash & Fold, Iron Only, Wash & Iron
  const r_wf = wtByWashermanAndName(w1Id, 'Wash & Fold');
  const r_io = wtByWashermanAndName(w1Id, 'Iron Only');
  const r_wi = wtByWashermanAndName(w1Id, 'Wash & Iron');
  const rameshGrid: [string, number, number, number][] = [
    ['Shirt',     2000, 800, 2500],
    ['Trouser',   2500, 1000, 3000],
    ['Saree',     4000, 1500, 5000],
    ['Bed Sheet', 5000, 2000, 6500],
    ['Jeans',     3000, 1200, 3800],
  ];
  for (const [item, wfP, ioP, wiP] of rameshGrid) {
    priceGridRows.push({ price_item_id: piByName(w1Id, item), wash_type_id: r_wf, price_paise: wfP, is_active: true, updated_at: daysAgo(100) });
    priceGridRows.push({ price_item_id: piByName(w1Id, item), wash_type_id: r_io, price_paise: ioP, is_active: true, updated_at: daysAgo(100) });
    priceGridRows.push({ price_item_id: piByName(w1Id, item), wash_type_id: r_wi, price_paise: wiP, is_active: true, updated_at: daysAgo(100) });
  }

  // Sunita: Shirt, Kurti, Salwar, Dupatta × Wash & Fold, Express Wash
  const s_wf = wtByWashermanAndName(w2Id, 'Wash & Fold');
  const s_ex = wtByWashermanAndName(w2Id, 'Express Wash');
  const sunitaGrid: [string, number, number][] = [
    ['Shirt',   1800, 2800],
    ['Kurti',   2200, 3200],
    ['Salwar',  2000, 3000],
    ['Dupatta', 1200, 1800],
  ];
  for (const [item, wfP, exP] of sunitaGrid) {
    priceGridRows.push({ price_item_id: piByName(w2Id, item), wash_type_id: s_wf, price_paise: wfP, is_active: true, updated_at: daysAgo(80) });
    priceGridRows.push({ price_item_id: piByName(w2Id, item), wash_type_id: s_ex, price_paise: exP, is_active: true, updated_at: daysAgo(80) });
  }

  // Rafi: Suit, Saree, Sherwani, Blazer, Trouser × Dry Clean, Wash & Iron, Steam Press
  const rf_dc = wtByWashermanAndName(w3Id, 'Dry Clean');
  const rf_wi = wtByWashermanAndName(w3Id, 'Wash & Iron');
  const rf_sp = wtByWashermanAndName(w3Id, 'Steam Press');
  const rafiGrid: [string, number, number, number][] = [
    ['Suit (2-pc)', 25000, 8000, 5000],
    ['Saree',       15000, 5000, 3000],
    ['Sherwani',    30000, 10000, 6000],
    ['Blazer',      18000, 6000, 3500],
    ['Trouser',     8000, 3000, 2000],
  ];
  for (const [item, dcP, wiP, spP] of rafiGrid) {
    priceGridRows.push({ price_item_id: piByName(w3Id, item), wash_type_id: rf_dc, price_paise: dcP, is_active: true, updated_at: daysAgo(150) });
    priceGridRows.push({ price_item_id: piByName(w3Id, item), wash_type_id: rf_wi, price_paise: wiP, is_active: true, updated_at: daysAgo(150) });
    priceGridRows.push({ price_item_id: piByName(w3Id, item), wash_type_id: rf_sp, price_paise: spP, is_active: true, updated_at: daysAgo(150) });
  }

  const gridRows = await knex('price_grid').insert(priceGridRows).returning(['id', 'price_item_id', 'wash_type_id', 'price_paise']);
  const gridId = (piId: string, wtId: string) =>
    gridRows.find((r: { id: string; price_item_id: string; wash_type_id: string }) => r.price_item_id === piId && r.wash_type_id === wtId)?.id as string;
  const gridPrice = (piId: string, wtId: string): number =>
    gridRows.find((r: { id: string; price_item_id: string; wash_type_id: string; price_paise: number }) => r.price_item_id === piId && r.wash_type_id === wtId)?.price_paise ?? 0;

  // ── 5. Customers ─────────────────────────────────────────────────────────
  const [c1Id, c2Id, c3Id, c4Id, c5Id] = await knex('customers')
    .insert([
      { phone: '9000000004', name: 'Priya Mehta',    address: '201 Hill View Apartments, Andheri West, Mumbai',  selected_washerman_id: w1Id, created_at: daysAgo(80), updated_at: daysAgo(1) },
      { phone: '9000000005', name: 'Arjun Nair',     address: '34B Sea Breeze Society, Bandra East, Mumbai',      selected_washerman_id: w2Id, created_at: daysAgo(60), updated_at: daysAgo(3) },
      { phone: '9000000006', name: 'Deepa Krishnan', address: '7 Sunset Tower, Juhu, Mumbai',                    selected_washerman_id: w3Id, created_at: daysAgo(50), updated_at: daysAgo(2) },
      { phone: '9000000007', name: 'Rohan Gupta',    address: '15 Green Park Colony, Andheri West, Mumbai',      selected_washerman_id: w1Id, created_at: daysAgo(40), updated_at: daysAgo(5) },
      { phone: '9000000008', name: 'Fatima Sheikh',  address: '88 Al-Noor Building, Bandra East, Mumbai',        selected_washerman_id: w2Id, created_at: daysAgo(30), updated_at: daysAgo(1) },
    ])
    .returning('id')
    .then((rows) => rows.map((r: { id: string }) => r.id));

  // ── 6. Favourites ────────────────────────────────────────────────────────
  await knex('favourites').insert([
    { customer_id: c1Id, washerman_id: w1Id, created_at: daysAgo(70) },
    { customer_id: c1Id, washerman_id: w3Id, created_at: daysAgo(65) },
    { customer_id: c2Id, washerman_id: w2Id, created_at: daysAgo(55) },
    { customer_id: c3Id, washerman_id: w3Id, created_at: daysAgo(45) },
    { customer_id: c4Id, washerman_id: w1Id, created_at: daysAgo(35) },
    { customer_id: c5Id, washerman_id: w2Id, created_at: daysAgo(25) },
    { customer_id: c5Id, washerman_id: w1Id, created_at: daysAgo(20) },
  ]);

  // ── 7. Orders ─────────────────────────────────────────────────────────────
  // Helper: build an order + its items in one go
  let orderSeq = 1;

  const insertOrder = async (opts: {
    customerId: string;
    washermanId: string;
    status: string;
    deliveryMode: 'door_to_door' | 'drop_off';
    pickupDate: string;
    isPaid?: boolean;
    createdAt: string;
    updatedAt: string;
    declineReason?: string;
    lines: { priceItemId: string; washTypeId: string; qty: number }[];
  }) => {
    const items = opts.lines.map((l) => ({
      gridId: gridId(l.priceItemId, l.washTypeId),
      unitPaise: gridPrice(l.priceItemId, l.washTypeId),
      qty: l.qty,
      itemName: priceItemRows.find((p: { id: string; item_name: string }) => p.id === l.priceItemId)?.item_name ?? '',
      wtName: washTypeRows.find((w: { id: string; name: string }) => w.id === l.washTypeId)?.name ?? '',
    }));
    const totalPaise = items.reduce((s, i) => s + i.unitPaise * i.qty, 0);
    const oNum = orderNumber(orderSeq++);

    const [order] = await knex('orders')
      .insert({
        order_number: oNum,
        customer_id: opts.customerId,
        washerman_id: opts.washermanId,
        status: opts.status,
        delivery_mode: opts.deliveryMode,
        pickup_date: opts.pickupDate,
        total_paise: totalPaise,
        is_paid: opts.isPaid ?? false,
        paid_at: opts.isPaid ? opts.updatedAt : null,
        decline_reason: opts.declineReason ?? null,
        created_at: opts.createdAt,
        updated_at: opts.updatedAt,
      })
      .returning('*');

    await knex('order_items').insert(
      items.map((i) => ({
        order_id: order.id,
        price_grid_id: i.gridId,
        item_name_snapshot: i.itemName,
        wash_type_snapshot: i.wtName,
        unit_price_paise: i.unitPaise,
        quantity: i.qty,
        subtotal_paise: i.unitPaise * i.qty,
      })),
    );

    return order;
  };

  // ── Priya (c1) → Ramesh (w1) ─────────────────────────────────────────────
  // delivered + paid
  const o1 = await insertOrder({
    customerId: c1Id, washermanId: w1Id, status: 'delivered', deliveryMode: 'door_to_door',
    pickupDate: pastDate(25), isPaid: true, createdAt: daysAgo(27), updatedAt: daysAgo(20),
    lines: [
      { priceItemId: piByName(w1Id, 'Shirt'), washTypeId: r_wi, qty: 3 },
      { priceItemId: piByName(w1Id, 'Trouser'), washTypeId: r_io, qty: 2 },
      { priceItemId: piByName(w1Id, 'Jeans'), washTypeId: r_wf, qty: 1 },
    ],
  });

  // delivered, unpaid
  await insertOrder({
    customerId: c1Id, washermanId: w1Id, status: 'delivered', deliveryMode: 'door_to_door',
    pickupDate: pastDate(12), isPaid: false, createdAt: daysAgo(14), updatedAt: daysAgo(8),
    lines: [
      { priceItemId: piByName(w1Id, 'Saree'), washTypeId: r_wf, qty: 2 },
      { priceItemId: piByName(w1Id, 'Bed Sheet'), washTypeId: r_wf, qty: 3 },
    ],
  });

  // in_progress
  await insertOrder({
    customerId: c1Id, washermanId: w1Id, status: 'in_progress', deliveryMode: 'door_to_door',
    pickupDate: pastDate(3), createdAt: daysAgo(5), updatedAt: daysAgo(2),
    lines: [
      { priceItemId: piByName(w1Id, 'Shirt'), washTypeId: r_wi, qty: 5 },
      { priceItemId: piByName(w1Id, 'Trouser'), washTypeId: r_wi, qty: 3 },
    ],
  });

  // pending
  await insertOrder({
    customerId: c1Id, washermanId: w1Id, status: 'pending', deliveryMode: 'door_to_door',
    pickupDate: futureDays(2), createdAt: daysAgo(1), updatedAt: daysAgo(1),
    lines: [
      { priceItemId: piByName(w1Id, 'Jeans'), washTypeId: r_wf, qty: 2 },
      { priceItemId: piByName(w1Id, 'Shirt'), washTypeId: r_io, qty: 4 },
    ],
  });

  // ── Rohan (c4) → Ramesh (w1) ──────────────────────────────────────────────
  await insertOrder({
    customerId: c4Id, washermanId: w1Id, status: 'delivered', deliveryMode: 'drop_off',
    pickupDate: pastDate(30), isPaid: true, createdAt: daysAgo(32), updatedAt: daysAgo(25),
    lines: [
      { priceItemId: piByName(w1Id, 'Shirt'), washTypeId: r_wf, qty: 6 },
      { priceItemId: piByName(w1Id, 'Trouser'), washTypeId: r_wf, qty: 4 },
    ],
  });

  await insertOrder({
    customerId: c4Id, washermanId: w1Id, status: 'ready', deliveryMode: 'drop_off',
    pickupDate: pastDate(4), createdAt: daysAgo(6), updatedAt: daysAgo(1),
    lines: [
      { priceItemId: piByName(w1Id, 'Bed Sheet'), washTypeId: r_wf, qty: 2 },
      { priceItemId: piByName(w1Id, 'Shirt'), washTypeId: r_io, qty: 3 },
    ],
  });

  // declined order
  await insertOrder({
    customerId: c4Id, washermanId: w1Id, status: 'declined', deliveryMode: 'door_to_door',
    pickupDate: pastDate(10), createdAt: daysAgo(11), updatedAt: daysAgo(10),
    declineReason: 'Out of capacity this week. Please try again next week.',
    lines: [
      { priceItemId: piByName(w1Id, 'Saree'), washTypeId: r_wi, qty: 3 },
    ],
  });

  // ── Arjun (c2) → Sunita (w2) ──────────────────────────────────────────────
  await insertOrder({
    customerId: c2Id, washermanId: w2Id, status: 'delivered', deliveryMode: 'door_to_door',
    pickupDate: pastDate(20), isPaid: true, createdAt: daysAgo(22), updatedAt: daysAgo(15),
    lines: [
      { priceItemId: piByName(w2Id, 'Shirt'), washTypeId: s_wf, qty: 4 },
      { priceItemId: piByName(w2Id, 'Kurti'), washTypeId: s_wf, qty: 3 },
    ],
  });

  await insertOrder({
    customerId: c2Id, washermanId: w2Id, status: 'accepted', deliveryMode: 'door_to_door',
    pickupDate: futureDays(1), createdAt: daysAgo(2), updatedAt: daysAgo(1),
    lines: [
      { priceItemId: piByName(w2Id, 'Salwar'), washTypeId: s_ex, qty: 2 },
      { priceItemId: piByName(w2Id, 'Dupatta'), washTypeId: s_ex, qty: 2 },
    ],
  });

  // ── Fatima (c5) → Sunita (w2) ────────────────────────────────────────────
  const o9 = await insertOrder({
    customerId: c5Id, washermanId: w2Id, status: 'delivered', deliveryMode: 'drop_off',
    pickupDate: pastDate(15), isPaid: true, createdAt: daysAgo(17), updatedAt: daysAgo(10),
    lines: [
      { priceItemId: piByName(w2Id, 'Kurti'), washTypeId: s_wf, qty: 5 },
      { priceItemId: piByName(w2Id, 'Dupatta'), washTypeId: s_wf, qty: 3 },
    ],
  });

  await insertOrder({
    customerId: c5Id, washermanId: w2Id, status: 'collecting', deliveryMode: 'door_to_door',
    pickupDate: pastDate(1), createdAt: daysAgo(3), updatedAt: daysAgo(1),
    lines: [
      { priceItemId: piByName(w2Id, 'Shirt'), washTypeId: s_ex, qty: 3 },
      { priceItemId: piByName(w2Id, 'Salwar'), washTypeId: s_wf, qty: 2 },
    ],
  });

  // ── Deepa (c3) → Rafi (w3) ───────────────────────────────────────────────
  const o11 = await insertOrder({
    customerId: c3Id, washermanId: w3Id, status: 'delivered', deliveryMode: 'door_to_door',
    pickupDate: pastDate(35), isPaid: true, createdAt: daysAgo(37), updatedAt: daysAgo(28),
    lines: [
      { priceItemId: piByName(w3Id, 'Suit (2-pc)'), washTypeId: rf_dc, qty: 1 },
      { priceItemId: piByName(w3Id, 'Blazer'), washTypeId: rf_dc, qty: 1 },
    ],
  });

  const o12 = await insertOrder({
    customerId: c3Id, washermanId: w3Id, status: 'delivered', deliveryMode: 'door_to_door',
    pickupDate: pastDate(15), isPaid: true, createdAt: daysAgo(17), updatedAt: daysAgo(10),
    lines: [
      { priceItemId: piByName(w3Id, 'Saree'), washTypeId: rf_dc, qty: 2 },
      { priceItemId: piByName(w3Id, 'Sherwani'), washTypeId: rf_sp, qty: 1 },
    ],
  });

  await insertOrder({
    customerId: c3Id, washermanId: w3Id, status: 'pending', deliveryMode: 'door_to_door',
    pickupDate: futureDays(3), createdAt: daysAgo(1), updatedAt: daysAgo(1),
    lines: [
      { priceItemId: piByName(w3Id, 'Trouser'), washTypeId: rf_wi, qty: 3 },
      { priceItemId: piByName(w3Id, 'Blazer'), washTypeId: rf_sp, qty: 2 },
    ],
  });

  // cancelled order
  await insertOrder({
    customerId: c3Id, washermanId: w3Id, status: 'cancelled', deliveryMode: 'drop_off',
    pickupDate: pastDate(8), createdAt: daysAgo(9), updatedAt: daysAgo(8),
    lines: [
      { priceItemId: piByName(w3Id, 'Suit (2-pc)'), washTypeId: rf_dc, qty: 1 },
    ],
  });

  // ── 8. Reviews ───────────────────────────────────────────────────────────
  await knex('reviews').insert([
    {
      order_id: o1.id, customer_id: c1Id, washerman_id: w1Id,
      rating: 5, review_text: 'Excellent service! Clothes were spotless and delivered on time. Highly recommend Ramesh Laundry.',
      created_at: daysAgo(19),
    },
    {
      order_id: o9.id, customer_id: c5Id, washerman_id: w2Id,
      rating: 4, review_text: 'Good work, my kurtis came back fresh and neatly folded. Slightly delayed but overall happy.',
      created_at: daysAgo(9),
    },
    {
      order_id: o11.id, customer_id: c3Id, washerman_id: w3Id,
      rating: 5, review_text: 'Perfect dry cleaning. My suit looks brand new. Rafi truly is a professional.',
      created_at: daysAgo(27),
    },
    {
      order_id: o12.id, customer_id: c3Id, washerman_id: w3Id,
      rating: 5, review_text: 'The saree was handled with such care. Will definitely come back!',
      created_at: daysAgo(9),
    },
  ]);

  // Manually sync avg_rating since trigger fires on insert but we bypassed referential checks
  await knex.raw(`
    UPDATE washermen w SET
      avg_rating = COALESCE((SELECT AVG(rating::numeric) FROM reviews r WHERE r.washerman_id = w.id), 0),
      review_count = (SELECT COUNT(*) FROM reviews r WHERE r.washerman_id = w.id)
  `);

  // ── 9. Notifications ─────────────────────────────────────────────────────
  await knex('notifications').insert([
    // Washerman notifications
    {
      recipient_id: w1Id, recipient_role: 'washerman',
      title: 'New Order Received', body: 'Priya Mehta placed a new order. Tap to review.',
      type: 'new_order', is_read: false, created_at: daysAgo(1),
    },
    {
      recipient_id: w1Id, recipient_role: 'washerman',
      title: 'New Order Received', body: 'Rohan Gupta placed a new order.',
      type: 'new_order', is_read: true, created_at: daysAgo(6),
    },
    {
      recipient_id: w2Id, recipient_role: 'washerman',
      title: 'New Order Received', body: 'Arjun Nair placed an express wash order.',
      type: 'new_order', is_read: false, created_at: daysAgo(2),
    },
    {
      recipient_id: w3Id, recipient_role: 'washerman',
      title: 'New Order Received', body: 'Deepa Krishnan placed a new dry clean order.',
      type: 'new_order', is_read: false, created_at: daysAgo(1),
    },
    // Customer notifications
    {
      recipient_id: c1Id, recipient_role: 'customer',
      title: 'Order Accepted ✓', body: 'Ramesh Laundry accepted your order DG000003. Clothes will be collected soon.',
      type: 'order_status', is_read: false, created_at: daysAgo(4),
    },
    {
      recipient_id: c1Id, recipient_role: 'customer',
      title: 'Order Delivered 🎉', body: 'Your order DG000001 has been delivered. Tap to leave a review.',
      type: 'order_status', is_read: true, created_at: daysAgo(20),
    },
    {
      recipient_id: c2Id, recipient_role: 'customer',
      title: 'Order Accepted ✓', body: 'Sunita Wash & Fold accepted your order. Collection scheduled.',
      type: 'order_status', is_read: false, created_at: daysAgo(1),
    },
    {
      recipient_id: c3Id, recipient_role: 'customer',
      title: 'Order Delivered 🎉', body: 'Your Rafi Dry Cleaners order is delivered. Hope you love it!',
      type: 'order_status', is_read: true, created_at: daysAgo(9),
    },
    {
      recipient_id: c4Id, recipient_role: 'customer',
      title: 'Order Ready 📦', body: 'Your clothes at Ramesh Laundry are ready for pickup!',
      type: 'order_status', is_read: false, created_at: daysAgo(1),
    },
    {
      recipient_id: c5Id, recipient_role: 'customer',
      title: 'Collection in Progress', body: 'Sunita is on the way to collect your laundry.',
      type: 'order_status', is_read: false, created_at: daysAgo(1),
    },
  ]);

  console.log('✅ Demo data seeded successfully');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  DEMO ACCOUNTS (use OTP bypass in .env to log in)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  WASHERMEN');
  console.log('    +91 9000000001  Ramesh Sharma       Andheri West  (available)');
  console.log('    +91 9000000002  Sunita Patel        Bandra East   (available)');
  console.log('    +91 9000000003  Mohammed Rafi       Juhu          (unavailable)');
  console.log('');
  console.log('  CUSTOMERS');
  console.log('    +91 9000000004  Priya Mehta         → Ramesh Laundry');
  console.log('    +91 9000000005  Arjun Nair          → Sunita Wash & Fold');
  console.log('    +91 9000000006  Deepa Krishnan      → Rafi Dry Cleaners');
  console.log('    +91 9000000007  Rohan Gupta         → Ramesh Laundry');
  console.log('    +91 9000000008  Fatima Sheikh       → Sunita Wash & Fold');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Add OTP_BYPASS_CODE=123456 to backend/.env');
  console.log('  then enter 1 2 3 4 5 6 on the OTP screen.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
