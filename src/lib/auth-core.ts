import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Format: scrypt:<saltHex>:<hashHex>. Contains no "$" so it is safe in .env files. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  const [scheme, saltHex, hashHex] = (stored ?? "").split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

/** Stateless session token: "<expiryUnixSeconds>.<hmac>". */
export function createSessionToken(secret: string, nowMs = Date.now()): string {
  const expires = String(Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS);
  return `${expires}.${sign(expires, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string, nowMs = Date.now()): boolean {
  if (!token) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac || !/^\d+$/.test(expires)) return false;
  const expected = Buffer.from(sign(expires, secret));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  return Number(expires) * 1000 > nowMs;
}
