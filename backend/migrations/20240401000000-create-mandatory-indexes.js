'use strict';

/**
 * migrations/20240401000000-create-mandatory-indexes.js
 *
 * Creates ALL mandatory indexes specified in TDD §4.6.
 * "Missing any index will cause performance failures under the 3,000-user load target."
 *
 * NEVER skip index creation (TDD §1.1 absolute constraint).
 *
 * Index summary:
 *  vendors      : { location_tag: 1, is_currently_open: 1 }
 *  menu_items   : { vendor_id: 1, is_sold_out: 1, category: 1 }
 *  reviews      : { vendor_id: 1, timestamp: -1 }
 *  reviews      : { vendor_id: 1, timestamp: 1, overall_score: 1 }  ← CRITICAL tripwire index
 *  reviews      : { student_id: 1, vendor_id: 1 } UNIQUE             ← 1 review/student/vendor lifetime
 *  wait_times   : { timestamp: 1 } TTL expireAfterSeconds: 1200      ← 20-min auto-delete
 *  wait_times   : { vendor_id: 1, student_id: 1, timestamp: -1 }     ← rate-limit + stuffing prevention
 *  users        : { email: 1 } UNIQUE
 *  users        : { created_at: 1 }                                   ← anomaly tripwire account-age check
 */
module.exports = {
  async up(db) {
    // ─── vendors ─────────────────────────────────────────────────────────────
    await db.collection('vendors').createIndex(
      { location_tag: 1, is_currently_open: 1 },
      { name: 'vendors_location_open', background: true }
    );

    // ─── menu_items ───────────────────────────────────────────────────────────
    await db.collection('menu_items').createIndex(
      { vendor_id: 1, is_sold_out: 1, category: 1 },
      { name: 'menu_items_vendor_soldout_category', background: true }
    );

    // ─── reviews ─────────────────────────────────────────────────────────────

    // Paginated review fetch — newest first
    await db.collection('reviews').createIndex(
      { vendor_id: 1, timestamp: -1 },
      { name: 'reviews_vendor_timestamp_desc', background: true }
    );

    // ⚠ CRITICAL: Powers the 60-minute anomaly tripwire query (TDD §4.6 / v3.0 patch)
    // Without this a full collection scan occurs under load
    await db.collection('reviews').createIndex(
      { vendor_id: 1, timestamp: 1, overall_score: 1 },
      { name: 'reviews_tripwire', background: true }
    );

    // Enforce 1 review per (student, vendor) — lifetime uniqueness (TDD §6.1)
    await db.collection('reviews').createIndex(
      { student_id: 1, vendor_id: 1 },
      { unique: true, name: 'unique_student_vendor_review', background: true }
    );

    // ─── wait_times ───────────────────────────────────────────────────────────

    // TTL auto-delete: documents expire after 20 minutes (1200 seconds) (TDD §2.4)
    // THIS IS the 20-minute wait-time decay mechanism — do NOT skip
    await db.collection('wait_times').createIndex(
      { timestamp: 1 },
      { expireAfterSeconds: 1200, name: 'wait_times_ttl', background: true }
    );

    // Rate-limit check: 1 report per (student, vendor) per 30-min window
    // Also prevents wait-time stuffing (TDD §4.6 v3.0 patch notes)
    await db.collection('wait_times').createIndex(
      { vendor_id: 1, student_id: 1, timestamp: -1 },
      { name: 'wait_times_rate_limit', background: true }
    );

    // ─── users ────────────────────────────────────────────────────────────────

    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true, name: 'users_email_unique', background: true }
    );

    // Used by anomaly tripwire account-age gate (TDD §6.4)
    await db.collection('users').createIndex(
      { created_at: 1 },
      { name: 'users_created_at', background: true }
    );

    console.log('[Migration] All mandatory indexes created (TDD §4.6)');
  },

  async down(db) {
    // Drop indexes in reverse order — safe for rollback

    await db.collection('users').dropIndex('users_created_at').catch(() => {});
    await db.collection('users').dropIndex('users_email_unique').catch(() => {});

    await db.collection('wait_times').dropIndex('wait_times_rate_limit').catch(() => {});
    await db.collection('wait_times').dropIndex('wait_times_ttl').catch(() => {});

    await db.collection('reviews').dropIndex('unique_student_vendor_review').catch(() => {});
    await db.collection('reviews').dropIndex('reviews_tripwire').catch(() => {});
    await db.collection('reviews').dropIndex('reviews_vendor_timestamp_desc').catch(() => {});

    await db.collection('menu_items').dropIndex('menu_items_vendor_soldout_category').catch(() => {});

    await db.collection('vendors').dropIndex('vendors_location_open').catch(() => {});

    console.log('[Migration] Rolled back all mandatory indexes');
  },
};
