import { fakerEN_NG as faker } from '@faker-js/faker';

import { ADMIN_ROLE_PERMISSIONS } from '@/constants/permissions';
import { ADMIN_ROLES } from '@/constants/roles';

import {
  BANKS,
  CATEGORIES,
  CITIES,
  COMMENT_LINES,
  DISHES,
  OPTION_GROUPS,
  REFUND_REASONS,
  REQUIRED_DOCUMENTS,
  VENDOR_NAME_PARTS,
} from './catalogue-data';
import { distanceMetres } from '../utils/geo';
import { documentImage, foodPhoto, vendorCover, vendorLogo } from '../utils/images';
import { DEFAULT_SETTINGS, deliveryFeeFor, processingFeeFor } from '../utils/settings-defaults';

/** Every demo account uses this password and OTP (test values, mock mode only). */
export const DEMO_PASSWORD = 'password123';
export const DEMO_OTP = '123456';

const DAY = 24 * 60 * 60 * 1000;
const kobo = (naira) => Math.round(naira) * 100;
const roundTo = (n, step) => Math.round(n / step) * step;

let counter = 0;
export const newId = (prefix) =>
  `${prefix}_${(++counter).toString(36)}${faker.string.alphanumeric(6).toLowerCase()}`;

export const orderCode = () => faker.string.alphanumeric({ length: 6, casing: 'upper' });

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const pickCity = () => {
  const pool = CITIES.flatMap((c) => Array(c.weight).fill(c));
  return faker.helpers.arrayElement(pool);
};

const jitter = (centre, km = 6) => ({
  lat: centre.lat + faker.number.float({ min: -1, max: 1 }) * (km / 111),
  lng: centre.lng + faker.number.float({ min: -1, max: 1 }) * (km / 111),
});

const nigerianPhone = () =>
  `+234${faker.helpers.arrayElement(['803', '806', '813', '816', '703', '706', '810', '814', '903', '905', '802', '808', '701', '708', '812', '902', '907', '809', '817', '818', '909'])}${faker.string.numeric(7)}`;

function makeAddress(city, label = 'Home') {
  const area = faker.helpers.arrayElement(city.areas);
  const point = jitter(city);
  return {
    label,
    line1: `${faker.number.int({ min: 1, max: 120 })} ${faker.location.street()}`,
    area,
    city: city.city,
    state: city.state,
    ...point,
  };
}

function makeUser({ id, role, firstName, lastName, email, phone, adminRole, createdAt }) {
  const first = firstName ?? faker.person.firstName();
  const last = lastName ?? faker.person.lastName();
  const user = {
    id: id ?? newId('usr'),
    role,
    firstName: first,
    lastName: last,
    name: `${first} ${last}`,
    email: email ?? faker.internet.email({ firstName: first, lastName: last }).toLowerCase(),
    phone: phone ?? nigerianPhone(),
    password: DEMO_PASSWORD,
    avatar: null,
    status: 'active',
    emailVerified: true,
    createdAt: (createdAt ?? faker.date.past({ years: 1 })).toISOString(),
  };
  if (adminRole) {
    user.adminRole = adminRole;
  }
  return user;
}

const OPENING_HOURS = () =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: day === 0 ? '12:00' : faker.helpers.arrayElement(['08:00', '09:00', '10:00']),
    close: faker.helpers.arrayElement(['20:00', '21:00', '22:00']),
    closed: day === 0 && faker.datatype.boolean(0.3),
  }));

function makeBank() {
  const bank = faker.helpers.arrayElement(BANKS);
  return {
    bankCode: bank.code,
    bankName: bank.name,
    accountNumber: faker.string.numeric(10),
    accountName: '',
    verified: true,
  };
}

function makeOptionGroups(categoryId) {
  const groups = [];
  const build = (key) => {
    const g = OPTION_GROUPS[key];
    return {
      id: newId('grp'),
      name: g.name,
      required: g.required,
      max: g.max,
      options: g.options.map(([name, price]) => ({ id: newId('opt'), name, price: kobo(price) })),
    };
  };
  if (['cat-rice', 'cat-swallow', 'cat-continental'].includes(categoryId))
    groups.push(build('protein'));
  if (['cat-rice', 'cat-grills', 'cat-small-chops', 'cat-pepper-soup'].includes(categoryId))
    groups.push(build('size'));
  if (['cat-rice', 'cat-beans', 'cat-grills'].includes(categoryId) && faker.datatype.boolean())
    groups.push(build('sides'));
  return groups;
}

/** Builds the full mock database. Deterministic for a given seed. */
export function buildSeed(seed = 2026) {
  faker.seed(seed);
  counter = 0;
  const now = Date.now();

  const db = {
    users: [],
    addresses: [],
    categories: CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })),
    vendors: [],
    staff: [],
    foodItems: [],
    likes: [],
    comments: [],
    follows: [],
    reports: [],
    orders: [],
    payments: [],
    deliveries: [],
    reviews: [],
    refunds: [],
    plans: [],
    subscriptions: [],
    invoices: [],
    riders: [],
    payoutStatements: [],
    notifications: [],
    tickets: [],
    chatMessages: [],
    adminRoles: [],
    auditLog: [],
    settings: structuredClone(DEFAULT_SETTINGS),
    requiredDocuments: structuredClone(REQUIRED_DOCUMENTS),
    banks: BANKS,
  };

  // ── Plans ───────────────────────────────────────────────────────────────
  db.plans = [
    {
      id: 'plan_basic',
      name: 'Basic',
      monthlyPrice: kobo(5000),
      limits: { menuItems: 20, photosPerItem: 1, staff: 1 },
      featured: 'none',
      analytics: 'basic',
      isRetired: false,
      sortOrder: 1,
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      monthlyPrice: kobo(12000),
      limits: { menuItems: 100, photosPerItem: 3, staff: 3 },
      featured: 'occasional',
      analytics: 'full',
      isRetired: false,
      sortOrder: 2,
      isPopular: true,
    },
    {
      id: 'plan_premium',
      name: 'Premium',
      monthlyPrice: kobo(25000),
      limits: { menuItems: null, photosPerItem: 5, staff: 10 },
      featured: 'priority',
      analytics: 'export',
      isRetired: false,
      sortOrder: 3,
    },
  ];

  // ── Admin roles and admins ────────────────────────────────────────────
  db.adminRoles = Object.entries(ADMIN_ROLE_PERMISSIONS).map(([id, permissions]) => ({
    id,
    permissions: [...permissions],
  }));
  const admins = [
    [ADMIN_ROLES.SUPER_ADMIN, 'super@kjtfoodie.test', 'Kenneth', 'Taiwo'],
    [ADMIN_ROLES.SUPPORT, 'support@kjtfoodie.test', 'Ifeoma', 'Nwosu'],
    [ADMIN_ROLES.FINANCE, 'finance@kjtfoodie.test', 'Musa', 'Abdullahi'],
    [ADMIN_ROLES.DISPATCH, 'dispatch@kjtfoodie.test', 'Segun', 'Alabi'],
    [ADMIN_ROLES.ONBOARDING, 'onboarding@kjtfoodie.test', 'Zainab', 'Bello'],
  ].map(([adminRole, email, firstName, lastName]) =>
    makeUser({
      id: `usr_admin_${adminRole}`,
      role: 'admin',
      adminRole,
      email,
      firstName,
      lastName,
    }),
  );
  db.users.push(...admins);

  // ── Customers ───────────────────────────────────────────────────────────
  const ada = makeUser({
    id: 'usr_customer_ada',
    role: 'customer',
    firstName: 'Ada',
    lastName: 'Okafor',
    email: 'customer@kjtfoodie.test',
    phone: '+2348030000001',
  });
  db.users.push(ada);
  const lagos = CITIES[0];
  db.addresses.push(
    {
      id: 'adr_ada_home',
      userId: ada.id,
      isDefault: true,
      ...makeAddress(lagos, 'Home'),
      area: 'Yaba',
      lat: 6.5095,
      lng: 3.3711,
    },
    {
      id: 'adr_ada_work',
      userId: ada.id,
      isDefault: false,
      ...makeAddress(lagos, 'Work'),
      area: 'Victoria Island',
      lat: 6.4281,
      lng: 3.4219,
    },
  );
  const customers = [ada];
  for (let i = 0; i < 70; i += 1) {
    const u = makeUser({ role: 'customer' });
    if (i % 23 === 7) u.status = 'suspended';
    if (i % 31 === 11) u.status = 'banned';
    customers.push(u);
    db.users.push(u);
    const city = pickCity();
    db.addresses.push({ id: newId('adr'), userId: u.id, isDefault: true, ...makeAddress(city) });
  }
  const addressOf = (userId) => db.addresses.find((a) => a.userId === userId && a.isDefault);

  // ── Vendors ─────────────────────────────────────────────────────────────
  const usedNames = new Set();
  const vendorName = () => {
    let name;
    do {
      name = faker.datatype.boolean(0.35)
        ? faker.helpers.arrayElement(VENDOR_NAME_PARTS.brands)
        : `${faker.helpers.arrayElement(VENDOR_NAME_PARTS.prefixes)} ${faker.helpers.arrayElement(VENDOR_NAME_PARTS.people)} ${faker.helpers.arrayElement(VENDOR_NAME_PARTS.suffixes)}`;
    } while (usedNames.has(name));
    usedNames.add(name);
    return name;
  };

  function makeVendor({
    id,
    owner,
    name,
    type,
    city,
    approvalStatus,
    subscriptionStatus,
    planId,
    point,
    area,
  }) {
    const vName = name ?? vendorName();
    const variant = faker.number.int(9);
    const vCity = city ?? pickCity();
    const location = point ?? jitter(vCity, 8);
    const vendorType = type ?? (faker.datatype.boolean(0.6) ? 'restaurant' : 'home_cook');
    const createdAt = faker.date.past({ years: 1, refDate: now - 20 * DAY });
    const bank = makeBank();
    bank.accountName = owner.name.toUpperCase();
    const vendor = {
      id: id ?? newId('ven'),
      ownerId: owner.id,
      slug: slugify(vName),
      name: vName,
      type: vendorType,
      description: faker.helpers.arrayElement([
        'Home-style Nigerian meals cooked fresh every day.',
        'Smoky jollof, grills and small chops for every occasion.',
        'Authentic soups and swallow, just like mama makes it.',
        'Fast, tasty and affordable — lunch sorted.',
        'Party trays, office lunches and weekend specials.',
      ]),
      logo: vendorLogo(vName, variant),
      cover: vendorCover(faker.helpers.arrayElement(['🍛', '🍢', '🍲', '🥘', '🍗']), variant),
      phone: nigerianPhone(),
      email: owner.email,
      address: {
        line1: `${faker.number.int({ min: 1, max: 99 })} ${faker.location.street()}`,
        area: area ?? faker.helpers.arrayElement(vCity.areas),
        city: vCity.city,
        state: vCity.state,
      },
      ...location,
      city: vCity.city,
      deliveryRadiusKm: faker.helpers.arrayElement([5, 8, 10, 15]),
      prepTimeMins: faker.helpers.arrayElement([15, 20, 25, 30, 40]),
      isPaused: false,
      openingHours: OPENING_HOURS(),
      approvalStatus: approvalStatus ?? 'approved',
      rejectionReason: null,
      submittedAt: createdAt.toISOString(),
      approvedAt:
        approvalStatus === 'approved' || !approvalStatus
          ? new Date(createdAt.getTime() + 2 * DAY).toISOString()
          : null,
      rating: Number(faker.number.float({ min: 3.6, max: 4.9 }).toFixed(1)),
      ratingCount: faker.number.int({ min: 4, max: 400 }),
      followersCount: 0,
      refundRate: Number(faker.number.float({ min: 0, max: 6 }).toFixed(1)),
      bank,
      bankChangeRequest: null,
      documents: REQUIRED_DOCUMENTS[vendorType].map((d) => ({
        id: newId('doc'),
        type: d.type,
        label: d.label,
        url: documentImage(d.label.split(' (')[0]),
        uploadedAt: createdAt.toISOString(),
      })),
      onboardingStep: 'submitted',
      planId:
        planId ??
        faker.helpers.arrayElement(['plan_basic', 'plan_pro', 'plan_pro', 'plan_premium']),
      subscriptionStatus:
        subscriptionStatus ??
        faker.helpers.weightedArrayElement([
          { weight: 6, value: 'active' },
          { weight: 2, value: 'trial' },
          { weight: 1, value: 'grace' },
          { weight: 1, value: 'expired' },
        ]),
      trialUsed: true,
      createdAt: createdAt.toISOString(),
    };
    return vendor;
  }

  // Demo vendor owner — approved, Pro plan, active
  const bisi = makeUser({
    id: 'usr_vendor_bisi',
    role: 'vendor',
    firstName: 'Bisi',
    lastName: 'Adeyemi',
    email: 'vendor@kjtfoodie.test',
    phone: '+2348030000002',
  });
  db.users.push(bisi);
  const mamaPut = makeVendor({
    id: 'ven_mama_put',
    owner: bisi,
    name: 'Mama Put Kitchen',
    type: 'restaurant',
    city: lagos,
    area: 'Yaba',
    point: { lat: 6.5158, lng: 3.3794 },
    planId: 'plan_pro',
    subscriptionStatus: 'active',
  });
  mamaPut.rating = 4.7;
  mamaPut.ratingCount = 312;
  mamaPut.refundRate = 1.2;
  db.vendors.push(mamaPut);
  bisi.vendorId = mamaPut.id;

  // Vendor with an expired plan (shows the lock screen)
  const chidi = makeUser({
    id: 'usr_vendor_expired',
    role: 'vendor',
    firstName: 'Chidi',
    lastName: 'Eze',
    email: 'expired.vendor@kjtfoodie.test',
    phone: '+2348030000003',
  });
  db.users.push(chidi);
  const expiredVendor = makeVendor({
    id: 'ven_expired',
    owner: chidi,
    name: 'Chidi Grills',
    city: lagos,
    planId: 'plan_basic',
    subscriptionStatus: 'expired',
  });
  db.vendors.push(expiredVendor);
  chidi.vendorId = expiredVendor.id;

  // New vendor who has not finished onboarding
  const tolu = makeUser({
    id: 'usr_vendor_new',
    role: 'vendor',
    firstName: 'Tolu',
    lastName: 'Ogunleye',
    email: 'new.vendor@kjtfoodie.test',
    phone: '+2348030000004',
  });
  db.users.push(tolu);
  const newVendor = makeVendor({
    id: 'ven_new',
    owner: tolu,
    name: 'Tolu’s Pot',
    city: lagos,
    approvalStatus: 'draft',
    subscriptionStatus: 'none',
  });
  Object.assign(newVendor, {
    onboardingStep: 'type',
    documents: [],
    approvedAt: null,
    submittedAt: null,
    rating: 0,
    ratingCount: 0,
    planId: null,
    trialUsed: false,
    bank: null,
    logo: null,
    cover: null,
    description: '',
  });
  db.vendors.push(newVendor);
  tolu.vendorId = newVendor.id;

  // Other vendors (some pending approval, some rejected)
  for (let i = 0; i < 45; i += 1) {
    const owner = makeUser({ role: 'vendor' });
    db.users.push(owner);
    const status = i < 6 ? 'pending' : i === 6 ? 'rejected' : i === 7 ? 'suspended' : 'approved';
    const v = makeVendor({ owner, approvalStatus: status });
    if (status === 'pending') {
      v.subscriptionStatus = 'none';
      v.trialUsed = false;
      v.approvedAt = null;
      v.submittedAt = faker.date.recent({ days: 4 }).toISOString();
    }
    if (status === 'rejected') {
      v.rejectionReason = 'The CAC certificate is not readable. Please upload a clearer photo.';
      v.subscriptionStatus = 'none';
    }
    db.vendors.push(v);
    owner.vendorId = v.id;
  }

  // Staff accounts for Mama Put
  for (let i = 0; i < 2; i += 1) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    db.staff.push({
      id: newId('stf'),
      vendorId: mamaPut.id,
      name: `${first} ${last}`,
      email: `${first}.${last}@example.com`.toLowerCase(),
      phone: nigerianPhone(),
      role: i === 0 ? 'manager' : 'kitchen',
      createdAt: faker.date.recent({ days: 60 }).toISOString(),
    });
  }

  // ── Subscriptions and invoices ───────────────────────────────────────────
  for (const v of db.vendors) {
    if (v.subscriptionStatus === 'none') continue;
    const interval = faker.helpers.arrayElement(['monthly', 'monthly', 'yearly']);
    const plan = db.plans.find((p) => p.id === v.planId);
    let periodEnd;
    if (v.subscriptionStatus === 'expired')
      periodEnd = now - faker.number.int({ min: 2, max: 20 }) * DAY;
    else if (v.subscriptionStatus === 'grace') periodEnd = now - DAY;
    else if (v.subscriptionStatus === 'trial')
      periodEnd = now + faker.number.int({ min: 1, max: 13 }) * DAY;
    else
      periodEnd = now + faker.number.int({ min: 3, max: interval === 'yearly' ? 300 : 28 }) * DAY;
    const periodStart = periodEnd - (interval === 'yearly' ? 365 : 30) * DAY;
    const sub = {
      id: newId('sub'),
      vendorId: v.id,
      planId: v.planId,
      interval,
      status: v.subscriptionStatus,
      currentPeriodStart: new Date(periodStart).toISOString(),
      currentPeriodEnd: new Date(periodEnd).toISOString(),
      trialEndsAt: v.subscriptionStatus === 'trial' ? new Date(periodEnd).toISOString() : null,
      graceEndsAt: v.subscriptionStatus === 'grace' ? new Date(now + 2 * DAY).toISOString() : null,
      cancelAtPeriodEnd: false,
      createdAt: v.approvedAt ?? v.createdAt,
    };
    if (v.id === mamaPut.id) {
      sub.interval = 'monthly';
      sub.currentPeriodEnd = new Date(now + 9 * DAY).toISOString();
      sub.currentPeriodStart = new Date(now - 21 * DAY).toISOString();
    }
    db.subscriptions.push(sub);
    v.subscriptionId = sub.id;
    if (v.subscriptionStatus !== 'trial') {
      const amount =
        interval === 'yearly'
          ? Math.round(plan.monthlyPrice * 12 * (1 - db.settings.yearlyDiscountPct / 100))
          : plan.monthlyPrice;
      const count = interval === 'yearly' ? 1 : faker.number.int({ min: 1, max: 6 });
      for (let k = 0; k < count; k += 1) {
        const at = new Date(periodStart - k * 30 * DAY);
        const reference = `SUB_${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`;
        const failed = v.subscriptionStatus === 'grace' && k === 0;
        db.invoices.push({
          id: newId('inv'),
          vendorId: v.id,
          subscriptionId: sub.id,
          planId: sub.planId,
          interval,
          amount,
          status: failed ? 'failed' : 'paid',
          reference,
          createdAt: at.toISOString(),
        });
        db.payments.push({
          id: newId('pay'),
          reference,
          type: 'subscription',
          vendorId: v.id,
          orderId: null,
          amount,
          vendorShare: 0,
          platformShare: amount,
          fee: Math.round(amount * 0.015),
          channel: 'card',
          status: failed ? 'failed' : 'success',
          settlementStatus: failed ? null : 'settled',
          reconciled: true,
          flag: null,
          createdAt: at.toISOString(),
        });
      }
    }
  }

  // ── Food items ────────────────────────────────────────────────────────────
  const liveVendors = db.vendors.filter((v) => v.approvalStatus === 'approved');
  for (const v of liveVendors) {
    const count = v.id === mamaPut.id ? 14 : faker.number.int({ min: 5, max: 10 });
    const dishes =
      v.id === mamaPut.id ? DISHES.slice(0, 14) : faker.helpers.arrayElements(DISHES, count);
    const plan = db.plans.find((p) => p.id === v.planId);
    for (const [name, categoryId, emoji, min, max, description] of dishes) {
      const variant = faker.number.int(9);
      const photoCount = Math.min(
        plan?.limits.photosPerItem ?? 1,
        faker.number.int({ min: 1, max: 3 }),
      );
      const createdAt = faker.date.between({ from: v.approvedAt ?? v.createdAt, to: now });
      db.foodItems.push({
        id: newId('food'),
        vendorId: v.id,
        categoryId,
        name,
        slug: slugify(name),
        description,
        price: kobo(roundTo(faker.number.int({ min, max }), 50)),
        photos: Array.from({ length: photoCount }, (_, i) => foodPhoto(emoji, variant + i)),
        emoji,
        portion: faker.helpers.arrayElement([
          '1 plate',
          '1 pack',
          'Serves 1',
          'Serves 2',
          '1 bowl',
        ]),
        prepTimeMins: faker.helpers.arrayElement([10, 15, 20, 30]),
        isAvailable: faker.datatype.boolean(0.92),
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        optionGroups: makeOptionGroups(categoryId),
        likesCount: 0,
        commentsCount: 0,
        ordersCount: 0,
        isHidden: false,
        createdAt: createdAt.toISOString(),
      });
    }
  }
  const itemsByVendor = (vendorId) => db.foodItems.filter((f) => f.vendorId === vendorId);

  // ── Likes, follows, comments, reports ─────────────────────────────────────
  for (const c of customers) {
    for (const f of faker.helpers.arrayElements(
      db.foodItems,
      faker.number.int({ min: 2, max: 25 }),
    )) {
      db.likes.push({
        id: newId('lik'),
        userId: c.id,
        foodItemId: f.id,
        createdAt: faker.date.recent({ days: 60 }).toISOString(),
      });
      f.likesCount += 1;
    }
    for (const v of faker.helpers.arrayElements(
      liveVendors,
      faker.number.int({ min: 0, max: 6 }),
    )) {
      db.follows.push({
        id: newId('fol'),
        userId: c.id,
        vendorId: v.id,
        createdAt: faker.date.recent({ days: 90 }).toISOString(),
      });
      v.followersCount += 1;
    }
  }
  // Pad counts so the feed looks lively
  for (const f of db.foodItems) f.likesCount += faker.number.int({ min: 0, max: 180 });
  for (const v of liveVendors) v.followersCount += faker.number.int({ min: 10, max: 1500 });

  for (const f of db.foodItems) {
    const n = faker.number.int({ min: 0, max: 5 });
    for (let i = 0; i < n; i += 1) {
      const author = faker.helpers.arrayElement(customers);
      const createdAt = faker.date.recent({ days: 30 });
      const comment = {
        id: newId('cmt'),
        foodItemId: f.id,
        userId: author.id,
        parentId: null,
        isVendorReply: false,
        body: faker.helpers.arrayElement(COMMENT_LINES),
        editedAt: null,
        removed: false,
        hidden: false,
        createdAt: createdAt.toISOString(),
      };
      db.comments.push(comment);
      f.commentsCount += 1;
      if (faker.datatype.boolean(0.35)) {
        const v = db.vendors.find((x) => x.id === f.vendorId);
        db.comments.push({
          id: newId('cmt'),
          foodItemId: f.id,
          userId: v.ownerId,
          parentId: comment.id,
          isVendorReply: true,
          body: faker.helpers.arrayElement([
            'Thank you so much! 🙏',
            'We appreciate you. See you next time!',
            'Noted — we will do better.',
            'Yes, we deliver there!',
          ]),
          editedAt: null,
          removed: false,
          hidden: false,
          createdAt: new Date(createdAt.getTime() + 3600000).toISOString(),
        });
        f.commentsCount += 1;
      }
    }
  }
  for (const c of faker.helpers.arrayElements(
    db.comments.filter((x) => !x.isVendorReply),
    9,
  )) {
    db.reports.push({
      id: newId('rep'),
      reporterId: faker.helpers.arrayElement(customers).id,
      targetType: 'comment',
      targetId: c.id,
      reason: faker.helpers.arrayElement([
        'Spam',
        'Offensive language',
        'Harassment',
        'Misleading',
      ]),
      status: 'open',
      createdAt: faker.date.recent({ days: 5 }).toISOString(),
    });
  }
  for (const f of faker.helpers.arrayElements(db.foodItems, 3)) {
    db.reports.push({
      id: newId('rep'),
      reporterId: faker.helpers.arrayElement(customers).id,
      targetType: 'food_item',
      targetId: f.id,
      reason: faker.helpers.arrayElement([
        'Photo is not the real food',
        'Unsafe food',
        'Prohibited item',
      ]),
      status: 'open',
      createdAt: faker.date.recent({ days: 5 }).toISOString(),
    });
  }

  // ── Riders ─────────────────────────────────────────────────────────────────
  function makeRider({ user, city, approvalStatus = 'approved', isOnline }) {
    const point = jitter(city, 7);
    const bank = makeBank();
    bank.accountName = user.name.toUpperCase();
    return {
      id: newId('rid'),
      userId: user.id,
      name: user.name,
      phone: user.phone,
      vehicleType: faker.helpers.arrayElement([
        'motorcycle',
        'motorcycle',
        'motorcycle',
        'bicycle',
        'car',
      ]),
      plateNumber: `${faker.helpers.arrayElement(['LSR', 'KJA', 'ABJ', 'EKY', 'APP', 'GGE'])}-${faker.string.numeric(3)}${faker.string.alpha({ length: 2, casing: 'upper' })}`,
      licenceNumber: faker.string.alphanumeric({ length: 11, casing: 'upper' }),
      guarantor: {
        name: faker.person.fullName(),
        phone: nigerianPhone(),
        relationship: faker.helpers.arrayElement([
          'Uncle',
          'Pastor',
          'Employer',
          'Aunt',
          'Brother',
        ]),
        address: `${faker.location.street()}, ${city.city}`,
      },
      documents: REQUIRED_DOCUMENTS.rider.map((d) => ({
        id: newId('doc'),
        type: d.type,
        label: d.label,
        url: documentImage(d.label),
        uploadedAt: user.createdAt,
      })),
      bank,
      approvalStatus,
      rejectionReason: null,
      isOnline: isOnline ?? (approvalStatus === 'approved' && faker.datatype.boolean(0.45)),
      lastSeenAt: new Date(now - faker.number.int({ min: 0, max: 600000 })).toISOString(),
      ...point,
      city: city.city,
      rating: Number(faker.number.float({ min: 3.9, max: 5 }).toFixed(1)),
      ratingCount: faker.number.int({ min: 5, max: 300 }),
      tripsCount: 0,
      submittedAt: user.createdAt,
      createdAt: user.createdAt,
    };
  }

  const tunde = makeUser({
    id: 'usr_rider_tunde',
    role: 'rider',
    firstName: 'Tunde',
    lastName: 'Bakare',
    email: 'rider@kjtfoodie.test',
    phone: '+2348030000005',
  });
  db.users.push(tunde);
  const tundeRider = makeRider({ user: tunde, city: lagos, isOnline: false });
  tundeRider.id = 'rid_tunde';
  Object.assign(tundeRider, { lat: 6.5122, lng: 3.3801, vehicleType: 'motorcycle', rating: 4.8 });
  db.riders.push(tundeRider);
  tunde.riderId = tundeRider.id;

  const kemi = makeUser({
    id: 'usr_rider_new',
    role: 'rider',
    firstName: 'Kemi',
    lastName: 'Adebayo',
    email: 'new.rider@kjtfoodie.test',
    phone: '+2348030000006',
  });
  db.users.push(kemi);
  const kemiRider = makeRider({
    user: kemi,
    city: lagos,
    approvalStatus: 'draft',
    isOnline: false,
  });
  Object.assign(kemiRider, {
    id: 'rid_new',
    documents: [],
    bank: null,
    guarantor: null,
    vehicleType: null,
    plateNumber: '',
    licenceNumber: '',
  });
  db.riders.push(kemiRider);
  kemi.riderId = kemiRider.id;

  for (let i = 0; i < 34; i += 1) {
    const user = makeUser({ role: 'rider' });
    db.users.push(user);
    const city = i < 18 ? lagos : pickCity();
    const r = makeRider({
      user,
      city,
      approvalStatus: i < 4 ? 'pending' : i === 4 ? 'suspended' : 'approved',
    });
    db.riders.push(r);
    user.riderId = r.id;
  }
  const approvedRiders = db.riders.filter((r) => r.approvalStatus === 'approved');

  // ── Orders, payments, deliveries, reviews ──────────────────────────────────
  const S = {
    PAID: 'paid',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    PREPARING: 'preparing',
    READY: 'ready_for_pickup',
    ASSIGNED: 'rider_assigned',
    PICKED_UP: 'picked_up',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  };
  const FLOW = [S.PAID, S.ACCEPTED, S.PREPARING, S.READY, S.ASSIGNED, S.PICKED_UP, S.DELIVERED];

  function buildLines(vendorId) {
    const items = itemsByVendor(vendorId);
    return faker.helpers
      .arrayElements(items, faker.number.int({ min: 1, max: Math.min(3, items.length) }))
      .map((f) => {
        const options = [];
        for (const g of f.optionGroups) {
          if (g.required || faker.datatype.boolean(0.3)) {
            const o = faker.helpers.arrayElement(g.options);
            options.push({
              groupId: g.id,
              groupName: g.name,
              optionId: o.id,
              name: o.name,
              price: o.price,
            });
          }
        }
        const quantity = faker.number.int({ min: 1, max: 3 });
        const unit = f.price + options.reduce((s, o) => s + o.price, 0);
        f.ordersCount += quantity;
        return {
          foodItemId: f.id,
          name: f.name,
          photo: f.photos[0],
          unitPrice: f.price,
          quantity,
          options,
          lineTotal: unit * quantity,
        };
      });
  }

  function createOrder({ customer, vendor, status, createdAt, riderId }) {
    const address = { ...addressOf(customer.id) };
    const distanceM = Math.max(
      800,
      Math.min(distanceMetres(vendor, address), 14000 + faker.number.int(4000)),
    );
    const items = buildLines(vendor.id);
    const subtotal = items.reduce((s, l) => s + l.lineTotal, 0);
    const deliveryFee = deliveryFeeFor(distanceM, db.settings);
    const processingFee = processingFeeFor(subtotal + deliveryFee, db.settings);
    const created = createdAt.getTime();
    const path =
      status === S.REJECTED
        ? [S.PAID, S.REJECTED]
        : status === S.CANCELLED
          ? [S.PAID, S.CANCELLED]
          : FLOW.slice(0, FLOW.indexOf(status) + 1);
    const statusHistory = path.map((s, i) => ({
      status: s,
      at: new Date(created + i * faker.number.int({ min: 3, max: 12 }) * 60000).toISOString(),
      by:
        i === 0
          ? 'system'
          : s === S.CANCELLED
            ? 'customer'
            : [S.ASSIGNED, S.PICKED_UP, S.DELIVERED].includes(s)
              ? 'rider'
              : 'vendor',
    }));
    const order = {
      id: newId('ord'),
      code: orderCode(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorSlug: vendor.slug,
      riderId: [S.ASSIGNED, S.PICKED_UP, S.DELIVERED].includes(status)
        ? (riderId ?? faker.helpers.arrayElement(approvedRiders).id)
        : null,
      status,
      items,
      subtotal,
      deliveryFee,
      processingFee,
      total: subtotal + deliveryFee + processingFee,
      address,
      deliveryNote:
        faker.helpers.maybe(
          () =>
            faker.helpers.arrayElement([
              'Call when you get to the gate',
              'Please add extra pepper',
              'Leave with the security man',
              'Blue gate opposite the church',
            ]),
          { probability: 0.4 },
        ) ?? '',
      scheduledFor: null,
      deliveryCode: faker.string.numeric(4),
      distanceM,
      etaMins: [
        Math.round(vendor.prepTimeMins + distanceM / 400),
        Math.round(vendor.prepTimeMins + distanceM / 300 + 10),
      ],
      acceptDeadline: new Date(created + db.settings.vendorAcceptTimeoutSec * 1000).toISOString(),
      statusHistory,
      cancelReason:
        status === S.CANCELLED
          ? 'Changed my mind'
          : status === S.REJECTED
            ? faker.helpers.arrayElement(['Out of stock', 'Kitchen closing', 'Too busy right now'])
            : null,
      ratedVendor: false,
      ratedRider: false,
      createdAt: createdAt.toISOString(),
      updatedAt: statusHistory.at(-1).at,
    };
    db.orders.push(order);

    const reference = `KJT_${faker.string.alphanumeric({ length: 12, casing: 'upper' })}`;
    const ageDays = (now - created) / DAY;
    db.payments.push({
      id: newId('pay'),
      reference,
      type: 'order',
      orderId: order.id,
      vendorId: vendor.id,
      customerId: customer.id,
      amount: order.total,
      vendorShare: subtotal,
      platformShare: deliveryFee,
      fee: processingFee,
      channel: faker.helpers.weightedArrayElement([
        { weight: 6, value: 'card' },
        { weight: 3, value: 'bank_transfer' },
        { weight: 1, value: 'ussd' },
      ]),
      status: 'success',
      settlementStatus: ageDays > 1.5 ? 'settled' : 'settling',
      settledAt: ageDays > 1.5 ? new Date(created + DAY).toISOString() : null,
      reconciled: ageDays > 1,
      flag:
        faker.helpers.maybe(
          () => faker.helpers.arrayElement(['amount_mismatch', 'missing_webhook']),
          { probability: 0.015 },
        ) ?? null,
      createdAt: order.createdAt,
    });
    order.paymentReference = reference;

    if (order.riderId) {
      const rider = db.riders.find((r) => r.id === order.riderId);
      const delivered = status === S.DELIVERED;
      db.deliveries.push({
        id: newId('del'),
        orderId: order.id,
        riderId: rider.id,
        status: delivered ? 'delivered' : status === S.PICKED_UP ? 'picked_up' : 'assigned',
        fee: deliveryFee,
        riderEarning: delivered ? Math.round((deliveryFee * db.settings.riderPayoutPct) / 100) : 0,
        payoutPct: db.settings.riderPayoutPct,
        distanceM,
        pickup: {
          lat: vendor.lat,
          lng: vendor.lng,
          name: vendor.name,
          address: `${vendor.address.line1}, ${vendor.address.area}`,
        },
        dropoff: {
          lat: address.lat,
          lng: address.lng,
          name: customer.name,
          address: `${address.line1}, ${address.area}`,
        },
        assignedAt: statusHistory.find((h) => h.status === S.ASSIGNED)?.at ?? null,
        pickedUpAt: statusHistory.find((h) => h.status === S.PICKED_UP)?.at ?? null,
        deliveredAt: statusHistory.find((h) => h.status === S.DELIVERED)?.at ?? null,
        route: [],
      });
      if (delivered) rider.tripsCount += 1;
    }

    if (status === S.DELIVERED && faker.datatype.boolean(0.45)) {
      const vRating = faker.helpers.weightedArrayElement([
        { weight: 6, value: 5 },
        { weight: 3, value: 4 },
        { weight: 1, value: 3 },
        { weight: 0.5, value: 2 },
      ]);
      db.reviews.push({
        id: newId('rev'),
        orderId: order.id,
        targetType: 'vendor',
        targetId: vendor.id,
        userId: customer.id,
        userName: customer.name,
        rating: vRating,
        comment: faker.helpers.arrayElement([
          'Delicious as always!',
          'Food was great, delivery a bit slow.',
          'Generous portion.',
          'Will order again.',
          '',
        ]),
        reply: null,
        createdAt: order.updatedAt,
      });
      db.reviews.push({
        id: newId('rev'),
        orderId: order.id,
        targetType: 'rider',
        targetId: order.riderId,
        userId: customer.id,
        userName: customer.name,
        rating: faker.helpers.arrayElement([5, 5, 4, 4, 3]),
        comment: faker.helpers.arrayElement(['Very polite rider.', 'Fast delivery!', '']),
        reply: null,
        createdAt: order.updatedAt,
      });
      order.ratedVendor = true;
      order.ratedRider = true;
    }
    return order;
  }

  // History across the last 90 days
  for (let i = 0; i < 360; i += 1) {
    const vendor = faker.helpers.weightedArrayElement([
      { weight: 3, value: mamaPut },
      ...liveVendors
        .filter((v) => v.subscriptionStatus !== 'expired')
        .map((v) => ({ weight: 1, value: v })),
    ]);
    const customer = faker.helpers.weightedArrayElement([
      { weight: 2, value: ada },
      ...customers.slice(1).map((c) => ({ weight: 1, value: c })),
    ]);
    const createdAt = faker.date.between({ from: now - 90 * DAY, to: now - 3 * 3600000 });
    const status = faker.helpers.weightedArrayElement([
      { weight: 20, value: S.DELIVERED },
      { weight: 1.2, value: S.CANCELLED },
      { weight: 1, value: S.REJECTED },
    ]);
    createOrder({ customer, vendor, status, createdAt });
  }
  // Today's orders for Mama Put's live queue and the admin overview
  const today = (minsAgo) => new Date(now - minsAgo * 60000);
  createOrder({ customer: customers[3], vendor: mamaPut, status: S.PAID, createdAt: today(1) });
  createOrder({ customer: customers[8], vendor: mamaPut, status: S.PAID, createdAt: today(2) });
  createOrder({ customer: customers[5], vendor: mamaPut, status: S.ACCEPTED, createdAt: today(7) });
  createOrder({
    customer: customers[12],
    vendor: mamaPut,
    status: S.PREPARING,
    createdAt: today(14),
  });
  createOrder({ customer: customers[15], vendor: mamaPut, status: S.READY, createdAt: today(26) });
  createOrder({
    customer: customers[20],
    vendor: mamaPut,
    status: S.ASSIGNED,
    createdAt: today(34),
    riderId: approvedRiders[3].id,
  });
  // Ada's order that is on its way (live tracking demo)
  createOrder({
    customer: ada,
    vendor: mamaPut,
    status: S.PICKED_UP,
    createdAt: today(38),
    riderId: approvedRiders[2].id,
  });
  for (let i = 0; i < 26; i += 1) {
    const vendor = faker.helpers.arrayElement(
      liveVendors.filter((v) => v.subscriptionStatus !== 'expired'),
    );
    createOrder({
      customer: faker.helpers.arrayElement(customers.slice(1)),
      vendor,
      status: faker.helpers.arrayElement([
        S.DELIVERED,
        S.DELIVERED,
        S.DELIVERED,
        S.PREPARING,
        S.READY,
        S.ASSIGNED,
        S.PICKED_UP,
        S.PAID,
      ]),
      createdAt: today(faker.number.int({ min: 5, max: 600 })),
    });
  }
  // Tunde's completed trips this month and before
  for (let i = 0; i < 24; i += 1) {
    const vendor = faker.helpers.arrayElement(liveVendors.filter((v) => v.city === 'Lagos'));
    createOrder({
      customer: faker.helpers.arrayElement(customers),
      vendor,
      status: S.DELIVERED,
      createdAt: faker.date.between({ from: now - 75 * DAY, to: now - 4 * 3600000 }),
      riderId: tundeRider.id,
    });
  }
  db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // ── Refunds ─────────────────────────────────────────────────────────────────
  const deliveredOrders = db.orders.filter((o) => o.status === S.DELIVERED);
  const refundCandidates = [
    ...deliveredOrders.filter((o) => o.customerId === ada.id).slice(1, 3),
    ...deliveredOrders
      .filter((o) => o.vendorId === mamaPut.id && o.customerId !== ada.id)
      .slice(0, 4),
    ...faker.helpers.arrayElements(deliveredOrders, 14),
  ];
  const seen = new Set();
  const refundStatuses = [
    'requested',
    'requested',
    'accepted',
    'paid',
    'confirmed',
    'rejected',
    'disputed',
    'escalated',
  ];
  refundCandidates.forEach((order, i) => {
    if (seen.has(order.id)) return;
    seen.add(order.id);
    const status = refundStatuses[i % refundStatuses.length];
    const createdAt = new Date(
      Math.min(new Date(order.updatedAt).getTime() + 3600000, now - (i + 1) * 3600000 * 5),
    );
    const step = (s, mins, by, note) => ({
      status: s,
      at: new Date(createdAt.getTime() + mins * 60000).toISOString(),
      by,
      note,
    });
    const amount = faker.datatype.boolean(0.6)
      ? order.subtotal
      : Math.round(order.subtotal / 2 / 100) * 100;
    const timeline = [step('requested', 0, 'customer', null)];
    let vendorResponse = null;
    let paymentReference = null;
    if (['accepted', 'paid', 'confirmed', 'disputed'].includes(status)) {
      vendorResponse = {
        decision: 'accepted',
        amount,
        reason: 'Sorry about that. Refunding you now.',
      };
      timeline.push(step('accepted', 90, 'vendor', vendorResponse.reason));
    }
    if (['paid', 'confirmed', 'disputed'].includes(status)) {
      paymentReference = `RF_${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`;
      timeline.push(step('paid', 200, 'vendor', `Reference ${paymentReference}`));
    }
    if (status === 'confirmed') timeline.push(step('confirmed', 400, 'customer', null));
    if (status === 'disputed')
      timeline.push(step('disputed', 400, 'customer', 'I have not received the money.'));
    if (status === 'rejected') {
      vendorResponse = {
        decision: 'rejected',
        amount: 0,
        reason: 'The rider confirmed the food was delivered hot and complete.',
      };
      timeline.push(step('rejected', 60, 'vendor', vendorResponse.reason));
    }
    if (status === 'escalated')
      timeline.push(
        step(
          'escalated',
          db.settings.refundDeadlineHours * 60,
          'system',
          'Vendor did not respond before the deadline.',
        ),
      );
    db.refunds.push({
      id: newId('rfd'),
      orderId: order.id,
      orderCode: order.code,
      customerId: order.customerId,
      customerName: order.customerName,
      vendorId: order.vendorId,
      vendorName: order.vendorName,
      reason: faker.helpers.arrayElement(REFUND_REASONS),
      details: faker.helpers.arrayElement([
        'The rice was cold and hard.',
        'I ordered two packs but got one.',
        'The chicken was missing.',
        '',
      ]),
      amount,
      orderSubtotal: order.subtotal,
      photos: faker.datatype.boolean(0.5) ? [foodPhoto(order.items[0] ? '🍛' : '📦', i)] : [],
      status,
      deadline: new Date(
        createdAt.getTime() + db.settings.refundDeadlineHours * 3600000,
      ).toISOString(),
      vendorResponse,
      paymentReference,
      escalated: status === 'escalated',
      timeline,
      comments: [],
      createdAt: createdAt.toISOString(),
    });
  });
  db.refunds.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // ── Rider payout statements (last 3 months) ──────────────────────────────────
  for (const r of approvedRiders) {
    for (let m = 1; m <= 3; m += 1) {
      const d = new Date(now);
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - m);
      const month = d.toISOString().slice(0, 7);
      const trips =
        r.id === tundeRider.id
          ? faker.number.int({ min: 60, max: 110 })
          : faker.number.int({ min: 10, max: 120 });
      const deliveryFees = trips * faker.number.int({ min: 90000, max: 160000 });
      const amount = Math.round((deliveryFees * db.settings.riderPayoutPct) / 100);
      const status = m === 1 ? faker.helpers.arrayElement(['draft', 'approved', 'paid']) : 'paid';
      db.payoutStatements.push({
        id: newId('pst'),
        riderId: r.id,
        riderName: r.name,
        month,
        trips,
        deliveryFees,
        payoutPct: db.settings.riderPayoutPct,
        amount,
        adjustments: 0,
        status,
        reference:
          status === 'paid'
            ? `TRF_${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`
            : null,
        approvedAt: status !== 'draft' ? new Date(d.getTime() + 33 * DAY).toISOString() : null,
        paidAt: status === 'paid' ? new Date(d.getTime() + 35 * DAY).toISOString() : null,
        createdAt: new Date(d.getTime() + 31 * DAY).toISOString(),
      });
    }
  }

  // ── Notifications for demo users ───────────────────────────────────────────
  const notify = (userId, type, title, body, link, minsAgo, read = false) =>
    db.notifications.push({
      id: newId('ntf'),
      userId,
      type,
      title,
      body,
      link,
      readAt: read ? new Date(now - minsAgo * 60000 + 60000).toISOString() : null,
      createdAt: new Date(now - minsAgo * 60000).toISOString(),
    });
  const adaActive = db.orders.find((o) => o.customerId === ada.id && o.status === S.PICKED_UP);
  notify(
    ada.id,
    'order',
    'Your food is on the way 🚚',
    `Order KJT-${adaActive.code} has been picked up.`,
    `/account/orders/${adaActive.id}`,
    4,
  );
  notify(
    ada.id,
    'order',
    'Mama Put Kitchen accepted your order',
    `Order KJT-${adaActive.code} is being prepared.`,
    `/account/orders/${adaActive.id}`,
    30,
    true,
  );
  notify(
    ada.id,
    'social',
    'Mama Put Kitchen posted a new dish',
    'Coconut rice is now on the menu.',
    '/v/mama-put-kitchen',
    600,
    true,
  );
  notify(
    ada.id,
    'refund',
    'Refund update',
    'Your refund request was accepted.',
    '/account/refunds',
    1500,
    true,
  );
  notify(bisi.id, 'order', 'New order', 'You have 2 new orders waiting.', '/vendor/orders', 1);
  notify(
    bisi.id,
    'subscription',
    'Your plan renews in 9 days',
    'Your Pro plan renews automatically.',
    '/vendor/subscription',
    200,
  );
  notify(
    bisi.id,
    'refund',
    'New refund request',
    'A customer asked for a refund. Respond within 48 h.',
    '/vendor/refunds',
    400,
  );
  notify(
    bisi.id,
    'social',
    'New comment',
    'Someone commented on Party jollof rice.',
    '/vendor/engagement',
    900,
    true,
  );
  notify(
    tunde.id,
    'payout',
    'Payout statement ready',
    'Your statement for last month is ready.',
    '/rider/earnings',
    3000,
    true,
  );
  notify(
    chidi.id,
    'subscription',
    'Your plan has expired',
    'Renew to make your store visible again.',
    '/vendor/subscription',
    60,
  );

  // ── Support tickets and chat ────────────────────────────────────────────────
  const ticketSubjects = [
    'Rider could not find my address',
    'Payment debited but no order',
    'How do I change my bank account?',
    'Customer refused delivery',
    'Wrong item delivered',
    'App keeps logging me out',
    'I want to upgrade my plan',
    'My payout is late',
  ];
  const supportAgent = admins.find((a) => a.adminRole === ADMIN_ROLES.SUPPORT);
  const ticketOwners = [
    ada,
    bisi,
    tunde,
    ...faker.helpers.arrayElements(customers.slice(1), 6),
    ...faker.helpers.arrayElements(
      db.users.filter((u) => u.role === 'vendor'),
      2,
    ),
  ];
  ticketOwners.forEach((u, i) => {
    const order = db.orders.find(
      (o) => o.customerId === u.id || o.vendorId === u.vendorId || o.riderId === u.riderId,
    );
    const createdAt = faker.date.recent({ days: 10 });
    const status = faker.helpers.arrayElement(['open', 'open', 'pending', 'resolved', 'closed']);
    const messages = [
      {
        id: newId('msg'),
        authorId: u.id,
        authorName: u.name,
        authorRole: u.role,
        body: `Hello, ${ticketSubjects[i % ticketSubjects.length].toLowerCase()}. Please help.`,
        internal: false,
        createdAt: createdAt.toISOString(),
      },
    ];
    if (status !== 'open') {
      messages.push({
        id: newId('msg'),
        authorId: supportAgent.id,
        authorName: supportAgent.name,
        authorRole: 'admin',
        body: 'Thanks for reaching out. We are looking into it and will update you shortly.',
        internal: false,
        createdAt: new Date(createdAt.getTime() + 1800000).toISOString(),
      });
      messages.push({
        id: newId('msg'),
        authorId: supportAgent.id,
        authorName: supportAgent.name,
        authorRole: 'admin',
        body: 'Checked Paystack — transaction is fine.',
        internal: true,
        createdAt: new Date(createdAt.getTime() + 2000000).toISOString(),
      });
    }
    db.tickets.push({
      id: newId('tkt'),
      number: 1000 + i,
      userId: u.id,
      userName: u.name,
      userRole: u.role,
      orderId: order?.id ?? null,
      orderCode: order?.code ?? null,
      subject: ticketSubjects[i % ticketSubjects.length],
      status,
      priority: faker.helpers.arrayElement(['low', 'normal', 'normal', 'high']),
      assigneeId: status === 'open' ? null : supportAgent.id,
      assigneeName: status === 'open' ? null : supportAgent.name,
      messages,
      createdAt: createdAt.toISOString(),
      updatedAt: messages.at(-1).createdAt,
    });
  });

  // ── Audit log ───────────────────────────────────────────────────────────────
  const auditActions = [
    ['vendor.approved', 'vendor'],
    ['vendor.rejected', 'vendor'],
    ['rider.approved', 'rider'],
    ['plan.updated', 'plan'],
    ['settings.updated', 'settings'],
    ['order.rider_reassigned', 'order'],
    ['refund.escalated', 'refund'],
    ['payout.approved', 'payout'],
    ['payout.marked_paid', 'payout'],
    ['customer.suspended', 'user'],
    ['comment.removed', 'comment'],
    ['subscription.extended', 'subscription'],
  ];
  for (let i = 0; i < 60; i += 1) {
    const actor = faker.helpers.arrayElement(admins);
    const [action, targetType] = faker.helpers.arrayElement(auditActions);
    db.auditLog.push({
      id: newId('aud'),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.adminRole,
      action,
      targetType,
      targetId: newId(targetType.slice(0, 3)),
      summary: action.replace('.', ' ').replace(/_/g, ' '),
      ip: faker.internet.ipv4(),
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
    });
  }
  db.auditLog.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return db;
}
