# 🎓 Misun Academy - Backend

> Robust, scalable Learning Management System (LMS) backend built with Node.js, Express, TypeScript, and MongoDB

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Deployment](#-deployment)

## ✨ Features

### 🔐 Authentication & Authorization

- **JWT-based Authentication** - Secure token-based auth
- **Role-based Access Control** - Multi-level permissions
- **HTTP-only Cookies** - Enhanced security
- **Password Hashing** - bcrypt encryption
- **Session Management** - Secure user sessions

### 📚 Course Management

- **CRUD Operations** - Complete course lifecycle
- **Module & Lesson Structure** - Organized content
- **Category Management** - Course categorization
- **Enrollment System** - Student course enrollment
- **Progress Tracking** - Monitor student advancement

### 📝 Assessment System

- **Quiz Creation** - Multiple-choice questions
- **Automatic Grading** - Instant score calculation
- **Assignment Management** - Create and review assignments
- **Submission Handling** - Text and file link submissions
- **Feedback System** - Instructor feedback on submissions

### 💬 Real-time Features

- **Live Chat** - Socket.IO powered messaging
- **Support System** - Student-instructor communication
- **Notifications** - Real-time updates
- **Message History** - Persistent chat records

### 📊 Analytics & Reporting

- **User Statistics** - Comprehensive user metrics
- **Course Analytics** - Enrollment and completion data
- **Performance Tracking** - Student progress insights
- **Dashboard Data** - Admin analytics

## 🛠 Tech Stack

| Technology     | Purpose                       |
| -------------- | ----------------------------- |
| **Node.js**    | Runtime Environment           |
| **Express.js** | Web Framework                 |
| **TypeScript** | Type Safety                   |
| **MongoDB**    | Database                      |
| **Mongoose**   | ODM                           |
| **Socket.IO**  | Real-time Communication       |
| **JWT**        | Authentication                |
| **bcrypt**     | Password Hashing              |
| **Cloudinary** | Image Storage                 |
| **Nodemailer** | Email Service                 |
| **CORS**       | Cross-Origin Resource Sharing |

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 16.x
npm >= 8.x
MongoDB >= 6.x
```

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/wahid1099/CourseMaster-Backend.git
cd CourseMaster-Backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
# Create .env file in root directory
cp .env.example .env
```

4. **Start MongoDB**

```bash
# Make sure MongoDB is running
mongod
```

5. **Start development server**

```bash
npm run dev
```

The server will be available at `http://localhost:5000`

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── cloudinary.ts
│   │   └── database.ts
│   ├── controllers/     # Route controllers
│   │   ├── assignment.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── course.controller.ts
│   │   ├── enrollment.controller.ts
│   │   ├── quiz.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/      # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── models/          # Mongoose models
│   │   ├── Assignment.model.ts
│   │   ├── Chat.model.ts
│   │   ├── Course.model.ts
│   │   ├── Enrollment.model.ts
│   │   ├── Quiz.model.ts
│   │   ├── QuizResult.model.ts
│   │   └── User.model.ts
│   ├── routes/          # API routes
│   │   ├── assignment.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── course.routes.ts
│   │   ├── enrollment.routes.ts
│   │   ├── quiz.routes.ts
│   │   └── user.routes.ts
│   ├── services/        # Business logic
│   │   ├── email.service.ts
│   │   └── socket.service.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── AppError.ts
│   │   └── asyncHandler.ts
│   └── server.ts        # Entry point
├── .env                 # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json        # TypeScript config
└── README.md
```

## 📚 API Documentation

### Base URL

```
Production: https://course-master-backend-chi.vercel.app/api
Development: http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint         | Description       | Auth Required |
| ------ | ---------------- | ----------------- | ------------- |
| POST   | `/auth/register` | Register new user | ❌            |
| POST   | `/auth/login`    | User login        | ❌            |
| POST   | `/auth/logout`   | User logout       | ✅            |
| GET    | `/auth/me`       | Get current user  | ✅            |

### Course Endpoints

| Method | Endpoint              | Description      | Auth Required         |
| ------ | --------------------- | ---------------- | --------------------- |
| GET    | `/courses`            | Get all courses  | ❌                    |
| GET    | `/courses/:id`        | Get course by ID | ❌                    |
| POST   | `/courses`            | Create course    | ✅ (Admin/Instructor) |
| PUT    | `/courses/:id`        | Update course    | ✅ (Admin/Instructor) |
| DELETE | `/courses/:id`        | Delete course    | ✅ (Admin)            |
| GET    | `/courses/categories` | Get categories   | ❌                    |

### Quiz Endpoints

| Method | Endpoint                    | Description        | Auth Required         |
| ------ | --------------------------- | ------------------ | --------------------- |
| GET    | `/quizzes/course/:courseId` | Get course quizzes | ✅                    |
| GET    | `/quizzes/:id`              | Get quiz by ID     | ✅                    |
| POST   | `/quizzes`                  | Create quiz        | ✅ (Admin/Instructor) |
| POST   | `/quizzes/:id/submit`       | Submit quiz        | ✅ (Student)          |
| GET    | `/quizzes/history`          | Get quiz history   | ✅ (Student)          |

### Assignment Endpoints

| Method | Endpoint                  | Description       | Auth Required   |
| ------ | ------------------------- | ----------------- | --------------- |
| GET    | `/assignments`            | Get assignments   | ✅              |
| POST   | `/assignments`            | Submit assignment | ✅ (Student)    |
| PUT    | `/assignments/:id/review` | Review assignment | ✅ (Instructor) |

### Enrollment Endpoints

| Method | Endpoint                    | Description      | Auth Required |
| ------ | --------------------------- | ---------------- | ------------- |
| POST   | `/student/enroll/:courseId` | Enroll in course | ✅ (Student)  |
| GET    | `/student/enrollments`      | Get enrollments  | ✅ (Student)  |
| PUT    | `/student/progress`         | Update progress  | ✅ (Student)  |

### User Management Endpoints

| Method | Endpoint            | Description         | Auth Required |
| ------ | ------------------- | ------------------- | ------------- |
| GET    | `/users`            | Get all users       | ✅ (Admin)    |
| GET    | `/users/stats`      | Get user statistics | ✅ (Admin)    |
| PUT    | `/users/:id`        | Update user         | ✅ (Admin)    |
| DELETE | `/users/:id`        | Delete user         | ✅ (Admin)    |
| PUT    | `/users/:id/status` | Toggle user status  | ✅ (Admin)    |

### Chat Endpoints

| Method | Endpoint                | Description        | Auth Required |
| ------ | ----------------------- | ------------------ | ------------- |
| GET    | `/chat/recent`          | Get recent chats   | ✅            |
| GET    | `/chat/history/:userId` | Get chat history   | ✅            |
| PUT    | `/chat/read/:userId`    | Mark as read       | ✅            |
| GET    | `/chat/support-agents`  | Get support agents | ✅            |

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/misun-academy
# Or MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/misun-academy

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:5173
# Production
# FRONTEND_URL=https://your-frontend-domain.com

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Admin Credentials
ADMIN_KEY=your-admin-registration-key
```

## 🗄 Database Schema

### User Model

```typescript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['student', 'instructor', 'teacher', 'admin', 'moderator'],
  avatar: String,
  bio: String,
  phone: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Course Model

```typescript
{
  title: String,
  description: String,
  instructor: String,
  category: String,
  price: Number,
  thumbnail: String,
  modules: [{
    title: String,
    description: String,
    lessons: [{
      title: String,
      content: String,
      videoUrl: String,
      duration: Number
    }]
  }],
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Quiz Model

```typescript
{
  course: ObjectId (Course),
  title: String,
  moduleIndex: Number,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number
  }],
  passingScore: Number,
  timeLimit: Number,
  createdBy: ObjectId (User),
  createdAt: Date
}
```

### Assignment Model

```typescript
{
  student: ObjectId (User),
  course: ObjectId (Course),
  title: String,
  description: String,
  moduleIndex: Number,
  submission: {
    answer: String,
    submittedAt: Date
  },
  review: {
    feedback: String,
    reviewedAt: Date,
    reviewedBy: ObjectId (User)
  },
  status: Enum ['pending', 'submitted', 'reviewed'],
  createdBy: ObjectId (User)
}
```

## 🔒 Authentication

### JWT Token Flow

1. **Registration/Login**

   - User provides credentials
   - Server validates and creates JWT
   - Token sent as HTTP-only cookie

2. **Protected Routes**

   - Client sends request with cookie
   - Middleware verifies JWT
   - Request proceeds if valid

3. **Role-based Access**
   - Middleware checks user role
   - Grants/denies access based on permissions

### Password Security

- Passwords hashed with bcrypt (10 rounds)
- Never stored in plain text
- Secure password reset flow

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Configure vercel.json**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ]
}
```

3. **Deploy**

```bash
vercel
```

### Other Deployment Options

- **Heroku**
- **AWS EC2**
- **DigitalOcean**
- **Railway**

## 📜 Available Scripts

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start development server with nodemon |
| `npm run build` | Compile TypeScript to JavaScript      |
| `npm start`     | Start production server               |
| `npm run lint`  | Run ESLint                            |
| `npm test`      | Run tests (when implemented)          |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔧 Error Handling

The API uses a centralized error handling system:

- **AppError Class** - Custom error class
- **Error Middleware** - Catches and formats errors
- **Async Handler** - Wraps async routes

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## 📊 Logging

- **Development**: Console logging with colors
- **Production**: File-based logging (when implemented)
- **Error Tracking**: Sentry integration (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 Code Style

- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Write meaningful commit messages
- Add JSDoc comments for functions

## 🐛 Known Issues

- None currently reported

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Wahid**

- GitHub: [@wahid1099](https://github.com/wahid1099)

## 🙏 Acknowledgments

- Express.js team
- MongoDB team
- Socket.IO team
- All contributors

---

**Made with ❤️ for education**
