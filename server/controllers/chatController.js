const Chat = require('../schemas/Chat');
const User = require('../schemas/User');

// Create or get existing chat between a client and artist
exports.ensureChat = async (req, res) => {
  try {
    const { clientId, artistId } = req.body;
    if (!clientId || !artistId) return res.status(400).json({ success: false, message: 'clientId and artistId are required' });

    let chat = await Chat.findOne({ client: clientId, artist: artistId });
    if (!chat) {
      chat = await Chat.create({ client: clientId, artist: artistId, messages: [] });
      await User.findByIdAndUpdate(clientId, { $addToSet: { chatIds: chat._id } });
      await User.findByIdAndUpdate(artistId, { $addToSet: { chatIds: chat._id } });
    }

    const populated = await Chat.findById(chat._id).populate('client', 'firstName lastName userType').populate('artist', 'firstName lastName userType');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// List chats for current user
exports.listMyChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ $or: [{ client: userId }, { artist: userId }] })
      .sort({ updatedAt: -1 })
      .populate('client', 'firstName lastName userType')
      .populate('artist', 'firstName lastName userType');
    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get chat by id
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate('client', 'firstName lastName userType')
      .populate('artist', 'firstName lastName userType');
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Send message (persist + return updated chat)
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'text is required' });
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: { sender: req.user.id, text, createdAt: new Date() } },
        $set: { lastMessageAt: new Date() }
      },
      { new: true }
    ).populate('client', 'firstName lastName userType').populate('artist', 'firstName lastName userType');
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


