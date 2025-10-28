const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Base user schema
const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 100
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    userProfileImage: {
      type: String,
      trim: true,
      default: ''
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    userType: {
      type: String,
      enum: ['client', 'artist', 'admin'],
      required: [true, 'User type is required'],
      default: 'client'
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    stripeAccountId: {
      type: String,
      required: false,
      trim: true
    },
    chatIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    discriminatorKey: 'userType', // use the same field as enum to drive discriminators
    timestamps: false
  }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Generate JWT token
UserSchema.methods.generateToken = function () {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign({ id: this._id, userType: this.userType }, secret, { expiresIn });
};

// Generate email verification token
UserSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 30 * 60 * 1000; // Token expires in 30 minutes

  return verificationToken;
};

// Create base model first
const User = mongoose.model('User', UserSchema);

// Register discriminators in separate files to keep concerns isolated
require('./users/Client');
require('./users/Artist');
require('./users/Admin');

module.exports = User;



