const express = require('express');
const router = express.Router();

// Auth routes
const { signup, login, me, updateProfile, googleAuth } = require('../controllers/authController');
const { createBooking, getClientBookings, getAllBookings, getBookingById, updateBookingStatus, updateBooking, deleteBooking, getPendingBookings, completeBooking, cancelBooking, updateBookingPaymentStatus, processRefund,getNearbyBookings} = require('../controllers/bookingController');

const { applyToBooking, getMyAppliedBookings, getApplicationsForBooking, updateApplicationStatus, withdrawApplication, notifyCancellationByArtist, completeApplication, addApplicationNote, getApplicationNotes } = require('../controllers/applicationController');

const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { createCheckoutSession, createRemainingCheckoutSession } = require('../controllers/paymentController');
const reviewController = require('../controllers/reviewController');
const chatController = require('../controllers/chatController');
const portfolioController = require('../controllers/portfolioController');
const { getWallet, updateWallet, getAllWallets, getWalletSummary, withdrawFunds } = require('../controllers/walletController');
const { getAllTransactions, getMyTransactions } = require('../controllers/transactionController');

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
router.get('/api/bookings/nearby', protect, getNearbyBookings);
// Completed bookings list for client should be defined before :id to avoid conflicts
router.get('/api/bookings/completed', protect, reviewController.listCompletedBookingsForClient);
router.get('/api/bookings/:id', protect, getBookingById);
router.put('/api/bookings/:id/status', protect, updateBookingStatus);
router.put('/api/bookings/:id/complete', protect, completeBooking);
router.put('/api/bookings/payment-status', protect, updateBookingPaymentStatus);
router.put('/api/bookings/cancel', protect, cancelBooking);
router.post('/api/bookings/refund', protect, processRefund);

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
router.post('/api/applications/cancel', protect, notifyCancellationByArtist); //Newly added by MA
router.put('/api/applications/complete', protect, completeApplication); //Mark application as completed with media
router.post('/api/applications/notes', protect, addApplicationNote); //Add note to application
router.get('/api/applications/notes/:bookingId', protect, getApplicationNotes); //Get notes for application 
// Payments (removed)
// Payments
router.post('/api/payments/create-checkout', protect, createCheckoutSession);
router.post('/api/payments/remaining-checkout', protect, createRemainingCheckoutSession);



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
router.get('/api/wallet/summary', protect, getWalletSummary);
router.put('/api/wallet/update', protect, updateWallet);
router.get('/api/wallet/all', protect, getAllWallets);
router.post('/api/wallet/withdraw', protect, withdrawFunds);

// Transaction routes
router.get('/api/transactions', protect, getAllTransactions);
router.get('/api/transactions/my-transactions', protect, getMyTransactions);

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

router.get('/api/admin/analytics', protect, adminOnly, adminController.getAnalytics);
router.get('/api/admin/analytics/requests-by-status', protect, adminOnly, adminController.getRequestsByStatus);
router.get('/api/admin/analytics/applications-by-status', protect, adminOnly, adminController.getApplicationsByStatus);
router.get('/api/admin/analytics/growth-over-time', protect, adminOnly, adminController.getGrowthOverTime);
router.get('/api/admin/analytics/activity-by-city', protect, adminOnly, adminController.getActivityByCity);
module.exports = router;