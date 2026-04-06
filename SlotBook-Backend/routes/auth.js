const express = require('express');
const { registerUser , loginUser, getStaffUsers, updateProfile } = require('../controller/authController');
const { auth } = require('../middleware/authMiddleware');
const router = express.Router();    

router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route to fetch staff list for approvals assignment
router.get('/staff', auth, getStaffUsers);
router.put('/profile', auth, updateProfile);

module.exports = router;