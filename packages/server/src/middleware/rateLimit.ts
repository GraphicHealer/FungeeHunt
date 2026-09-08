import rateLimit from 'express-rate-limit';

const common = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
};

// GM passphrase attempts.
export const gmLoginLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

// Public game creation (the wizard is intentionally usable without logging in).
export const createGameLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

// Player proof submissions: token-authed, but each request writes files to disk.
export const submitLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 60,
});

// Unauthenticated endpoints keyed by 6-digit codes (join, view, archive, spectator).
// Generous enough for a room full of phones behind one NAT, far too slow to brute-force codes.
export const codeLookupLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 600,
});
