const express = require('express');
const router = express.Router();

// Auth routes
const { signup, login, me } = require('../controllers/authController');
const { createBooking, getClientBookings, getAllBookings, getBookingById, updateBookingStatus, updateBooking, deleteBooking, getPendingBookings } = require('../controllers/bookingController');

const { applyToBooking, getMyAppliedBookings, getApplicationsForBooking, updateApplicationStatus, withdrawApplication } = require('../controllers/applicationController');

const { protect } = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const portfolioController = require('../controllers/portfolioController');

// Auth routes
router.post('/api/auth/register', signup);
router.post('/api/auth/login', login);
router.get('/api/auth/me', protect, me);

// Booking routes
router.post('/api/bookings', protect, createBooking);
router.get('/api/bookings', protect, getClientBookings);
router.get('/api/bookings/all', protect, getAllBookings);
router.get('/api/bookings/pending', protect, getPendingBookings);
router.get('/api/bookings/:id', protect, getBookingById);
router.put('/api/bookings/:id/status', protect, updateBookingStatus);
router.put('/api/bookings/:id', protect, updateBooking);
router.delete('/api/bookings/:id', protect, deleteBooking);

// Applications
router.post('/api/applications/apply', protect, applyToBooking);
router.put('/api/applications/withdraw', protect, withdrawApplication);
router.get('/api/applications/my-applied', protect, getMyAppliedBookings);
router.get('/api/applications/booking/:bookingId', protect, getApplicationsForBooking);
router.put('/api/applications/:applicationId/status', protect, updateApplicationStatus);

module.exports = router;

// Chat routes
router.post('/api/chats/ensure', protect, chatController.ensureChat);
router.get('/api/chats', protect, chatController.listMyChats);
router.get('/api/chats/:chatId', protect, chatController.getChat);
router.post('/api/chats/:chatId/messages', protect, chatController.sendMessage);
router.put('/api/chats/:chatId/read', protect, chatController.markRead);

// Portfolio routes (artists only)
router.get('/api/portfolios/me', protect, portfolioController.listMyPortfolios);
router.post('/api/portfolios', protect, portfolioController.createPortfolio);
router.put('/api/portfolios/:id', protect, portfolioController.updatePortfolio);
router.delete('/api/portfolios/:id', protect, portfolioController.deletePortfolio);