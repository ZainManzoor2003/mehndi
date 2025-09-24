const User = require('../schemas/User');

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, userType } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !userType) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ firstName, lastName, email, password, userType });
    const token = user.generateToken();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(201).json({ success: true, token, data: { user: safeUser } });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = user.generateToken();
    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({ success: true, token, data: { user: safeUser } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, login };
 
// GET /api/auth/me (protected)
const me = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: { user: req.user } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.me = me;


