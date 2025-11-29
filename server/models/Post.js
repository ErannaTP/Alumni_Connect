const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

class Post extends Model {
  // Add appreciation
  async addAppreciation(userId) {
    const appreciations = this.appreciations || [];
    const alreadyAppreciated = appreciations.some(
      app => app.userId === userId
    );
    
    if (!alreadyAppreciated) {
      appreciations.push({ userId, createdAt: new Date() });
      this.appreciations = appreciations;
      this.appreciationCount = appreciations.length;
    }
    return await this.save();
  }

  // Remove appreciation
  async removeAppreciation(userId) {
    const appreciations = this.appreciations || [];
    const filtered = appreciations.filter(
      app => app.userId !== userId
    );
    this.appreciations = filtered;
    this.appreciationCount = filtered.length;
    return await this.save();
  }

  // Add answer
  async addAnswer(userId, text) {
    const answers = this.answers || [];
    answers.push({ userId, text, createdAt: new Date() });
    this.answers = answers;
    this.answerCount = answers.length;
    return await this.save();
  }
}

Post.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a title' },
      len: {
        args: [0, 200],
        msg: 'Title cannot exceed 200 characters'
      }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide content' }
    }
  },
  domain: {
    type: DataTypes.ENUM(
      'Cybersecurity',
      'Data Science',
      'Artificial Intelligence',
      'Software Engineering',
      'Machine Learning',
      'Database Systems',
      'Web Development',
      'Mobile App Development',
      'Cloud Computing',
      'Networking',
      'General',
      'Success Story',
      'New Hiring Opportunity'
    ),
    allowNull: false
  },
  hashtags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  appreciations: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  appreciationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  answers: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  answerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isRecommended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Post',
  tableName: 'posts',
  timestamps: true,
  hooks: {
    beforeUpdate: (post) => {
      post.updatedAt = new Date();
    }
  }
});

// Associations
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });

module.exports = Post;