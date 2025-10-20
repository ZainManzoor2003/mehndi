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
      // Link chat to client immediately
      await User.findByIdAndUpdate(clientId, { $addToSet: { chatIds: chat._id } });
      // Do NOT add to artist yet; only after first message is sent
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
    const { text, attachments } = req.body;
    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, message: 'text or attachments are required' });
    }
    
    const messageData = {
      sender: req.user.id,
      text: text || '',
      createdAt: new Date()
    };
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }
    
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: messageData },
        $set: { lastMessageAt: new Date() }
      },
      { new: true }
    ).populate('client', 'firstName lastName userType').populate('artist', 'firstName lastName userType');
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    // After first message, ensure artist has the chat linked
    try {
      const artistHasChat = await User.findOne({ _id: chat.artist._id, chatIds: chat._id });
      if (!artistHasChat) {
        await User.findByIdAndUpdate(chat.artist._id, { $addToSet: { chatIds: chat._id } });
      }
    } catch (_) {}
    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark all messages in a chat as read by current user
exports.markRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    // Add userId to readBy for all messages that don't include it
    chat.messages = chat.messages.map(m => {
      const already = (m.readBy || []).some(id => String(id) === String(userId));
      if (!already) {
        m.readBy = [...(m.readBy || []), userId];
      }
      return m;
    });
    await chat.save();

    const populated = await Chat.findById(chatId)
      .populate('client', 'firstName lastName userType')
      .populate('artist', 'firstName lastName userType');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


