const User = require('../schemas/User');
const Blog = require('../schemas/Blog');
const Application = require('../schemas/Application');
const Booking = require('../schemas/Booking');

// Users
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, userType, password } = req.body || {};

    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
      user.email = email.toLowerCase();
    }

    if (typeof firstName !== 'undefined') user.firstName = String(firstName).trim();
    if (typeof lastName !== 'undefined') user.lastName = String(lastName).trim();
    if (typeof userType !== 'undefined') user.userType = userType;

    if (password && String(password).length >= 6) {
      user.password = String(password);
    }

    const saved = await user.save();
    const safe = saved.toObject();
    delete safe.password;
    return res.status(200).json({ success: true, data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Applications (summary/status only)
exports.getApplicationsStatus = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: '$Booking' },
      { $group: { _id: '$Booking.status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { status: 1 } }
    ];
    const stats = await Application.aggregate(pipeline);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// All applications with artist and booking info
exports.listAllApplications = async (req, res) => {
  try {
    const results = await Application.aggregate([
      { $unwind: '$Booking' },
      { $lookup: { from: 'users', localField: 'Booking.artist_id', foreignField: '_id', as: 'artist' } },
      { $unwind: '$artist' },
      { $lookup: { from: 'bookings', localField: 'Booking.booking_id', foreignField: '_id', as: 'booking' } },
      { $unwind: '$booking' },
      { $project: {
          _id: 1,
          applicationId: '$_id',
          status: '$Booking.status',
          artist: { _id: '$artist._id', firstName: '$artist.firstName', lastName: '$artist.lastName', email: '$artist.email' },
          booking: { 
            _id: '$booking._id', 
            title: '$booking.otherEventType', 
            budgetMin: '$booking.minimumBudget', 
            budgetMax: '$booking.maximumBudget',
            client: { firstName: '$booking.firstName', lastName: '$booking.lastName', email: '$booking.email' },
            location: '$booking.location',
            eventDate: '$booking.eventDate',
            images: '$Booking.images',
            video: '$Booking.video'
          },
          proposedBudget: '$Booking.artistDetails.proposedBudget',
          estimatedDuration: '$Booking.artistDetails.estimatedDuration'
      }} ,
      { $sort: { _id: -1 } }
    ]);
    
    return res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error('Error in listAllApplications:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Blogs CRUD
exports.createBlog = async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }
    const blog = await Blog.create({ title: title.trim(), description: description.trim(), imageUrl: (imageUrl || '').trim(), authorId: req.user._id });
    return res.status(201).json({ success: true, data: blog });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.listBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate('authorId', 'firstName lastName email').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: blogs.length, data: blogs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { title, description, imageUrl } = req.body;
    const update = {};
    if (typeof title !== 'undefined') update.title = title.trim();
    if (typeof description !== 'undefined') update.description = description.trim();
    if (typeof imageUrl !== 'undefined') update.imageUrl = imageUrl.trim();
    const blog = await Blog.findByIdAndUpdate(blogId, update, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    return res.status(200).json({ success: true, data: blog });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findByIdAndDelete(blogId);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    return res.status(200).json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
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
    const prevFromDate = new Date(fromDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    const prevToDate = new Date(fromDate.getTime() - 1);
    
    // Build city filter
    const cityFilter = city ? { city: new RegExp(city, 'i') } : {};
    
    // Get current period data
    const currentPeriodData = await getPeriodData(fromDate, toDate, cityFilter);
    
    // Get previous period data for comparison
    const previousPeriodData = await getPeriodData(prevFromDate, prevToDate, cityFilter);
    
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
      prevCancellationRate: previousPeriodData.cancellationRate
    };
    
    return res.status(200).json({ success: true, data: analyticsData });
  } catch (err) {
    console.error('Error in getAnalytics:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper function to get data for a specific period
const getPeriodData = async (fromDate, toDate, cityFilter) => {
  try {
    // Get total clients (users with userType 'client')
    const totalClients = await User.countDocuments({
      userType: 'client',
      createdAt: { $gte: fromDate, $lte: toDate }
    });
    
    // Get total artists (users with userType 'artist')
    const totalArtists = await User.countDocuments({
      userType: 'artist',
      createdAt: { $gte: fromDate, $lte: toDate }
    });
    
    // Get total requests (total bookings)
    const totalRequests = await Booking.countDocuments({
      createdAt: { $gte: fromDate, $lte: toDate },
      ...cityFilter
    });
    
    // Get completed requests (bookings with status 'completed')
    const completedRequests = await Booking.countDocuments({
      status: 'completed',
      createdAt: { $gte: fromDate, $lte: toDate },
      ...cityFilter
    });
    
    // Get active applications (applications with status 'accepted')
    const activeApplications = await Application.countDocuments({
      'Booking.status': 'accepted',
      createdAt: { $gte: fromDate, $lte: toDate }
    });
    
    // Calculate cancellation rate
    const cancelledApplications = await Application.countDocuments({
      'Booking.status': 'cancelled',
      createdAt: { $gte: fromDate, $lte: toDate }
    });
    
    const totalApplications = await Application.countDocuments({
      createdAt: { $gte: fromDate, $lte: toDate }
    });
    
    const cancellationRate = totalApplications > 0 ? 
      Math.round((cancelledApplications / totalApplications) * 100) : 0;
    
    return {
      totalClients,
      totalArtists,
      totalRequests,
      completedRequests,
      activeApplications,
      cancellationRate
    };
  } catch (err) {
    console.error('Error in getPeriodData:', err);
    return {
      totalClients: 0,
      totalArtists: 0,
      totalRequests: 0,
      completedRequests: 0,
      activeApplications: 0,
      cancellationRate: 0
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
    
    const cityFilter = city ? { city: new RegExp(city, 'i') } : {};
    
    const statusCounts = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          ...cityFilter
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const result = statusCounts.map(item => ({
      status: item._id,
      count: item.count
    }));
    
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getRequestsByStatus:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getApplicationsByStatus = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    
    const statusCounts = await Application.aggregate([
      {
        $unwind: '$Booking'
      },
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate }
        }
      },
      {
        $group: {
          _id: '$Booking.status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const result = statusCounts.map(item => ({
      status: item._id,
      count: item.count
    }));
    
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getApplicationsByStatus:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
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
          userType: 'client',
          createdAt: { $gte: fromDate, $lte: toDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    const artistData = await User.aggregate([
      {
        $match: {
          userType: 'artist',
          createdAt: { $gte: fromDate, $lte: toDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Get all months in range for consistent data
    const months = [];
    const current = new Date(fromDate);
    while (current <= toDate) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        label: current.toLocaleDateString('en-US', { month: 'short' })
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    // Create cumulative data
    let clientTotal = 0;
    let artistTotal = 0;
    
    const result = months.map(month => {
      const clientCount = clientData.find(d => d._id.year === month.year && d._id.month === month.month)?.count || 0;
      const artistCount = artistData.find(d => d._id.year === month.year && d._id.month === month.month)?.count || 0;
      
      clientTotal += clientCount;
      artistTotal += artistCount;
      
      return {
        month: month.label,
        clients: clientTotal,
        artists: artistTotal
      };
    });
    
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getGrowthOverTime:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
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
          createdAt: { $gte: fromDate, $lte: toDate }
        }
      },
      {
        $group: {
          _id: '$city',
          requests: { $sum: 1 }
        }
      }
    ]);
    
    // Get applications by city (through bookings)
    const applicationsByCity = await Application.aggregate([
      {
        $unwind: '$Booking'
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'Booking.booking_id',
          foreignField: '_id',
          as: 'booking'
        }
      },
      {
        $unwind: '$booking'
      },
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate }
        }
      },
      {
        $group: {
          _id: '$booking.city',
          applications: { $sum: 1 }
        }
      }
    ]);
    
    // Combine data
    const allCities = new Set([
      ...requestsByCity.map(r => r._id),
      ...applicationsByCity.map(a => a._id)
    ]);
    
    const result = Array.from(allCities).map(city => {
      const requests = requestsByCity.find(r => r._id === city)?.requests || 0;
      const applications = applicationsByCity.find(a => a._id === city)?.applications || 0;
      
      return {
        city,
        requests,
        applications
      };
    }).sort((a, b) => (b.requests + b.applications) - (a.requests + a.applications));
    
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getActivityByCity:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


