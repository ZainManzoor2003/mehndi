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
    .populate('sender', 'firstName lastName email userType')
    .populate('receiver', 'firstName lastName email userType')
    .populate({
      path: 'bookingId',
      select: 'eventType eventDate minimumBudget maximumBudget assignedArtist clientId firstName lastName',
      populate: {
        path: 'assignedArtist',
        select: 'firstName lastName email userType'
      }
    })
    .sort({ createdAt: -1 });

    // Format transactions for frontend
    const formattedTransactions = transactions.map(transaction => {
      const isSender = transaction.sender._id.toString() === userId.toString();
      const booking = transaction.bookingId;
      
      // Determine the artist information
      let artistInfo = null;
      if (booking && booking.assignedArtist && booking.assignedArtist.length > 0) {
        // Get the first assigned artist
        artistInfo = {
          _id: booking.assignedArtist[0]._id,
          name: `${booking.assignedArtist[0].firstName} ${booking.assignedArtist[0].lastName}`,
          firstName: booking.assignedArtist[0].firstName,
          lastName: booking.assignedArtist[0].lastName,
          email: booking.assignedArtist[0].email
        };
      } else if (transaction.receiver && transaction.receiver.userType === 'artist') {
        // If receiver is an artist, use their info
        artistInfo = {
          _id: transaction.receiver._id,
          name: `${transaction.receiver.firstName} ${transaction.receiver.lastName}`,
          firstName: transaction.receiver.firstName,
          lastName: transaction.receiver.lastName,
          email: transaction.receiver.email
        };
      } else if (transaction.sender && transaction.sender.userType === 'artist') {
        // If sender is an artist, use their info
        artistInfo = {
          _id: transaction.sender._id,
          name: `${transaction.sender.firstName} ${transaction.sender.lastName}`,
          firstName: transaction.sender.firstName,
          lastName: transaction.sender.lastName,
          email: transaction.sender.email
        };
      }

      // Format event name and category
      let eventName = 'Unknown Event';
      let category = 'Event';
      
      if (booking && booking.eventType) {
        if (Array.isArray(booking.eventType)) {
          eventName = booking.eventType.join(', ');
          // Determine category from event type based on schema enum values
          const eventTypes = booking.eventType;
          
          if (eventTypes.includes('Wedding')) {
            category = 'Bridal';
          } else if (eventTypes.includes('Festival') || eventTypes.includes('Eid')) {
            category = 'Festive';
          } else if (eventTypes.includes('Party')) {
            category = 'Party';
          } else if (eventTypes.includes('Other')) {
            category = 'Casual';
          }
        } else {
          eventName = booking.eventType;
          
          if (booking.eventType === 'Wedding') {
            category = 'Bridal';
          } else if (booking.eventType === 'Festival' || booking.eventType === 'Eid') {
            category = 'Festive';
          } else if (booking.eventType === 'Party') {
            category = 'Party';
          } else if (booking.eventType === 'Other') {
            category = 'Casual';
          }
        }
      }

      // Determine transaction status text
      let statusText = 'Paid';
      let statusClass = 'paid';
      
      switch (transaction.transactionType) {
        case 'half':
          statusText = 'Deposit Paid';
          statusClass = 'deposit-paid';
          break;
        case 'full':
          statusText = 'Payment Complete';
          statusClass = 'payment-complete';
          break;
        case 'refund':
          statusText = 'Refunded';
          statusClass = 'refunded';
          break;
        case 'admin-fee':
          statusText = 'Admin Fee';
          statusClass = 'admin-fee';
          break;
        case 'withdrawal':
          statusText = 'Withdrawal';
          statusClass = 'withdrawal';
          break;
        default:
          statusText = 'Paid';
          statusClass = 'paid';
      }

      // Format amount display
      let amountDisplay = `£${transaction.amount.toFixed(0)}`;
      if (transaction.transactionType === 'half') {
        amountDisplay = `£${transaction.amount.toFixed(0)} (50% deposit)`;
      } else if (transaction.transactionType === 'full') {
        amountDisplay = `£${transaction.amount.toFixed(0)} (remaining)`;
      }

      return {
        _id: transaction._id,
        bookingId: transaction.bookingId?._id,
        eventName: eventName,
        category: category,
        eventDate: booking ? booking.eventDate : null,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        amountDisplay: amountDisplay,
        statusText: statusText,
        statusClass: statusClass,
        isSender: isSender,
        artistInfo: artistInfo,
        artistName: artistInfo ? artistInfo.name : 'Unknown Artist',
        otherParty: isSender ? transaction.receiver : transaction.sender,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        // Additional fields for UI
        paymentMethod: 'Stripe', // Default payment method
        invoiceAvailable: true // All transactions have invoice capability
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

