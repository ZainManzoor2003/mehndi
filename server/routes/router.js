const express = require('express');
const router = express.Router();

// Auth routes
const { signup, login, me } = require('../controllers/authController');
const { createBooking, getClientBookings, getAllBookings, getBookingById, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// Auth routes
router.post('/api/auth/register', signup);
router.post('/api/auth/login', login);
router.get('/api/auth/me', protect, me);

// Booking routes
router.post('/api/bookings', protect, createBooking);
router.get('/api/bookings', protect, getClientBookings);
router.get('/api/bookings/all', protect, getAllBookings);
router.get('/api/bookings/:id', protect, getBookingById);
router.put('/api/bookings/:id/status', protect, updateBookingStatus);

module.exports = router;