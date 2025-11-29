const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');

// Load environment variables
dotenv.config();

// Import database configuration
const { connectDB, sequelize } = require('./config/database');

// PostgreSQL Connection
connectDB();

// Sample seed data
const seedUsers = async () => {
  try {
    // Clear existing data
    await sequelize.sync({ force: true });
    console.log('🗑️  Cleared existing data and recreated tables');

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@kle.edu',
      password: 'admin123',
      role: 'admin',
      department: 'Administration',
      isVerified: true
    });
    console.log('✅ Admin created:', admin.email);

    // Create Alumni
    const alumni = [
      {
        name: 'Kritik Patel',
        email: 'kritik.p@alumni.kle.edu',
        password: 'alumni123',
        role: 'alumni',
        batch: '2023',
        currentRole: 'Data Analyst',
        company: 'TechCorp Solutions',
        domain: 'Data Science',
        domains: ['Data Science', 'Machine Learning'],
        bio: 'Data enthusiast & mentor with 3 years of industry experience',
        rating: 4.8,
        ratingCount: 25,
        linkedin: 'https://linkedin.com/in/kritikp',
        skills: ['Python', 'SQL', 'Tableau', 'Machine Learning'],
        achievements: 'Published 2 research papers on predictive analytics',
        isVerified: true
      },
      {
        name: 'Swapnil Thorat',
        email: 'swapnil.t@alumni.kle.edu',
        password: 'alumni123',
        role: 'alumni',
        batch: '2021',
        currentRole: 'Software Engineer',
        company: 'Microsoft',
        domain: 'Web Development',
        domains: ['Web Development', 'Cloud Computing'],
        bio: 'Full-stack developer passionate about scalable applications',
        rating: 4.6,
        ratingCount: 18,
        linkedin: 'https://linkedin.com/in/swapnilt',
        skills: ['React', 'Node.js', 'Azure', 'MongoDB'],
        achievements: 'Led development of 3 major cloud-based applications',
        isVerified: true
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha.r@alumni.kle.edu',
        password: 'alumni123',
        role: 'alumni',
        batch: '2020',
        currentRole: 'Security Analyst',
        company: 'CyberGuard Inc',
        domain: 'Cybersecurity',
        domains: ['Cybersecurity', 'Networking'],
        bio: 'Security specialist with CEH certification',
        rating: 4.9,
        ratingCount: 30,
        linkedin: 'https://linkedin.com/in/snehar',
        skills: ['Penetration Testing', 'Ethical Hacking', 'Cloud Security'],
        achievements: 'CEH Certified, Presented at 2 international security conferences',
        isVerified: true
      }
    ];

    const createdAlumni = [];
    for (const alum of alumni) {
      const created = await User.create(alum);
      createdAlumni.push(created);
    }
    console.log(`✅ Created ${createdAlumni.length} alumni users`);

    // Create Students
    const students = [
      {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@students.kle.edu',
        password: 'student123',
        role: 'student',
        branch: 'CSE',
        year: '2024',
        domain: 'Data Science',
        description: 'Aspiring data scientist interested in AI/ML',
        isVerified: true
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@students.kle.edu',
        password: 'student123',
        role: 'student',
        branch: 'IT',
        year: '2025',
        domain: 'Web Development',
        description: 'Full-stack development enthusiast',
        isVerified: true
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan.gupta@students.kle.edu',
        password: 'student123',
        role: 'student',
        branch: 'CSE',
        year: '2024',
        domain: 'Cybersecurity',
        description: 'Passionate about network security and ethical hacking',
        isVerified: true
      }
    ];

    const createdStudents = [];
    for (const student of students) {
      const created = await User.create(student);
      createdStudents.push(created);
    }
    console.log(`✅ Created ${createdStudents.length} student users`);

    // Create sample posts
    const posts = [
      {
        authorId: createdAlumni[0].id,
        title: 'How to break into Data Science in 2024',
        content: 'Data Science is an exciting field with lots of opportunities. Here are my top tips for students looking to enter this field...',
        domain: 'Data Science',
        hashtags: ['DataScience', 'Career', 'Tech'],
        appreciationCount: 15
      },
      {
        authorId: createdAlumni[2].id,
        title: 'Cybersecurity Best Practices Every Developer Should Know',
        content: 'Security should never be an afterthought. Here are essential practices every developer must follow...',
        domain: 'Cybersecurity',
        hashtags: ['Security', 'Development', 'BestPractices'],
        appreciationCount: 22
      },
      {
        authorId: createdAlumni[1].id,
        title: 'My Journey to Microsoft - A Success Story',
        content: 'It wasn\'t an easy journey, but with persistence and the right guidance, I landed my dream job at Microsoft. Here\'s how...',
        domain: 'Success Story',
        hashtags: ['Success', 'Microsoft', 'Career'],
        appreciationCount: 35
      }
    ];

    const createdPosts = [];
    for (const post of posts) {
      const created = await Post.create(post);
      createdPosts.push(created);
    }
    console.log(`✅ Created ${createdPosts.length} sample posts`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@kle.edu');
    console.log('  Password: admin123');
    console.log('\nAlumni (Sample):');
    console.log('  Email: kritik.p@alumni.kle.edu');
    console.log('  Password: alumni123');
    console.log('\nStudent (Sample):');
    console.log('  Email: aarav.sharma@students.kle.edu');
    console.log('  Password: student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();