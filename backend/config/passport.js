'use strict';

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

/**
 * config/passport.js
 *
 * Configures the Passport Google OAuth2 strategy.
 *
 * Domain Validation (TDD §5.1 — MANDATORY):
 *  NEVER hardcode the domain — read from process.env.UNIVERSITY_EMAIL_DOMAIN
 *  If the authenticated Google profile's email does NOT end with the university domain,
 *  the verify callback must return a 403-equivalent failure (done(null, false, ...)).
 *
 * All OAuth credentials read exclusively from process.env (TDD §1.1).
 */
module.exports = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        // Pass the request object so we can inspect it if needed
        passReqToCallback: false,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Extract primary email from Google profile
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value.toLowerCase()
              : null;

          if (!email) {
            return done(null, false, { message: 'No email returned from Google' });
          }

          // ─── MANDATORY domain validation (TDD §5.1) ──────────────────────
          // NEVER hardcode the domain (TDD §1.1)
          const domain = process.env.UNIVERSITY_EMAIL_DOMAIN;
          if (!domain) {
            console.error('[Passport] UNIVERSITY_EMAIL_DOMAIN env var is not set');
            return done(new Error('Server misconfiguration: missing email domain'));
          }

          if (!email.endsWith(domain)) {
            // Return 403-equivalent — done(null, false) triggers failureRedirect
            return done(null, false, {
              message: 'University email required. Only ' + domain + ' addresses are permitted.',
            });
          }

          // ─── Upsert user in MongoDB ───────────────────────────────────────
          // findOne by email; if not found, create a new Student user.
          let user = await User.findOne({ email });

          if (!user) {
            user = new User({
              _id: uuidv4(),
              email,
              role: 'student',
              is_verified: true,   // Domain check passed → verified
              created_at: new Date(),
            });
            await user.save();
            console.log(`[Passport] New user registered: ${email}`);
          } else if (!user.is_verified) {
            // Existing user re-authenticating — mark as verified
            user.is_verified = true;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          console.error('[Passport] Verify callback error:', err.message);
          return done(err);
        }
      }
    )
  );

  // We use stateless JWT (no session serialization needed)
  // These are required by Passport even when session: false in most strategies
  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
