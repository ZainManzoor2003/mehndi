const Booking = require('../schemas/Booking');
const User = require('../schemas/User');

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

module.exports = {
  createBooking,
  getClientBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus
};
