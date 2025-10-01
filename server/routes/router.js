const express = require('express');
const router = express.Router();

// Auth routes
const { signup, login, me, updateProfile, googleAuth } = require('../controllers/authController');
const { createBooking, getClientBookings, getAllBookings, getBookingById, updateBookingStatus, updateBooking, deleteBooking, getPendingBookings, completeBooking } = require('../controllers/bookingController');

const { applyToBooking, getMyAppliedBookings, getApplicationsForBooking, updateApplicationStatus, withdrawApplication } = require('../controllers/applicationController');

const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { createCheckoutSession } = require('../controllers/paymentController');
const reviewController = require('../controllers/reviewController');
const chatController = require('../controllers/chatController');
const portfolioController = require('../controllers/portfolioController');
const { getWallet, updateWallet, getAllWallets } = require('../controllers/walletController');

// Auth routes
router.post('/api/auth/register', signup);
router.post('/api/auth/login', login);
router.post('/api/auth/google', googleAuth);
router.get('/api/auth/me', protect, me);
router.put('/api/auth/update-profile', protect, updateProfile);

// Booking routes
router.post('/api/bookings', protect, createBooking);
router.get('/api/bookings', protect, getClientBookings);
router.get('/api/bookings/all', protect, getAllBookings);
router.get('/api/bookings/pending', protect, getPendingBookings);
// Completed bookings list for client should be defined before :id to avoid conflicts
router.get('/api/bookings/completed', protect, reviewController.listCompletedBookingsForClient);
router.get('/api/bookings/:id', protect, getBookingById);
router.put('/api/bookings/:id/status', protect, updateBookingStatus);
router.put('/api/bookings/:id/complete', protect, completeBooking);

// Reviews
router.post('/api/reviews', protect, reviewController.createReview);
router.get('/api/reviews/booking/:bookingId', protect, reviewController.getMyReviewForBooking);
router.put('/api/bookings/:id', protect, updateBooking);
router.delete('/api/bookings/:id', protect, deleteBooking);

// Applications
router.post('/api/applications/apply', protect, applyToBooking);
router.put('/api/applications/withdraw', protect, withdrawApplication);
router.get('/api/applications/my-applied', protect, getMyAppliedBookings);
router.get('/api/applications/booking/:bookingId', protect, getApplicationsForBooking);
router.put('/api/applications/:applicationId/status', protect, updateApplicationStatus);
// Payments (removed)
// Payments
router.post('/api/payments/create-checkout', protect, createCheckoutSession);



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

// Wallet routes
router.get('/api/wallet', protect, getWallet);
router.put('/api/wallet/update', protect, updateWallet);
router.get('/api/wallet/all', protect, getAllWallets);

module.exports = router;
// Admin routes
router.get('/api/admin/users', protect, adminOnly, adminController.listUsers);
router.put('/api/admin/users/:userId', protect, adminOnly, adminController.updateUser);
router.delete('/api/admin/users/:userId', protect, adminOnly, adminController.deleteUser);

router.get('/api/admin/applications/status', protect, adminOnly, adminController.getApplicationsStatus);
router.get('/api/admin/applications', protect, adminOnly, adminController.listAllApplications);

router.post('/api/admin/blogs', protect, adminOnly, adminController.createBlog);
router.get('/api/admin/blogs', protect, adminOnly, adminController.listBlogs);
router.put('/api/admin/blogs/:blogId', protect, adminOnly, adminController.updateBlog);
router.delete('/api/admin/blogs/:blogId', protect, adminOnly, adminController.deleteBlog);
