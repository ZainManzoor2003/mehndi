const express = require('express');
const router = express.Router();

// Auth routes
const { signup, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/api/auth/register', signup);
router.post('/api/auth/login', login);
router.get('/api/auth/me', protect, me);

module.exports = router;