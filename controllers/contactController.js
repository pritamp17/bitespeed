const contactModel = require('../models/contactModel');
const controllerUtil = require('../utils/controllerUtil');



exports.getContactInfo = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    controllerUtil.validateEmailAndPhoneNumber(email, phoneNumber);
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

      // Get all unique emails and phone numbers from the SQL database
  let allEmailsSet = new Set([row.email, ...secondaryContacts.map(contact => contact.email)]);

  let allPhoneNumbersSet = new Set([row.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber)]);

  // Add primary contact details
  const primaryContact = await contactModel.getContactById(primaryContactId);
  allEmailsSet.add(primaryContact.email);
  allPhoneNumbersSet.add(primaryContact.phoneNumber);

  // Check if the provided email and phone number are already in the list of emails or phone numbers
  if (email !== null && !allEmailsSet.has(email)) {
    allEmailsSet.add(email);
    primaryContactId = row.id; // Update primary contact ID since it is a new primary contact now
  }

  if (phoneNumber !== null && !allPhoneNumbersSet.has(phoneNumber)) {
    allPhoneNumbersSet.add(phoneNumber);
    primaryContactId = row.id; // Update primary contact ID since it is a new primary contact now
  }


      // Return the consolidated contact with filtered secondary contact IDs
      res.status(200).json({
        contact: {
          primaryContactId: primaryContactId,
          emails: Array.from(allEmailsSet),
          phoneNumbers: Array.from(allPhoneNumbersSet),
          secondaryContactIds: secondaryContactIds,
        },
      });
    } else {
      // Create a new primary contact
      const result = await contactModel.createPrimaryContact(email, phoneNumber);
      const primaryContactId = result.primaryContactId;

      // Return the new contact with an empty array for secondaryContactIds
      res.status(200).json({
        contact: {
          primaryContactId: primaryContactId,
          emails: [],
          phoneNumbers: [],
          secondaryContactIds: [],
        },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addPrimaryContact = async (req, res) => {
  const { email, phoneNumber } = req.body;
  try {
    controllerUtil.validateEmailAndPhoneNumber(email, phoneNumber);
    const result = await contactModel.createPrimaryContact(email, phoneNumber);
    const contactId = result.primaryContactId;

    res.json({
      contact: {
        id: contactId,
        email,
        phoneNumber,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addSecondaryContact = async (req, res) => {
  const { email, phoneNumber, linkedId } = req.body;
  try {
    controllerUtil.validateEmailAndPhoneNumber(email, phoneNumber);
    const linkedUserExists = await contactModel.checkUserExists(linkedId);
    console.log(linkedId);
    if (!linkedUserExists) {
      throw new Error('The linkedId user does not exist');
    }

    const contactMatches = await contactModel.checkContactMatches(phoneNumber, email, linkedId);

    if (!contactMatches) {
      throw new Error('The phone number or email does not match with the linkedId user');
    }

    const secondaryContact = await contactModel.createSecondaryContact(email, phoneNumber, linkedId);

    return res.json({
      contact: {
        id: secondaryContact.secondaryContactId,
        email,
        phoneNumber,
        linkedId,
      },
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateContact = async (req, res) => {
  const { id } = req.params;
  const { email, phoneNumber } = req.body;
  try {
    controllerUtil.validateEmailAndPhoneNumber(email, phoneNumber);
    await contactModel.updateContact(id, email, phoneNumber);
    res.json({ message: 'Contact updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ eerror: err.message });
  }
};

exports.deleteContact = async (req, res) => {
  const { id } = req.params;
  try {
    await contactModel.deleteContact(id);
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await contactModel.getAllContacts();
    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error while getting all contacts' });
  }
};