const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

class Event extends Model {}

Event.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a title' },
      len: {
        args: [1, 200],
        msg: 'Title must be between 1 and 200 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a description' }
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'Please provide a valid date' }
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a location' }
    }
  },
  organizerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  attendees: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: []
  },
  maxAttendees: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  isVirtual: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  meetingLink: {
    type: DataTypes.STRING
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
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
  modelName: 'Event',
  tableName: 'events',
  timestamps: true,
  hooks: {
    beforeUpdate: (event) => {
      event.updatedAt = new Date();
    }
  }
});

// Associations
Event.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });
User.hasMany(Event, { foreignKey: 'organizerId', as: 'organizedEvents' });

module.exports = Event;