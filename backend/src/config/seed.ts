import bcrypt from 'bcryptjs';
import { query } from './database';

const users = [
  { email: 'admin@bimplatform.com', password: 'Admin123!', fullName: 'Admin BIM', role: 'admin' },
  { email: 'arquitecto@bimplatform.com', password: 'Arq12345!', fullName: 'Carlos Arquitecto', role: 'user' },
  { email: 'ingeniero@bimplatform.com', password: 'Ing12345!', fullName: 'María Ingeniera', role: 'user' },
  { email: 'cliente@bimplatform.com', password: 'Cli12345!', fullName: 'Pedro Cliente', role: 'viewer' },
];

async function seed() {
  console.log('Seeding users...');

  for (const u of users) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length > 0) {
      console.log(`  Already exists: ${u.email}`);
      continue;
    }

    const hash = await bcrypt.hash(u.password, 12);
    await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified)
       VALUES ($1, $2, $3, $4, true)`,
      [u.email, hash, u.fullName, u.role]
    );
    console.log(`  Created: ${u.email} (${u.role})`);
  }

  console.log('Seed completed');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
