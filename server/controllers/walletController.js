const Wallet = require('../schemas/Wallet');
const User = require('../schemas/User');
const Transaction = require('../schemas/Transaction');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

// GET /api/wallet - Get user's wallet
const getWallet = async (req, res) => {
  try {
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ userId }).populate('userId', 'firstName lastName email userType');

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { wallet }
    });
  } catch (err) {
    console.error('Get wallet error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// PUT /api/wallet/update - Update wallet amount (admin only)
const updateWallet = async (req, res) => {
  try {
    const { userId, amount, operation } = req.body;
    const adminId = req.user._id;

    // Check if current user is admin
    const admin = await User.findById(adminId);
    if (!admin || admin.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (!userId || amount === undefined || !operation) {
      return res.status(400).json({
        success: false,
        message: 'User ID, amount, and operation are required'
      });
    }

    if (!['add', 'subtract', 'set'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Operation must be add, subtract, or set'
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount cannot be negative'
      });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    let newAmount;
    switch (operation) {
      case 'add':
        newAmount = wallet.walletAmount + amount;
        break;
      case 'subtract':
        newAmount = wallet.walletAmount - amount;
        if (newAmount < 0) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient wallet balance'
          });
        }
        break;
      case 'set':
        newAmount = amount;
        break;
    }

    wallet.walletAmount = newAmount;
    await wallet.save();

    return res.status(200).json({
      success: true,
      message: 'Wallet updated successfully',
      data: { wallet }
    });
  } catch (err) {
    console.error('Update wallet error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// GET /api/wallet/all - Get all wallets (admin only)
const getAllWallets = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Check if current user is admin
    const admin = await User.findById(adminId);
    if (!admin || admin.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const wallets = await Wallet.find()
      .populate('userId', 'firstName lastName email userType')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { wallets }
    });
  } catch (err) {
    console.error('Get all wallets error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// GET /api/wallet/summary - Get wallet summary with total paid from transactions
const getWalletSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get wallet balance
    const wallet = await Wallet.findOne({ userId });
    const remainingBalance = wallet ? wallet.walletAmount : 0;

    // Calculate total paid from transactions where user is sender (excluding refunds)
    const transactions = await Transaction.find({
      sender: userId,
      transactionType: { $nin: ['refund', 'admin-fee', 'withdrawal'] }
    });
    const totalPaid = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    return res.status(200).json({
      success: true,
      data: {
        remainingBalance: remainingBalance,
        totalPaid: totalPaid,
        wallet: wallet
      }
    });
  } catch (err) {
    console.error('Get wallet summary error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// POST /api/wallet/withdraw - Request withdrawal via Stripe
const withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a Stripe account ID
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

      // Create account onboarding link with role-based return URL
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const returnPath = user.userType === 'client' ? '/dashboard/wallet' : '/artist-dashboard/applications';
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${baseUrl}/reauth`,
        return_url: `${baseUrl}${returnPath}`,
        type: "account_onboarding",
      });

      // Save the Stripe account ID to user profile
      user.stripeAccountId = account.id;
      await user.save();

      console.log("Onboarding link:", accountLink.url);

      return res.status(200).json({
        success: true,
        message: 'Stripe account created. Please complete onboarding.',
        data: {
          onboardingUrl: accountLink.url,
          stripeAccountId: account.id
        }
      });
    }

    // console.log(await stripe.accounts.createLoginLink('acct_1SEopBPY0cFB8LY2'))

    //  const balance= await stripe.balance.retrieve({stripeAccount:'acct_1SEopBPY0cFB8LY2'})
    //  console.log(balance)

    // User has Stripe account ID, proceed with transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit (cents for SGD)
      currency: "sgd",
      destination: user.stripeAccountId,
      description: "Payout to artist for completed booking",
    });

    console.log("Transfer created:", transfer.id);

    await stripe.payouts.create({
      amount: Math.round(amount * 100), // $50
      currency: "sgd",
    }, {
      stripeAccount: user.stripeAccountId, // connected account ID
    });

    // Find user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check if user has sufficient balance
    if (wallet.walletAmount < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Deduct amount from wallet
    wallet.walletAmount -= amount;
    await wallet.save();

    // Create transaction record
    const transaction = new Transaction({
      sender: userId,
      receiver: userId,
      amount: amount,
      transactionType: 'withdrawal'
    });
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Transfer initiated successfully',
      data: {
        transferId: transfer.id,
        amount: amount,
        status: transfer.status
      }
    });

  } catch (error) {
    console.error('Withdraw funds error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during withdrawal',
      error: error.message
    });
  }
};


module.exports = { getWallet, updateWallet, getAllWallets, getWalletSummary, withdrawFunds };
