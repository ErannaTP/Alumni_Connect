const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');

// @route   GET /api/messages
// @desc    Get messages for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { with: otherUserId } = req.query;

    let query;
    if (otherUserId) {
      // Get conversation with specific user
      query = {
        $or: [
          { sender: req.user._id, receiver: otherUserId },
          { sender: otherUserId, receiver: req.user._id }
        ]
      };
    } else {
      // Get all messages involving current user
      query = {
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id }
        ]
      };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email role avatar')
      .populate('receiver', 'name email role avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get list of all conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .populate('sender', 'name email role avatar')
    .populate('receiver', 'name email role avatar')
    .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      const partnerId = msg.sender._id.toString() === req.user._id.toString()
        ? msg.receiver._id.toString()
        : msg.sender._id.toString();
      
      if (!conversationsMap.has(partnerId)) {
        const partner = msg.sender._id.toString() === req.user._id.toString()
          ? msg.receiver
          : msg.sender;
        
        conversationsMap.set(partnerId, {
          user: partner,
          lastMessage: msg,
          unreadCount: 0
        });
      }
      
      // Count unread messages
      if (msg.receiver._id.toString() === req.user._id.toString() && !msg.isRead) {
        conversationsMap.get(partnerId).unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: text.trim()
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role avatar')
      .populate('receiver', 'name email role avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify that the current user is the receiver
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }

    await message.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
