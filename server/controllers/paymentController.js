const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

// @desc    Create Stripe Checkout Session for upfront payment
// @route   POST /api/payments/create-checkout
// @access  Private (Client only)
exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = 'gbp', bookingId, applicationId, successUrl, cancelUrl,
      description, isPaid,remainingAmount } = req.body || {};
    

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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(Number(amount) * 100),
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
        paidAmount: String(amount),
        remainingAmount: String(remainingAmount),
        isPaid: String(isPaid || 'none'),
      },
      success_url:  `http://localhost:3000/dashboard/proposals?checkout=success&bookingId=${encodeURIComponent(bookingId)}&applicationId=${encodeURIComponent(applicationId)}&paidAmount=${encodeURIComponent(amount)}&isPaid=${encodeURIComponent(isPaid || 'none')}&remaining=${encodeURIComponent(remainingAmount || '0')}`,
      cancel_url: `http://localhost:3000/dashboard/proposals?checkout=canceled&bookingId=${encodeURIComponent(bookingId)}&applicationId=${encodeURIComponent(applicationId)}`,
    });

    return res.status(200).json({ success: true, data: { id: session.id, url: session.url } });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};


