const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    // Target user (who will receive the notification)
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target user ID is required']
    },
    
    // Who triggered the notification
    triggeredByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Triggered by user ID is required']
    },
    
    // Target user type (client or artist)
    targetUserType: {
      type: String,
      enum: ['client', 'artist'],
      required: [true, 'Target user type is required']
    },
    
    // Notification type
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_cancelled',
        'booking_completed',
        'application_submitted',
        'application_accepted',
        'application_declined',
        'application_withdrawn',
        'booking_deleted_application_deleted'
      ],
      required: [true, 'Notification type is required']
    },
    
    // Title of the notification
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    
    // Message content
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    
    // Related booking ID (if applicable)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: function() {
        return ['booking_created', 'booking_cancelled', 'booking_completed', 'application_submitted', 'application_accepted', 'application_declined', 'application_withdrawn', 'booking_deleted_application_deleted'].includes(this.type);
      }
    },
    
    // Related application ID (if applicable)
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: function() {
        return ['application_submitted', 'application_accepted', 'application_declined', 'application_withdrawn'].includes(this.type);
      }
    },
    
    // Additional data for the notification
    data: {
      bookingName: String,
      clientName: String,
      artistName: String,
      bookingDate: Date,
      eventType: [String],
      location: String,
      proposedBudget: Number,
      status: String
    },
    
    // Read status
    isRead: {
      type: Boolean,
      default: false
    },
    
    // Read timestamp
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
NotificationSchema.index({ targetUserId: 1, createdAt: -1 });
NotificationSchema.index({ targetUserId: 1, isRead: 1 });
NotificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
