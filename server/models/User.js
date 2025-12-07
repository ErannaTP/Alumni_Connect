const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

class User extends Model {
  // Hash password before saving
  async hashPassword() {
    if (this.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Compare password method
  async comparePassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // Update rating for alumni
  async updateRating(newRating) {
    const totalRating = (this.rating * this.ratingCount) + newRating;
    this.ratingCount += 1;
    this.rating = totalRating / this.ratingCount;
    return await this.save();
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a name' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email' },
      notEmpty: { msg: 'Please provide an email' }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6],
        msg: 'Password must be at least 6 characters'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('student', 'alumni', 'admin'),
    allowNull: false
  },
  // Student specific fields
  branch: {
    type: DataTypes.STRING
  },
  year: {
    type: DataTypes.STRING
  },
  domain: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  // Alumni specific fields
  batch: {
    type: DataTypes.STRING
  },
  currentRole: {
    type: DataTypes.STRING
  },
  company: {
    type: DataTypes.STRING
  },
  bio: {
    type: DataTypes.TEXT
  },
  linkedin: {
    type: DataTypes.STRING
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  domains: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  achievements: {
    type: DataTypes.TEXT
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  // Admin specific fields
  department: {
    type: DataTypes.STRING
  },
  permissions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  // Common fields
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpire: {
    type: DataTypes.DATE
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
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      await user.hashPassword();
    },
    beforeUpdate: async (user) => {
      user.updatedAt = new Date();
    }
  }
});

module.exports = User;