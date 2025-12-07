const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Event = require('../models/Event');

// @route   GET /api/students/alumni
// @desc    Get all alumni (for students to browse)
// @access  Private (Student)
router.get('/alumni', protect, authorize('student'), async (req, res) => {
  try {
    const { search, domain, department, year } = req.query;
    
    let query = { role: 'alumni', isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { currentRole: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (domain) query.domain = domain;
    if (department) query.branch = department;
    if (year) query.batch = year;

    const alumni = await User.find(query)
      .select('-password')
      .sort({ rating: -1, createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: alumni.length,
      data: alumni
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/students/profile
// @desc    Get student profile
// @access  Private (Student)
router.get('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({
      success: true,
      data: student
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/students/profile
// @desc    Update student profile
// @access  Private (Student)
router.put('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const allowedUpdates = ['name', 'branch', 'year', 'domain', 'description', 'avatar', 'skills'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const student = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: student
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/students/connections
// @desc    Get student's connection requests
// @access  Private (Student)
router.get('/connections', protect, authorize('student'), async (req, res) => {
  try {
    const connections = await Connection.find({ student: req.user._id })
      .populate('alumni', 'name email batch currentRole company rating linkedin avatar')
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

// @route   GET /api/students/events
// @desc    Get all events
// @access  Private (Student)
router.get('/events', protect, authorize('student'), async (req, res) => {
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

// @route   GET /api/students/events/upcoming
// @desc    Get upcoming events
// @access  Private (Student)
router.get('/events/upcoming', protect, authorize('student'), async (req, res) => {
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
