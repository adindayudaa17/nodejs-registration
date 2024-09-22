const express = require('express');
const { registerUser, approveUser } = require('../controllers/userController');
const upload = require('../middlewares/uploadMiddleware'); // Import middleware multer untuk file upload

const router = express.Router();

// Add upload middleware to handle file uploads
router.post('/register', upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'nidTdp', maxCount: 1 },
    { name: 'npwp', maxCount: 1 },
    { name: 'sipNib', maxCount: 1 },
    { name: 'ktp', maxCount: 1 },
    { name: 'aktaPendirian', maxCount: 1 },
    { name: 'aktaPengesahanPendirian', maxCount: 1 },
    { name: 'othersFile', maxCount: 1 }
]), registerUser);

router.post('/approve/:token', approveUser);

module.exports = router;
