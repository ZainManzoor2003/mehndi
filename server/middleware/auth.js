const jwt = require('jsonwebtoken');
const User = require('../schemas/User');

// Protect routes using Bearer token
const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Find user in database (Google OAuth users are now saved to database)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth protect error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { protect };




