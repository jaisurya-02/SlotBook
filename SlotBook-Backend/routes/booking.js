const express = require('express');
const router = express.Router();
const {
    createBooking,
    getMyBookings,
    getAllBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking
} = require('../controller/bookingController');
const { auth, isAdmin } = require('../middleware/authMiddleware');

// User routes
router.post('/', auth, createBooking);
router.get('/mine', auth, getMyBookings);
router.get('/:id', auth, getBookingById);
router.delete('/:id', auth, cancelBooking);

// Admin / Staff routes
router.get('/', auth, getAllBookings); // Controller should filter based on role internally or allow all. Wait, if we keep `isAdmin`, staff cannot access.
router.patch('/:id/status', auth, updateBookingStatus);

module.exports = router;
