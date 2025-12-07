const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Connection = require('../models/Connection');
const Event = require('../models/Event');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const alumniCount = await User.countDocuments({ role: 'alumni' });
    const postCount = await Post.countDocuments();
    const connectionCount = await Connection.countDocuments();
    const pendingConnections = await Connection.countDocuments({ status: 'Pending' });

    res.status(200).json({
      success: true,
      data: {
        students: studentCount,
        alumni: alumniCount,
        posts: postCount,
        connections: connectionCount,
        pendingConnections
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/Deactivate user
// @access  Private (Admin)
router.put('/users/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/posts
// @desc    Get all posts for moderation
// @access  Private (Admin)
router.get('/posts', protect, authorize('admin'), async (req, res) => {
  try {
    const { isApproved } = req.query;
    let query = {};
    
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    const posts = await Post.find(query)
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });

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

// @route   PUT /api/admin/posts/:id/approve
// @desc    Approve/Reject post
// @access  Private (Admin)
router.put('/posts/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { isApproved } = req.body;

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Post ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: post
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/admin/events
// @desc    Get all events
// @access  Private (Admin)
router.get('/events', protect, authorize('admin'), async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['date', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('Admin get events error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching events'
    });
  }
});

// @route   POST /api/admin/events
// @desc    Create a new event
// @access  Private (Admin)
router.post('/events', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, date, location, isVirtual, meetingLink, maxAttendees, tags } = req.body;

    // Validation
    if (!title || !description || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, date, location'
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      organizerId: req.user.id,
      isVirtual: isVirtual || false,
      meetingLink: meetingLink || null,
      maxAttendees: maxAttendees || 100,
      tags: tags || []
    });

    // Fetch the event with organizer info
    const populatedEvent = await Event.findByPk(event.id, {
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email', 'avatar']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });

  } catch (error) {
    console.error('Admin create event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating event'
    });
  }
});

// @route   PUT /api/admin/events/:id
// @desc    Update an event
// @access  Private (Admin)
router.put('/events/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const { title, description, date, location, isVirtual, meetingLink, maxAttendees, tags } = req.body;

    // Update fields
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (location !== undefined) event.location = location;
    if (isVirtual !== undefined) event.isVirtual = isVirtual;
    if (meetingLink !== undefined) event.meetingLink = meetingLink;
    if (maxAttendees !== undefined) event.maxAttendees = maxAttendees;
    if (tags !== undefined) event.tags = tags;

    await event.save();

    // Fetch the updated event with organizer info
    const populatedEvent = await Event.findByPk(event.id, {
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email', 'avatar']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: populatedEvent
    });

  } catch (error) {
    console.error('Admin update event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating event'
    });
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete an event
// @access  Private (Admin)
router.delete('/events/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.destroy();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting event'
    });
  }
});

module.exports = router;
