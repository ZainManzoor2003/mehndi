const Stripe = require('stripe');
const Booking = require('../schemas/Booking');
const Application = require('../schemas/Application');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Stripe Checkout session for accepting an application
// @route   POST /api/payments/checkout
// @access  Private (Client)
exports.createCheckoutSession = async (req, res) => {
  try {
    const { bookingId, applicationId } = req.body;

    if (!bookingId || !applicationId) {
      return res.status(400).json({ success: false, message: 'bookingId and applicationId are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (!req.user || req.user.userType !== 'client' || booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const entry = application.Booking.find(b => b.booking_id.toString() === bookingId.toString());
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Application not linked to this booking' });
    }

    if (entry.status !== 'applied') {
      return res.status(400).json({ success: false, message: 'Only applied applications can be accepted and paid' });
    }

    // Determine amount: 50% if eventDate > 14 days from now, else 100%
    const eventDate = new Date(booking.eventDate);
    const now = new Date();
    const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    const proposed = entry.artistDetails?.proposedBudget || booking.minimumBudget || 0;
    const percent = diffDays > 14 ? 0.5 : 1;
    const amount = Math.round(proposed * percent * 100); // in pence

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Mehndi Booking Deposit',
              description: percent === 1 ? 'Full payment' : '50% deposit',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${'http://localhost:3000'}/proposal?status=success&booking=${bookingId}&application=${applicationId}`,
      cancel_url: `${'http://localhost:3000'}/proposal?status=cancelled&booking=${bookingId}&application=${applicationId}`,
      metadata: {
        bookingId,
        applicationId,
        percent: percent === 1 ? '100' : '50',
      },
    });

    return res.status(200).json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ success: false, message: 'Payment session creation failed', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// @desc    Webhook for Stripe to mark booking as paid and set paymentPaid
// @route   POST /api/payments/webhook
// @access  Public (Stripe)
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { bookingId, applicationId, percent, isPaid } = session.metadata || {};

      if (bookingId && applicationId) {
        // Mark application as accepted, booking confirmed, and paymentPaid as percent
        await Application.updateOne(
          { _id: applicationId, 'Booking.booking_id': bookingId },
          { $set: { 'Booking.$.status': 'accepted' } }
        );

        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.status = 'confirmed';
          booking.paymentPaid = percent === '100' ? 'paid' : 'partial';
          if (isPaid) {
            booking.isPaid = isPaid;
          }
          await booking.save();

          // Decline other applications
          await Application.updateMany(
            { 'Booking.booking_id': bookingId, _id: { $ne: applicationId } },
            { $set: { 'Booking.$[elem].status': 'declined' } },
            { arrayFilters: [ { 'elem.booking_id': bookingId } ] }
          );
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).send('Server error');
  }
};


