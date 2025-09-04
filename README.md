# Todo App - React Native with Node.js & MongoDB

A comprehensive task management application built with React Native, TypeScript, jwt Authentication, and Node.js backend with MongoDB.

## Features

### Core Features
- User Registration & Authentication (Backend)
- Create, Read, Update, Delete tasks
- Task priorities (High, Medium, Low)
- Task status tracking (Pending, In Progress, Completed)
- Due dates 
- Task categories
- Offline functionality with local storage

### Advanced Features
- Smart sorting algorithm (priority + deadline + creation time)
- Task filtering and sorting options
- Dashboard with statistics
- Beautiful, modern UI design
- Real-time data synchronization
- Comprehensive error handling

##  Tech Stack

### Frontend (React Native)
- React Native 0.81.1
- TypeScript
- Redux Toolkit for state management
- React Navigation for routing
- AsyncStorage for offline data
- React Native Vector Icons
- React Native Date Picker

### Backend (Node.js)
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Input validation with express-validator
- CORS, Helmet for security

## Setup Instructions

### Prerequisites
- Node.js (v20+)
- React Native development environment
- MongoDB (local or Atlas)
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)



### 2. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community
brew services start mongodb-community
```

#### Option B: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Update `.env` file in backend

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Edit .env file with your settings:
# MONGODB_URI=mongodb://localhost:27017/todoapp
# OR for Atlas: mongodb+srv://username:password@cluster.mongodb.net/todoapp
# JWT_SECRET=your_super_secret_jwt_key_here
# PORT=3000

# Build and start the server
npm run build
npm run dev
```

The backend will run on `http://localhost:3000`

### 4. React Native App Setup

```bash
cd TodoApp

# Install dependencies (already done)
npm install



# Update API base URL in src/services/api.ts
# Change BASE_URL to your backend URL (use your computer's IP for device testing)
# For emulator: http://localhost:3000/api
# For device: http://YOUR_IP:3000/api

# Start Metro bundler
npm start

# Run on Android
npm run android


```

## App Architecture

### State Management
- **Redux Toolkit** for global state
- **AsyncStorage** for persistence
- **Optimistic updates** for better UX

### Navigation Structure
```
App
├── Auth Stack
│   ├── Login Screen
│   └── Register Screen
└── Main Tab Navigator
    ├── Dashboard (Statistics)
    ├── Tasks Stack
    │   ├── Task List
    │   ├── Create Task
    │   ├── Edit Task
    │   └── Task Detail
    └── Profile
```

### Backend API Structure
```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── GET /profile
│   └── PUT /profile
└── /tasks
    ├── GET / (with filtering & sorting)
    ├── POST /
    ├── GET /:id
    ├── PUT /:id
    ├── DELETE /:id
    ├── PATCH /:id/complete
    └── GET /stats
```



### Environment Variables
Backend uses `.env` file for configuration:
```env
MONGODB_URI=mongodb://localhost:27017/todoapp
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

##  Key Features Explained

### Smart Sorting Algorithm
The app includes an intelligent sorting system that considers:
- **Priority weight** (2x multiplier)
- **Urgency weight** (3x multiplier based on deadline proximity)
- **Age factor** (creation time)

### Offline Functionality
- Tasks are cached locally using AsyncStorage
- App works offline with cached data
- Automatic sync when connection is restored

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS and security headers
- Rate limiting (can be added)

##  Running the Complete App

1. **Start MongoDB** (if using local)
2. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Start React Native**:
   ```bash
   cd TodoApp
   npm start
   npm run android  # or npm run ios
   ```

## API Testing

You can test the backend API using tools like Postman or curl:

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

##  UI/UX Features

- **Modern Design**: Clean, intuitive interface
- **Color-coded Priorities**: Visual priority indicators
- **Status Badges**: Clear task status representation
- **Smooth Animations**: Enhanced user experience
- **Responsive Layout**: Works on different screen sizes








