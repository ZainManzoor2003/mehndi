const Application = require('../schemas/Application');
const Booking = require('../schemas/Booking');
const User = require('../schemas/User');
const Transaction = require('../schemas/Transaction');

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
    if (booking.status !== 'pending' && booking.status!=='in_progress') {
      return res.status(400).json({ success: false, message: 'You can only apply to bookings with pending or in_progress status' });
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

    // Add artist to booking.appliedArtists (no duplicates) and update status to in_progress
    await Booking.updateOne(
      { _id: bookingId },
      { 
        $addToSet: { appliedArtists: req.user.id },
        $set: { status: 'in_progress' }
      }
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

// @desc    Withdraw an application (artist withdraws their application)
// @route   PUT /api/applications/withdraw
// @access  Private (Artist only)
exports.withdrawApplication = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    // Find the application for this artist and booking
    const application = await Application.findOne({
      'Booking.booking_id': bookingId,
      'Booking.artist_id': req.user.id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Find the specific booking reference in the application
    const bookingRef = application.Booking.find(
      b => b.booking_id.toString() === bookingId && b.artist_id.toString() === req.user.id
    );

    if (!bookingRef) {
      return res.status(404).json({ success: false, message: 'Application not found for this booking' });
    }

    // Check if the application status is 'applied'
    if (bookingRef.status !== 'applied') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot withdraw application with status: ${bookingRef.status}. Only applications with 'applied' status can be withdrawn.` 
      });
    }

    // Update the status to 'withdrawn'
    await Application.updateOne(
      {
        _id: application._id,
        'Booking.booking_id': bookingId,
        'Booking.artist_id': req.user.id
      },
      {
        $set: {
          'Booking.$.status': 'withdrawn'
        }
      }
    );

    // Update booking status to 'pending' and remove artist from appliedArtists array
    await Booking.updateOne(
      { _id: bookingId },
      { 
        $set: { status: 'pending' },
        $pull: { appliedArtists: req.user.id }
      }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Application withdrawn successfully' 
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while withdrawing application', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
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
    const { bookingId, status, paymentPaid, remainingPayment, isPaid } = req.body;
    console.log(isPaid,remainingPayment)

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

    // If accepted, set booking assignedArtist and update payment fields if provided.
    if (status === 'accepted') {
      // Get the application to know the artist id
      const application = await Application.findById(applicationId);
      const bookingEntry = application.Booking.find(b => b.booking_id.toString() === bookingId.toString());
      const artistId = bookingEntry && bookingEntry.artist_id;

      if (artistId) {
        if (!Array.isArray(booking.assignedArtist) || !booking.assignedArtist.map(a => a.toString()).includes(artistId.toString())) {
          booking.assignedArtist = [...(booking.assignedArtist || []), artistId];
        }
        booking.status = 'confirmed';
        // Update payment fields if provided by frontend
        if (typeof paymentPaid !== 'undefined') {
          booking.paymentPaid = String(paymentPaid);
        }
        if (typeof remainingPayment !== 'undefined') {
          booking.remainingPayment = String(remainingPayment);
        }
        if (typeof isPaid !== 'undefined') {
          booking.isPaid = isPaid;
        }
        await booking.save();

        // Create transaction if payment was made
        if (paymentPaid && paymentPaid > 0) {
          try {
            // Check if transaction already exists for this booking
            const existingTransaction = await Transaction.findOne({
              sender: req.user.id,
              receiver: artistId,
              bookingId: bookingId
            });

            // Only create if doesn't exist
            if (!existingTransaction) {
              await Transaction.create({
                sender: req.user.id, // Client who is paying
                receiver: artistId, // Artist receiving payment
                bookingId: bookingId,
                amount: Number(paymentPaid)
              });
            }
          } catch (transactionError) {
            console.error('Error creating transaction:', transactionError);
            // Don't fail the whole request if transaction creation fails
          }
        }
      }
    }

    // Return refreshed list for this booking
    return exports.getApplicationsForBooking(req, res);
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating application status', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};


// @desc    Artist cancels an accepted application -> notify client by email
// @route   POST /api/applications/cancel
// @access  Private (Artist only)
exports.notifyCancellationByArtist = async (req, res) => {
  try {
    const { bookingId, reason, details } = req.body || {};
    console.log('notifyCancellationByArtist payload:', { bookingId, reason, details, artistId: req.user?.id });
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    if (!req.user || req.user.userType !== 'artist') {
      return res.status(403).json({ success: false, message: 'Only artists can cancel accepted applications.' });
    }

    const updateResult = await Application.updateOne(
      { 'Booking.booking_id': bookingId, 'Booking.artist_id': req.user.id },
      { $set: { 'Booking.$[elem].status': 'expired' } },
      { arrayFilters: [{ 'elem.booking_id': bookingId }] }
    );

    if (updateResult.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'No application found for this booking and artist to cancel.' });
    }

    // Get booking and client
    const booking = await Booking.findById(bookingId).select('clientId eventType');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const client = await User.findById(booking.clientId).select('email');
    if (!client || !client.email) return res.status(404).json({ success: false, message: 'Client email not found' });

    // Send email
    const nodemailer = require('nodemailer');
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || "ahmadmurtaza2233@gmail.com",
        pass: process.env.EMAIL_PASS || "czhupnxmdckqhydy",
      },
    });

    const eventType = Array.isArray(booking.eventType) ? booking.eventType.join(', ') : (booking.eventType || 'Mehndi');
    const html = `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
        <h2>Application Cancellation Notice</h2>
        <p>The artist has cancelled an accepted application.</p>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Event Type:</strong> ${eventType}</p>
        <p><strong>Artist ID:</strong> ${req.user.id}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
      </div>`;

    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: 'Artist cancelled the accepted application',
      html,
    });

    return res.status(200).json({ success: true, message: 'Cancellation email sent to client.' });
  } catch (error) {
    console.error('notifyCancellationByArtist error:', error);
    return res.status(500).json({ success: false, message: 'Server error while sending cancellation email' });
  }
};


