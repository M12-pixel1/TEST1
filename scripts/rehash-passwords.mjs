/**
 * One-time migration script: rehash plain text passwords to bcrypt.
 * Run once after upgrading auth to bcrypt.
 *
 * Usage: node scripts/rehash-passwords.mjs
 */
import { hashSync } from 'bcrypt';
import { createConfiguredV1Db } from '../app/src/db/v1-db.ts';

const SALT_ROUNDS = 12;

const db = createConfiguredV1Db((key) => process.env[key]);

const users = db.database
  .prepare('SELECT user_id, display_name FROM demo_users')
  .all();

console.log(`Found ${users.length} demo users to process.`);
console.log('Note: In-memory auth users do not persist passwords to DB.');
console.log('This script is a template for when DB-backed auth is added.');
console.log('');

for (const user of users) {
  const u = user;
  console.log(`- ${u.display_name} (${u.user_id}): would rehash password`);
}

console.log('');
console.log('Rehash template complete. Adapt this script when password column exists in DB.');

db.close();
