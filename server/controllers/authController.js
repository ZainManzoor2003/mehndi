const User = require('../schemas/User');
const Wallet = require('../schemas/Wallet');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');

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
    
    // Create wallet for the new user
    await Wallet.create({
      userId: user._id,
      walletAmount: 0,
      role: userType
    });

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

// PUT /api/auth/update-profile (protected)
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, and email are required' 
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email is already taken by another user' 
      });
    }

    // Get user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Handle password update if provided
    if (currentPassword && newPassword) {
      // Get user with password for verification
      const userWithPassword = await User.findById(userId).select('+password');
      
      // Verify current password
      const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'New password must be at least 6 characters long' 
        });
      }

      // Set password directly on user object (will be hashed by pre-save middleware)
      user.password = newPassword;
    }

    // Update other fields
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.email = email.toLowerCase().trim();

    // Save user (this will trigger password hashing if password was modified)
    const updatedUser = await user.save();

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const safeUser = updatedUser.toObject();
    delete safeUser.password;

    return res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: { user: safeUser } 
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google credential is required' 
      });
    }

    console.log('Google OAuth - Verifying credential...');
    
    // Initialize Google OAuth2 client
    const client = new OAuth2Client();
    
    // Verify the Google credential
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '262818084611-h1hqd4vvma7otjo0cvo9drb4la9fe8p0.apps.googleusercontent.com',
    });
    
    console.log('Google OAuth - Token verified successfully');
    
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not provided by Google' 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // User exists, do not auto-login; inform frontend email already exists
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists. Please log in to continue.' 
      });
    }

    // User doesn't exist, create new user in database
    const generatedPassword = `${given_name || 'Google'}12345`;
    
    user = await User.create({
      firstName: given_name || 'Google',
      lastName: family_name || 'User',
      email: email,
      password: generatedPassword, // This will be hashed by pre-save middleware
      userType: 'client', // Default to client for Google OAuth
      userProfileImage: picture || null
    });

    // Create wallet for the new Google OAuth user
    await Wallet.create({
      userId: user._id,
      walletAmount: 0,
      role: 'client'
    });

    const token = user.generateToken();
    const safeUser = user.toObject();
    delete safeUser.password;

    console.log('Google user created in database:', safeUser.email);
    console.log('Generated password:', generatedPassword);

    return res.status(201).json({ 
      success: true, 
      token, 
      data: { user: safeUser },
      message: `Welcome! Your password is ${generatedPassword}`
    });
  } catch (err) {
    console.error('Google OAuth error:', err);
    
    // Provide more specific error messages
    if (err.message.includes('Wrong recipient')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Google OAuth configuration. Please check client ID settings.' 
      });
    }
    
    if (err.message.includes('Token used too early') || err.message.includes('Token used too late')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google token has expired. Please try signing in again.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Google authentication failed. Please try again.' 
    });
  }
};

// GET /api/auth/artist-rating/:id
const getArtistRating = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Artist ID is required' 
      });
    }

    // Find the artist by ID and userType
    const artist = await User.findOne({ 
      _id: id, 
      userType: 'artist' 
    })

    if (!artist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artist not found' 
      });
    }

    // Return the rating average, defaulting to 0 if no ratings
    const rating = artist.ratingsAverage || 0;
    const count = artist.ratingsCount || 0;
    console.log('rating',rating)
    console.log('count',count)

    return res.status(200).json({ 
      success: true, 
      data: { 
        rating:Number(rating.toFixed(2)), 
        count :artist.ratingsCount
      } 
    });
  } catch (err) {
    console.error('Get artist rating error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching artist rating' 
    });
  }
};

module.exports = { signup, login, me, updateProfile, googleAuth, getArtistRating };


