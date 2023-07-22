const contactModel = require('../models/contactModel');
const controllerUtil = require('../utils/controllerUtil');



exports.getContactInfo = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    // controllerUtil.validateEmailAndPhoneNumber(email, phoneNumber);
    const rows = await contactModel.getPrimaryContactsByEmailOrPhoneNumber(email, phoneNumber);
    const allSecondaryContacts = await contactModel.getSecondaryContactsByEmailOrPhoneNumber(email,phoneNumber);
    if (rows.length == 1 || allSecondaryContacts.length > 0) {
      const secondaryContactIds = [];
      let primaryContactId = rows.length ? rows[0].id : allSecondaryContacts[0].linkedId;
      
      // Find secondary contacts with linkedId equal to primary contact ID
      const secondaryContacts = await contactModel.getSecondaryContactsByLinkedId(primaryContactId);
      
      if (secondaryContacts.length == 0 && !((email && rows[0].email === email) || (phoneNumber && rows[0].phoneNumber === phoneNumber))) {
        const contact = await contactModel.createSecondaryContact(email, phoneNumber, primaryContactId);
        res.status(200).json({
          message: "created a new secondary contact",
          contact: contact
        }); 
      }else{

      secondaryContacts.forEach((secondaryContact) => {
        if (secondaryContact.linkedId === primaryContactId) {
          secondaryContactIds.push(secondaryContact.id);
        }
      });

      // Get all unique emails and phone numbers from the database
      const emailsArray = [rows.email, ...secondaryContacts.map(contact => contact.email)].filter(Boolean);
      const phoneNumbersArray = [rows.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber)].filter(Boolean);
      
      // Create sets from filtered arrays
      const allEmailsSet = new Set(emailsArray);
      const allPhoneNumbersSet = new Set(phoneNumbersArray);

      // Add primary contact details 
      const primaryContact = await contactModel.getContactById(primaryContactId);
      if(primaryContact.email != null){
        allEmailsSet.add(primaryContact.email);
      }
      if(primaryContact.phoneNumber != null){
        allPhoneNumbersSet.add(primaryContact.phoneNumber);
      }
 

  // Checking if the provided email and phone number are already in the list of emails or phone numbers
  if (email !== null && !allEmailsSet.has(email)) {
    allEmailsSet.add(email);
  }

  if (phoneNumber !== null && !allPhoneNumbersSet.has(phoneNumber)) {
    allPhoneNumbersSet.add(phoneNumber);
  }      
      res.status(200).json({
        contact: {
          primaryContactId: primaryContactId,
          emails: Array.from(allEmailsSet),
          phoneNumbers: Array.from(allPhoneNumbersSet),
          secondaryContactIds: secondaryContactIds,
        },
      });
    } 
  } else if(rows.length > 1){
         // There are two primary contacts with the provided email or phone number
         // Choose the oldest primary contact and update it to secondary
      const oldestPrimaryContact = rows.reduce((prev, current) => {
        return prev.createdAt < current.createdAt ? prev : current;
      });

      // Update the oldest primary contact to secondary
      await contactModel.updateContactLinkPrecedence(oldestPrimaryContact.id, 'secondary');

      // Update the createdAt and updatedAt of the oldest primary contact to the current time
      await contactModel.updateContactUpdatedAt(oldestPrimaryContact.id);

      // Return the consolidated contact
      return res.status(200).json({
        contact: {
          primaryContactId: oldestPrimaryContact.id,
          emails: [email, oldestPrimaryContact.email],
          phoneNumbers: [phoneNumber, oldestPrimaryContact.phoneNumber],
          secondaryContactIds: [oldestPrimaryContact.id === rows[0].id ? rows[1].id : rows[0].id],
        },
      });
  
  }   else {
          // Create a new primary contact
          const result = await contactModel.createPrimaryContact(email, phoneNumber);
          const primaryContactId = result.primaryContactId;

          // Return the new contact with an empty array for secondaryContactIds
          res.status(200).json({
            contact: {
              primaryContactId: primaryContactId,
              email: email,
              phoneNumber:phoneNumber ,
            },
          });
        }
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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