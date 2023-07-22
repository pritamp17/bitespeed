const express = require('express');
const contactController = require('../controllers/contactController');

const router = express.Router();

router.post('/identify', contactController.getContactInfo);
router.post('/add/primary', contactController.addPrimaryContact);
router.post('/add/secondary', contactController.addSecondaryContact);
router.patch('/update/:id', contactController.updateContact);
router.delete('/delete/:id', contactController.deleteContact);
router.get('/getall',contactController.getAllContacts);
module.exports = router;