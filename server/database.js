const fs = require("node:fs");
const path = require("node:path");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
const isPostgres = Boolean(process.env.DATABASE_URL);
let sqlite;
let pool;

if (isPostgres) {
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: true },
    max: 10
  });
} else {
  const Database = require("better-sqlite3");
  const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, "..", "data"));
  fs.mkdirSync(dataDir, { recursive: true });
  sqlite = new Database(path.join(dataDir, "saanjh.sqlite"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
}

function postgresSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function initialize() {
  if (isPostgres) await pool.query(schema);
  else sqlite.exec(schema);
}

async function run(sql, params = []) {
  if (isPostgres) {
    const result = await pool.query(postgresSql(sql), params);
    return { changes: result.rowCount, rows: result.rows };
  }
  const result = sqlite.prepare(sql).run(...params);
  return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
}

async function get(sql, params = []) {
  if (isPostgres) {
    const result = await pool.query(postgresSql(sql), params);
    return result.rows[0];
  }
  return sqlite.prepare(sql).get(...params);
}

async function all(sql, params = []) {
  if (isPostgres) {
    const result = await pool.query(postgresSql(sql), params);
    return result.rows;
  }
  return sqlite.prepare(sql).all(...params);
}

async function close() {
  if (pool) await pool.end();
  if (sqlite) sqlite.close();
}

module.exports = { all, close, get, initialize, isPostgres, run };
