const Application = require('../schemas/Application');
const Booking = require('../schemas/Booking');
const User = require('../schemas/User');
const Transaction = require('../schemas/Transaction');
const Notification = require('../schemas/Notification');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

// Helper function to create notifications
const createNotification = async (type, targetUserId, triggeredByUserId, targetUserType, bookingId, applicationId, data) => {
  try {
    const notificationData = {
      targetUserId,
      triggeredByUserId,
      targetUserType,
      type,
      bookingId,
      applicationId,
      data
    };

    // Set title and message based on type
    switch (type) {
      case 'booking_created':
        notificationData.title = 'New Booking Created';
        notificationData.message = `${data.clientName} has created a new ${data.eventType?.join(', ') || 'mehndi'} booking for ${data.bookingDate ? new Date(data.bookingDate).toLocaleDateString() : 'your area'}`;
        break;
      case 'booking_cancelled':
        notificationData.title = 'Booking Cancelled';
        notificationData.message = `${data.clientName} has cancelled the ${data.eventType?.join(', ') || 'mehndi'} booking scheduled for ${data.bookingDate ? new Date(data.bookingDate).toLocaleDateString() : 'your area'}`;
        break;
      case 'booking_completed':
        notificationData.title = 'Booking Completed';
        notificationData.message = `Your ${data.eventType?.join(', ') || 'mehndi'} booking with ${data.clientName} has been completed successfully`;
        break;
      case 'application_submitted':
        notificationData.title = 'New Application Received';
        notificationData.message = `${data.artistName} has applied for your ${data.eventType?.join(', ') || 'mehndi'} booking`;
        break;
      case 'application_accepted':
        notificationData.title = 'Application Accepted';
        notificationData.message = `Your application for ${data.clientName}'s ${data.eventType?.join(', ') || 'mehndi'} booking has been accepted`;
        break;
      case 'application_declined':
        notificationData.title = 'Application Declined';
        notificationData.message = `Your application for ${data.clientName}'s ${data.eventType?.join(', ') || 'mehndi'} booking has been declined`;
        break;
      case 'application_withdrawn':
        notificationData.title = 'Application Withdrawn';
        notificationData.message = `${data.artistName} has withdrawn their application for your ${data.eventType?.join(', ') || 'mehndi'} booking`;
        break;
      default:
        notificationData.title = 'Notification';
        notificationData.message = 'You have a new notification';
    }

    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// @desc    Artist applies to a booking with full application details
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

    // Check if user has Stripe account, if not create one
    const user = await User.findById(req.user.id);
    if (!user.stripeAccountId) {
      // Create Stripe Express account
      const account = await stripe.accounts.create({
        type: "express",
        country: "SG",
        email: user.email,
        business_type: "individual", // or "company"
        default_currency: "sgd",
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });

      // Create account onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/reauth`,
        return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/wallet`,
        type: "account_onboarding",
      });

      // Save the Stripe account ID to user profile
      user.stripeAccountId = account.id;
      await user.save();

      console.log("Onboarding link:", accountLink.url);
      
      return res.status(200).json({ 
        success: false, 
        message: 'Stripe account setup required', 
        requiresOnboarding: true,
        onboardingUrl: accountLink.url 
      });
    }

    const {
      proposedBudget,
      estimatedDuration,
      availability,
      experience,
      proposal,
      terms
    } = artistDetails;

    // Validate required fields (only budget, duration, message, and terms)
    if (!proposedBudget || proposedBudget <= 0) {
      return res.status(400).json({ success: false, message: 'Valid proposed budget is required' });
    }

    if (!estimatedDuration || !estimatedDuration.value || estimatedDuration.value <= 0) {
      return res.status(400).json({ success: false, message: 'Valid estimated duration is required' });
    }

    if (!proposal || !proposal.message || !proposal.message.trim()) {
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
    if (booking.status !== 'pending' && booking.status !== 'in_progress') {
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
              relevantExperience: experience?.relevantExperience || 'N/A',
              yearsOfExperience: experience?.yearsOfExperience || 0,
              portfolioHighlights: experience?.portfolioHighlights || ''
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

    // Create notification for the client about new application
    try {
      const artistName = `${req.user.firstName} ${req.user.lastName}`;
      const booking = await Booking.findById(bookingId);
      const client = await User.findById(booking.clientId);
      
      const notificationData = {
        artistName,
        clientName: `${client.firstName} ${client.lastName}`,
        bookingName: `${booking.eventType?.join(', ') || 'Mehndi'} - ${booking.city}`,
        eventType: booking.eventType,
        bookingDate: booking.eventDate,
        location: booking.city,
        proposedBudget
      };

      await createNotification(
        'application_submitted',
        booking.clientId,
        req.user.id,
        'client',
        bookingId,
        application._id,
        notificationData
      );
    } catch (notificationError) {
      console.error('Error creating application notification:', notificationError);
      // Don't fail the application if notifications fail
    }

    return res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (error) {
    console.error('Apply to booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while applying', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// exports.applyToBooking = async (req, res) => {
//   try {
//     const { 
//       bookingId,
//       artistDetails 
//     } = req.body;

//     // Validate required fields
//     if (!bookingId || !artistDetails) {
//       return res.status(400).json({ success: false, message: 'bookingId and artistDetails are required' });
//     }

//     const {
//       proposedBudget,
//       estimatedDuration,
//       availability,
//       experience,
//       proposal,
//       terms
//     } = artistDetails;

//     // Validate nested required fields
//     if (
//       !proposedBudget ||
//       !estimatedDuration?.value ||
//       !estimatedDuration?.unit ||
//       typeof availability?.isAvailableOnDate === 'undefined' ||
//       typeof availability?.canTravelToLocation === 'undefined' ||
//       !experience?.relevantExperience ||
//       typeof experience?.yearsOfExperience === 'undefined' ||
//       !proposal?.message ||
//       !terms?.agreedToTerms
//     ) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Missing required application fields' 
//       });
//     }

//     // Check if user is an artist
//     if (!req.user || req.user.userType !== 'artist') {
//       return res.status(403).json({ success: false, message: 'Only artists can apply to bookings' });
//     }

//     // Check if booking exists and is open for applications
//     const booking = await Booking.findById(bookingId).select('status assignedArtist appliedArtists');
//     if (!booking) {
//       return res.status(404).json({ success: false, message: 'Booking not found' });
//     }
//     if (booking.status === 'cancelled') {
//       return res.status(400).json({ success: false, message: 'Cannot apply to a cancelled booking' });
//     }

//     // Check if artist has already applied
//     const existingApplication = await Application.findOne({
//       'Booking.booking_id': bookingId,
//       'Booking.artist_id': req.user.id
//     });
//     if (existingApplication) {
//       return res.status(400).json({ success: false, message: 'You have already applied to this booking' });
//     }

//     // Create or update application
//     let application = await Application.findOne({ 'Booking.artist_id': req.user.id });
//     if (!application) {
//       application = new Application({ Booking: [] });
//     }

//     // Add new booking application with complete artistDetails
//     application.Booking.push({
//           booking_id: bookingId,
//           artist_id: req.user.id,
//           status: 'applied',
//           artistDetails: {
//             proposedBudget,
//             estimatedDuration: {
//               value: estimatedDuration.value,
//           unit: estimatedDuration.unit
//             },
//             availability: {
//           isAvailableOnDate: availability.isAvailableOnDate,
//           canTravelToLocation: availability.canTravelToLocation,
//           travelDistance: availability.travelDistance || 0
//             },
//             experience: {
//               relevantExperience: experience.relevantExperience,
//               yearsOfExperience: experience.yearsOfExperience,
//               portfolioHighlights: experience.portfolioHighlights || ''
//             },
//             proposal: {
//               message: proposal.message,
//               whyInterested: proposal.whyInterested || '',
//               additionalNotes: proposal.additionalNotes || ''
//             },
//             terms: {
//               agreedToTerms: terms.agreedToTerms
//             }
//           }
//     });

//     await application.save();

//     // Optionally populate full booking details if needed for response
//     await application.populate([
//       {
//         path: 'Booking.booking_id',
//         select: 'eventType eventDate location city firstName lastName email phoneNumber preferredTimeSlot minimumBudget maximumBudget',
//         model: 'Booking',
//         match: { _id: bookingId },
//         transform: (doc) => {
//           if (!doc) return null;
//           return {
//             _id: doc._id,
//             eventType: doc.eventType,
//             eventDate: doc.eventDate,
//             location: doc.location,
//             city: doc.city,
//             firstName: doc.firstName,
//             lastName: doc.lastName,
//             email: doc.email,
//             phoneNumber: doc.phoneNumber,
//             preferredTimeSlot: doc.preferredTimeSlot,
//             minimumBudget: doc.minimumBudget,
//             maximumBudget: doc.maximumBudget
//           }
//         }
//       }
//     ]);

//     // Add artist to booking.appliedArtists (no duplicates) and update status to in_progress
//     await Booking.updateOne(
//       { _id: bookingId },
//       { 
//         $addToSet: { appliedArtists: req.user.id },
//         $set: { status: 'in_progress' }
//       }
//     );

//     // Add application id to artist.appliedApplications
//     await require('../schemas/User').updateOne(
//       { _id: req.user.id },
//       { $addToSet: { 'artist.appliedApplications': application._id } }
//     );

//     return res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
//   } catch (error) {
//     console.error('Apply to booking error:', error);
//     return res.status(500).json({ success: false, message: 'Server error while applying', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
//   }
// };

// @desc    Withdraw an application (artist withdraws their application)
// @route   PUT /api/applications/withdraw
// @access  Private (Artist only)
exports.withdrawApplication = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    if (!req.user || req.user.userType !== 'artist') {
      return res.status(403).json({ success: false, message: 'Only artists can withdraw applications' });
    }

    const application = await Application.findOne({ 'Booking.artist_id': req.user.id });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const bookingEntry = application.Booking.find(b => b.booking_id.toString() === bookingId);
    if (!bookingEntry) {
      return res.status(404).json({ success: false, message: 'You have not applied to this booking' });
    }

    // Only allow withdrawal if not already accepted
    if (bookingEntry.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw an accepted application. Please contact the client to cancel.' });
    }

    // Remove the booking entry from application
    application.Booking = application.Booking.filter(b => b.booking_id.toString() !== bookingId);
    await application.save();

    // Remove artist from booking.appliedArtists
    await Booking.updateOne(
      { _id: bookingId },
      { $pull: { appliedArtists: req.user.id } }
    );

    // Create notification for the client about application withdrawal
    try {
      const booking = await Booking.findById(bookingId);
      const client = await User.findById(booking.clientId);
      const artistName = `${req.user.firstName} ${req.user.lastName}`;
      
      const notificationData = {
        artistName,
        clientName: `${client.firstName} ${client.lastName}`,
        bookingName: `${booking.eventType?.join(', ') || 'Mehndi'} - ${booking.city}`,
        eventType: booking.eventType,
        bookingDate: booking.eventDate,
        location: booking.city
      };

      await createNotification(
        'application_withdrawn',
        booking.clientId,
        req.user.id,
        'client',
        bookingId,
        application._id,
        notificationData
      );
    } catch (notificationError) {
      console.error('Error creating withdrawal notification:', notificationError);
      // Don't fail the withdrawal if notifications fail
    }

    return res.status(200).json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw application error:', error);
    return res.status(500).json({ success: false, message: 'Server error while withdrawing application' });
  }
};

// @desc    Get all bookings the artist has applied to
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


exports.getMyApplicationStats = async (req, res) => {
  try {
    const artistId = req.user.id;

    const pipeline = [
      { $unwind: '$Booking' },
      { $match: { 'Booking.artist_id': new (require('mongoose').Types.ObjectId)(artistId) } },
      { $group: { _id: '$Booking.status', count: { $sum: 1 } } }
    ];

    const result = await Application.aggregate(pipeline);
    const statsMap = result.reduce((acc, { _id, count }) => { acc[_id] = count; return acc; }, {});

    const applied = statsMap.applied || 0;
    const accepted = statsMap.accepted || 0;
    const declined = statsMap.declined || 0;
    const withdrawn = statsMap.withdrawn || 0;
    const expired = statsMap.expired || 0;
    const pending = statsMap.pending || 0;
    const total = applied + accepted + declined + withdrawn + expired + pending;
    const acceptanceRate = total > 0 ? +(accepted / total * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      data: { applied, accepted, declined, withdrawn, expired, pending, total, acceptanceRate }
    });
  } catch (error) {
    console.error('Get my application stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching application stats' });
  }
};

// @desc    Get all applications for a booking (for client to review)
// @route   GET /api/applications/booking/:bookingId
// @access  Private (Client owner of booking)
exports.getApplicationsForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    // Verify booking ownership
    const booking = await Booking.findById(bookingId).select('clientId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (!req.user || req.user.userType !== 'client' || booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applications for this booking' });
    }

    // Get full booking details
    const fullBooking = await Booking.findById(bookingId).lean();

    // Find all applications that have this booking
    const applications = await Application.find({ 'Booking.booking_id': bookingId })
      .populate('Booking.artist_id', 'firstName lastName email phoneNumber artist')
      .lean();

    // Extract relevant booking entries and artist info
    const result = [];
    for (const app of applications) {
      const bookingEntry = app.Booking.find(b => b.booking_id.toString() === bookingId);
      if (bookingEntry && bookingEntry.artist_id) {
        result.push({
          applicationId: app._id,
          bookingId: bookingId,
          bookingDetails: fullBooking,
          artist: {
            _id: bookingEntry.artist_id._id,
            firstName: bookingEntry.artist_id.firstName,
            lastName: bookingEntry.artist_id.lastName,
            email: bookingEntry.artist_id.email,
            phoneNumber: bookingEntry.artist_id.phoneNumber,
            profilePicture: bookingEntry.artist_id.artist?.profilePicture,
            bio: bookingEntry.artist_id.artist?.bio,
            portfolioLinks: bookingEntry.artist_id.artist?.portfolioLinks
          },
          status: bookingEntry.status,
          artistDetails: bookingEntry.artistDetails,
          appliedDate: app.createdAt
        });
      }
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Get applications for booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching applications' });
  }
};

// @desc    Update an application status for a booking (client accepts/declines)
// @route   PUT /api/applications/:applicationId/status
// @access  Private (Client only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { bookingId, status, paymentPaid, remainingPayment, isPaid } = req.body;
    console.log(isPaid, remainingPayment)

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
        
        // Handle payment fields - check if booking is half paid and use artist's proposed budget
        if (typeof isPaid !== 'undefined') {
          if (booking.isPaid === 'half' && isPaid === 'full') {
            // Booking is half paid, add artist's proposed budget to existing payment
            const proposedBudget = bookingEntry.artistDetails?.proposedBudget || 0;
            const currentPaymentPaid = Number(booking.paymentPaid) || 0;
            booking.paymentPaid = String(currentPaymentPaid + proposedBudget);
            booking.remainingPayment = '0';
            booking.isPaid = 'full';
          } else {
            // Regular payment logic
            if (typeof paymentPaid !== 'undefined') {
              booking.paymentPaid = String(paymentPaid);
            }
            if (typeof remainingPayment !== 'undefined') {
              booking.remainingPayment = String(remainingPayment);
            }
            booking.isPaid = isPaid;
          }
        }
        
        await booking.save();
      }
    }

    // Create notification for the artist about application status change
    try {
      const application = await Application.findById(applicationId);
      const bookingEntry = application.Booking.find(b => b.booking_id.toString() === bookingId.toString());
      const artistId = bookingEntry && bookingEntry.artist_id;
      
      if (artistId) {
        const clientName = `${req.user.firstName} ${req.user.lastName}`;
        const notificationData = {
          clientName,
          artistName: `${req.user.firstName} ${req.user.lastName}`,
          bookingName: `${booking.eventType?.join(', ') || 'Mehndi'} - ${booking.city}`,
          eventType: booking.eventType,
          bookingDate: booking.eventDate,
          location: booking.city,
          proposedBudget: bookingEntry.artistDetails?.proposedBudget
        };

        await createNotification(
          status === 'accepted' ? 'application_accepted' : 'application_declined',
          artistId,
          req.user.id,
          'artist',
          bookingId,
          applicationId,
          notificationData
        );
      }
    } catch (notificationError) {
      console.error('Error creating application status notification:', notificationError);
      // Don't fail the status update if notifications fail
    }

    // Return refreshed list for this booking
    return exports.getApplicationsForBooking(req, res);
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating application status', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
}


// @desc    Artist cancels an accepted application -> notify client by email
// @route   POST /api/applications/cancel
// @access  Private (Artist only)
exports.notifyCancellationByArtist = async (req, res) => {
  try {
    const { bookingId, reason, description } = req.body || {};
    console.log('notifyCancellationByArtist payload:', { bookingId, reason, description, artistId: req.user?.id });
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    if (!req.user || req.user.userType !== 'artist') {
      return res.status(403).json({ success: false, message: 'Only artists can cancel accepted applications.' });
    }

    // Update application with cancellation details
    const updateResult = await Application.updateOne(
      { 'Booking.booking_id': bookingId, 'Booking.artist_id': req.user.id },
      { 
        $set: { 
          'Booking.$[elem].status': 'cancelled',
          'Booking.$[elem].cancellationReason': reason,
          'Booking.$[elem].cancellationDescription': description || null
        } 
      },
      { arrayFilters: [{ 'elem.booking_id': bookingId }] }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'No application found for this booking and artist to cancel.' });
    }

    // Get booking and client
    const booking = await Booking.findById(bookingId).select('clientId eventType firstName lastName eventDate preferredTimeSlot');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const client = await User.findById(booking.clientId).select('email firstName lastName');
    if (!client || !client.email) return res.status(404).json({ success: false, message: 'Client email not found' });

    // Get artist details
    const artist = await User.findById(req.user.id).select('firstName lastName email phoneNumber');

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
    const eventDate = booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const eventTime = Array.isArray(booking.preferredTimeSlot) ? booking.preferredTimeSlot.join(', ') : 'Not specified';

    // Base URL for frontend (adjust as needed)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const relistUrl = `${frontendUrl}/payment-reschedule-booking/relist/${bookingId}/${req.user.id}/${booking.clientId}`;
    const refundUrl = `${frontendUrl}/payment-reschedule-booking/refund/${bookingId}/${req.user.id}/${booking.clientId}`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;font-size:15px;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f9f9f9;">
        <div style="background-color:white;padding:40px 35px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.08);">
          
          <h2 style="color:#333;margin-top:0;font-size:22px;font-weight:600;">Hi ${client.firstName},</h2>
          
          <p style="line-height:1.6;color:#555;">
            We know how disappointing this must be — your booked artist, <strong>${artist.firstName} ${artist.lastName}</strong>, 
            is no longer available for your appointment on <strong>${eventDate}</strong> at <strong>${eventTime}</strong>.
          </p>

          <div style="background-color:#fef2f2;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #dc2626;">
            <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Reason:</strong></p>
            <p style="margin:8px 0 0 0;color:#555;">${reason}</p>
          </div>
          
          <p style="line-height:1.6;color:#555;margin-top:25px;">
            You can now choose how you'd like to proceed:
          </p>

          <div style="background-color:#f9fafb;padding:20px;border-radius:10px;margin:20px 0;">
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 8px 0;font-weight:600;color:#333;">1. Relist your booking request</p>
              <p style="margin:0;color:#666;font-size:14px;line-height:1.5;">
                We'll make your request live again so other artists can apply. 
                Your 50% deposit will carry over — no need to pay again unless the new artist's rate is higher.
              </p>
            </div>
            <div>
              <p style="margin:0 0 8px 0;font-weight:600;color:#333;">2. Request a full refund</p>
              <p style="margin:0;color:#666;font-size:14px;line-height:1.5;">
                Prefer not to wait? We'll return your deposit in full.
              </p>
            </div>
          </div>

          <div style="display:flex;gap:15px;margin:30px 0;">
            <a href="${relistUrl}" style="flex:1;text-decoration:none;">
              <div style="background-color:#d4a574;color:white;padding:14px 24px;border-radius:8px;text-align:center;font-weight:600;font-size:15px;cursor:pointer;">
                🔄 Relist My Booking
              </div>
            </a>
            <a href="${refundUrl}" style="flex:1;text-decoration:none;">
              <div style="background-color:#10b981;color:white;padding:14px 24px;border-radius:8px;text-align:center;font-weight:600;font-size:15px;cursor:pointer;">
                💸 Request Refund
              </div>
            </a>
          </div>

          <div style="background-color:#fffbeb;padding:15px;border-radius:8px;margin:25px 0;border-left:4px solid #f59e0b;">
            <p style="margin:0;color:#92400e;font-size:14px;line-height:1.5;">
              🔔 <strong>Note:</strong> If no new artists apply within 48 hours, we'll refund your deposit automatically — or you can contact us for help.
            </p>
          </div>
          
          <p style="line-height:1.6;color:#555;margin-top:25px;">
            Thanks for your understanding — and if you need help updating your request or finding someone new, we're always here.
          </p>
          
          <p style="margin-top:30px;color:#888;font-size:13px;border-top:1px solid #eee;padding-top:20px;">
            — The Mehndi Me Team 💝
          </p>
        </div>
      </div>`;

    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: "Don't Worry — We'll Help You Rebook or Refund Your Deposit",
      html,
    });

    return res.status(200).json({ success: true, message: 'Cancellation email sent to client.' });
  } catch (error) {
    console.error('notifyCancellationByArtist error:', error);
    return res.status(500).json({ success: false, message: 'Server error while sending cancellation email' });
  }
};

// @desc    Mark application as completed with media proof (artist uploads images/video)
// @route   PUT /api/applications/complete
// @access  Private (Artist only)
exports.completeApplication = async (req, res) => {
  try {
    const { bookingId, images = [], video = '' } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    if (!req.user || req.user.userType !== 'artist') {
      return res.status(403).json({ success: false, message: 'Only artists can mark applications as completed.' });
    }

    // Find the application and update the specific booking entry
    const application = await Application.findOne({
      'Booking.booking_id': bookingId,
      'Booking.artist_id': req.user.id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found for this booking and artist' });
    }

    // Update the specific booking entry within the application
    const updateResult = await Application.updateOne(
      {
        _id: application._id,
        'Booking.booking_id': bookingId,
        'Booking.artist_id': req.user.id
      },
      {
        $set: {
          'Booking.$.status': 'completed',
          'Booking.$.images': Array.isArray(images) ? images.slice(0, 3) : [],
          'Booking.$.video': typeof video === 'string' ? video : ''
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Failed to update application' });
    }

    return res.status(200).json({
      success: true,
      message: 'Application marked as completed successfully',
      data: { bookingId, images, video }
    });
  } catch (error) {
    console.error('Complete application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while completing application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Add a note to an application (by artist for accepted application)
// @route   POST /api/applications/notes
// @access  Private (Artist only)
exports.addApplicationNote = async (req, res) => {
  try {
    const { bookingId, content, followUp = false } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    if (req.user.userType !== 'artist') {
      return res.status(403).json({ success: false, message: 'Only artists can add notes' });
    }

    // Find the application for this artist and booking
    const application = await Application.findOne({
      'Booking.booking_id': bookingId,
      'Booking.artist_id': req.user.id,
      'Booking.status': 'accepted'
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'No accepted application found for this booking' });
    }

    // Find the specific booking entry
    const bookingEntry = application.Booking.find(
      b => b.booking_id.toString() === bookingId.toString() && b.artist_id.toString() === req.user.id
    );

    if (!bookingEntry) {
      return res.status(404).json({ success: false, message: 'Booking entry not found' });
    }

    // Add note to the booking entry
    if (!bookingEntry.notes) {
      bookingEntry.notes = [];
    }

    bookingEntry.notes.push({
      content: content.trim(),
      followUp: followUp === true,
      createdAt: new Date()
    });

    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: bookingEntry.notes
    });
  } catch (error) {
    console.error('Add application note error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding note',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get notes for an application (by artist)
// @route   GET /api/applications/notes/:bookingId
// @access  Private (Artist only)
exports.getApplicationNotes = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    if (req.user.userType !== 'artist') {
      return res.status(403).json({ success: false, message: 'Only artists can view notes' });
    }

    // Find the application for this artist and booking
    const application = await Application.findOne({
      'Booking.booking_id': bookingId,
      'Booking.artist_id': req.user.id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'No application found for this booking' });
    }

    // Find the specific booking entry
    const bookingEntry = application.Booking.find(
      b => b.booking_id.toString() === bookingId.toString() && b.artist_id.toString() === req.user.id
    );

    if (!bookingEntry) {
      return res.status(404).json({ success: false, message: 'Booking entry not found' });
    }

    return res.status(200).json({
      success: true,
      data: bookingEntry.notes || []
    });
  } catch (error) {
    console.error('Get application notes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching notes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
