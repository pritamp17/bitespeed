const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./users.db',sqlite3.OPEN_READWRITE, (err) => {
    if (err) throw err;
  });

module.exports = db;