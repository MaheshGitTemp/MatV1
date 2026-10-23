// makeadmin.js
// ─────────────────────────────────────────────────────────────────────────────
// CLI to provision an admin account directly in Postgres. There is no admin
// registration flow — admins are seeded with this script.
//
// Usage:
//   node makeadmin.js <email> <username> <plainpassword> [name]
//
// Re-running UPSERTS by email (resets the password), so it doubles as a
// password-reset tool. It never prints the hash or plaintext.
// ─────────────────────────────────────────────────────────────────────────────

// The backend's .env lives at backend/src/.env (same file app.js uses). Load it
// explicitly by absolute path so this script works regardless of the directory
// it is run from (running from backend/ would otherwise find no .env and leave
// PGPASSWORD undefined → "client password must be a string").
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'src', '.env') });

async function main() {
  const [, , email, username, plainpassword, nameArg] = process.argv;

  if (!email || !username || !plainpassword) {
    console.log('Usage: node makeadmin.js <email> <username> <plainpassword> [name]');
    process.exit(1);
    return; // defensive — process.exit is synchronous but keeps lint/intent clear
  }

  const pool = require('./src/services/pool');
  const { hashPassword } = require('./src/services/passwordfunction');

  const name = nameArg || username;

  try {
    const hash = await hashPassword(plainpassword);
    const { rows } = await pool.query(
      `INSERT INTO public.adminlogin (email, username, password, name)
            VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
          SET password = EXCLUDED.password,
              username = EXCLUDED.username,
              name     = COALESCE(EXCLUDED.name, public.adminlogin.name)
       RETURNING id, email, username`,
      [email, username, hash, name]
    );

    const admin = rows[0];
    console.log(`Admin ready -> id=${admin.id} email=${admin.email} username=${admin.username}`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error(`makeadmin failed: ${err.message}`);
    try { await pool.end(); } catch (_) { /* best effort */ }
    process.exit(1);
  }
}

main();
