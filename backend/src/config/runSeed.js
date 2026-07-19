const { Pool } = require('pg');
const fs = require('fs');
const seed = fs.readFileSync('C:\\Users\\hacke\\AppData\\Local\\Temp\\opencode\\bim-ai-platform\\database\\002_seed.sql', 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(seed).then(r => { console.log('Seed OK'); return pool.end(); }).catch(e => { console.error(e.message); process.exit(1); });
