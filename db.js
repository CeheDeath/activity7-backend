const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// Local: ./data. On Render with a disk: set DATA_DIR=/var/data in env vars.
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "records.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

const count = db.prepare("SELECT COUNT(*) AS c FROM records").get().c;
if (count === 0) {
  db.exec(fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8"));
}

module.exports = db;