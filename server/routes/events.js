const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');

// @route   GET /api/events
// @desc    Get all events (for students and alumni)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Get all events organized by admins, ordered by date
    const events = await Event.findAll({
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email', 'role', 'avatar']
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

// @route   GET /api/events/upcoming
// @desc    Get upcoming events
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
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
        attributes: ['id', 'name', 'email', 'role', 'avatar']
      }],
      order: [['date', 'ASC']],
      limit: 10
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

// @route   POST /api/events
// @desc    Create a new event (admin only)
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
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
      organizerId: req.user.id, // Admin who creates the event
      isVirtual: isVirtual || false,
      meetingLink: meetingLink || null,
      maxAttendees: maxAttendees || 100,
      tags: tags || [],
      attendees: []
    });

    // Fetch the event with organizer info
    const populatedEvent = await Event.findByPk(event.id, {
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email', 'role', 'avatar']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating event'
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event (admin only)
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
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
        attributes: ['id', 'name', 'email', 'role', 'avatar']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: populatedEvent
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating event'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event (admin only)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
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
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting event'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'name', 'email', 'role', 'avatar']
      }]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching event'
    });
  }
});

module.exports = router;