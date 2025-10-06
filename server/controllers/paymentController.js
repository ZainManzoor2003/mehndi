const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

// @desc    Create Stripe Checkout Session for upfront payment
// @route   POST /api/payments/create-checkout
// @access  Private (Client only)
exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = 'gbp', bookingId, applicationId, successUrl, cancelUrl,
      description, isPaid, remainingAmount } = req.body || {};

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Stripe not configured on server' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    if (!bookingId || !applicationId) {
      return res.status(400).json({ success: false, message: 'bookingId and applicationId are required' });
    }

    if (!req.user || req.user.userType !== 'client') {
      return res.status(403).json({ success: false, message: 'Only clients can create payments' });
    }

    // Check if booking is half paid and adjust payment logic
    const Booking = require('../schemas/Booking');
    const booking = await Booking.findById(bookingId);
    
    if (booking && booking.isPaid === 'half' && isPaid === 'full') {
      // Booking is half paid, use artist's proposed budget as full amount
      const Application = require('../schemas/Application');
      const application = await Application.findById(applicationId);
      
      if (application) {
        const entry = application.Booking.find(b => b.booking_id.toString() === bookingId.toString());
        if (entry && entry.artistDetails?.proposedBudget) {
          const proposedBudget = entry.artistDetails.proposedBudget;
          // Update the amount to be the artist's proposed budget
          req.body.amount = proposedBudget;
          req.body.isPaid = 'full';
          req.body.remainingAmount = 0;
        }
      }
    }

    // Use updated values after potential adjustment
    const finalAmount = req.body.amount || amount;
    const finalIsPaid = req.body.isPaid || isPaid;
    const finalRemainingAmount = req.body.remainingAmount || remainingAmount;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(Number(finalAmount) * 100),
            product_data: {
              name: 'Booking upfront payment',
              description: description || `Booking ${bookingId} upfront payment`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: String(bookingId),
        applicationId: String(applicationId),
        paidAmount: String(finalAmount),
        remainingAmount: String(finalRemainingAmount),
        isPaid: String(finalIsPaid || 'none'),
      },
      success_url: `http://localhost:3000/payment-success?checkout=success&bookingId=${encodeURIComponent(bookingId)}&applicationId=${encodeURIComponent(applicationId)}&paidAmount=${encodeURIComponent(finalAmount)}&isPaid=${encodeURIComponent(finalIsPaid || 'none')}&remaining=${encodeURIComponent(finalRemainingAmount || '0')}`,
      cancel_url: `http://localhost:3000/payment-cancel?checkout=canceled&bookingId=${encodeURIComponent(bookingId)}&applicationId=${encodeURIComponent(applicationId)}`,
    });

    return res.status(200).json({ success: true, data: { id: session.id, url: session.url } });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// @desc    Create Stripe Checkout Session for remaining payment
// @route   POST /api/payments/remaining-checkout
// @access  Private (Client only)
exports.createRemainingCheckoutSession = async (req, res) => {
  try {
    const { bookingId, remainingAmount, artistId, currency = 'gbp' } = req.body || {};

    console.log('Remaining Payment Controller - Request body:', req.body);
    console.log('Remaining Payment Controller - Amount:', remainingAmount);

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Stripe not configured on server' });
    }

    if (!remainingAmount || remainingAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid remaining amount is required' });
    }

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    if (!req.user || req.user.userType !== 'client') {
      return res.status(403).json({ success: false, message: 'Only clients can create payments' });
    }

    // Verify booking ownership
    const Booking = require('../schemas/Booking');
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.clientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(Number(remainingAmount) * 100),
            product_data: {
              name: 'Booking remaining payment',
              description: `Remaining payment for booking`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: String(bookingId),
        paymentType: 'remaining',
        clientId: String(req.user.id),
        isPaid: 'full',
        artistId: String(artistId)
      },
      success_url: `http://localhost:3000/payment-success?checkout=success&bookingId=
      ${encodeURIComponent(bookingId)}&paymentType=remaining&isPaid=full&amount=${encodeURIComponent(remainingAmount)}&artistId=${encodeURIComponent(artistId)}`,
      cancel_url: `http://localhost:3000/payment-cancel?checkout=canceled&bookingId=${encodeURIComponent(bookingId)}&paymentType=remaining`,
    });

    console.log('Remaining Payment Controller - Session created successfully:', { id: session.id, url: session.url });
    return res.status(200).json({ success: true, data: { id: session.id, url: session.url } });
  } catch (error) {
    console.error('Remaining payment checkout session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create remaining payment checkout session', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};


