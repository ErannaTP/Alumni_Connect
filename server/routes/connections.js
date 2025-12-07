const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Connection = require('../models/Connection');
const User = require('../models/User');

// @route   GET /api/connections
// @desc    Get user's connections
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let where = {};
    
    if (req.user.role === 'student') {
      where.studentId = req.user.id;
    } else if (req.user.role === 'alumni') {
      where.alumniId = req.user.id;
    }

    const connections = await Connection.findAll({
      where,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email', 'branch', 'year', 'domain', 'avatar']
        },
        {
          model: User,
          as: 'alumni',
          attributes: ['name', 'email', 'batch', 'currentRole', 'company', 'rating', 'linkedin', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

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

// @route   POST /api/connections
// @desc    Send connection request (student to alumni)
// @access  Private (Student)
router.post('/', protect, async (req, res) => {
  try {
    const { alumniId, requestMessage } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can send connection requests'
      });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      where: {
        studentId: req.user.id,
        alumniId: alumniId
      }
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: 'Connection request already exists'
      });
    }

    const connection = await Connection.create({
      studentId: req.user.id,
      alumniId: alumniId,
      requestMessage: requestMessage || '',
      status: 'Pending'
    });

    const populatedConnection = await Connection.findByPk(connection.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email', 'branch', 'year', 'domain', 'avatar']
        },
        {
          model: User,
          as: 'alumni',
          attributes: ['name', 'email', 'batch', 'currentRole', 'company', 'rating', 'linkedin', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      data: populatedConnection
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/connections/:id
// @desc    Update connection status (accept/reject)
// @access  Private (Alumni)
router.put('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Accepted" or "Rejected"'
      });
    }

    const connection = await Connection.findByPk(req.params.id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    // Verify that the current user is the alumni in this connection
    if (connection.alumniId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this connection'
      });
    }

    connection.status = status;
    await connection.save();

    const populatedConnection = await Connection.findByPk(connection.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email', 'branch', 'year', 'domain', 'avatar']
        },
        {
          model: User,
          as: 'alumni',
          attributes: ['name', 'email', 'batch', 'currentRole', 'company', 'rating', 'linkedin', 'avatar']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: `Connection ${status.toLowerCase()} successfully`,
      data: populatedConnection
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/connections/:id
// @desc    Delete connection request
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const connection = await Connection.findByPk(req.params.id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      connection.studentId === req.user.id ||
      connection.alumniId === req.user.id ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this connection'
      });
    }

    await connection.destroy();

    res.status(200).json({
      success: true,
      message: 'Connection deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;