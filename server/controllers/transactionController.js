const Transaction = require('../schemas/Transaction');
const Booking = require('../schemas/Booking');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
};

// @desc    Get transactions for logged in user
// @route   GET /api/transactions/my-transactions
// @access  Private
const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all transactions where user is sender or receiver
    const transactions = await Transaction.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .populate('sender', 'firstName lastName email')
    .populate('receiver', 'firstName lastName email')
    .populate('bookingId', 'eventType eventDate minimumBudget maximumBudget')
    .sort({ createdAt: -1 });

    // Format transactions for frontend
    const formattedTransactions = transactions.map(transaction => {
      const isSender = transaction.sender._id.toString() === userId.toString();
      const booking = transaction.bookingId;
      
      return {
        _id: transaction._id,
        bookingId: transaction.bookingId?._id,
        eventName: booking ? (Array.isArray(booking.eventType) ? booking.eventType.join(', ') : booking.eventType) : 'Unknown Event',
        eventDate: booking ? booking.eventDate : null,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        isSender: isSender,
        otherParty: isSender ? transaction.receiver : transaction.sender,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedTransactions
    });
  } catch (error) {
    console.error('Get my transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user transactions'
    });
  }
};

module.exports = {
  getAllTransactions,
  getMyTransactions
};

