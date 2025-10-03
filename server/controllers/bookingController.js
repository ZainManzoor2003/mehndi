const Booking = require('../schemas/Booking');
const User = require('../schemas/User');
const Transaction = require('../schemas/Transaction');
const Wallet = require('../schemas/Wallet');
const Application = require('../schemas/Application');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Client only)
const createBooking = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      eventType,
      otherEventType,
      eventDate,
      preferredTimeSlot,
      location,
      artistTravelsToClient,
      fullAddress,
      city,
      postalCode,
      venueName,
      minimumBudget,
      maximumBudget,
      duration,
      numberOfPeople,
      designStyle,
      designComplexity,
      bodyPartsToDecorate,
      designInspiration,
      coveragePreference,
      additionalRequests
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Personal information is required'
      });
    }

    if (!eventType || eventType.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Event date is required'
      });
    }

    if (!preferredTimeSlot || preferredTimeSlot.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Preferred time slot is required'
      });
    }

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    if (typeof artistTravelsToClient !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Travel preference is required'
      });
    }

    if (!fullAddress || !city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Address information is required'
      });
    }

    if (!minimumBudget || !maximumBudget || !duration || !numberOfPeople) {
      return res.status(400).json({
        success: false,
        message: 'Budget and duration information is required'
      });
    }

    if (!designStyle || !designComplexity || !bodyPartsToDecorate || bodyPartsToDecorate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Design preferences are required'
      });
    }

    // Validate event date is in the future
    const eventDateObj = new Date(eventDate);
    if (eventDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be in the future'
      });
    }

    // Validate budget range
    if (maximumBudget < minimumBudget) {
      return res.status(400).json({
        success: false,
        message: 'Maximum budget must be greater than or equal to minimum budget'
      });
    }

    // Create the booking
    const booking = await Booking.create({
      clientId: req.user.id,
      firstName,
      lastName,
      email,
      phoneNumber,
      eventType,
      otherEventType: otherEventType || undefined,
      eventDate: eventDateObj,
      preferredTimeSlot,
      location,
      artistTravelsToClient,
      fullAddress,
      city,
      postalCode,
      venueName: venueName || undefined,
      minimumBudget,
      maximumBudget,
      duration,
      numberOfPeople,
      designStyle,
      designComplexity,
      bodyPartsToDecorate,
      designInspiration: designInspiration || undefined,
      coveragePreference: coveragePreference || undefined,
      additionalRequests: additionalRequests || undefined,
      status: 'pending'
    });

    // Populate client information
    await booking.populate('clientId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all bookings for a client
// @route   GET /api/bookings
// @access  Private (Client only)
const getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ clientId: req.user.id })
      .populate('assignedArtist', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all bookings for artists (admin/artist view)
// @route   GET /api/bookings/all
// @access  Private (Artist/Admin only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('clientId', 'firstName lastName email')
      .populate('assignedArtist', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching all bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all pending bookings (for artists/admin)
// @route   GET /api/bookings/pending
// @access  Private (Artist/Admin only)
const getPendingBookings = async (req, res) => {
  try {
    const artistId = req.user && req.user.id ? req.user.id : null;
    // Return both pending and in_progress bookings
    const query = { status: { $in: ['pending', 'in_progress'] } };
    if (artistId) {
      // exclude bookings the current artist has already applied to
      query.appliedArtists = { $nin: [artistId] };
    }

    const bookings = await Booking.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('assignedArtist', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('clientId', 'firstName lastName email')
      .populate('assignedArtist', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    if (req.user.userType === 'client' && booking.clientId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update a booking (client can update own booking when not completed/cancelled)
// @route   PUT /api/bookings/:id
// @access  Private (Client only for own booking)
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the owner client can update
    if (req.user.userType !== 'client' || booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    }

    // Prevent updates when completed or cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit a ${booking.status} booking` });
    }

    const updatableFields = [
      'firstName','lastName','email','phoneNumber',
      'eventType','otherEventType','eventDate','preferredTimeSlot',
      'location','artistTravelsToClient','fullAddress','city','postalCode','venueName',
      'minimumBudget','maximumBudget','duration','numberOfPeople',
      'designStyle','designComplexity','bodyPartsToDecorate','designInspiration','coveragePreference',
      'additionalRequests'
    ];

    updatableFields.forEach((field) => {
      if (typeof req.body[field] !== 'undefined') {
        booking[field] = req.body[field];
      }
    });

    // Validate budget
    if (typeof booking.minimumBudget === 'number' && typeof booking.maximumBudget === 'number' && booking.maximumBudget < booking.minimumBudget) {
      return res.status(400).json({ success: false, message: 'Maximum budget must be >= minimum budget' });
    }

    // Normalize eventDate
    if (req.body.eventDate) {
      const eventDateObj = new Date(req.body.eventDate);
      booking.eventDate = eventDateObj;
    }

    await booking.save();

    res.status(200).json({ success: true, message: 'Booking updated successfully', data: booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating booking', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// @desc    Delete a booking (client can delete own booking when not completed)
// @route   DELETE /api/bookings/:id
// @access  Private (Client only for own booking)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.userType !== 'client' || booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot delete a completed booking' });
    }

    await booking.deleteOne();
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting booking', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Artist/Admin only)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    if (status === 'confirmed' && !booking.assignedArtist) {
      booking.assignedArtist = req.user.id;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Complete a booking by attaching media URLs and setting status completed
// @route   PUT /api/bookings/:id/complete
// @access  Private (Client only for own booking)
const completeBooking = async (req, res) => {
  try {
    const { images = [], video = '' } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only owner client can mark complete
    if (req.user.userType !== 'client' || booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this booking' });
    }

    // Accept up to 3 images
    const imgArray = Array.isArray(images) ? images.slice(0, 3) : [];
    booking.images = imgArray;
    if (typeof video === 'string') booking.video = video;
    booking.status = 'completed';

    await booking.save();

    return res.status(200).json({ success: true, message: 'Booking marked as completed', data: booking });
  } catch (error) {
    console.error('Complete booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while completing booking' });
  }
};

// @desc    Cancel a booking with reason and details
// @route   PUT /api/bookings/cancel
// @access  Private (Client only)
const cancelBooking = async (req, res) => {
  try {
    const { bookingId, cancellationReason, cancellationDescription, artistId } = req.body;

    // Validate required fields
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    if (!artistId) {
      return res.status(400).json({
        success: false,
        message: 'Artist ID is required'
      });
    }

    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    // If reason is 'Other', description is required
    if (cancellationReason === 'Other' && (!cancellationDescription || !cancellationDescription.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation description is required when reason is "Other"'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership
    if (booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    // Update booking with cancellation details
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancellationDescription = cancellationDescription || null;
    booking.updatedAt = new Date();

    await booking.save();

    // Update application status to cancelled for this booking and artist
    await Application.updateOne(
      { 
        'Booking.booking_id': bookingId,
        'Booking.artist_id': artistId
      },
      { 
        $set: { 'Booking.$.status': 'cancelled' }
      }
    );

    console.log('Application status updated to cancelled for booking:', bookingId, 'artist:', artistId);

    // Check if refund should be processed (14-day rule)
    const eventDate = new Date(booking.eventDate);
    const today = new Date();
    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    const paidAmount = parseFloat(booking.paymentPaid) || 0;

    // console.log('Cancellation check:', { eventDate, today, diffDays, paidAmount });

    if (diffDays > 14 && paidAmount > 0) {
      // Calculate 10% fee (90% refund to client, 10% to admin)
      const refundAmount = paidAmount * 0.9; // 90% refund
      const adminFee = paidAmount * 0.1; // 10% admin fee

      // Find admin user and their wallet
      const adminUser = await User.findOne({ userType: 'admin' });
      if (!adminUser) {
        console.log('No admin user found');
        return res.status(500).json({
          success: false,
          message: 'Admin user not found'
        });
      }

      let adminWallet = await Wallet.findOne({ userId: adminUser._id });
      if (!adminWallet) {
        console.log('Admin wallet not found for user:', adminUser._id);
        return res.status(500).json({
          success: false,
          message: 'Admin wallet not found'
        });
      }

      // Add 10% fee to admin wallet
      adminWallet.walletAmount += adminFee;
      await adminWallet.save();

      // Add refund amount to client's wallet
      let clientWallet = await Wallet.findOne({ userId: req.user.id });
      if (!clientWallet) {
        console.log('Client wallet not found for user:', req.user.id);
        return res.status(500).json({
          success: false,
          message: 'Client wallet not found'
        });
      }

      // Add refund amount to client wallet
      clientWallet.walletAmount += refundAmount;
      await clientWallet.save();

      console.log('Client wallet updated:', {
        userId: req.user.id,
        refundAmount: refundAmount,
        newBalance: clientWallet.walletAmount
      });

      // Find the original transaction to update
      const originalTransaction = await Transaction.findOne({
        sender: req.user.id,
        receiver: artistId,
        bookingId: bookingId
      });

      if (originalTransaction) {
        // Update original transaction to refund type with 90% amount
        originalTransaction.amount = refundAmount;
        originalTransaction.transactionType = 'refund';
        originalTransaction.updatedAt = new Date();
        await originalTransaction.save();

        console.log('Transaction updated for refund:', {
          originalAmount: paidAmount,
          refundAmount: refundAmount,
          adminFee: adminFee
        });
      } else {
        console.log('No original transaction found for booking:', bookingId);
      }

      // Create admin transaction record
      const adminTransaction = new Transaction({
        sender: req.user.id,
        receiver: adminUser._id, // Admin user ID
        bookingId: bookingId,
        amount: adminFee,
        transactionType: 'admin-fee'
      });
      await adminTransaction.save();

      console.log('Refund processed:', {
        totalPaid: paidAmount,
        clientRefund: refundAmount,
        adminFee: adminFee,
        daysUntilEvent: diffDays
      });
    } else if (diffDays >= 7 && diffDays <= 14 && paidAmount > 0) {
      // 7-14 days: 50% refund to client, 50% to admin
      const refundAmount = paidAmount * 0.5; // 50% refund to client
      const adminFee = paidAmount * 0.5; // 50% admin fee

      // Find admin user and their wallet
      const adminUser = await User.findOne({ userType: 'admin' });
      if (!adminUser) {
        console.log('No admin user found');
        return res.status(500).json({
          success: false,
          message: 'Admin user not found'
        });
      }

      let adminWallet = await Wallet.findOne({ userId: adminUser._id });
      if (!adminWallet) {
        console.log('Admin wallet not found for user:', adminUser._id);
        return res.status(500).json({
          success: false,
          message: 'Admin wallet not found'
        });
      }

      // Add 50% fee to admin wallet
      adminWallet.walletAmount += adminFee;
      await adminWallet.save();

      // Add 50% refund to client's wallet
      let clientWallet = await Wallet.findOne({ userId: req.user.id });
      if (!clientWallet) {
        console.log('Client wallet not found for user:', req.user.id);
        return res.status(500).json({
          success: false,
          message: 'Client wallet not found'
        });
      }

      // Add refund amount to client wallet
      clientWallet.walletAmount += refundAmount;
      await clientWallet.save();

      console.log('Client wallet updated (50% refund):', {
        userId: req.user.id,
        refundAmount: refundAmount,
        newBalance: clientWallet.walletAmount
      });

      // Find the original transaction to update
      const originalTransaction = await Transaction.findOne({
        sender: req.user.id,
        receiver: artistId,
        bookingId: bookingId
      });

      if (originalTransaction) {
        // Update original transaction to refund type with 50% amount
        originalTransaction.amount = refundAmount;
        originalTransaction.transactionType = 'refund';
        originalTransaction.updatedAt = new Date();
        await originalTransaction.save();

        console.log('Transaction updated for 50% refund:', {
          originalAmount: paidAmount,
          refundAmount: refundAmount,
          adminFee: adminFee
        });
      } else {
        console.log('No original transaction found for booking:', bookingId);
      }

      // Create admin transaction record
      const adminTransaction = new Transaction({
        sender: req.user.id,
        receiver: adminUser._id, // Admin user ID
        bookingId: bookingId,
        amount: adminFee,
        transactionType: 'admin-fee'
      });
      await adminTransaction.save();

      console.log('50% refund processed:', {
        totalPaid: paidAmount,
        clientRefund: refundAmount,
        adminFee: adminFee,
        daysUntilEvent: diffDays
      });
    } else {
      console.log('No refund processed:', {
        daysUntilEvent: diffDays,
        paidAmount: paidAmount,
        reason: diffDays < 7 ? 'Less than 7 days' : 'No payment made'
      });
    }

    // TODO: Notify assigned artists about cancellation
    // TODO: Send cancellation email to client

    // Prepare response data
    const responseData = {
      bookingId: booking._id,
      status: booking.status,
      cancellationReason: booking.cancellationReason,
      cancellationDescription: booking.cancellationDescription,
      cancelledAt: booking.updatedAt,
      refundProcessed: false,
      refundAmount: 0,
      adminFee: 0
    };

    // Add refund information if applicable
    if (diffDays > 14 && paidAmount > 0) {
      responseData.refundProcessed = true;
      responseData.refundAmount = paidAmount * 0.9;
      responseData.adminFee = paidAmount * 0.1;
      responseData.daysUntilEvent = diffDays;
      responseData.refundType = '90% refund';
    } else if (diffDays >= 7 && diffDays <= 14 && paidAmount > 0) {
      responseData.refundProcessed = true;
      responseData.refundAmount = paidAmount * 0.5;
      responseData.adminFee = paidAmount * 0.5;
      responseData.daysUntilEvent = diffDays;
      responseData.refundType = '50% refund';
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update booking payment status for remaining payment
// @route   PUT /api/bookings/:id/payment-status
// @access  Private (Client only)
const updateBookingPaymentStatus = async (req, res) => {
  try {
    const { isPaid, remainingPayment, bookingId, artistId} = req.body;

    // Validate required fields
    if (!isPaid) {
      return res.status(400).json({
        success: false,
        message: 'isPaid status is required'
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId is required'
      });
    }

    // Trim whitespace from bookingId
    const trimmedBookingId = bookingId.trim();

    console.log('Update payment status - Request data:', {
      bookingId: bookingId,
      trimmedBookingId: trimmedBookingId,
      isPaid: isPaid,
      remainingPayment: remainingPayment
    });

    // Find the booking
    const booking = await Booking.findById(trimmedBookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership
    if (booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Update booking payment fields
    booking.isPaid = isPaid;
    
    // Add remaining amount to existing paymentPaid amount
    const existingPaymentPaid = Number(booking.paymentPaid) || 0;
    const remainingAmount = Number(remainingPayment) || 0;
    const totalPaidAmount = existingPaymentPaid + remainingAmount;
    
    booking.paymentPaid = String(totalPaidAmount);
    
    if (remainingPayment !== undefined) {
      booking.remainingPayment = String(remainingPayment);
    }
    booking.updatedAt = new Date();

    console.log('Payment calculation:', {
      existingPaymentPaid: existingPaymentPaid,
      remainingAmount: remainingAmount,
      totalPaidAmount: totalPaidAmount,
      newRemainingPayment: remainingPayment
    });

    await booking.save();

    // Create transaction record for remaining payment
    if (artistId && isPaid === 'full') {
      const transactionAmount = Number(remainingPayment) || 0;
      
      const transaction = new Transaction({
        sender: req.user.id,
        receiver: artistId,
        bookingId: trimmedBookingId,
        amount: transactionAmount,
        transactionType: 'full'
      });
      
      await transaction.save();
      
      console.log('Transaction created for remaining payment:', {
        sender: req.user.id,
        receiver: artistId,
        bookingId: trimmedBookingId,
        amount: transactionAmount,
        transactionType: 'full'
      });
    }

    console.log('Booking payment status updated:', {
      bookingId: trimmedBookingId,
      isPaid: isPaid,
      remainingPayment: remainingPayment
    });

    return res.status(200).json({
      success: true,
      message: 'Booking payment status updated successfully',
      data: {
        bookingId: booking._id,
        isPaid: booking.isPaid,
        remainingPayment: booking.remainingPayment,
        updatedAt: booking.updatedAt
      }
    });

  } catch (error) {
    console.error('Update booking payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating booking payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createBooking,
  getClientBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  completeBooking,
  updateBooking,
  deleteBooking,
  getPendingBookings,
  cancelBooking,
  updateBookingPaymentStatus
};

