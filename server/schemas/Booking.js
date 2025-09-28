const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // Client Information
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  
  // Personal Information
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
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: 20
  },

  // Event Details
  eventType: {
    type: [String],
    required: [true, 'Event type is required'],
    enum: ['Wedding', 'Festival', 'Eid', 'Party', 'Other'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one event type must be selected'
    }
  },
  otherEventType: {
    type: String,
    trim: true,
    maxlength: 100
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  preferredTimeSlot: {
    type: [String],
    required: [true, 'Preferred time slot is required'],
    enum: ['Morning', 'Flexible', 'Afternoon', 'Evening'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one time slot must be selected'
    }
  },

  // Location Details
  location: {
    type: String,
    required: [true, 'Location or postcode is required'],
    trim: true,
    maxlength: 200
  },
  artistTravelsToClient: {
    type: Boolean,
    required: [true, 'Travel preference is required']
  },
  fullAddress: {
    type: String,
    required: [true, 'Full address is required'],
    trim: true,
    maxlength: 500
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: 100
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    maxlength: 20
  },
  venueName: {
    type: String,
    trim: true,
    maxlength: 200
  },

  // Budget and Duration
  minimumBudget: {
    type: Number,
    required: [true, 'Minimum budget is required'],
    min: [0, 'Minimum budget must be positive']
  },
  maximumBudget: {
    type: Number,
    required: [true, 'Maximum budget is required'],
    min: [0, 'Maximum budget must be positive'],
    validate: {
      validator: function(v) {
        return v >= this.minimumBudget;
      },
      message: 'Maximum budget must be greater than or equal to minimum budget'
    }
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 hour'],
    max: [24, 'Duration cannot exceed 24 hours']
  },
  numberOfPeople: {
    type: Number,
    required: [true, 'Number of people is required'],
    min: [1, 'Number of people must be at least 1'],
    max: [100, 'Number of people cannot exceed 100']
  },

  // Design Preferences
  designStyle: {
    type: String,
    required: [true, 'Design style is required'],
    trim: true,
    maxlength: 100
  },
  designComplexity: {
    type: String,
    required: [true, 'Design complexity is required'],
    trim: true,
    maxlength: 100
  },
  bodyPartsToDecorate: {
    type: [String],
    required: [true, 'Body parts to decorate is required'],
    enum: ['Hands', 'Feet', 'Arms', 'Back'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one body part must be selected'
    }
  },
  designInspiration: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  coveragePreference: {
    type: String,
    trim: true,
    maxlength: 100
  },

  // Additional Information
  additionalRequests: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  // Payment
  paymentPaid: {
    type: String,
    default: '0',
    trim: true
  },

  // Remaining amount to be paid in GBP (pounds)
  remainingPayment: {
    type: String,
    default: '0',
    trim: true
  },

  // Payment status
  isPaid: {
    type: String,
    enum: ['none', 'half', 'full'],
    default: 'none'
  },

  // Artist Assignment (can be multiple)
  assignedArtist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  // Artists who applied to this booking
  appliedArtists: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
BookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
BookingSchema.index({ clientId: 1, status: 1 });
BookingSchema.index({ eventDate: 1 });
BookingSchema.index({ assignedArtist: 1 });
BookingSchema.index({ appliedArtists: 1 });

module.exports = mongoose.model('Booking', BookingSchema);

