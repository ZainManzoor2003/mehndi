const User = require('../schemas/User');
const Wallet = require('../schemas/Wallet');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

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

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const message = `Welcome to MehndiMe! Please verify your email by clicking the link below:\n\n${verificationURL}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`;
    
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/assets/logo%20icon.png" alt="MehndiMe" style="width: 80px; height: 80px;">
          <h1 style="color: #d4a574; margin: 10px 0;">Welcome to MehndiMe!</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Hi ${firstName},<br><br>
            Thank you for signing up with MehndiMe! To complete your registration and start booking amazing mehndi artists, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationURL}" 
               style="background-color: #d4a574; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.3s;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Or copy and paste this link into your browser:
          </p>
          
          <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; color: #333; font-size: 14px;">
            ${verificationURL}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This verification link will expire in 24 hours (1 day).<br>
              If you didn't create an account with MehndiMe, please ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© 2024 MehndiMe. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - MehndiMe',
        message: message,
        html: htmlMessage
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        data: { 
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType,
            isEmailVerified: user.isEmailVerified
          }
        }
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // If email fails, still create the user but inform them
      return res.status(201).json({ 
        success: true, 
        message: 'Registration successful! However, we couldn\'t send the verification email. Please contact support to verify your account.',
        data: { 
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType,
            isEmailVerified: user.isEmailVerified
          }
        }
      });
    }
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

    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your Account is Suspended. Can\'t Logged-in. Contact Support Team.' 
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.' 
      });
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
      // Check if existing user is suspended
      if (user.status === 'suspended') {
        return res.status(403).json({ 
          success: false, 
          message: 'Your Account is Suspended. Can\'t Logged-in. Contact Support Team.' 
        });
      }
      
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

// GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification token is required' 
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and check if it's not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification token' 
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already verified' 
      });
    }

    // Mark email as verified and clear verification token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully! You can now log in to your account.' 
    });

  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during email verification' 
    });
  }
};

// POST /api/auth/resend-verification-email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email address' 
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already verified' 
      });
    }

    // Generate new email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const message = `Welcome to MehndiMe! Please verify your email by clicking the link below:\n\n${verificationURL}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`;
    
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/assets/logo%20icon.png" alt="MehndiMe" style="width: 80px; height: 80px;">
          <h1 style="color: #d4a574; margin: 10px 0;">Welcome to MehndiMe!</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Hi ${user.firstName},<br><br>
            Thank you for signing up with MehndiMe! To complete your registration and start booking amazing mehndi artists, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationURL}" 
               style="background-color: #d4a574; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.3s;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Or copy and paste this link into your browser:
          </p>
          
          <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; color: #333; font-size: 14px;">
            ${verificationURL}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This verification link will expire in 24 hours (1 day).<br>
              If you didn't create an account with MehndiMe, please ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© 2024 MehndiMe. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - MehndiMe',
        message: message,
        html: htmlMessage
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Verification email has been sent successfully. Please check your inbox.' 
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email. Please try again later.' 
      });
    }
  } catch (err) {
    console.error('Resend verification email error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = { signup, login, me, updateProfile, googleAuth, getArtistRating, verifyEmail, resendVerificationEmail };


