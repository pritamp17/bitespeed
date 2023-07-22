const contactModel = require('../models/contactModel');

// exports.identifyContact = (req, res) => {
//   const { email, phoneNumber } = req.body;

//   // if row.linkeId == null to primary
//     // create primary
//   // else secondary
//    //
//   // Check if the contact already exists
//   contactModel.getContactByEmailOrPhoneNumber(email, phoneNumber)
//     .then((row) => {
//       if (row) {
//         let primaryContactId = row.linkedId || row.id;
//         const secondaryContactIds = [];

//         // Find secondary contacts with linkedId equal to primary contact ID
//         contactModel.getSecondaryContacts(primaryContactId)
//           .then((secondaryContacts) => {
//             secondaryContacts.forEach((secondaryContact) => {
//               if (secondaryContact.linkedId === primaryContactId) {
//                 secondaryContactIds.push(secondaryContact.id);
//               }
//             });

//             // Get all unique emails and phone numbers from SQL database
//             const allEmails = [...new Set([row.email, ...secondaryContacts.map(contact => contact.email), email])];
//             const allPhoneNumbers = [...new Set([row.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber), phoneNumber])];

//             // Check if the provided email and phone number are already in the list of emails or phone numbers
//             if (!allEmails.includes(email)) {
//               allEmails.push(email);
//               primaryContactId = row.id; // Update primary contact ID since it is a new primary contact now
//             }

//             if (!allPhoneNumbers.includes(phoneNumber)) {
//               allPhoneNumbers.push(phoneNumber);
//               primaryContactId = row.id; // Update primary contact ID since it is a new primary contact now
//             }

//             // Return the consolidated contact with filtered secondary contact IDs
//             res.json({
//               contact: {
//                 primaryContatctId: primaryContactId,
//                 emails: allEmails,
//                 phoneNumbers: allPhoneNumbers,
//                 secondaryContactIds: secondaryContactIds,
//               },
//             });
//           })
//           .catch((err) => {
//             console.error(err);
//             res.status(500).json({ error: 'Internal Server Error' });
//           });
//       } else {
//         // Create a new primary contact
//         contactModel.createPrimaryContact(email, phoneNumber)
//           .then((result) => {
//             const primaryContatctId = result.primaryContatctId;

//             // Return the new contact with an empty array for secondaryContactIds
//             res.json({
//               contact: {
//                 primaryContatctId,
//                 emails: [],
//                 phoneNumbers: [],
//                 secondaryContactIds: [],
//               },
//             });
//           })
//           .catch((err) => {
//             console.error(err);
//             res.status(500).json({ error: 'Internal Server Error' });
//           });
//       }
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).json({ error: 'Internal Server Error' });
//     });
// };


exports.getContactInfo = async (email, phoneNumber) => {
  try {
    const row = await contactModel.getContactByEmailOrPhoneNumber(email, phoneNumber);

    if (row) {
      let primaryContactId = row.linkedId || row.id;
      const secondaryContactIds = [];

      // Find secondary contacts with linkedId equal to primary contact ID
      const secondaryContacts = await contactModel.getSecondaryContacts(primaryContactId);

      secondaryContacts.forEach((secondaryContact) => {
        if (secondaryContact.linkedId === primaryContactId) {
          secondaryContactIds.push(secondaryContact.id);
        }
      });

      // Get all unique emails and phone numbers from SQL database
      const allEmails = [...new Set([row.email, ...secondaryContacts.map(contact => contact.email), email])];
      const allPhoneNumbers = [...new Set([row.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber), phoneNumber])];

      // Check if the provided email and phone number are already in the list of emails or phone numbers
      if (!allEmails.includes(email)) {
        allEmails.push(email);
        primaryContactId = row.id; // Update primary contact ID since it is a new primary contact now
      }

      if (!allPhoneNumbers.includes(phoneNumber)) {
        allPhoneNumbers.push(phoneNumber);
        primaryContactId = row.id; // Update primary contact ID since it is a new primary contact now
      }

      // Return the consolidated contact with filtered secondary contact IDs
      return {
        contact: {
          primaryContatctId: primaryContactId,
          emails: allEmails,
          phoneNumbers: allPhoneNumbers,
          secondaryContactIds: secondaryContactIds,
        },
      };
    } else {
      // Create a new primary contact
      const result = await contactModel.createPrimaryContact(email, phoneNumber);
      const primaryContactId = result.primaryContactId;

      // Return the new contact with an empty array for secondaryContactIds
      return {
        contact: {
          primaryContatctId: primaryContactId,
          emails: [],
          phoneNumbers: [],
          secondaryContactIds: [],
        },
      };
    }
  } catch (err) {
    console.error(err);
    throw new Error('Internal Server Error');
  }
}

exports.addPrimaryContact = (req, res) => {
  const { email, phoneNumber } = req.body;

  contactModel.createPrimaryContact(email, phoneNumber)
    .then((result) => {
      const contactId = result.contactId;

      res.json({
        contact: {
          id: contactId,
          email,
          phoneNumber,
        },
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
};

exports.addSecondaryContact = async (email, phoneNumber, linkedId) => {
  try {
    const linkedUserExists = await contactModel.checkUserExists(linkedId);
    
    if (!linkedUserExists) {
      throw new Error('The linkedId user does not exist');
    }
    
    const contactMatches = await contactModel.checkContactMatches(phoneNumber, email, linkedId);
    
    if (!contactMatches) {
      throw new Error('The phone number or email does not match with the linkedId user');
    }
    
    const secondaryContact = await contactModel.createSecondaryContact(email, phoneNumber, linkedId);
    
    return { secondaryContactId: secondaryContact.lastID };
  } catch (err) {
    throw err;
  }
};

exports.updateContact = (req, res) => {
  const { id } = req.params;
  const { email, phoneNumber } = req.body;

  contactModel.updateContact(id, email, phoneNumber)
    .then(() => {
      res.json({ message: 'Contact updated successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
};

exports.deleteContact = (req, res) => {
  const { id } = req.params;
console.log(id);
  contactModel.deleteContact(id)
    .then(() => {
      res.json({ message: 'Contact deleted successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
};

exports.getAllContacts = (req,res) => {
  contactModel.getAllContacts()
  .then(contacts => {
    res.json(contacts);
  })
  .catch(error => {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  });
}
