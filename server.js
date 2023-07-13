const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const port = 3000;

// Middleware for parsing JSON
app.use(bodyParser.json());

// Identify endpoint
app.post('/identify', (req, res) => {
  const { email, phoneNumber } = req.body;

  // Check if the contact already exists
  db.get(
    `SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?`,
    [email, phoneNumber],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Contact already exists, return the consolidated contact
      if (row) {
        const primaryContactId = row.linkedId || row.id;
        const secondaryContactIds = [];

        // Find secondary contacts
        db.each(
          `SELECT * FROM Contact WHERE linkedId = ? AND id != ?`,
          [primaryContactId, row.id],
          (err, secondaryContact) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Internal Server Error' });
            }

            secondaryContactIds.push(secondaryContact.id);
          },
          () => {
            // Return the consolidated contact
            res.json({
              contact: {
                primaryContactId,
                emails: [row.email],
                phoneNumbers: [row.phoneNumber],
                secondaryContactIds,
              },
            });
          }
        );
      } else {
        // Create a new primary contact
        db.run(
          `INSERT INTO Contact (email, phoneNumber, linkPrecedence) VALUES (?, ?, 'primary')`,
          [email, phoneNumber],
          function (err) {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Internal Server Error' });
            }

            // Return the new contact with an empty array for secondaryContactIds
            res.json({
              contact: {
                primaryContactId: this.lastID,
                emails: [],
                phoneNumbers: [],
                secondaryContactIds: [],
              },
            });
          }
        );
      }
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
