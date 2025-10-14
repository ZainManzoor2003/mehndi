const Review = require('../schemas/Review');
const Booking = require('../schemas/Booking');
const User = require('../schemas/User');

// Create a review and mark booking as rated=true
// POST /api/reviews
// Private (Client only)
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, artistId } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'bookingId, rating and comment are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only owner client can review
    if (!req.user || booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed bookings can be reviewed' });
    }

    // Prevent duplicate review for same booking by same user
    const existing = await Review.findOne({ userId: req.user.id, bookingId });
    if (existing) return res.status(409).json({ success: false, message: 'You have already reviewed this booking' });

    const review = await Review.create({ userId: req.user.id, bookingId, rating, comment });

    // Determine artist to update ratings for
    let targetArtistId = artistId;

    if (targetArtistId) {
      try {
        const artistDoc = await User.findOne({_id: targetArtistId, userType: 'artist'});
        console.log(artistDoc)
        if (artistDoc) {
          const prevCount = Number(artistDoc.ratingsCount || 0);
          const prevAvg = Number(artistDoc.ratingsAverage || 0);
          const newCount = prevCount + 1;
          const newAvg = ((prevAvg * prevCount) + Number(rating)) / newCount;
          await User.updateOne({ _id: targetArtistId, userType: 'artist' }, {
            $set: { ratingsAverage: Number(newAvg.toFixed(2)) },
            $inc: { ratingsCount: 1 }
          });
        }
      } catch (e) {
        console.warn('Failed to update artist ratings:', e?.message || e);
      }
    }

    // Mark booking rated
    booking.rated = true;
    await booking.save();

    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error('Create review error:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating review' });
  }
};

// Get completed bookings for current client to review (optionally filter rated=false)
// GET /api/bookings/completed
// Private (Client only)
const listCompletedBookingsForClient = async (req, res) => {
  try {
    const onlyNotRated = req.query.onlyNotRated === 'true';
    const query = { clientId: req.user.id, status: 'completed' };
    if (onlyNotRated) query.rated = false;
    // Populate assigned artist basic profile fields for UI cards
    const bookings = await Booking.find(query)
      .populate('assignedArtist', 'firstName lastName userProfileImage email')
      .sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    console.error('List completed bookings error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching bookings' });
  }
};

module.exports = { createReview, listCompletedBookingsForClient };
// Get current user's review for a booking
// GET /api/reviews/booking/:bookingId
// Private (Client only)
const getMyReviewForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const review = await Review.findOne({ userId: req.user.id, bookingId });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    console.error('Get review error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching review' });
  }
};

module.exports.getMyReviewForBooking = getMyReviewForBooking;


