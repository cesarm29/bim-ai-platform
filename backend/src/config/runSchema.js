const { Pool } = require('pg');
const fs = require('fs');
const schema = fs.readFileSync('C:\\Users\\hacke\\AppData\\Local\\Temp\\opencode\\bim-ai-platform\\database\\001_schema.sql', 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(schema).then(r => { console.log('Schema ejecutado OK'); return pool.end(); }).catch(e => { console.error(e.message); process.exit(1); });
