'use strict';

/**
 * backend/scripts/seeder.js
 * Populates the DB with realistic SRM University AP demo data.
 * Run: node backend/scripts/seeder.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { v4: uuidv4 } = require('uuid');
const connectDB = require('../config/db');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');

// ─── Helper ───────────────────────────────────────────────────────────────────
const id = () => uuidv4();

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Clearing existing data...');
    await User.deleteMany({});
    await Vendor.deleteMany({});
    await MenuItem.deleteMany({});
    await Review.deleteMany({});

    // ─── Users ────────────────────────────────────────────────────────────────
    console.log('[Seeder] Creating users...');

    const admin = await User.create({
      _id: id(), email: 'admin@srmap.edu.in', role: 'admin', is_verified: true,
    });

    const [vu1, vu2, vu3, vu4, vu5, vu6] = await Promise.all([
      User.create({ _id: id(), email: 'greenbites@srmap.edu.in',    role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'crunchy@srmap.edu.in',       role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'spcanteen@srmap.edu.in',     role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'mbacafe@srmap.edu.in',       role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'expressbites@srmap.edu.in',  role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'chaistop@srmap.edu.in',      role: 'vendor', is_verified: true }),
    ]);

    const [s1, s2, s3, s4] = await Promise.all([
      User.create({ _id: id(), email: 'student@srmap.edu.in',        role: 'student', is_verified: true }),
      User.create({ _id: id(), email: 'ap22110010001@srmap.edu.in',  role: 'student', is_verified: true }),
      User.create({ _id: id(), email: 'ap22110010002@srmap.edu.in',  role: 'student', is_verified: true }),
      User.create({ _id: id(), email: 'ap22110010003@srmap.edu.in',  role: 'student', is_verified: true }),
    ]);

    // ─── Vendors ──────────────────────────────────────────────────────────────
    console.log('[Seeder] Creating vendors...');

    const weekdays = [1, 2, 3, 4, 5].map(day => ({ day, open: '08:00', close: '20:00' }));
    const weekdaysLong = [1, 2, 3, 4, 5].map(day => ({ day, open: '07:30', close: '22:00' }));
    const allDays = [1, 2, 3, 4, 5, 6, 7].map(day => ({ day, open: '09:00', close: '21:00' }));

    const [v1, v2, v3, v4, v5, v6] = await Promise.all([
      Vendor.create({
        _id: id(), owner_id: vu1._id,
        stall_name: 'Green Bites',
        location_tag: 'Main Canteen — Ground Floor',
        operating_hours: weekdays,
        is_currently_open: true,
        avg_rating: 4.5,
        current_wait_time: 8,
      }),
      Vendor.create({
        _id: id(), owner_id: vu2._id,
        stall_name: 'Crunchy Corner',
        location_tag: 'Food Court — Level 2',
        operating_hours: weekdaysLong,
        is_currently_open: true,
        avg_rating: 4.2,
        current_wait_time: 12,
      }),
      Vendor.create({
        _id: id(), owner_id: vu3._id,
        stall_name: 'SP Canteen',
        location_tag: 'Science Block — Near Gate B',
        operating_hours: weekdays,
        is_currently_open: true,
        avg_rating: 4.0,
        current_wait_time: 5,
      }),
      Vendor.create({
        _id: id(), owner_id: vu4._id,
        stall_name: 'MBA Café',
        location_tag: 'Management Block — 1st Floor',
        operating_hours: weekdays,
        is_currently_open: false,
        avg_rating: 4.7,
        current_wait_time: 3,
      }),
      Vendor.create({
        _id: id(), owner_id: vu5._id,
        stall_name: 'Express Bites',
        location_tag: 'Engineering Block — Lobby',
        operating_hours: weekdaysLong,
        is_currently_open: true,
        avg_rating: 3.9,
        current_wait_time: 15,
      }),
      Vendor.create({
        _id: id(), owner_id: vu6._id,
        stall_name: 'The Chai Stop',
        location_tag: 'Library — Ground Floor',
        operating_hours: allDays,
        is_currently_open: true,
        avg_rating: 4.8,
        current_wait_time: 2,
      }),
    ]);

    // ─── Menu Items ───────────────────────────────────────────────────────────
    console.log('[Seeder] Creating menu items...');

    await MenuItem.insertMany([
      // Green Bites — v1
      { _id: id(), vendor_id: v1._id, item_name: 'Veg Thali',            price: 80,  category: 'Main Course', dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v1._id, item_name: 'Paneer Butter Masala', price: 120, category: 'Main Course', dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v1._id, item_name: 'Dal Tadka',            price: 60,  category: 'Main Course', dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v1._id, item_name: 'Raita',                price: 25,  category: 'Snacks',      dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v1._id, item_name: 'Lassi',                price: 40,  category: 'Beverages',   dietary_tag: 'veg',     is_sold_out: false },

      // Crunchy Corner — v2
      { _id: id(), vendor_id: v2._id, item_name: 'Chicken Burger',       price: 150, category: 'Fast Food',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: v2._id, item_name: 'Veg Burger',           price: 90,  category: 'Fast Food',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v2._id, item_name: 'French Fries',         price: 60,  category: 'Snacks',      dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v2._id, item_name: 'Cold Coffee',          price: 70,  category: 'Beverages',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v2._id, item_name: 'Chicken Wrap',         price: 130, category: 'Fast Food',   dietary_tag: 'non-veg', is_sold_out: false },

      // SP Canteen — v3
      { _id: id(), vendor_id: v3._id, item_name: 'Chicken Biryani',      price: 140, category: 'Main Course', dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: v3._id, item_name: 'Veg Biryani',          price: 100, category: 'Main Course', dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v3._id, item_name: 'Samosa (2 pcs)',       price: 20,  category: 'Snacks',      dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v3._id, item_name: 'Buttermilk',           price: 15,  category: 'Beverages',   dietary_tag: 'veg',     is_sold_out: false },

      // MBA Café — v4
      { _id: id(), vendor_id: v4._id, item_name: 'Grilled Sandwich',     price: 75,  category: 'Snacks',      dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v4._id, item_name: 'Cappuccino',           price: 80,  category: 'Beverages',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v4._id, item_name: 'Club Sandwich',        price: 110, category: 'Snacks',      dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: v4._id, item_name: 'Pasta Arabiata',       price: 130, category: 'Main Course', dietary_tag: 'veg',     is_sold_out: false },

      // Express Bites — v5
      { _id: id(), vendor_id: v5._id, item_name: 'Egg Roll',             price: 50,  category: 'Fast Food',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: v5._id, item_name: 'Pav Bhaji',            price: 70,  category: 'Supper',      dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v5._id, item_name: 'Noodles',              price: 65,  category: 'Supper',      dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v5._id, item_name: 'Energy Drink',         price: 55,  category: 'Beverages',   dietary_tag: 'veg',     is_sold_out: false },

      // The Chai Stop — v6
      { _id: id(), vendor_id: v6._id, item_name: 'Masala Chai',          price: 15,  category: 'Beverages',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v6._id, item_name: 'Filter Coffee',        price: 20,  category: 'Beverages',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v6._id, item_name: 'Biscuits (Packet)',     price: 10,  category: 'Snacks',      dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: v6._id, item_name: 'Boiled Eggs (2 pcs)',  price: 30,  category: 'Snacks',      dietary_tag: 'non-veg', is_sold_out: false },
    ]);

    // ─── Reviews ──────────────────────────────────────────────────────────────
    console.log('[Seeder] Creating reviews...');

    await Review.insertMany([
      { _id: id(), vendor_id: v1._id, user_id: s1._id, rating: 5, comment: 'Fresh food every day — the veg thali is a steal at ₹80!' },
      { _id: id(), vendor_id: v1._id, user_id: s2._id, rating: 4, comment: 'Paneer was excellent. Queue was a bit long during lunch hours.' },
      { _id: id(), vendor_id: v2._id, user_id: s1._id, rating: 4, comment: 'Chicken burger is quite good. Fries always hot and crispy.' },
      { _id: id(), vendor_id: v2._id, user_id: s3._id, rating: 5, comment: 'Best fast food on campus. Highly recommend the chicken wrap!' },
      { _id: id(), vendor_id: v3._id, user_id: s2._id, rating: 4, comment: 'Biryani is authentic. The samosas are perfect with buttermilk.' },
      { _id: id(), vendor_id: v4._id, user_id: s4._id, rating: 5, comment: 'MBA Café is a hidden gem — great coffee and calm environment.' },
      { _id: id(), vendor_id: v5._id, user_id: s3._id, rating: 4, comment: 'Fast service, good pav bhaji. Perfect after evening classes.' },
      { _id: id(), vendor_id: v6._id, user_id: s4._id, rating: 5, comment: 'The chai here is legendary. Best ₹15 on campus!' },
    ]);

    console.log('\n ✓  Seeding completed successfully!');
    console.log('    6 vendors | 26 menu items | 8 reviews | 10 users\n');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Error:', err.message);
    process.exit(1);
  }
};

seedData();
