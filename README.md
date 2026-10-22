# SkillSphere 🎓

**A MERN Stack Learning Management Platform**

SkillSphere is a web-based learning management platform designed to help students explore courses, enroll in learning programs, track their progress, and earn certificates. It also provides administrative tools to manage courses, students, and platform activities.

## ✨ Features

### 👨‍🎓 Student Features
- User registration and login
- Browse courses and view course details
- Enroll in courses
- Access lessons and learning content
- Track course progress
- View and earn course completion certificates
- Manage student profile
- Review courses and view notifications

### 🛠️ Admin Features
- Admin dashboard and analytics
- Course management
- Student management
- Enrollment monitoring
- Lesson management
- Announcement management
- Review management

## 🧰 Tech Stack

- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT-based authentication
- **Icons and charts:** Lucide React and Recharts

## 📁 Project Structure

```text
SkillSphere/
├── client/          # React frontend
├── server/          # Express backend and API
├── .gitignore
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Shahid-Ansari26/SkillSphere.git
cd SkillSphere
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory and configure the environment variables required by your backend, such as the server port, MongoDB connection string, and JWT secret.

**Never commit your `.env` file or expose your secrets publicly.**

Start the backend using the development script configured in `server/package.json`, for example:

```bash
npm run dev
```

### 3. Set up the frontend

Open a separate terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## 🔐 Security

- Environment variables are stored in a local `.env` file.
- Authentication protects routes and restricted operations.
- Administrative features require appropriate authorization.

## 📸 Screenshots

Screenshots of the homepage, course details, student dashboard, and admin dashboard can be added here.

## 🚀 Future Enhancements

- Improve the responsive experience across devices
- Add more courses and learning resources
- Enhance analytics and reporting
- Deploy the frontend and backend for public access

## 👨‍💻 Author

**Shahid Ansari**

Computer Science Engineering — Artificial Intelligence and Machine Learning

## 📄 License

This project was developed for educational and portfolio purposes.
