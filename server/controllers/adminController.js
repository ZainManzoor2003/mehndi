const mongoose = require("mongoose");
const User = require("../schemas/User");
const Blog = require("../schemas/Blog");
const Application = require("../schemas/Application");
const Booking = require("../schemas/Booking");
const Notification = require("../schemas/Notification");

// Users
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, count: users.length, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, userType, password, status } =
      req.body || {};

    const user = await User.findById(userId).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
      }
      user.email = email.toLowerCase();
    }

    if (typeof firstName !== "undefined")
      user.firstName = String(firstName).trim();
    if (typeof lastName !== "undefined")
      user.lastName = String(lastName).trim();
    if (typeof userType !== "undefined") user.userType = userType;
    if (typeof status !== "undefined") user.status = status;

    if (password && String(password).length >= 6) {
      user.password = String(password);
    }

    const saved = await user.save();
    const safe = saved.toObject();
    delete safe.password;
    return res.status(200).json({ success: true, data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get user bookings (for clients)
exports.getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ clientId: userId }).sort({
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get user applications (for artists)
exports.getUserApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    const applications = await Application.aggregate([
      { $unwind: "$Booking" },
      { $match: { "Booking.artist_id": new mongoose.Types.ObjectId(userId) } },
      { $count: "total" },
    ]);
    const count = applications.length > 0 ? applications[0].total : 0;
    return res
      .status(200)
      .json({ success: true, count, data: Array(count).fill({}) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Applications (summary/status only)
exports.getApplicationsStatus = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$Booking" },
      { $group: { _id: "$Booking.status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
      { $sort: { status: 1 } },
    ];
    const stats = await Application.aggregate(pipeline);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// All applications with artist and booking info
exports.listAllApplications = async (req, res) => {
  try {
    const results = await Application.aggregate([
      { $unwind: "$Booking" },
      {
        $lookup: {
          from: "users",
          localField: "Booking.artist_id",
          foreignField: "_id",
          as: "artist",
        },
      },
      { $unwind: "$artist" },
      {
        $lookup: {
          from: "bookings",
          localField: "Booking.booking_id",
          foreignField: "_id",
          as: "booking",
        },
      },
      { $unwind: "$booking" },
      {
        $project: {
          _id: 1,
          applicationId: "$_id",
          status: "$Booking.status",
          cancellationReason: "$Booking.cancellationReason",
          artist: {
            _id: "$artist._id",
            firstName: "$artist.firstName",
            lastName: "$artist.lastName",
            email: "$artist.email",
          },
          booking: {
            _id: "$booking._id",
            title: "$booking.otherEventType",
            budgetMin: "$booking.minimumBudget",
            budgetMax: "$booking.maximumBudget",
            client: {
              firstName: "$booking.firstName",
              lastName: "$booking.lastName",
              email: "$booking.email",
            },
            location: "$booking.location",
            eventDate: "$booking.eventDate",
            images: "$Booking.images",
            video: "$Booking.video",
          },
          proposedBudget: "$Booking.artistDetails.proposedBudget",
          estimatedDuration: "$Booking.artistDetails.estimatedDuration",
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return res
      .status(200)
      .json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error("Error in listAllApplications:", err);
    return res.status(500).json({ success: false, message: "Server error" });
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
      case "application_declined":
        notificationData.title = "Application Declined by Admin";
        notificationData.message = `Your application for ${
          data.clientName || "a client"
        }'s ${
          data.eventType?.join(", ") || "mehndi"
        } booking has been declined by admin`;
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

// @desc    Admin rejects an application (admin rejects an application)
// @route   PUT /api/admin/applications/reject
// @access  Private (Admin only)
exports.rejectApplication = async (req, res) => {
  try {
    const { applicationId, bookingId } = req.body;

    if (!applicationId || !bookingId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "applicationId and bookingId are required",
        });
    }

    // Verify application exists and get the booking entry
    const application = await Application.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    const bookingEntry = application.Booking.find(
      (b) => b.booking_id.toString() === bookingId.toString()
    );
    if (!bookingEntry) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Booking entry not found in this application",
        });
    }

    // Check if already accepted or completed
    if (bookingEntry.status === "accepted") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot reject an accepted application",
        });
    }

    // Update the booking entry status to 'declined'
    bookingEntry.status = "declined";
    await application.save();

    // Get booking and artist information for notification
    const booking = await Booking.findById(bookingId);
    const artistId = bookingEntry.artist_id;

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Get client information
    const client = await User.findById(booking.clientId);
    const clientName = client
      ? `${client.firstName} ${client.lastName}`
      : "The client";

    // Remove artist from booking.appliedArtists if still present
    if (booking.appliedArtists && Array.isArray(booking.appliedArtists)) {
      booking.appliedArtists = booking.appliedArtists.filter(
        (id) => id.toString() !== artistId.toString()
      );
      // If no applied artists remain and booking is not confirmed, revert to pending
      if (
        booking.appliedArtists.length === 0 &&
        booking.status !== "confirmed"
      ) {
        booking.status = "pending";
      }
      await booking.save();
    }

    // Create notification for the artist about application rejection by admin
    try {
      const notificationData = {
        clientName,
        artistName: "",
        bookingName: `${booking.eventType?.join(", ") || "Mehndi"} - ${
          booking.city || booking.location
        }`,
        eventType: booking.eventType,
        bookingDate: booking.eventDate,
        location: booking.city || booking.location,
        proposedBudget: bookingEntry.artistDetails?.proposedBudget,
      };

      await createNotification(
        "application_declined",
        artistId,
        req.user.id,
        "artist",
        bookingId,
        applicationId,
        notificationData
      );
    } catch (notificationError) {
      console.error(
        "Error creating rejection notification:",
        notificationError
      );
      // Don't fail the rejection if notifications fail
    }

    return res
      .status(200)
      .json({ success: true, message: "Application rejected successfully" });
  } catch (error) {
    console.error("Reject application error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while rejecting application",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
  }
};

// @desc    Admin cancels an accepted application -> notify client by email
// @route   POST /api/admin/applications/cancel
// @access  Private (Admin only)
exports.notifyCancellationByAdmin = async (req, res) => {
  try {
    const { applicationId, bookingId } = req.body;

    if (!applicationId || !bookingId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "applicationId and bookingId are required",
        });
    }

    // Verify application exists and get the booking entry
    const application = await Application.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    const bookingEntry = application.Booking.find(
      (b) => b.booking_id.toString() === bookingId.toString()
    );
    if (!bookingEntry) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Booking entry not found in this application",
        });
    }

    // Check if application is accepted
    if (bookingEntry.status !== "accepted") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Can only cancel accepted applications",
        });
    }

    // Update application with cancellation (no reason/description required for admin)
    bookingEntry.status = "cancelled";
    await application.save();

    // Get booking and client
    const booking = await Booking.findById(bookingId).select(
      "clientId eventType firstName lastName eventDate preferredTimeSlot assignedArtist"
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const client = await User.findById(booking.clientId).select(
      "email firstName lastName"
    );
    if (!client || !client.email) {
      return res
        .status(404)
        .json({ success: false, message: "Client email not found" });
    }

    // Get artist details
    const artistId = bookingEntry.artist_id || booking.assignedArtist;
    const artist = await User.findById(artistId).select(
      "firstName lastName email phoneNumber"
    );
    if (!artist) {
      return res
        .status(404)
        .json({ success: false, message: "Artist not found" });
    }

    // Send email
    const nodemailer = require("nodemailer");
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "ahmadmurtaza2233@gmail.com",
        pass: process.env.EMAIL_PASS || "czhupnxmdckqhydy",
      },
    });

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
    const eventTime = Array.isArray(booking.preferredTimeSlot)
      ? booking.preferredTimeSlot.join(", ")
      : "Not specified";

    // Base URL for frontend (adjust as needed)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const relistUrl = `${frontendUrl}/payment-reschedule-booking/relist/${bookingId}/${artistId}/${booking.clientId}`;
    const refundUrl = `${frontendUrl}/payment-reschedule-booking/refund/${bookingId}/${artistId}/${booking.clientId}`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;font-size:15px;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f9f9f9;">
        <div style="background-color:white;padding:40px 35px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.08);">
          
          <h2 style="color:#333;margin-top:0;font-size:22px;font-weight:600;">Hi ${client.firstName},</h2>
          
          <p style="line-height:1.6;color:#555;">
            We're reaching out to let you know that the admin has cancelled your booking with <strong>${artist.firstName} ${artist.lastName}</strong> 
            for your appointment on <strong>${eventDate}</strong> at <strong>${eventTime}</strong>.
          </p>

          <div style="background-color:#fef2f2;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #dc2626;">
            <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Admin Cancellation:</strong></p>
            <p style="margin:8px 0 0 0;color:#555;">This booking has been cancelled by our admin team. We apologize for any inconvenience this may cause.</p>
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
      subject:
        "Booking Cancelled by Admin — We'll Help You Rebook or Refund Your Deposit",
      html,
    });

    return res
      .status(200)
      .json({ success: true, message: "Cancellation email sent to client." });
  } catch (error) {
    console.error("notifyCancellationByAdmin error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while sending cancellation email",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
  }
};

// Blogs CRUD
exports.createBlog = async (req, res) => {
  try {
    const { title, description, imageUrl, minutesToRead, category, sections } =
      req.body || {};
    if (!title || !description) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Title and description are required",
        });
    }
    const minutes =
      typeof minutesToRead === "number" ? minutesToRead : Number(minutesToRead);
    if (!minutes || minutes < 1 || !Number.isInteger(minutes)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Minutes to read must be a positive integer",
        });
    }
    if (!imageUrl || !String(imageUrl).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Image is required" });
    }
    const validCategories = [
      "Client Tips",
      "Artist Tips",
      "Success Stories",
      "Platform Updates",
    ];
    if (!category || !validCategories.includes(category)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid category is required" });
    }
    const safeSections = Array.isArray(sections)
      ? sections.map((s) => ({
          subtitle: String(s.subtitle || "").trim(),
          description: String(s.description || ""),
          imageUrl: String(s.imageUrl || ""),
          quote: String(s.quote || ""),
        }))
      : [];
    const blog = await Blog.create({
      title: title.trim(),
      description: description.trim(),
      imageUrl: (imageUrl || "").trim(),
      minutesToRead: minutes,
      category: category.trim(),
      sections: safeSections,
      authorId: req.user._id,
    });
    return res.status(201).json({ success: true, data: blog });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.listBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("authorId", "firstName lastName email")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, count: blogs.length, data: blogs });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { title, description, imageUrl, minutesToRead, category, sections } =
      req.body || {};
    const update = {};
    if (typeof title !== "undefined") update.title = title.trim();
    if (typeof description !== "undefined")
      update.description = description.trim();
    if (typeof imageUrl !== "undefined") update.imageUrl = imageUrl.trim();
    if (typeof minutesToRead !== "undefined")
      update.minutesToRead =
        typeof minutesToRead === "number"
          ? minutesToRead
          : Number(minutesToRead) || undefined;
    if (typeof category !== "undefined") {
      const validCategories = [
        "Client Tips",
        "Artist Tips",
        "Success Stories",
        "Platform Updates",
      ];
      if (validCategories.includes(category)) {
        update.category = category.trim();
      }
    }
    if (typeof sections !== "undefined") {
      update.sections = Array.isArray(sections)
        ? sections.map((s) => ({
            subtitle: String(s.subtitle || "").trim(),
            description: String(s.description || ""),
            imageUrl: String(s.imageUrl || ""),
            quote: String(s.quote || ""),
          }))
        : [];
    }
    const blog = await Blog.findByIdAndUpdate(blogId, update, { new: true });
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    return res.status(200).json({ success: true, data: blog });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findByIdAndDelete(blogId);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    return res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { from, to, city } = req.query;

    // Parse date range
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // Include the entire end date

    // Calculate previous period for comparison
    const periodDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    const prevFromDate = new Date(
      fromDate.getTime() - periodDays * 24 * 60 * 60 * 1000
    );
    const prevToDate = new Date(fromDate.getTime() - 1);

    // Build city filter
    const cityFilter = city ? { city: new RegExp(city, "i") } : {};

    // Get current period data
    const currentPeriodData = await getPeriodData(fromDate, toDate, cityFilter);

    // Get previous period data for comparison
    const previousPeriodData = await getPeriodData(
      prevFromDate,
      prevToDate,
      cityFilter
    );

    const analyticsData = {
      // Current period
      totalClients: currentPeriodData.totalClients,
      totalArtists: currentPeriodData.totalArtists,
      totalRequests: currentPeriodData.totalRequests,
      completedRequests: currentPeriodData.completedRequests,
      activeApplications: currentPeriodData.activeApplications,
      cancellationRate: currentPeriodData.cancellationRate,

      // Previous period for comparison
      prevTotalClients: previousPeriodData.totalClients,
      prevTotalArtists: previousPeriodData.totalArtists,
      prevTotalRequests: previousPeriodData.totalRequests,
      prevCompletedRequests: previousPeriodData.completedRequests,
      prevActiveApplications: previousPeriodData.activeApplications,
      prevCancellationRate: previousPeriodData.cancellationRate,
    };

    return res.status(200).json({ success: true, data: analyticsData });
  } catch (err) {
    console.error("Error in getAnalytics:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper function to get data for a specific period
const getPeriodData = async (fromDate, toDate, cityFilter) => {
  try {
    // Get total clients (users with userType 'client')
    const totalClients = await User.countDocuments({
      userType: "client",
      createdAt: { $gte: fromDate, $lte: toDate },
    });

    // Get total artists (users with userType 'artist')
    const totalArtists = await User.countDocuments({
      userType: "artist",
      createdAt: { $gte: fromDate, $lte: toDate },
    });

    // Get total requests (total bookings)
    const totalRequests = await Booking.countDocuments({
      createdAt: { $gte: fromDate, $lte: toDate },
      ...cityFilter,
    });

    // Get completed requests (bookings with status 'completed')
    const completedRequests = await Booking.countDocuments({
      status: "completed",
      createdAt: { $gte: fromDate, $lte: toDate },
      ...cityFilter,
    });

    // Get active applications (applications with status 'accepted')
    // Active applications filtered via booking.city
    const activeAppsAgg = await Application.aggregate([
      { $unwind: "$Booking" },
      {
        $lookup: {
          from: "bookings",
          localField: "Booking.booking_id",
          foreignField: "_id",
          as: "bookingRef",
        },
      },
      { $unwind: "$bookingRef" },
      {
        $match: {
          "Booking.status": "accepted",
          createdAt: { $gte: fromDate, $lte: toDate },
          ...(cityFilter.city ? { "bookingRef.city": cityFilter.city } : {}),
        },
      },
      { $count: "count" },
    ]);
    const activeApplications = activeAppsAgg[0]?.count || 0;

    // Calculate cancellation rate
    const cancelledAppsAgg = await Application.aggregate([
      { $unwind: "$Booking" },
      {
        $lookup: {
          from: "bookings",
          localField: "Booking.booking_id",
          foreignField: "_id",
          as: "bookingRef",
        },
      },
      { $unwind: "$bookingRef" },
      {
        $match: {
          "Booking.status": "cancelled",
          createdAt: { $gte: fromDate, $lte: toDate },
          ...(cityFilter.city ? { "bookingRef.city": cityFilter.city } : {}),
        },
      },
      { $count: "count" },
    ]);
    const cancelledApplications = cancelledAppsAgg[0]?.count || 0;

    const totalAppsAgg = await Application.aggregate([
      { $unwind: "$Booking" },
      {
        $lookup: {
          from: "bookings",
          localField: "Booking.booking_id",
          foreignField: "_id",
          as: "bookingRef",
        },
      },
      { $unwind: "$bookingRef" },
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          ...(cityFilter.city ? { "bookingRef.city": cityFilter.city } : {}),
        },
      },
      { $count: "count" },
    ]);
    const totalApplications = totalAppsAgg[0]?.count || 0;

    const cancellationRate =
      totalApplications > 0
        ? Math.round((cancelledApplications / totalApplications) * 100)
        : 0;

    return {
      totalClients,
      totalArtists,
      totalRequests,
      completedRequests,
      activeApplications,
      cancellationRate,
    };
  } catch (err) {
    console.error("Error in getPeriodData:", err);
    return {
      totalClients: 0,
      totalArtists: 0,
      totalRequests: 0,
      completedRequests: 0,
      activeApplications: 0,
      cancellationRate: 0,
    };
  }
};

// Chart Data APIs
exports.getRequestsByStatus = async (req, res) => {
  try {
    const { from, to, city } = req.query;

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const cityFilter = city ? { city: new RegExp(city, "i") } : {};

    const statusCounts = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          ...cityFilter,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const result = statusCounts.map((item) => ({
      status: item._id,
      count: item.count,
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error in getRequestsByStatus:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getApplicationsByStatus = async (req, res) => {
  try {
    const { from, to, city } = req.query;

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const statusCounts = await Application.aggregate([
      {
        $unwind: "$Booking",
      },
      // Join booking to get city when filtering
      ...(city
        ? [
            {
              $lookup: {
                from: "bookings",
                localField: "Booking.booking_id",
                foreignField: "_id",
                as: "bookingRef",
              },
            },
            { $unwind: "$bookingRef" },
          ]
        : []),
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          ...(city
            ? { "bookingRef.city": { $regex: city, $options: "i" } }
            : {}),
        },
      },
      {
        $group: {
          _id: "$Booking.status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const result = statusCounts.map((item) => ({
      status: item._id,
      count: item.count,
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error in getApplicationsByStatus:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getGrowthOverTime = async (req, res) => {
  try {
    const { from, to } = req.query;

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Get monthly data for clients and artists
    const clientData = await User.aggregate([
      {
        $match: {
          userType: "client",
          createdAt: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const artistData = await User.aggregate([
      {
        $match: {
          userType: "artist",
          createdAt: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get all months in range for consistent data
    const months = [];
    const current = new Date(fromDate);
    while (current <= toDate) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        label: current.toLocaleDateString("en-US", { month: "short" }),
      });
      current.setMonth(current.getMonth() + 1);
    }

    // Create cumulative data
    let clientTotal = 0;
    let artistTotal = 0;

    const result = months.map((month) => {
      const clientCount =
        clientData.find(
          (d) => d._id.year === month.year && d._id.month === month.month
        )?.count || 0;
      const artistCount =
        artistData.find(
          (d) => d._id.year === month.year && d._id.month === month.month
        )?.count || 0;

      clientTotal += clientCount;
      artistTotal += artistCount;

      return {
        month: month.label,
        clients: clientTotal,
        artists: artistTotal,
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error in getGrowthOverTime:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getActivityByCity = async (req, res) => {
  try {
    const { from, to } = req.query;

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Get requests (bookings) by city
    const requestsByCity = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: "$city",
          requests: { $sum: 1 },
        },
      },
    ]);

    // Get applications by city (through bookings)
    const applicationsByCity = await Application.aggregate([
      {
        $unwind: "$Booking",
      },
      {
        $lookup: {
          from: "bookings",
          localField: "Booking.booking_id",
          foreignField: "_id",
          as: "booking",
        },
      },
      {
        $unwind: "$booking",
      },
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: "$booking.city",
          applications: { $sum: 1 },
        },
      },
    ]);

    // Combine data
    const allCities = new Set([
      ...requestsByCity.map((r) => r._id),
      ...applicationsByCity.map((a) => a._id),
    ]);

    const result = Array.from(allCities)
      .map((city) => {
        const requests =
          requestsByCity.find((r) => r._id === city)?.requests || 0;
        const applications =
          applicationsByCity.find((a) => a._id === city)?.applications || 0;

        return {
          city,
          requests,
          applications,
        };
      })
      .sort(
        (a, b) => b.requests + b.applications - (a.requests + a.applications)
      );

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error in getActivityByCity:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
