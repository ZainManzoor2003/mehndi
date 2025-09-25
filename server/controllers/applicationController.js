const Application = require('../schemas/Application');
const Booking = require('../schemas/Booking');

// @desc    Apply to a booking (artist creates an application entry)
// @route   POST /api/applications/apply
// @access  Private (Artist only)
exports.applyToBooking = async (req, res) => {
  try {
    const { 
      bookingId,
      artistDetails 
    } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    // Validate required artist details
    if (!artistDetails) {
      return res.status(400).json({ success: false, message: 'Artist details are required' });
    }

    const {
      proposedBudget,
      estimatedDuration,
      availability,
      experience,
      proposal,
      terms
    } = artistDetails;

    // Validate required fields
    if (!proposedBudget || proposedBudget <= 0) {
      return res.status(400).json({ success: false, message: 'Valid proposed budget is required' });
    }

    if (!estimatedDuration || !estimatedDuration.value || estimatedDuration.value <= 0) {
      return res.status(400).json({ success: false, message: 'Valid estimated duration is required' });
    }

    if (!experience || !experience.relevantExperience || !experience.yearsOfExperience) {
      return res.status(400).json({ success: false, message: 'Experience details are required' });
    }

    if (!proposal || !proposal.message) {
      return res.status(400).json({ success: false, message: 'Proposal message is required' });
    }

    if (!terms || !terms.agreedToTerms) {
      return res.status(400).json({ success: false, message: 'You must agree to the terms and conditions' });
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

    // Check if artist has already applied to this booking
    const existingApplication = await Application.findOne({
      'Booking.booking_id': bookingId,
      'Booking.artist_id': req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'You have already applied to this booking' });
    }

    // Create a new application document with the booking ref and detailed artist information
    const application = await Application.create({
      Booking: [
        {
          booking_id: bookingId,
          artist_id: req.user.id,
          status: 'applied',
          artistDetails: {
            proposedBudget,
            estimatedDuration: {
              value: estimatedDuration.value,
              unit: estimatedDuration.unit || 'hours'
            },
            availability: {
              isAvailableOnDate: availability?.isAvailableOnDate !== false,
              canTravelToLocation: availability?.canTravelToLocation !== false,
              travelDistance: availability?.travelDistance || 0
            },
            experience: {
              relevantExperience: experience.relevantExperience,
              yearsOfExperience: experience.yearsOfExperience,
              portfolioHighlights: experience.portfolioHighlights || ''
            },
            proposal: {
              message: proposal.message,
              whyInterested: proposal.whyInterested || '',
              additionalNotes: proposal.additionalNotes || ''
            },
            terms: {
              agreedToTerms: terms.agreedToTerms
            }
          }
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

    return res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
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
    const allowedStatuses = ['applied', 'pending', 'accepted', 'declined', 'withdrawn', 'expired'];
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

// @desc    Get all applications for a specific booking (for the owning client)
// @route   GET /api/applications/booking/:bookingId
// @access  Private (Client only)
exports.getApplicationsForBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    // Ensure the booking exists and belongs to the requesting client
    const booking = await Booking.findById(bookingId).select('clientId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!req.user || req.user.userType !== 'client' || booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applications for this booking' });
    }

    // Aggregate applications for this booking and unwind the Booking array to access the embedded item
    const mongoose = require('mongoose');
    const results = await Application.aggregate([
      { $unwind: '$Booking' },
      { $match: { 'Booking.booking_id': new mongoose.Types.ObjectId(bookingId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'Booking.artist_id',
          foreignField: '_id',
          as: 'artist'
        }
      },
      { $unwind: '$artist' },
      {
        $project: {
          _id: 1,
          applicationId: '$_id',
          bookingId: '$Booking.booking_id',
          artistId: '$Booking.artist_id',
          status: '$Booking.status',
          artistDetails: '$Booking.artistDetails',
          artist: {
            _id: '$artist._id',
            firstName: '$artist.firstName',
            lastName: '$artist.lastName',
            email: '$artist.email',
            rating: '$artist.artist.rating'
          }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    return res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Get applications for booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching applications', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// @desc    Update an application status for a booking (client accepts/declines)
// @route   PUT /api/applications/:applicationId/status
// @access  Private (Client only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { bookingId, status } = req.body;

    if (!applicationId || !bookingId || !status) {
      return res.status(400).json({ success: false, message: 'applicationId, bookingId and status are required' });
    }

    const allowed = ['accepted', 'declined'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    // Verify booking ownership
    const booking = await Booking.findById(bookingId).select('clientId assignedArtist status');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (!req.user || req.user.userType !== 'client' || booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update applications for this booking' });
    }

    // Update the target application's embedded Booking entry status
    const updateResult = await Application.updateOne(
      { _id: applicationId, 'Booking.booking_id': bookingId },
      { $set: { 'Booking.$.status': status } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Application not found for this booking' });
    }

    // If accepted, set booking assignedArtist and confirm booking. Also decline others.
    if (status === 'accepted') {
      // Get the application to know the artist id
      const application = await Application.findById(applicationId);
      const bookingEntry = application.Booking.find(b => b.booking_id.toString() === bookingId.toString());
      const artistId = bookingEntry && bookingEntry.artist_id;

      if (artistId) {
        // Assign artist to booking and set status to confirmed
        if (!Array.isArray(booking.assignedArtist) || !booking.assignedArtist.map(a => a.toString()).includes(artistId.toString())) {
          booking.assignedArtist = [...(booking.assignedArtist || []), artistId];
        }
        booking.status = 'confirmed';
        await booking.save();

        // Decline all other applications for this booking
        await Application.updateMany(
          { 'Booking.booking_id': bookingId, _id: { $ne: applicationId } },
          { $set: { 'Booking.$[elem].status': 'declined' } },
          { arrayFilters: [ { 'elem.booking_id': bookingId } ] }
        );
      }
    }

    // Return refreshed list for this booking
    return exports.getApplicationsForBooking(req, res);
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating application status', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};


