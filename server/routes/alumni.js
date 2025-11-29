const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Connection = require('../models/Connection');
const Event = require('../models/Event');

// @route   GET /api/alumni/profile
// @desc    Get alumni profile
// @access  Private (Alumni)
router.get('/profile', protect, authorize('alumni'), async (req, res) => {
  try {
    const alumni = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({
      success: true,
      data: alumni
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/alumni/profile
// @desc    Update alumni profile
// @access  Private (Alumni)
router.put('/profile', protect, authorize('alumni'), async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'batch', 'currentRole', 'company', 'bio', 
      'linkedin', 'domains', 'achievements', 'skills', 'avatar'
    ];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const alumni = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: alumni
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/alumni/connection-requests
// @desc    Get connection requests received by alumni
// @access  Private (Alumni)
router.get('/connection-requests', protect, authorize('alumni'), async (req, res) => {
  try {
    const connections = await Connection.find({ alumni: req.user._id })
      .populate('student', 'name email branch year domain avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/alumni/posts
// @desc    Get alumni's own posts
// @access  Private (Alumni)
router.get('/posts', protect, authorize('alumni'), async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name role avatar');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/alumni/events
// @desc    Get all events
// @access  Private (Alumni)
router.get('/events', protect, authorize('alumni'), async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['date', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching events'
    });
  }
});

// @route   GET /api/alumni/events/upcoming
// @desc    Get upcoming events
// @access  Private (Alumni)
router.get('/events/upcoming', protect, authorize('alumni'), async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.findAll({
      where: {
        date: {
          [require('sequelize').Op.gte]: now
        }
      },
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['date', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching upcoming events'
    });
  }
});

module.exports = router;
