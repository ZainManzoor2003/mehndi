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

    return res.status(201).json({ success: true, message: 'Application submitted', data: application });
  } catch (error) {
    console.error('Apply to booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while applying', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};


