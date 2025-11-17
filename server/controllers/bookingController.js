const Booking = require("../schemas/Booking");
const User = require("../schemas/User");
const Transaction = require("../schemas/Transaction");
const Wallet = require("../schemas/Wallet");
const Application = require("../schemas/Application");
const Notification = require("../schemas/Notification");
const BookingLog = require("../schemas/BookingLog");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");
const sendEmail = require("../utils/sendEmail");

// Helper function to create booking logs
const createBookingLog = async (
  bookingId,
  action,
  performedBy,
  options = {}
) => {
  try {
    const logData = {
      bookingId,
      action,
      performedBy: {
        userId: performedBy.userId || null,
        userType: performedBy.userType || null,
        name: performedBy.name || null,
      },
      applicationId: options.applicationId || null,
      artistId: options.artistId || null,
      previousValues: options.previousValues || null,
      newValues: options.newValues || null,
      details: options.details || null,
      statusAtTime: options.statusAtTime || null,
    };

    await BookingLog.create(logData);
  } catch (error) {
    console.error("Error creating booking log:", error);
    // Don't fail the main operation if logging fails
  }
};

// Helper function to create notifications
const createNotification = async (
  type,
  targetUserId,
  triggeredByUserId,
  targetUserType,
  bookingId,
  applicationId,
  data
) => {
  try {
    const notificationData = {
      targetUserId,
      triggeredByUserId,
      targetUserType,
      type,
      bookingId,
      applicationId,
      data,
    };

    // Set title and message based on type
    switch (type) {
      case "booking_created":
        notificationData.title = "New Booking Created";
        notificationData.message = `${data.clientName} has created a new ${
          data.eventType?.join(", ") || "mehndi"
        } booking for ${
          data.bookingDate
            ? new Date(data.bookingDate).toLocaleDateString()
            : "your area"
        }`;
        break;
      case "booking_cancelled":
        notificationData.title = "Booking Cancelled";
        notificationData.message = `${data.clientName} has cancelled the ${
          data.eventType?.join(", ") || "mehndi"
        } booking scheduled for ${
          data.bookingDate
            ? new Date(data.bookingDate).toLocaleDateString()
            : "your area"
        }`;
        break;
      case "booking_completed":
        notificationData.title = "Booking Completed";
        notificationData.message = `Your ${
          data.eventType?.join(", ") || "mehndi"
        } booking with ${data.clientName} has been completed successfully`;
        break;
      case "application_submitted":
        notificationData.title = "New Application Received";
        notificationData.message = `${data.artistName} has applied for your ${
          data.eventType?.join(", ") || "mehndi"
        } booking`;
        break;
      case "application_accepted":
        notificationData.title = "Application Accepted";
        notificationData.message = `Your application for ${data.clientName}'s ${
          data.eventType?.join(", ") || "mehndi"
        } booking has been accepted`;
        break;
      case "application_declined":
        notificationData.title = "Application Declined";
        notificationData.message = `Your application for ${data.clientName}'s ${
          data.eventType?.join(", ") || "mehndi"
        } booking has been declined`;
        break;
      case "application_withdrawn":
        notificationData.title = "Application Withdrawn";
        notificationData.message = `${
          data.artistName
        } has withdrawn their application for your ${
          data.eventType?.join(", ") || "mehndi"
        } booking`;
        break;
      case "booking_deleted_application_deleted":
        notificationData.title = "Booking Deleted";
        notificationData.message = `The ${
          data.eventType?.join(", ") || "mehndi"
        } booking you applied for has been deleted by the client. Your application has been automatically removed.`;
        break;
      default:
        notificationData.title = "Notification";
        notificationData.message = "You have a new notification";
    }

    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Client only)
const createBooking = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      eventType,
      otherEventType,
      eventDate,
      preferredTimeSlot,
      location,
      artistTravelsToClient,
      latitude,
      longitude,
      zipCode,
      venueName,
      minimumBudget,
      maximumBudget,
      duration,
      numberOfPeople,
      // designStyle,
      designInspiration,
      coveragePreference,
      additionalRequests,
    } = req.body;

    // Validate required fields
    if (!firstName) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!eventType || eventType.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Event type is required",
      });
    }

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        message: "Event date is required",
      });
    }

    if (!preferredTimeSlot || preferredTimeSlot.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Preferred time slot is required",
      });
    }

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }

    // Handle travel preference - can be 'yes', 'no', or 'both'
    if (artistTravelsToClient === undefined || artistTravelsToClient === null) {
      return res.status(400).json({
        success: false,
        message: "Travel preference is required",
      });
    }

    // Address fields are completely removed

    if (!minimumBudget || !maximumBudget || !numberOfPeople) {
      return res.status(400).json({
        success: false,
        message: "Budget and number of people information is required",
      });
    }

    // if (!designStyle) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Design style is required'
    //   });
    // }

    // Validate event date is in the future
    const eventDateObj = new Date(eventDate);
    if (eventDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Event date must be in the future",
      });
    }

    // Validate budget range
    if (maximumBudget < minimumBudget) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum budget must be greater than or equal to minimum budget",
      });
    }

    // Convert travel preference to boolean or keep as 'both' for database
    let travelPreference;
    if (artistTravelsToClient === "both") {
      travelPreference = "both"; // Store as string for 'both' option
    } else if (
      artistTravelsToClient === "yes" ||
      artistTravelsToClient === true
    ) {
      travelPreference = true;
    } else if (
      artistTravelsToClient === "no" ||
      artistTravelsToClient === false
    ) {
      travelPreference = false;
    } else {
      travelPreference = artistTravelsToClient;
    }

    // Get email from request or user account
    const bookingEmail = email || req.user.email || "";

    // Create the booking
    const booking = await Booking.create({
      clientId: req.user.id,
      firstName,
      lastName,
      email: bookingEmail,
      eventType,
      otherEventType: otherEventType || undefined,
      eventDate: eventDateObj,
      preferredTimeSlot,
      location,
      artistTravelsToClient: travelPreference,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      zipCode: zipCode || undefined,
      venueName: venueName || undefined,
      minimumBudget,
      maximumBudget,
      duration: duration || 3,
      numberOfPeople,
      // designStyle,
      designInspiration: Array.isArray(designInspiration)
        ? designInspiration
        : designInspiration
        ? [designInspiration]
        : [],
      coveragePreference: coveragePreference || undefined,
      additionalRequests: additionalRequests || undefined,
      status: "pending",
    });

    // Populate client information
    await booking.populate("clientId", "firstName lastName email");

    // Create notification for all artists about new booking
    try {
      const clientName = `${req.user.firstName} ${req.user.lastName}`;
      const notificationData = {
        clientName,
        bookingName: `${eventType.join(", ")} - ${location}`,
        eventType,
        bookingDate: eventDateObj,
        location: location,
        minimumBudget,
        maximumBudget,
      };

      // Find all artists to notify them about the new booking
      const artists = await User.find({ userType: "artist" }).select("_id");

      // Create notifications for all artists
      const notificationPromises = artists.map((artist) =>
        createNotification(
          "booking_created",
          artist._id,
          req.user.id,
          "artist",
          booking._id,
          null,
          notificationData
        )
      );

      await Promise.all(notificationPromises);
    } catch (notificationError) {
      console.error("Error creating booking notifications:", notificationError);
      // Don't fail the booking creation if notifications fail
    }

    // Create booking log
    await createBookingLog(
      booking._id,
      "booking_created",
      {
        userId: req.user.id,
        userType: req.user.userType,
        name: `${req.user.firstName} ${req.user.lastName}`,
      },
      {
        statusAtTime: "pending",
        details: `Booking created for ${eventType.join(
          ", "
        )} event on ${eventDateObj.toLocaleDateString()}`,
      }
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating booking",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get all bookings for a client
// @route   GET /api/bookings
// @access  Private (Client only)
const getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ clientId: req.user.id })
      .populate("assignedArtist", "firstName lastName userProfileImage email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get all bookings for artists (admin/artist view)
// @route   GET /api/bookings/all
// @access  Private (Artist/Admin only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("clientId", "firstName lastName email")
      .populate("assignedArtist", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching all bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
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
    const query = { status: { $in: ["pending", "in_progress"] } };
    if (artistId) {
      // exclude bookings the current artist has already applied to
      query.appliedArtists = { $nin: [artistId] };
    }

    const bookings = await Booking.find(query)
      .populate("clientId", "firstName lastName email")
      .populate("assignedArtist", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get pending bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
// @desc    Get booking logs
// @route   GET /api/bookings/:id/logs
// @access  Private
const getBookingLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const logs = await BookingLog.find({ bookingId: id })
      .populate("performedBy.userId", "firstName lastName email userType")
      .populate("artistId", "firstName lastName email")
      .populate("applicationId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Get booking logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching booking logs",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("clientId", "firstName lastName email")
      .populate("assignedArtist", "firstName lastName email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user has access to this booking
    if (
      req.user.userType === "client" &&
      booking.clientId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching booking",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
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
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Only the owner client can update
    if (
      req.user.userType !== "client" ||
      booking.clientId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });
    }

    // Prevent updates when completed or cancelled
    if (["completed", "cancelled", "in_progress"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a ${booking.status} booking`,
      });
    }

    const updatableFields = [
      "firstName",
      "lastName",
      "email",
      "eventType",
      "otherEventType",
      "eventDate",
      "preferredTimeSlot",
      "location",
      "artistTravelsToClient",
      "venueName",
      "minimumBudget",
      "maximumBudget",
      "duration",
      "numberOfPeople",
      // 'designStyle',
      "designInspiration",
      "coveragePreference",
      "additionalRequests",
    ];

    updatableFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        // Special handling for different fields
        if (field === "designInspiration") {
          // Convert string to array if needed
          booking[field] = Array.isArray(req.body[field])
            ? req.body[field]
            : req.body[field]
            ? [req.body[field]]
            : [];
        } else if (field === "eventType") {
          // Convert single value to array if needed
          booking[field] = Array.isArray(req.body[field])
            ? req.body[field]
            : [req.body[field]];
        } else if (field === "preferredTimeSlot") {
          // Convert single value to array if needed
          booking[field] = Array.isArray(req.body[field])
            ? req.body[field]
            : [req.body[field]];
        } else if (field === "artistTravelsToClient") {
          // Handle travel preference - can be 'yes', 'no', 'both', true, false
          if (typeof req.body[field] === "string") {
            if (req.body[field] === "both") {
              booking[field] = "both";
            } else if (req.body[field] === "yes") {
              booking[field] = true;
            } else if (req.body[field] === "no") {
              booking[field] = false;
            } else {
              booking[field] = req.body[field];
            }
          } else {
            booking[field] = req.body[field];
          }
        } else {
          booking[field] = req.body[field];
        }
      }
    });

    // Validate budget
    if (
      typeof booking.minimumBudget === "number" &&
      typeof booking.maximumBudget === "number" &&
      booking.maximumBudget < booking.minimumBudget
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum budget must be >= minimum budget",
      });
    }

    // Normalize eventDate
    if (req.body.eventDate) {
      const eventDateObj = new Date(req.body.eventDate);
      booking.eventDate = eventDateObj;
    }

    // Convert numbers
    if (req.body.minimumBudget !== undefined) {
      booking.minimumBudget = Number(req.body.minimumBudget);
    }
    if (req.body.maximumBudget !== undefined) {
      booking.maximumBudget = Number(req.body.maximumBudget);
    }
    if (req.body.duration !== undefined) {
      booking.duration = Number(req.body.duration);
    }
    if (req.body.numberOfPeople !== undefined) {
      booking.numberOfPeople = Number(req.body.numberOfPeople);
    }

    // Store previous values for logging
    const previousStatus = booking.status;

    // Set status to pending when booking is updated
    booking.status = "pending";
    booking.reinstate = false;
    booking.assignedArtist = [];
    booking.appliedArtists = [];

    await booking.save();

    // Create booking log
    await createBookingLog(
      booking._id,
      "booking_updated",
      {
        userId: req.user.id,
        userType: req.user.userType,
        name: `${req.user.firstName} ${req.user.lastName}`,
      },
      {
        previousValues: { status: previousStatus },
        newValues: { status: "pending" },
        statusAtTime: "pending",
        details: "Booking details were updated",
      }
    );

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating booking",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Delete a booking (client can delete own booking when not completed)
// @route   DELETE /api/bookings/:id
// @access  Private (Client only for own booking)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (
      req.user.userType !== "client" ||
      booking.clientId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this booking",
      });
    }

    if (booking.status === "completed") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete a completed booking" });
    }

    // Find all applications that reference this booking
    const applications = await Application.find({
      "Booking.booking_id": req.params.id,
    });

    // Collect artist IDs from applications that will be deleted
    const affectedArtistIds = new Set();
    if (applications.length > 0) {
      applications.forEach((app) => {
        const bookingEntry = app.Booking.find(
          (b) => b.booking_id.toString() === req.params.id
        );
        if (bookingEntry) {
          affectedArtistIds.add(bookingEntry.artist_id.toString());
        }
      });

      // Delete all applications that have this booking
      await Application.deleteMany({
        "Booking.booking_id": req.params.id,
      });

      // Get client information for notifications
      const client = await User.findById(req.user.id);
      const clientName = client
        ? `${client.firstName} ${client.lastName}`
        : "The client";

      // Send notifications to all affected artists
      const notificationPromises = Array.from(affectedArtistIds).map(
        async (artistId) => {
          try {
            const notificationData = {
              clientName,
              artistName: "",
              eventType: booking.eventType,
              bookingDate: booking.eventDate,
              location: booking.city || booking.location,
            };

            await createNotification(
              "booking_deleted_application_deleted",
              artistId,
              req.user.id,
              "artist",
              req.params.id,
              null,
              notificationData
            );
          } catch (notificationError) {
            console.error(
              `Error creating notification for artist ${artistId}:`,
              notificationError
            );
            // Don't fail the deletion if notifications fail
          }
        }
      );

      // Wait for all notifications to be sent (but don't fail if they fail)
      await Promise.allSettled(notificationPromises);
    }

    // Create booking log before deletion
    await createBookingLog(
      req.params.id,
      "booking_deleted",
      {
        userId: req.user.id,
        userType: req.user.userType,
        name: `${req.user.firstName} ${req.user.lastName}`,
      },
      {
        statusAtTime: booking.status,
        details: `Booking deleted by client`,
      }
    );

    await booking.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting booking",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Artist/Admin only)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.status = status;
    if (status === "confirmed" && !booking.assignedArtist) {
      booking.assignedArtist = req.user.id;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating booking status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Complete a booking by attaching media URLs and setting status completed
// @route   PUT /api/bookings/:id/complete
// @access  Private (Client only for own booking)
const completeBooking = async (req, res) => {
  try {
    const { images = [], video = "" } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Only owner client can mark complete
    if (
      req.user.userType !== "client" ||
      booking.clientId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this booking",
      });
    }

    // Ensure an artist has been assigned before completion
    const hasAssignedArtist =
      Array.isArray(booking.assignedArtist) &&
      booking.assignedArtist.length > 0;
    if (!hasAssignedArtist) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete booking: no artist assigned",
      });
    }

    // Fetch assigned artist's Stripe account ID (first assigned artist)
    const assignedArtistId = booking.assignedArtist[0];
    let assignedArtistStripeAccountId = null;
    try {
      const assignedArtist = await User.findById(assignedArtistId);
      assignedArtistStripeAccountId =
        assignedArtist && assignedArtist.stripeAccountId
          ? assignedArtist.stripeAccountId
          : null;
    } catch (_) {}

    if (!assignedArtistStripeAccountId) {
      return res.status(400).json({
        success: false,
        message: "Assigned artist is missing Stripe account",
      });
    }

    // Amount to transfer = total payment paid for the booking
    const amountPaid = Number(booking.paymentPaid) || 0;
    if (!(amountPaid > 0)) {
      return res.status(400).json({
        success: false,
        message: "No payment recorded for this booking",
      });
    }

    // Credit assigned artist wallet instead of Stripe transfer
    try {
      let artistWallet = await Wallet.findOne({ userId: assignedArtistId });
      if (!artistWallet) {
        artistWallet = new Wallet({
          userId: assignedArtistId,
          walletAmount: 0,
        });
      }
      // Determine if artist account is older than one month to apply 15% commission
      let commissionAmount = 0;
      try {
        const artistDoc = await User.findById(assignedArtistId).select(
          "createdAt"
        );
        if (artistDoc && artistDoc.createdAt) {
          const accountAgeMs =
            Date.now() - new Date(artistDoc.createdAt).getTime();
          const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
          if (accountAgeMs >= oneMonthMs) {
            commissionAmount = Math.round(amountPaid * 0.15 * 100) / 100; // 15%
          }
        }
      } catch (_) {
        /* ignore commission calc errors, default to 0 */
      }

      const payoutAmount = Math.max(0, amountPaid - commissionAmount);
      artistWallet.walletAmount += payoutAmount;
      await artistWallet.save();

      // Record transaction of type 'full' with logged-in client as sender
      const tx = new Transaction({
        sender: req.user.id,
        receiver: assignedArtistId,
        bookingId: booking._id,
        amount: amountPaid,
        commission: commissionAmount,
        transactionType: "full",
      });
      await tx.save();
    } catch (walletErr) {
      console.error("Wallet credit error:", walletErr);
      return res.status(500).json({
        success: false,
        message: "Failed to credit artist wallet",
        error: walletErr.message,
      });
    }

    // Accept up to 3 images
    const imgArray = Array.isArray(images) ? images.slice(0, 3) : [];
    booking.images = imgArray;
    if (typeof video === "string") booking.video = video;
    booking.status = "completed";

    await booking.save();

    // Create notification for the artist about booking completion
    try {
      const clientName = `${req.user.firstName} ${req.user.lastName}`;
      const notificationData = {
        clientName,
        bookingName: `${booking.eventType?.join(", ") || "Mehndi"} - ${
          booking.location
        }`,
        eventType: booking.eventType,
        bookingDate: booking.eventDate,
        location: booking.location,
      };

      await createNotification(
        "booking_completed",
        assignedArtistId,
        req.user.id,
        "artist",
        booking._id,
        null,
        notificationData
      );
    } catch (notificationError) {
      console.error(
        "Error creating completion notification:",
        notificationError
      );
      // Don't fail the completion if notifications fail
    }

    return res.status(200).json({
      success: true,
      message: "Booking marked as completed",
      data: booking,
      assignedArtistStripeAccountId,
    });
  } catch (error) {
    console.error("Complete booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while completing booking",
    });
  }
};

// @desc    Cancel a booking with reason and details
// @route   PUT /api/bookings/cancel
// @access  Private (Client only)
const cancelBooking = async (req, res) => {
  try {
    const { bookingId, cancellationReason, cancellationDescription, artistId } =
      req.body;

    // Validate required fields
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!artistId) {
      return res.status(400).json({
        success: false,
        message: "Artist ID is required",
      });
    }

    // For client cancellations, only cancellationDescription is required
    if (!cancellationDescription || !cancellationDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation description is required",
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify ownership
    if (booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed booking",
      });
    }

    // Update booking with cancellation details
    booking.status = "cancelled";
    booking.cancellationReason = cancellationReason || null; // Optional for client
    booking.cancellationDescription = cancellationDescription;
    booking.updatedAt = new Date();

    await booking.save();

    // Update application status to cancelled for this booking and artist
    await Application.updateOne(
      {
        "Booking.booking_id": bookingId,
        "Booking.artist_id": artistId,
      },
      {
        $set: { "Booking.$.status": "cancelled" },
      }
    );

    console.log(
      "Application status updated to cancelled for booking:",
      bookingId,
      "artist:",
      artistId
    );

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
      const adminUser = await User.findOne({ userType: "admin" });
      if (!adminUser) {
        console.log("No admin user found");
        return res.status(500).json({
          success: false,
          message: "Admin user not found",
        });
      }

      let adminWallet = await Wallet.findOne({ userId: adminUser._id });
      if (!adminWallet) {
        console.log("Admin wallet not found for user:", adminUser._id);
        return res.status(500).json({
          success: false,
          message: "Admin wallet not found",
        });
      }

      // Add 10% fee to admin wallet
      adminWallet.walletAmount += adminFee;
      await adminWallet.save();

      // Add refund amount to client's wallet
      let clientWallet = await Wallet.findOne({ userId: req.user.id });
      if (!clientWallet) {
        console.log("Client wallet not found for user:", req.user.id);
        return res.status(500).json({
          success: false,
          message: "Client wallet not found",
        });
      }

      // Add refund amount to client wallet
      clientWallet.walletAmount += refundAmount;
      await clientWallet.save();

      console.log("Client wallet updated:", {
        userId: req.user.id,
        refundAmount: refundAmount,
        newBalance: clientWallet.walletAmount,
      });

      // Find the original transaction to update
      const originalTransaction = await Transaction.findOne({
        sender: req.user.id,
        receiver: artistId,
        bookingId: bookingId,
      });

      if (originalTransaction) {
        // Update original transaction to refund type with 90% amount
        originalTransaction.amount = refundAmount;
        originalTransaction.transactionType = "refund";
        originalTransaction.updatedAt = new Date();
        await originalTransaction.save();

        console.log("Transaction updated for refund:", {
          originalAmount: paidAmount,
          refundAmount: refundAmount,
          adminFee: adminFee,
        });
      } else {
        console.log("No original transaction found for booking:", bookingId);
      }

      // // Create admin transaction record
      // const adminTransaction = new Transaction({
      //   sender: req.user.id,
      //   receiver: adminUser._id, // Admin user ID
      //   bookingId: bookingId,
      //   amount: adminFee,
      //   transactionType: 'admin-fee'
      // });
      // await adminTransaction.save();

      console.log("Refund processed:", {
        totalPaid: paidAmount,
        clientRefund: refundAmount,
        adminFee: adminFee,
        daysUntilEvent: diffDays,
      });
    } else if (diffDays >= 7 && diffDays <= 14 && paidAmount > 0) {
      // 7-14 days: 40% refund to client, 10% to admin, 50% to artist
      // Check artist account creation date to adjust admin fee
      const artist = await User.findById(artistId);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      const accountCreationDate = new Date(artist.createdAt);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // If artist account was created more than one month ago, reduce admin fee to 5%
      // If less than one month, charge normal 10% admin fee
      const adminFeePercentage = accountCreationDate < oneMonthAgo ? 0.0 : 0.1;

      const refundAmount = paidAmount * 0.5; // 50% refund to client
      const adminFee = paidAmount * adminFeePercentage;
      const artistAmount = paidAmount - refundAmount - adminFee; // Remaining to artist

      // Find admin user and their wallet
      const adminUser = await User.findOne({ userType: "admin" });
      if (!adminUser) {
        console.log("No admin user found");
        return res.status(500).json({
          success: false,
          message: "Admin user not found",
        });
      }

      let adminWallet = await Wallet.findOne({ userId: adminUser._id });
      if (!adminWallet) {
        console.log("Admin wallet not found for user:", adminUser._id);
        return res.status(500).json({
          success: false,
          message: "Admin wallet not found",
        });
      }

      // Add 10% fee to admin wallet
      adminWallet.walletAmount += adminFee;
      await adminWallet.save();

      // Add 40% refund to client's wallet
      let clientWallet = await Wallet.findOne({ userId: req.user.id });
      if (!clientWallet) {
        console.log("Client wallet not found for user:", req.user.id);
        return res.status(500).json({
          success: false,
          message: "Client wallet not found",
        });
      }

      // Add refund amount to client wallet
      clientWallet.walletAmount += refundAmount;
      await clientWallet.save();

      console.log("Client wallet updated (40% refund):", {
        userId: req.user.id,
        refundAmount: refundAmount,
        newBalance: clientWallet.walletAmount,
      });

      // Find artist wallet and add 40% to it
      let artistWallet = await Wallet.findOne({ userId: artistId });
      if (!artistWallet) {
        console.log("Artist wallet not found for user:", artistId);
        return res.status(500).json({
          success: false,
          message: "Artist wallet not found",
        });
      }

      // Add 40% to artist wallet
      artistWallet.walletAmount += artistAmount;
      await artistWallet.save();

      console.log("Artist wallet updated (50%):", {
        userId: artistId,
        artistAmount: artistAmount,
        newBalance: artistWallet.walletAmount,
      });

      // Find the original transaction to update
      const originalTransaction = await Transaction.findOne({
        sender: req.user.id,
        receiver: artistId,
        bookingId: bookingId,
      });

      if (originalTransaction) {
        // Update original transaction to refund type with 40% amount
        originalTransaction.amount = refundAmount;
        originalTransaction.transactionType = "refund";
        originalTransaction.updatedAt = new Date();
        await originalTransaction.save();

        console.log("Transaction updated for 40% refund:", {
          originalAmount: paidAmount,
          refundAmount: refundAmount,
          adminFee: adminFee,
          artistAmount: artistAmount,
        });
      } else {
        console.log("No original transaction found for booking:", bookingId);
      }

      // // Create admin transaction record
      // const adminTransaction = new Transaction({
      //   sender: req.user.id,
      //   receiver: adminUser._id, // Admin user ID
      //   bookingId: bookingId,
      //   amount: adminFee,
      //   transactionType: 'admin-fee'
      // });
      // await adminTransaction.save();

      console.log("50% refund processed:", {
        totalPaid: paidAmount,
        clientRefund: refundAmount,
        adminFee: adminFee,
        daysUntilEvent: diffDays,
      });
    } else {
      // Less than 7 days: 90% to artist, 10% to admin
      if (diffDays < 7 && paidAmount > 0) {
        // Check artist account creation date to adjust admin fee
        const artist = await User.findById(artistId);
        if (!artist) {
          return res.status(404).json({
            success: false,
            message: "Artist not found",
          });
        }

        const accountCreationDate = new Date(artist.createdAt);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // If artist account was created more than one month ago, reduce admin fee to 5%
        // If less than one month, charge normal 10% admin fee
        const adminFeePercentage =
          accountCreationDate < oneMonthAgo ? 0.0 : 0.1;

        const adminFee = paidAmount * adminFeePercentage;
        const artistAmount = paidAmount - adminFee; // Remaining to artist

        // Find admin user
        const adminUser = await User.findOne({ userType: "admin" });
        if (!adminUser) {
          console.log("No admin user found");
          return res.status(500).json({
            success: false,
            message: "Admin user not found",
          });
        }

        let adminWallet = await Wallet.findOne({ userId: adminUser._id });
        if (!adminWallet) {
          adminWallet = new Wallet({ userId: adminUser._id, walletAmount: 0 });
        }

        // Add 10% fee to admin wallet
        adminWallet.walletAmount += adminFee;
        await adminWallet.save();

        // Find artist wallet and add 90% to it
        let artistWallet = await Wallet.findOne({ userId: artistId });
        if (!artistWallet) {
          console.log("Artist wallet not found for user:", artistId);
          return res.status(500).json({
            success: false,
            message: "Artist wallet not found",
          });
        }

        // Add 90% to artist wallet
        artistWallet.walletAmount += artistAmount;
        await artistWallet.save();

        console.log("Artist wallet updated (90%):", {
          userId: artistId,
          artistAmount: artistAmount,
          newBalance: artistWallet.walletAmount,
        });

        // // Create admin fee transaction
        // const adminTransaction = new Transaction({
        //   sender: req.user.id,
        //   receiver: adminUser._id,
        //   bookingId: bookingId,
        //   amount: adminFee,
        //   transactionType: 'admin-fee'
        // });
        // await adminTransaction.save();

        console.log("Fee processed (less than 7 days):", {
          totalPaid: paidAmount,
          artistAmount: artistAmount,
          adminFee: adminFee,
          daysUntilEvent: diffDays,
        });
      } else {
        console.log("No refund processed:", {
          daysUntilEvent: diffDays,
          paidAmount: paidAmount,
          reason: diffDays < 7 ? "Less than 7 days" : "No payment made",
        });
      }
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
      adminFee: 0,
    };

    // Add refund information if applicable
    if (diffDays > 14 && paidAmount > 0) {
      responseData.refundProcessed = true;
      responseData.refundAmount = paidAmount * 0.9;
      responseData.adminFee = paidAmount * 0.1;
      responseData.daysUntilEvent = diffDays;
      responseData.refundType = "90% refund";
    } else if (diffDays >= 7 && diffDays <= 14 && paidAmount > 0) {
      responseData.refundProcessed = true;
      responseData.refundAmount = paidAmount * 0.5;
      responseData.adminFee = paidAmount * 0.5;
      responseData.daysUntilEvent = diffDays;
      responseData.refundType = "50% refund";
    } else if (diffDays < 7 && paidAmount > 0) {
      responseData.refundProcessed = false;
      responseData.refundAmount = 0;
      responseData.adminFee = paidAmount;
      responseData.daysUntilEvent = diffDays;
      responseData.refundType = "No refund - admin fee";
    }

    // Create notification for the artist about booking cancellation
    try {
      const clientName = `${req.user.firstName} ${req.user.lastName}`;
      const notificationData = {
        clientName,
        bookingName: `${booking.eventType?.join(", ") || "Mehndi"} - ${
          booking.location
        }`,
        eventType: booking.eventType,
        bookingDate: booking.eventDate,
        location: booking.location,
        cancellationReason,
      };

      await createNotification(
        "booking_cancelled",
        artistId,
        req.user.id,
        "artist",
        bookingId,
        null,
        notificationData
      );
    } catch (notificationError) {
      console.error(
        "Error creating cancellation notification:",
        notificationError
      );
      // Don't fail the cancellation if notifications fail
    }

    // Create booking log
    const previousStatus = "confirmed"; // Before cancellation it was confirmed
    await createBookingLog(
      bookingId,
      "booking_cancelled",
      {
        userId: req.user.id,
        userType: req.user.userType,
        name: `${req.user.firstName} ${req.user.lastName}`,
      },
      {
        artistId: artistId,
        previousValues: { status: previousStatus },
        newValues: { status: "cancelled" },
        statusAtTime: "cancelled",
        details: `Booking cancelled. Reason: ${cancellationDescription}`,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while cancelling booking",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Update booking payment status for remaining payment
// @route   PUT /api/bookings/:id/payment-status
// @access  Private (Client only)
const updateBookingPaymentStatus = async (req, res) => {
  try {
    const { isPaid, remainingPayment, bookingId, artistId } = req.body;

    // Validate required fields
    if (!isPaid) {
      return res.status(400).json({
        success: false,
        message: "isPaid status is required",
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    // Trim whitespace from bookingId
    const trimmedBookingId = bookingId.trim();

    console.log("Update payment status - Request data:", {
      bookingId: bookingId,
      trimmedBookingId: trimmedBookingId,
      isPaid: isPaid,
      remainingPayment: remainingPayment,
    });

    // Find the booking
    const booking = await Booking.findById(trimmedBookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify ownership
    if (booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
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
      booking.remainingPayment = String(0);
    }
    booking.updatedAt = new Date();

    console.log("Payment calculation:", {
      existingPaymentPaid: existingPaymentPaid,
      remainingAmount: remainingAmount,
      totalPaidAmount: totalPaidAmount,
      newRemainingPayment: remainingPayment,
    });

    await booking.save();

    console.log("Booking payment status updated:", {
      bookingId: trimmedBookingId,
      isPaid: isPaid,
      remainingPayment: remainingPayment,
    });

    // Send confirmation email to client
    try {
      const client = await User.findById(booking.clientId).select(
        "email firstName lastName"
      );
      if (client && client.email) {
        const eventType = Array.isArray(booking.eventType)
          ? booking.eventType.join(", ")
          : booking.eventType || "Mehndi";
        const eventDate = booking.eventDate
          ? new Date(booking.eventDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A";
        const totalPaid = Number(booking.paymentPaid) || 0;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const dashboardUrl = `${frontendUrl}/dashboard/bookings`;

        const htmlMessage = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size: 15px; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 40px 35px; border-radius: 12px; box-shadow: 0 2px 15px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: #8b5a2b; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3">
                    <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h2 style="color: #5a3a1f; margin: 0; font-size: 28px; font-weight: 700;">Payment Complete!</h2>
              </div>
              
              <p style="color: #5a3a1f; line-height: 1.6; margin-bottom: 25px;">
                Hi ${client.firstName},
              </p>
              
              <p style="color: #5a3a1f; line-height: 1.6; margin-bottom: 25px;">
                Your remaining payment has been received successfully! Your booking is now fully paid and confirmed.
              </p>
              
              <div style="background-color: #fef9f3; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #5a3a1f; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Booking Details:</h3>
                <p style="color: #5a3a1f; margin: 8px 0;"><strong>Event Type:</strong> ${eventType}</p>
                <p style="color: #5a3a1f; margin: 8px 0;"><strong>Event Date:</strong> ${eventDate}</p>
                <p style="color: #5a3a1f; margin: 8px 0;"><strong>Total Amount Paid:</strong> £${totalPaid.toFixed(
                  2
                )}</p>
                <p style="color: #5a3a1f; margin: 8px 0;"><strong>Payment Status:</strong> Fully Paid</p>
              </div>
              
              <p style="color: #5a3a1f; line-height: 1.6; margin-bottom: 25px;">
                We'll remind you closer to your event date. If you have any questions or need to make changes, please don't hesitate to contact us.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #8b5a2b; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; text-decoration: none;">
                  View My Bookings
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #888; font-size: 13px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                Thank you for booking with Mehndi Me 💝
              </p>
            </div>
          </div>
        `;

        await sendEmail({
          email: client.email,
          subject: "Payment Complete - Your Booking is Confirmed",
          message: `Hi ${
            client.firstName
          },\n\nYour remaining payment has been received successfully! Your booking is now fully paid and confirmed.\n\nEvent Type: ${eventType}\nEvent Date: ${eventDate}\nTotal Amount Paid: £${totalPaid.toFixed(
            2
          )}\n\nWe'll remind you closer to your event date.\n\nThank you for booking with Mehndi Me!`,
          html: htmlMessage,
        });
        console.log("Payment confirmation email sent to client:", client.email);
      }
    } catch (emailError) {
      console.error("Error sending payment confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      message: "Booking payment status updated successfully",
      data: {
        bookingId: booking._id,
        isPaid: booking.isPaid,
        remainingPayment: booking.remainingPayment,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update booking payment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating booking payment status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Process refund for booking
// @route   POST /api/bookings/refund
// @access  Private (Client only)
const processRefund = async (req, res) => {
  try {
    const { bookingId, userId, artistId } = req.body;

    if (!bookingId || !userId || !artistId) {
      return res.status(400).json({
        success: false,
        message: "bookingId, userId, and artistId are required",
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify ownership
    if (booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to process refund for this booking",
      });
    }

    // Check if booking is cancelled from artist side
    if (booking.reinstate !== true) {
      return res.status(400).json({
        success: false,
        message: "Refund cannot be proceesed for this booking",
      });
    }

    // Add refund amount to user's wallet
    let userWallet = await Wallet.findOne({ userId: userId });
    if (!userWallet) {
      userWallet = new Wallet({ userId: userId, walletAmount: 0 });
    }

    const refundAmount = Number(booking.paymentPaid) || 0;
    userWallet.walletAmount += refundAmount;
    await userWallet.save();

    // Reset booking status and payment fields
    booking.status = "pending";
    booking.reinstate = false;
    booking.paymentPaid = "0";
    booking.remainingPayment = "0";
    booking.isPaid = "none";
    booking.assignedArtist = []; // Clear assigned artists array
    booking.appliedArtists = []; // Clear applied artists array
    await booking.save();

    console.log("Refund processed:", {
      bookingId: bookingId,
      userId: userId,
      artistId: artistId,
      refundAmount: refundAmount,
      newWalletBalance: userWallet.walletAmount,
    });

    // Create refund transaction record
    const refundTransaction = new Transaction({
      sender: artistId,
      receiver: userId,
      bookingId: bookingId,
      amount: refundAmount,
      transactionType: "refund",
    });
    await refundTransaction.save();
    console.log("Refund transaction created:", refundTransaction);

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: {
        bookingId: booking._id,
        refundAmount: refundAmount,
        newWalletBalance: userWallet.walletAmount,
        bookingStatus: booking.status,
      },
    });
  } catch (error) {
    console.error("Process refund error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing refund",
    });
  }
};

// @desc    Process refund for booking by admin
// @route   POST /api/admin/bookings/refund
// @access  Private (Admin only)
const processRefundByAdmin = async (req, res) => {
  try {
    const { bookingId, userId, artistId } = req.body;

    if (!bookingId || !userId || !artistId) {
      return res.status(400).json({
        success: false,
        message: "bookingId, userId, and artistId are required",
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Admin can process refund for any booking, no ownership check needed

    // Add refund amount to user's wallet
    let userWallet = await Wallet.findOne({ userId: userId });
    if (!userWallet) {
      userWallet = new Wallet({ userId: userId, walletAmount: 0 });
    }

    const refundAmount = Number(booking.paymentPaid) || 0;
    userWallet.walletAmount += refundAmount;
    await userWallet.save();

    // Reset booking status and payment fields
    booking.status = "pending";
    booking.reinstate = false;
    booking.paymentPaid = "0";
    booking.remainingPayment = "0";
    booking.isPaid = "none";
    booking.assignedArtist = []; // Clear assigned artists array
    booking.appliedArtists = []; // Clear applied artists array
    await booking.save();

    console.log("Refund processed by admin:", {
      bookingId: bookingId,
      userId: userId,
      artistId: artistId,
      refundAmount: refundAmount,
      newWalletBalance: userWallet.walletAmount,
      processedBy: req.user.id,
    });

    // Create refund transaction record
    const refundTransaction = new Transaction({
      sender: artistId,
      receiver: userId,
      bookingId: bookingId,
      amount: refundAmount,
      transactionType: "refund",
    });
    await refundTransaction.save();
    console.log("Refund transaction created:", refundTransaction);

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully by admin",
      data: {
        bookingId: booking._id,
        refundAmount: refundAmount,
        newWalletBalance: userWallet.walletAmount,
        bookingStatus: booking.status,
      },
    });
  } catch (error) {
    console.error("Process refund by admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing refund",
    });
  }
};

// @desc    Get nearby bookings within 3km radius
// @route   GET /api/bookings/nearby
// @access  Private (Artist only)
const getNearbyBookings = async (req, res) => {
  try {
    const { latitude, longitude, radius = 3 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Get all pending bookings with latitude and longitude
    const bookings = await Booking.find({
      status: "pending",
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
    }).populate("clientId", "firstName lastName email");

    // Filter bookings within radius using Haversine formula
    const nearbyBookings = bookings.filter((booking) => {
      if (!booking.latitude || !booking.longitude) return false;

      const R = 6371; // Earth's radius in kilometers
      const dLat = ((booking.latitude - userLat) * Math.PI) / 180;
      const dLng = ((booking.longitude - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((booking.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= radiusKm;
    });

    // Sort by distance (closest first)
    nearbyBookings.sort((a, b) => {
      const distA = calculateDistance(
        userLat,
        userLng,
        a.latitude,
        a.longitude
      );
      const distB = calculateDistance(
        userLat,
        userLng,
        b.latitude,
        b.longitude
      );
      return distA - distB;
    });

    res.status(200).json({
      success: true,
      data: nearbyBookings,
      count: nearbyBookings.length,
    });
  } catch (error) {
    console.error("Get nearby bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching nearby bookings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Save/like a booking for the current user
// @route   POST /api/bookings/:id/save
// @access  Private (Artist only)
const saveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    const userId = req.user.id;
    if (!booking.savedBy) booking.savedBy = [];
    if (!booking.savedBy.find((u) => u.toString() === userId)) {
      booking.savedBy.push(userId);
      await booking.save();
    }
    return res
      .status(200)
      .json({ success: true, message: "Saved", data: { saved: true } });
  } catch (error) {
    console.error("Save booking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while saving booking" });
  }
};

// @desc    Unsave/unlike a booking for the current user
// @route   DELETE /api/bookings/:id/save
// @access  Private (Artist only)
const unsaveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    const userId = req.user.id;
    booking.savedBy = (booking.savedBy || []).filter(
      (u) => u.toString() !== userId
    );
    await booking.save();
    return res
      .status(200)
      .json({ success: true, message: "Unsaved", data: { saved: false } });
  } catch (error) {
    console.error("Unsave booking error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while unsaving booking" });
  }
};

// @desc    Get current user's saved bookings
// @route   GET /api/bookings/saved
// @access  Private (Artist only)
const getSavedBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ savedBy: { $in: [userId] } })
      .populate("clientId", "firstName lastName email")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error("Get saved bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching saved bookings",
    });
  }
};

module.exports = {
  createBooking,
  getClientBookings,
  getAllBookings,
  getBookingById,
  getBookingLogs,
  updateBookingStatus,
  completeBooking,
  updateBooking,
  deleteBooking,
  getPendingBookings,
  cancelBooking,
  updateBookingPaymentStatus,
  processRefund,
  processRefundByAdmin,
  getNearbyBookings,
  saveBooking,
  unsaveBooking,
  getSavedBookings,
};
