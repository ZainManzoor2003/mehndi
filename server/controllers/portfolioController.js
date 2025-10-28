const Portfolio = require('../schemas/Portfolio');
const User = require('../schemas/User');

// Ensure only artists can manage portfolios
const assertArtist = (user) => {
  if (!user || user.userType !== 'artist') {
    const err = new Error('Only artist users can manage portfolios');
    err.status = 403;
    throw err;
  }
};

exports.listMyPortfolios = async (req, res) => {
  try {
    assertArtist(req.user);
    const portfolios = await Portfolio.find({ artist: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, data: portfolios });
  } catch (err) {
    console.error('listMyPortfolios error:', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.createPortfolio = async (req, res) => {
  try {
    assertArtist(req.user);

    const payload = { ...req.body, artist: req.user._id };
    // Normalize URL arrays
    if (Array.isArray(payload.mediaUrls)) {
      payload.mediaUrls = payload.mediaUrls.filter(Boolean);
    }

    // Handle travel distance validation
    if (payload.availableForTravel && (!payload.travelDistanceKm || payload.travelDistanceKm <= 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Travel distance in km is required when available for travel' 
      });
    }

    // Set travel distance to 0 if not available for travel
    if (!payload.availableForTravel) {
      payload.travelDistanceKm = 0;
    }

    const portfolio = await Portfolio.create(payload);

    // Link to artist's portfolios array
    await User.updateOne({ _id: req.user._id }, { $addToSet: { 'portfolios': portfolio._id } });

    return res.status(201).json({ success: true, data: portfolio });
  } catch (err) {
    console.error('createPortfolio error:', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.updatePortfolio = async (req, res) => {
  try {
    assertArtist(req.user);
    const { id } = req.params;

    const existing = await Portfolio.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Portfolio not found' });
    if (String(existing.artist) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = { ...req.body };
    // Prevent artist field change
    delete updates.artist;

    if (Array.isArray(updates.mediaUrls)) {
      updates.mediaUrls = updates.mediaUrls.filter(Boolean);
    }

    // Handle travel distance validation
    if (updates.availableForTravel && (!updates.travelDistanceKm || updates.travelDistanceKm <= 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Travel distance in km is required when available for travel' 
      });
    }

    // Set travel distance to 0 if not available for travel
    if (updates.availableForTravel === false) {
      updates.travelDistanceKm = 0;
    }

    const updated = await Portfolio.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updatePortfolio error:', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.deletePortfolio = async (req, res) => {
  try {
    assertArtist(req.user);
    const { id } = req.params;

    const existing = await Portfolio.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Portfolio not found' });
    if (String(existing.artist) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await existing.deleteOne();
    await User.updateOne({ _id: req.user._id }, { $pull: { 'portfolios': existing._id } });

    return res.json({ success: true, message: 'Portfolio deleted' });
  } catch (err) {
    console.error('deletePortfolio error:', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.getArtistPortfolio = async (req, res) => {
  try {
    const { artistId } = req.params;

    // Find the artist's portfolio (get the first published one or the first one if none published)
    const portfolio = await Portfolio.findOne({ artist: artistId, isPublished: true })
      .populate('artist', 'firstName lastName email userProfileImage')
      .sort({ createdAt: -1 });

    // If no published portfolio, get the most recent one
    if (!portfolio) {
      const fallbackPortfolio = await Portfolio.findOne({ artist: artistId })
        .populate('artist', 'firstName lastName email userProfileImage')
        .sort({ createdAt: -1 });
      
      if (!fallbackPortfolio) {
        return res.status(404).json({ success: false, message: 'No portfolio found for this artist' });
      }
      
      return res.json({ success: true, data: fallbackPortfolio });
    }

    return res.json({ success: true, data: portfolio });
  } catch (err) {
    console.error('getArtistPortfolio error:', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
};


