const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// PostgreSQL connection
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'kle_alumni_connect',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'postgres',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully.');
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };