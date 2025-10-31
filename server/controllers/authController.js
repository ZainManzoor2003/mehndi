const User = require('../schemas/User');
const Wallet = require('../schemas/Wallet');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, userType, city, phoneNumber } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !userType) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // City is mandatory for clients
    if (userType === 'client' && !city) {
      return res.status(400).json({ success: false, message: 'City is required for clients' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Build user data object
    const userData = { firstName, lastName, email, password, userType };
    
    // Add city only if provided (mandatory for clients, optional for artists)
    if (city) {
      userData.city = city;
    }

    // Phone number (optional server-side validation, required from UI)
    if (phoneNumber) {
      userData.phoneNumber = phoneNumber;
    }

    const user = await User.create(userData);
    
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
    const verificationURL = `${process.env.FRONTEND_URL || 'https://mehndi-client.vercel.app'}/verify-email/${verificationToken}`;
    
    // Different email content for artists and clients
    let message, htmlMessage, subject;
    
    if (userType === 'artist') {
      // Artist email
      subject = `🎨 Welcome to MehndiMe, ${firstName}!`;
      message = `Welcome to MehndiMe!

Hi ${firstName},

Welcome to MehndiMe, the community where talented mehndi artists like you connect with clients who appreciate authentic, beautiful designs.

Before you start applying for bookings and showcasing your artistry, please verify your email address below:

${verificationURL}

For your security, this link will expire in 30 minutes.

Once verified, you'll be able to:
✨ Create your artist profile and upload your portfolio
✨ Apply to client requests in your area
✨ Get discovered by verified clients looking for your style

If you didn't sign up for MehndiMe, you can safely ignore this email.

Warmly,
The MehndiMe Team`;

      htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.FRONTEND_URL || 'https://mehndi-client.vercel.app'}/assets/logo%20icon.png" alt="MehndiMe" style="width: 80px; height: 80px;">
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #d4a574; margin: 0 0 10px 0; text-align: center;">You're almost there — verify your artist account!</h1>
          <p style="text-align: center; color: #666; margin: 0 0 20px 0; font-size: 16px;">Start connecting with clients and showcasing your artistry.</p>
          
          <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; margin-top: 20px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 10px;">Hi ${firstName},</p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              Welcome to MehndiMe, the community where talented mehndi artists like you connect with clients who appreciate authentic, beautiful designs.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Before you start applying for bookings and showcasing your artistry, please verify your email address below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationURL}" 
                 style="background-color: #d4a574; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.3s;">
                Verify My Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; color: #333; font-size: 14px; margin-bottom: 20px;">
              ${verificationURL}
            </p>
            
            <p style="color: #333; font-weight: 600; margin-bottom: 10px;">For your security, this link will expire in 30 minutes.</p>
            
            <p style="color: #333; font-weight: 600; margin-bottom: 10px;">Once verified, you'll be able to:</p>
            <ul style="color: #666; line-height: 1.8; margin-bottom: 20px;">
              <li>Create your artist profile and upload your portfolio</li>
              <li>Apply to client requests in your area</li>
              <li>Get discovered by verified clients looking for your style</li>
            </ul>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              Need help verifying? Contact our <a href="mailto:support@mehndime.com" style="color: #d4a574; text-decoration: none;">support team</a>.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">
              If you didn't sign up for MehndiMe, you can safely ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666;">
          <p style="margin: 5px 0;">Warmly,<br><strong>The MehndiMe Team</strong></p>
          <p style="margin: 5px 0; color: #d4a574; font-style: italic;">Empowering artists — one design at a time.</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 MehndiMe. All rights reserved.</p>
          <p style="margin: 5px 0;"><a href="https://www.mehndime.com" style="color: #d4a574; text-decoration: none;">www.mehndime.com</a></p>
        </div>
      </div>
    `;
    } else {
      // Client email
      subject = `Welcome to MehndiMe — Let's Bring Your Mehndi Vision to Life`;
      message = `Welcome to MehndiMe — Verify Your Client Account

You're just one step away from connecting with amazing mehndi artists!

Hi ${firstName},

Welcome to MehndiMe, the community where you can easily find skilled, authentic mehndi artists for every occasion — from weddings and festivals to simple self-care moments.

Before you start posting requests and exploring artist portfolios, please verify your email address below:

${verificationURL}

For your security, this link will expire in 30 minutes.

Once verified, you'll be able to:
✨ Post mehndi requests and receive applications from local artists
✨ Browse portfolios and compare styles
✨ Hire trusted, verified artists with confidence

If you didn't sign up for MehndiMe, you can safely ignore this email.

Warm regards,
The MehndiMe Team`;

      htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.FRONTEND_URL || 'https://mehndi-client.vercel.app'}/assets/logo%20icon.png" alt="MehndiMe" style="width: 80px; height: 80px;">
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #d4a574; margin: 0 0 10px 0; text-align: center;">Welcome to MehndiMe — Verify Your Client Account</h1>
          <p style="text-align: center; color: #666; margin: 0 0 20px 0; font-size: 16px;">You're just one step away from connecting with amazing mehndi artists!</p>
          
          <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; margin-top: 20px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 10px;">Hi ${firstName},</p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              Welcome to MehndiMe, the community where you can easily find skilled, authentic mehndi artists for every occasion — from weddings and festivals to simple self-care moments. 💛
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Before you start posting requests and exploring artist portfolios, please verify your email address below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationURL}" 
                 style="background-color: #d4a574; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.3s;">
                Verify My Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; color: #333; font-size: 14px; margin-bottom: 20px;">
              ${verificationURL}
            </p>
            
            <p style="color: #333; font-weight: 600; margin-bottom: 10px;">For your security, this link will expire in 30 minutes.</p>
            
            <p style="color: #333; font-weight: 600; margin-bottom: 10px;">Once verified, you'll be able to:</p>
            <ul style="color: #666; line-height: 1.8; margin-bottom: 20px;">
              <li>Post mehndi requests and receive applications from local artists</li>
              <li>Browse portfolios and compare styles</li>
              <li>Hire trusted, verified artists with confidence</li>
            </ul>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              Need help verifying? Contact our <a href="mailto:support@mehndime.com" style="color: #d4a574; text-decoration: none;">support team</a>.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">
              If you didn't sign up for MehndiMe, you can safely ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666;">
          <p style="margin: 5px 0;">Warm regards,<br><strong>The MehndiMe Team</strong></p>
          <p style="margin: 5px 0; color: #d4a574; font-style: italic;">Bringing peace of mind to your mehndi experience.</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p style="margin: 5px 0;">© 2025 MehndiMe. All rights reserved.</p>
          <p style="margin: 5px 0;"><a href="https://www.mehndime.com" style="color: #d4a574; text-decoration: none;">www.mehndime.com</a></p>
        </div>
      </div>
    `;
    }

    try {
      await sendEmail({
        email: user.email,
        subject: subject,
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

    // Check if phone is verified
    if (!user.isPhoneVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your phone number before logging in.' 
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

// POST /api/auth/send-phone-code
const sendPhoneCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.isEmailVerified) return res.status(400).json({ success: false, message: 'Verify email first' });

    // Resolve phone number from discriminators
    let phone = user.phoneNumber;
    if (!phone) {
      const fullUser = await User.findById(user._id).lean();
      phone = fullUser.phoneNumber; // artist stores at root via discriminator; client too
    }
    if (!phone) return res.status(400).json({ success: false, message: 'No phone number on account' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.phoneVerificationCode = code;
    user.phoneVerificationExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Send via Twilio
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID ;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio env not set; skipping SMS send');
      } else {
        const twilio = require('twilio')(accountSid, authToken);
        await twilio.messages.create({ to: phone, from: fromNumber, body: `Your MehndiMe verification code is: ${code}` });
      }
    } catch (e) {
      console.error('Twilio send error:', e.message);
    }

    return res.status(200).json({ success: true, message: 'Verification code sent' });
  } catch (err) {
    console.error('sendPhoneCode error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/verify-phone-code
const verifyPhoneCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email and code are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.phoneVerificationCode || !user.phoneVerificationExpires) {
      return res.status(400).json({ success: false, message: 'No code to verify. Please request a new code.' });
    }
    if (user.phoneVerificationExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Code expired. Please request a new code.' });
    }
    if (String(user.phoneVerificationCode) !== String(code)) {
      return res.status(400).json({ success: false, message: 'Invalid code. Please try again.' });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, message: 'Phone verified successfully' });
  } catch (err) {
    console.error('verifyPhoneCode error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

 
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

module.exports = { signup, login, me, updateProfile, googleAuth, getArtistRating, verifyEmail, resendVerificationEmail, sendPhoneCode, verifyPhoneCode };
