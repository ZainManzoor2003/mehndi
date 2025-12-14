const cron = require("node-cron");
const Booking = require("../schemas/Booking");
const Application = require("../schemas/Application");
const User = require("../schemas/User");
const Wallet = require("../schemas/Wallet");
const Transaction = require("../schemas/Transaction");
const Notification = require("../schemas/Notification");

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
      case "booking_completed":
        notificationData.title = "Booking Completed";
        notificationData.message = `Your ${
          data.eventType?.join(", ") || "mehndi"
        } booking with ${data.clientName} has been completed successfully`;
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

// Auto-complete bookings that have passed 24 hours after eventDate
const autoCompleteBookings = async () => {
  try {
    console.log("\n🔄 [AUTO-COMPLETE] Starting auto-completion check...");
    console.log(`   Time: ${new Date().toISOString()}`);

    // Calculate the cutoff time (24 hours ago from now)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find bookings that:
    // 1. Status is "confirmed" (artist has been accepted)
    // 2. eventDate has passed 24 hours
    // 3. Has assigned artist
    // 4. Status is not already "completed"
    const bookingsToComplete = await Booking.find({
      status: "confirmed",
      eventDate: { $lte: twentyFourHoursAgo },
      assignedArtist: { $exists: true, $ne: [] },
    });

    console.log(
      `📊 [AUTO-COMPLETE] Found ${bookingsToComplete.length} booking(s) to auto-complete`
    );

    if (bookingsToComplete.length === 0) {
      console.log("✅ [AUTO-COMPLETE] No bookings to complete. Exiting...\n");
      return;
    }

    let completedCount = 0;
    let errorCount = 0;

    for (const booking of bookingsToComplete) {
      try {
        console.log(
          `\n🔍 [AUTO-COMPLETE] Processing Booking ID: ${booking._id}`
        );
        console.log(`   Event Date: ${booking.eventDate}`);
        console.log(`   Client ID: ${booking.clientId}`);
        console.log(`   Assigned Artists: ${booking.assignedArtist.length}`);

        // Check if booking already has assigned artist
        if (
          !Array.isArray(booking.assignedArtist) ||
          booking.assignedArtist.length === 0
        ) {
          console.log(
            `⚠️  [AUTO-COMPLETE] Skipping booking ${booking._id}: No assigned artist`
          );
          continue;
        }

        // Get the first assigned artist (primary artist)
        const assignedArtistId = booking.assignedArtist[0];

        // Check if artist has Stripe account (required for payment)
        const assignedArtist = await User.findById(assignedArtistId);
        if (!assignedArtist || !assignedArtist.stripeAccountId) {
          console.log(
            `⚠️  [AUTO-COMPLETE] Skipping booking ${booking._id}: Artist missing Stripe account`
          );
          continue;
        }

        // Get payment amount
        const amountPaid = Number(booking.paymentPaid) || 0;
        if (amountPaid <= 0) {
          console.log(
            `⚠️  [AUTO-COMPLETE] Skipping booking ${booking._id}: No payment recorded`
          );
          continue;
        }

        console.log(`   Amount Paid: £${amountPaid}`);

        // Calculate commission (15% if artist account is older than 1 month)
        let commissionAmount = 0;
        try {
          if (assignedArtist.createdAt) {
            const accountAgeMs =
              Date.now() - new Date(assignedArtist.createdAt).getTime();
            const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
            if (accountAgeMs >= oneMonthMs) {
              commissionAmount = Math.round(amountPaid * 0.15 * 100) / 100; // 15%
            }
          }
        } catch (err) {
          console.log(`   ⚠️  Commission calculation error: ${err.message}`);
        }

        const payoutAmount = Math.max(0, amountPaid - commissionAmount);
        console.log(`   Commission: £${commissionAmount}`);
        console.log(`   Payout Amount: £${payoutAmount}`);

        // Credit artist wallet
        let artistWallet = await Wallet.findOne({ userId: assignedArtistId });
        if (!artistWallet) {
          artistWallet = new Wallet({
            userId: assignedArtistId,
            walletAmount: 0,
            role: "artist",
          });
        }

        const previousWalletAmount = artistWallet.walletAmount;
        artistWallet.walletAmount += payoutAmount;
        await artistWallet.save();

        console.log(
          `   💰 Wallet updated: £${previousWalletAmount} → £${artistWallet.walletAmount}`
        );

        // Create transaction record
        const clientUser = await User.findById(booking.clientId);
        const tx = new Transaction({
          sender: booking.clientId,
          receiver: assignedArtistId,
          bookingId: booking._id,
          amount: amountPaid,
          commission: commissionAmount,
          transactionType: "full",
        });
        await tx.save();
        console.log(`   📝 Transaction recorded: ${tx._id}`);

        // Update booking status to completed (no images/video for auto-complete)
        booking.status = "completed";
        await booking.save({ validateBeforeSave: false });
        console.log(`   ✅ Booking status updated to: completed`);

        // Update application status to completed
        const application = await Application.findOne({
          "Booking.booking_id": booking._id,
          "Booking.artist_id": assignedArtistId,
        });

        if (application) {
          const updateResult = await Application.updateOne(
            {
              _id: application._id,
              "Booking.booking_id": booking._id,
              "Booking.artist_id": assignedArtistId,
            },
            {
              $set: {
                "Booking.$.status": "completed",
              },
            }
          );

          if (updateResult.modifiedCount > 0) {
            console.log(`   ✅ Application status updated to: completed`);
          } else {
            console.log(`   ⚠️  Application not found or already updated`);
          }
        } else {
          console.log(`   ⚠️  Application not found for this booking`);
        }

        // Create notification for artist
        try {
          const clientName = clientUser
            ? `${clientUser.firstName} ${clientUser.lastName}`
            : "Client";
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
            booking.clientId,
            "artist",
            booking._id,
            null,
            notificationData
          );
          console.log(`   📬 Notification sent to artist`);
        } catch (notificationError) {
          console.error(
            `   ❌ Error creating notification: ${notificationError.message}`
          );
        }

        completedCount++;
        console.log(
          `✅ [AUTO-COMPLETE] Successfully completed booking ${booking._id}\n`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `❌ [AUTO-COMPLETE] Error processing booking ${booking._id}:`,
          error.message
        );
        console.error(`   Stack: ${error.stack}\n`);
      }
    }

    console.log("\n📊 [AUTO-COMPLETE] Summary:");
    console.log(`   ✅ Successfully completed: ${completedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📅 Next check will run as scheduled\n`);
  } catch (error) {
    console.error("❌ [AUTO-COMPLETE] Fatal error:", error);
    console.error(`   Stack: ${error.stack}\n`);
  }
};

// Schedule the cron job to run every hour
// Format: minute hour day month day-of-week
// This runs at the start of every hour (e.g., 1:00, 2:00, 3:00, etc.)
const startAutoCompleteCron = () => {
  console.log("⏰ [CRON] Auto-complete bookings cron job started");
  console.log("   Schedule: Every 24 hours (Daily at 00:00)");
  console.log("   Example: Mon 00:00, Tue 00:00, etc.\n");

  // Run every 24 hours (at minute 0 of hour 0)
  cron.schedule("0 0 * * *", async () => {
    await autoCompleteBookings();
  });

  // Also run immediately on startup (optional - for testing)
  // Uncomment the line below if you want to run it immediately when server starts
  // autoCompleteBookings();
};

module.exports = {
  autoCompleteBookings,
  startAutoCompleteCron,
};
