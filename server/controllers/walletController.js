const Wallet = require('../schemas/Wallet');
const User = require('../schemas/User');
const Transaction = require('../schemas/Transaction');

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
      transactionType: { $ne: 'refund' }
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

module.exports = { getWallet, updateWallet, getAllWallets, getWalletSummary };
