import { cookies } from "next/headers";
import {
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifyPassword,
  verifySessionToken,
} from "./auth-core";

const COOKIE = "ft_admin";
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// Best-effort brute-force limit; per server instance only (serverless instances do not share it).
const failures: { count: number; first: number } = { count: 0, first: 0 };

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return secret;
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !process.env.SESSION_SECRET) return false;
  return verifySessionToken(token, sessionSecret());
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You must be signed in as the administrator to do that.");
    this.name = "UnauthorizedError";
  }
}

/** Call first in every server-side mutation. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new UnauthorizedError();
}

/** Returns an error message on failure, or null after setting the session cookie. */
export async function signIn(password: string): Promise<string | null> {
  if (!process.env.ADMIN_PASSWORD_HASH) return "Admin login is not configured on the server.";
  const now = Date.now();
  if (now - failures.first > LOCKOUT_MS) Object.assign(failures, { count: 0, first: now });
  if (failures.count >= MAX_FAILURES) return "Too many failed attempts. Try again in a few minutes.";

  if (!verifyPassword(password, process.env.ADMIN_PASSWORD_HASH)) {
    if (failures.count === 0) failures.first = now;
    failures.count++;
    await new Promise((r) => setTimeout(r, 500));
    return "Incorrect password.";
  }
  failures.count = 0;
  (await cookies()).set(COOKIE, createSessionToken(sessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return null;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
