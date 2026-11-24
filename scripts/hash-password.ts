import { hashPassword } from "../src/lib/auth-core";

// Usage: npm run admin:hash -- "your password"
// Prints ADMIN_PASSWORD_HASH for your environment variables. The password itself is never stored.
const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: npm run admin:hash -- "a password of at least 8 characters"');
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH="${hashPassword(password)}"`);
