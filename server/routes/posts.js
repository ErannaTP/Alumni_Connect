const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const { Op } = require('sequelize');

// @route   GET /api/posts
// @desc    Get all posts (with filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { domain, search, author } = req.query;
    let where = { isApproved: true };
    
    if (domain && domain !== 'None') where.domain = domain;
    if (author) where.authorId = author;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
        // Note: For hashtags, we'll need to adjust the approach since it's stored as JSON
      ];
    }

    const posts = await Post.findAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'role', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

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

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, domain, hashtags, image } = req.body;

    const post = await Post.create({
      authorId: req.user.id,
      title,
      content,
      domain,
      hashtags: hashtags || [],
      image: image || ''
    });

    const populatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'role', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/posts/:id/appreciate
// @desc    Toggle appreciation on a post
// @access  Private
router.post('/:id/appreciate', protect, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const alreadyAppreciated = post.appreciations.some(
      app => app.userId === req.user.id
    );

    if (alreadyAppreciated) {
      await post.removeAppreciation(req.user.id);
    } else {
      await post.addAppreciation(req.user.id);
    }

    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'role', 'avatar']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedPost
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/posts/:id/answer
// @desc    Add an answer to a post
// @access  Private
router.post('/:id/answer', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Answer text is required'
      });
    }

    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.addAnswer(req.user.id, text.trim());

    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'role', 'avatar']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Answer added successfully',
      data: updatedPost
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is post author or admin
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await post.destroy();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;