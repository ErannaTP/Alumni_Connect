const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

class Connection extends Model {}

Connection.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  alumniId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected'),
    defaultValue: 'Pending'
  },
  requestMessage: {
    type: DataTypes.TEXT
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
  modelName: 'Connection',
  tableName: 'connections',
  timestamps: true,
  hooks: {
    beforeUpdate: (connection) => {
      connection.updatedAt = new Date();
    }
  }
});

// Prevent duplicate connection requests - handled at application level
// Add unique constraint in database migration

// Associations
Connection.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Connection.belongsTo(User, { foreignKey: 'alumniId', as: 'alumni' });
User.hasMany(Connection, { foreignKey: 'studentId', as: 'studentConnections' });
User.hasMany(Connection, { foreignKey: 'alumniId', as: 'alumniConnections' });

module.exports = Connection;