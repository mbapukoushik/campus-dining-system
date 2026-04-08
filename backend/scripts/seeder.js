'use strict';

/**
 * backend/scripts/seeder.js
 *
 * Seeds the database with real restaurants near SRM University AP,
 * Mangalagiri / Amaravati, Andhra Pradesh.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const User     = require('../models/User');
const Vendor   = require('../models/Vendor');
const MenuItem = require('../models/MenuItem');
const Review   = require('../models/Review');

const id = () => uuidv4();

async function seed() {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 10 });
    console.log('[Seeder] Connected. Clearing old data...');

    await Promise.all([
      User.deleteMany({}),
      Vendor.deleteMany({}),
      MenuItem.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // ─── Vendor Owners ───────────────────────────────────────────────────────
    const owners = await Promise.all([
      User.create({ _id: id(), email: 'srilakshmi.mourya@srmap.edu.in',   role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'bismillah.biryani@srmap.edu.in',   role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'mandakini.restaurant@srmap.edu.in',role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'zamzam.restaurant@srmap.edu.in',   role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'senapathi.hotel@srmap.edu.in',     role: 'vendor', is_verified: true }),
      User.create({ _id: id(), email: 'prasad.fastfoods@srmap.edu.in',    role: 'vendor', is_verified: true }),
    ]);

    // ─── Students ─────────────────────────────────────────────────────────────
    const students = await Promise.all([
      User.create({ _id: id(), email: 'bapukoushik_maddisotty@srmap.edu.in', role: 'student', is_verified: true }),
      User.create({ _id: id(), email: 'ap22110010001@srmap.edu.in',           role: 'student', is_verified: true }),
      User.create({ _id: id(), email: 'ap22110010002@srmap.edu.in',           role: 'student', is_verified: true }),
      User.create({ _id: id(), email: 'ap22110010003@srmap.edu.in',           role: 'student', is_verified: true }),
    ]);

    // ─── Vendors ──────────────────────────────────────────────────────────────
    const weekdays = [1, 2, 3, 4, 5].map(d => ({ day: d, open: '09:00', close: '22:00' }));
    const allWeek  = [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, open: '08:00', close: '23:00' }));

    const vendors = await Promise.all([

      // 1 ─ Sri Lakshmi Mourya Dhaba (Rating 4.1 in app)
      Vendor.create({
        _id: id(), owner_id: owners[0]._id,
        stall_name: 'Sri Lakshmi Mourya Dhaba',
        location_tag: 'Near Donbasco School, Yerrabai Nagar',
        operating_hours: allWeek,
        is_currently_open: true,
        avg_rating: 4.1,
        current_wait_time: 15,
      }),

      // 2 ─ Bismillah Biryani (Rating 4.2 in app)
      Vendor.create({
        _id: id(), owner_id: owners[1]._id,
        stall_name: 'Bismillah Biryani',
        location_tag: 'Opp Mandakini Bar, Mangalagiri',
        operating_hours: allWeek,
        is_currently_open: true,
        avg_rating: 4.2,
        current_wait_time: 20,
      }),

      // 3 ─ Mandakini Restaurant (Rating 3.9 in app)
      Vendor.create({
        _id: id(), owner_id: owners[2]._id,
        stall_name: 'Mandakini Restaurant',
        location_tag: 'Gowtham Buddha Road, Mangalagiri',
        operating_hours: weekdays,
        is_currently_open: true,
        avg_rating: 3.9,
        current_wait_time: 25,
      }),

      // 4 ─ Zam Zam Family Restaurant (Rating 3.9 in app)
      Vendor.create({
        _id: id(), owner_id: owners[3]._id,
        stall_name: 'Zam Zam Family Restaurant',
        location_tag: 'Gowtham Buddha Road, Mangalagiri',
        operating_hours: allWeek,
        is_currently_open: true,
        avg_rating: 3.9,
        current_wait_time: 30,
      }),

      // 5 ─ Senapathi Military Hotel (Rating 3.8 in app)
      Vendor.create({
        _id: id(), owner_id: owners[4]._id,
        stall_name: 'Senapathi Military Hotel',
        location_tag: 'Guntur Highway, Chinakakani',
        operating_hours: weekdays,
        is_currently_open: true,
        avg_rating: 3.8,
        current_wait_time: 10,
      }),

      // 6 ─ Prasad Fast Foods & Biryanis (Rating 3.2 in app)
      Vendor.create({
        _id: id(), owner_id: owners[5]._id,
        stall_name: 'Prasad Fast Foods & Biryanis',
        location_tag: 'Near VJ College, Ganapathi Nagar',
        operating_hours: weekdays,
        is_currently_open: false,
        avg_rating: 3.2,
        current_wait_time: 35,
      }),

    ]);

    // ─── Menu Items ───────────────────────────────────────────────────────────
    await MenuItem.insertMany([

      // Sri Lakshmi Mourya Dhaba
      { _id: id(), vendor_id: vendors[0]._id, item_name: 'Chicken Biryani (Full)',  price: 220, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[0]._id, item_name: 'Chicken Biryani (Half)',  price: 130, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[0]._id, item_name: 'Veg Biryani',             price: 120, category: 'lunch',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: vendors[0]._id, item_name: 'Pulka (2 pcs)',            price: 40,  category: 'dinner',  dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: vendors[0]._id, item_name: 'Mutton Curry',             price: 180, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[0]._id, item_name: 'Dal Fry + Rice',           price: 90,  category: 'lunch',   dietary_tag: 'veg',     is_sold_out: false },

      // Bismillah Biryani
      { _id: id(), vendor_id: vendors[1]._id, item_name: 'Special Chicken Biryani', price: 250, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[1]._id, item_name: 'Chicken Biryani',         price: 180, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[1]._id, item_name: 'Egg Biryani',             price: 120, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[1]._id, item_name: 'Veg Biryani',             price: 100, category: 'lunch',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: vendors[1]._id, item_name: 'Chicken Pakodi',          price: 160, category: 'snacks',  dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[1]._id, item_name: 'Raitha',                  price: 30,  category: 'snacks',  dietary_tag: 'veg',     is_sold_out: false },

      // Mandakini Restaurant
      { _id: id(), vendor_id: vendors[2]._id, item_name: 'Chicken Fried Rice',      price: 150, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[2]._id, item_name: 'Egg Fried Rice',          price: 110, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[2]._id, item_name: 'Veg Fried Rice',          price: 90,  category: 'lunch',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: vendors[2]._id, item_name: 'Chicken Manchuria',       price: 180, category: 'snacks',  dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[2]._id, item_name: 'Butter Naan',             price: 40,  category: 'dinner',  dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: vendors[2]._id, item_name: 'Sweet Lassi',             price: 50,  category: 'beverages', dietary_tag: 'veg',   is_sold_out: false },

      // Zam Zam Family Restaurant
      { _id: id(), vendor_id: vendors[3]._id, item_name: 'Mutton Mandi',            price: 350, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[3]._id, item_name: 'Chicken Mandi',           price: 280, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[3]._id, item_name: 'Chicken Biryani',         price: 200, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[3]._id, item_name: 'Roti',                    price: 20,  category: 'dinner',  dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: vendors[3]._id, item_name: 'Chicken BBQ',             price: 220, category: 'snacks',  dietary_tag: 'non-veg', is_sold_out: false },

      // Senapathi Military Hotel
      { _id: id(), vendor_id: vendors[4]._id, item_name: 'Meals (Full)',             price: 120, category: 'lunch',   dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: vendors[4]._id, item_name: 'Chicken Biryani',         price: 170, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[4]._id, item_name: 'Tandoori Chicken (Half)', price: 220, category: 'snacks',  dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[4]._id, item_name: 'Pulka + Curry',           price: 80,  category: 'dinner',  dietary_tag: 'veg',     is_sold_out: false },

      // Prasad Fast Foods & Biryanis
      { _id: id(), vendor_id: vendors[5]._id, item_name: 'Special Biryani',         price: 180, category: 'lunch',   dietary_tag: 'non-veg', is_sold_out: true  },
      { _id: id(), vendor_id: vendors[5]._id, item_name: 'Noodles (Veg)',           price: 90,  category: 'dinner',  dietary_tag: 'veg',     is_sold_out: false },
      { _id: id(), vendor_id: vendors[5]._id, item_name: 'Chicken Noodles',         price: 130, category: 'dinner',  dietary_tag: 'non-veg', is_sold_out: false },
      { _id: id(), vendor_id: vendors[5]._id, item_name: 'Veg Manchuria',           price: 110, category: 'snacks',  dietary_tag: 'veg',     is_sold_out: false },

    ]);

    // ─── Reviews ──────────────────────────────────────────────────────────────
    await Review.insertMany([
      {
        _id: id(), vendor_id: vendors[0]._id, student_id: students[0]._id,
        taste_score: 4, value_score: 5, overall_score: 4,
        comment_text: 'Best biryani near campus. The half portion is perfect for ₹130. Dal fry is also good.',
      },
      {
        _id: id(), vendor_id: vendors[1]._id, student_id: students[1]._id,
        taste_score: 5, value_score: 4, overall_score: 5,
        comment_text: 'Bismillah biryani is authentic — the masala hits different. Slightly pricey but worth it.',
      },
      {
        _id: id(), vendor_id: vendors[2]._id, student_id: students[2]._id,
        taste_score: 4, value_score: 4, overall_score: 4,
        comment_text: 'Fried rice is good and fresh. Chicken manchuria is the star here.',
      },
      {
        _id: id(), vendor_id: vendors[3]._id, student_id: students[3]._id,
        taste_score: 5, value_score: 3, overall_score: 4,
        comment_text: 'Mutton Mandi is a must try. Expensive but the portion size is huge.',
      },
      {
        _id: id(), vendor_id: vendors[4]._id, student_id: students[0]._id,
        taste_score: 4, value_score: 5, overall_score: 4,
        comment_text: 'Military hotel meals for ₹120 is unbeatable value. Comes with full side dishes.',
      },
    ]);

    console.log('\n ✓  Seeding complete! Real restaurants loaded.\n');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Error:', err.message);
    process.exit(1);
  }
}

seed();
