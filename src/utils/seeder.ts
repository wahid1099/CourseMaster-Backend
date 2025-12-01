import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Course from '../models/Course.model';

dotenv.config();

const seedData = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coursemaster');
    console.log('✅ MongoDB connected');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@coursemaster.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin'
    });
    console.log('✅ Admin user created');

    // Create sample courses
    const courses = await Course.create([
      {
        title: 'Complete Web Development Bootcamp',
        description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch. Build real-world projects and become a full-stack developer.',
        instructor: 'John Doe',
        price: 99.99,
        category: 'Web Development',
        tags: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
        modules: [
          {
            title: 'Introduction to Web Development',
            description: 'Learn the basics of web development',
            order: 1,
            lessons: [
              {
                title: 'What is Web Development?',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 15,
                order: 1
              },
              {
                title: 'Setting Up Your Environment',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 20,
                order: 2
              }
            ]
          },
          {
            title: 'HTML & CSS Fundamentals',
            description: 'Master HTML and CSS',
            order: 2,
            lessons: [
              {
                title: 'HTML Basics',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 30,
                order: 1
              },
              {
                title: 'CSS Styling',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 35,
                order: 2
              }
            ]
          }
        ],
        batch: {
          name: 'Batch 1',
          startDate: new Date('2024-01-01')
        },
        isPublished: true
      },
      {
        title: 'Data Science with Python',
        description: 'Master data analysis, visualization, and machine learning with Python. Work with real datasets and build predictive models.',
        instructor: 'Jane Smith',
        price: 149.99,
        category: 'Data Science',
        tags: ['Python', 'Machine Learning', 'Data Analysis'],
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        modules: [
          {
            title: 'Python Fundamentals',
            description: 'Learn Python programming basics',
            order: 1,
            lessons: [
              {
                title: 'Introduction to Python',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 25,
                order: 1
              }
            ]
          }
        ],
        batch: {
          name: 'Batch 1',
          startDate: new Date('2024-02-01')
        },
        isPublished: true
      },
      {
        title: 'UI/UX Design Masterclass',
        description: 'Learn user interface and user experience design principles. Create beautiful and functional designs using Figma.',
        instructor: 'Mike Johnson',
        price: 79.99,
        category: 'Design',
        tags: ['UI/UX', 'Figma', 'Design'],
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
        modules: [
          {
            title: 'Design Fundamentals',
            description: 'Learn the basics of UI/UX design',
            order: 1,
            lessons: [
              {
                title: 'What is UI/UX?',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 20,
                order: 1
              }
            ]
          }
        ],
        batch: {
          name: 'Batch 1',
          startDate: new Date('2024-03-01')
        },
        isPublished: true
      }
    ]);

    console.log(`✅ Created ${courses.length} sample courses`);
    console.log('\n📝 Admin Credentials:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log(`Admin Key: ${process.env.ADMIN_KEY || 'MISUN_ADMIN_2024'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
