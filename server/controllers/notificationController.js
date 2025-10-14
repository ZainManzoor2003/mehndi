const Notification = require('../schemas/Notification');

// @desc    Get notifications for the current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    // Get notifications for the current user, filtered by their user type
    const notifications = await Notification.find({
      targetUserId: userId,
      targetUserType: userType
    })
    .populate('triggeredByUserId', 'firstName lastName')
    .populate('bookingId', 'eventType city eventDate')
    .sort({ createdAt: -1 })
    .limit(10); // Limit to latest 10 notifications

    // Transform notifications for frontend display
    const transformedNotifications = notifications.map(notification => {
      let type = 'info';
      let icon = '📩';

      // Determine notification type and icon based on notification type
      switch (notification.type) {
        case 'booking_created':
          type = 'success';
          icon = '🎨';
          break;
        case 'booking_cancelled':
          type = 'danger';
          icon = '❌';
          break;
        case 'booking_completed':
          type = 'success';
          icon = '✅';
          break;
        case 'application_submitted':
          type = 'info';
          icon = '📝';
          break;
        case 'application_accepted':
          type = 'success';
          icon = '🎉';
          break;
        case 'application_declined':
          type = 'warning';
          icon = '😔';
          break;
        case 'application_withdrawn':
          type = 'warning';
          icon = '↩️';
          break;
        default:
          type = 'info';
          icon = '📩';
      }

      return {
        id: notification._id,
        type,
        icon,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        data: notification.data
      };
    });

    return res.status(200).json({
      success: true,
      data: transformedNotifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id, 
        targetUserId: userId 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    await Notification.updateMany(
      { 
        targetUserId: userId,
        targetUserType: userType,
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking all notifications as read'
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      targetUserId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting notification'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
