const Application = require('../schemas/Application');
const Booking = require('../schemas/Booking');

// @desc    Apply to a booking (artist creates an application entry)
// @route   POST /api/applications/apply
// @access  Private (Artist only)
exports.applyToBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    // Ensure booking exists and get status
    const booking = await Booking.findById(bookingId).select('clientId status');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only allow applying to pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'You can only apply to bookings with pending status' });
    }

    // Create a new application document with the booking ref and current artist id
    const application = await Application.create({
      Booking: [
        {
          booking_id: bookingId,
          artist_id: req.user.id,
          status: 'applied'
        }
      ]
    });

    // Add artist to booking.appliedArtists (no duplicates)
    await Booking.updateOne(
      { _id: bookingId },
      { $addToSet: { appliedArtists: req.user.id } }
    );

    // Add application id to artist.appliedApplications
    await require('../schemas/User').updateOne(
      { _id: req.user.id },
      { $addToSet: { 'artist.appliedApplications': application._id } }
    );

    return res.status(201).json({ success: true, message: 'Application submitted', data: application });
  } catch (error) {
    console.error('Apply to booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while applying', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// @desc    Get bookings the current artist has applications for by status
// @route   GET /api/applications/my-applied?status=applied
// @access  Private (Artist only)
exports.getMyAppliedBookings = async (req, res) => {
  try {
    const artistId = req.user.id;
    const status = (req.query.status || 'applied').toString();
    const allowedStatuses = ['applied', 'pending', 'accepted', 'declined', 'withdrawn'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    // Find all application docs where Booking array contains an entry for this artist with status 'applied'
    const applications = await Application.aggregate([
      { $unwind: '$Booking' },
      { $match: { 'Booking.artist_id': new (require('mongoose').Types.ObjectId)(artistId), 'Booking.status': status } },
      { $group: { _id: null, bookingIds: { $addToSet: '$Booking.booking_id' } } }
    ]);

    const bookingIds = applications.length > 0 ? applications[0].bookingIds : [];

    if (!bookingIds.length) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const bookings = await Booking.find({ _id: { $in: bookingIds } })
      .populate('clientId', 'firstName lastName email')
      .populate('assignedArtist', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error('Get my applied bookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching applied bookings', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};


