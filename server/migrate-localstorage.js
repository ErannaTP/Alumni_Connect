/**
 * Migration Script: LocalStorage to PostgreSQL
 * This script helps migrate data from localStorage to PostgreSQL
 * 
 * Usage:
 * 1. Export your localStorage data to JSON files
 * 2. Place them in the same directory as this script
 * 3. Run: node server/migrate-localstorage.js
 */

const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');
const Connection = require('./models/Connection');
const Message = require('./models/Message');

// Load environment variables
dotenv.config();

// Connect to PostgreSQL
const { connectDB } = require('./config/database');

// Example: Migrate users from localStorage export
const migrateUsers = async (usersData) => {
  try {
    console.log('\n📤 Migrating Users...');
    
    for (const userData of usersData) {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Create new user
      const user = await User.create(userData);
      console.log(`✅ Migrated user: ${userData.email}`);
    }
    
    console.log('✅ User migration complete!');
  } catch (error) {
    console.error('❌ Error migrating users:', error.message);
  }
};

// Example: Migrate posts from localStorage export
const migratePosts = async (postsData) => {
  try {
    console.log('\n📤 Migrating Posts...');
    
    for (const postData of postsData) {
      const post = await Post.create(postData);
      console.log(`✅ Migrated post: ${post.title || post.id}`);
    }
    
    console.log('✅ Post migration complete!');
  } catch (error) {
    console.error('❌ Error migrating posts:', error.message);
  }
};

// Main migration function
const runMigration = async () => {
  await connectDB();
  
  console.log('\n=====================================');
  console.log('📦 LocalStorage to PostgreSQL Migration');
  console.log('=====================================\n');
  
  // OPTION 1: If you have JSON export files
  // Uncomment and modify these lines:
  /*
  const usersData = require('./exported-users.json');
  const postsData = require('./exported-posts.json');
  
  await migrateUsers(usersData);
  await migratePosts(postsData);
  */
  
  // OPTION 2: Create sample admin user
  console.log('Creating default admin user...');
  
  const adminExists = await User.findOne({ where: { email: 'etpatil62@gmail.com' } });
  
  if (!adminExists) {
    const admin = await User.create({
      name: 'KLE Admin',
      email: 'etpatil62@gmail.com',
      password: 'password',
      role: 'admin',
      department: 'IT',
      isActive: true,
      isVerified: true,
      permissions: ['manage_users', 'manage_posts', 'view_analytics']
    });
    
    console.log('✅ Admin user created: etpatil62@gmail.com');
  } else {
    console.log('⚠️  Admin user already exists');
  }
  
  // Get stats
  const userCount = await User.count();
  const postCount = await Post.count();
  const connectionCount = await Connection.count();
  const messageCount = await Message.count();
  
  console.log('\n=====================================');
  console.log('📊 Database Statistics:');
  console.log('=====================================');
  console.log(`Users:       ${userCount}`);
  console.log(`Posts:       ${postCount}`);
  console.log(`Connections: ${connectionCount}`);
  console.log(`Messages:    ${messageCount}`);
  console.log('=====================================\n');
  
  console.log('✅ Migration completed successfully!');
  console.log('\n💡 Next Steps:');
  console.log('1. Update your frontend to use API calls (api.js)');
  console.log('2. Remove localStorage dependencies');
  console.log('3. Test user login and registration');
  console.log('4. Deploy to production!\n');
  
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

// Run migration
runMigration();