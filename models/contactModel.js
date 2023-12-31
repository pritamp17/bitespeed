const db = require('../utils/database');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT,
    email TEXT,
    linkedId INTEGER,
    linkPrecedence TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    deletedAt DATETIME
  )`);
});

exports.getContactByEmailOrPhoneNumber = (email, phoneNumber) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?', [email, phoneNumber], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

exports.getSecondaryContactsByLinkedId = (primaryContactId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Contact WHERE linkedId = ?', [primaryContactId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

exports.checkUserExists = (linkedId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM Contact WHERE id = ?', [linkedId], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

exports.checkContactMatches = (phoneNumber, email, linkedId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM Contact WHERE (phoneNumber = ? OR email = ?) AND id = ?', [phoneNumber, email, linkedId], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

exports.createSecondaryContact = (email, phoneNumber, linkedId) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence) VALUES (?, ?, ?, "secondary")', [phoneNumber, email, linkedId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

exports.createPrimaryContact = (email, phoneNumber) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence) VALUES (?, ?, NULL, "primary")', [phoneNumber, email], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ primaryContactId: this.lastID });
      }
    });
  });
};

exports.createSecondaryContact = (email, phoneNumber,linkedId) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence) VALUES (?, ?, ?, "secondary")', [phoneNumber, email, linkedId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ secondaryContactId: this.lastID });
      }
    });
  });
};

exports.updateContact = (id, email, phoneNumber) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE Contact SET email = ?, phoneNumber = ? WHERE id = ?', [email, phoneNumber, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.deleteContact = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM Contact WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.getContactById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM Contact WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

exports.getAllContacts = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Contact', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

exports.updateContactLinkPrecedence = (contactId, linkPrecedence) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE Contact SET linkPrecedence = ? WHERE id = ?', [linkPrecedence, contactId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.updateContactUpdatedAt = (contactId) => {
  return new Promise((resolve, reject) => {
    const currentTime = new Date().toISOString();
    db.run('UPDATE Contact SET updatedAt = ? WHERE id = ?', [currentTime, contactId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.getPrimaryContactsByEmailOrPhoneNumber = (email, phoneNumber) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Contact WHERE (email = ? OR phoneNumber = ?) AND linkPrecedence = "primary"', [email, phoneNumber], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

exports.getSecondaryContactsByEmailOrPhoneNumber = (email, phoneNumber) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Contact WHERE (email = ? OR phoneNumber = ?) AND linkPrecedence = "secondary"', [email, phoneNumber], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};