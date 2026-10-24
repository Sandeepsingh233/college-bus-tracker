🚌 College Bus Tracking & Attendance System

A modern, web-based fleet monitoring and attendance management system built for educational institutions. The platform connects Admins, Drivers, and Students through real-time GPS tracking, automated distance proximity alerts, manual route stop arrival triggers, and automated attendance logging using Firebase Realtime Database.

🌟 Key Features

👑 Admin Control Panel

Live Fleet Overview: Real-time multi-bus live mapping via Leaflet.js and OpenStreetMap.

User Management: Dynamic creation, management, and deletion of Driver and Student accounts.

Data Integrity & Cleanup: Automatic cascading deletion of historical student attendance records upon account termination.

Force Session Override: Emergency administrative power to terminate active broadcast sessions for any bus.

Notice Board & Emergency Monitoring: Send college-wide announcements and view instant emergency panic triggers.

🚘 Driver Portal (Uber-Style Interface)

One-Tap GPS Broadcast: Continuous live location broadcasting utilizing browser Geolocation.watchPosition with dynamic speed calculation.

Interactive Route Checklist: Clickable schedule list for manual stop updates during transit.

Stop Arrival Announcements: Direct arrival notification triggers sent to students on assigned routes.

Attendance Logging: Daily driver login tracking along with student attendance management (Present / Absent).

Panic / SOS Button: Dedicated emergency alert sender connected directly to the Admin Dashboard.

🎓 Student Dashboard

Real-Time Interactive Map: Live tracking of assigned college buses.

Automated Audio & Visual Alerts: Native Web Audio API tone generator (800Hz beep sequence) activated upon:

Entering a 1.5 km proximity radius of the student's live location.

Driver announcing arrival at a designated route stop.

Driver Contact Card: Direct contact information and quick-call action for assigned drivers.

Personal Attendance History: Real-time log of daily transit attendance status.

🛠️ Tech Stack & Dependencies

Frontend: HTML5, Tailwind CSS (CDN), JavaScript (ES6+ Native APIs)

Mapping Framework: Leaflet.js with OpenStreetMap Tiles

Audio Engine: Browser-native AudioContext Web Audio API

Backend & Database: Firebase Realtime Database

Deployment & Hosting: Git, GitHub, hosted on Vercel / Netlify

🗄️ Database Schema (Firebase Realtime Database)

{
  "users": {
    "drivers": {
      "driver_username": {
        "name": "Driver Name",
        "driverId": "DRV-101",
        "busNumber": "BUS-05",
        "phone": "+91 9876543210",
        "route": "Route 12",
        "schedule": "07:30 AM - Main Gate\n07:50 AM - City Center"
      }
    },
    "students": {
      "student_username": {
        "name": "Student Name",
        "studentId": "STU-501",
        "course": "B.Tech CS",
        "route": "Route 12",
        "pickupStop": "City Center"
      }
    }
  },
  "liveBus": {
    "buses": {
      "driver_username": {
        "lat": 28.6139,
        "lng": 77.2090,
        "speed": 12.4,
        "busNumber": "BUS-05",
        "route": "Route 12"
      }
    },
    "stopArrivals": {
      "Route 12": {
        "stopName": "City Center",
        "timestamp": 1700000000000
      }
    }
  },
  "attendance": {
    "students": {
      "2026-10-24": {
        "student_username": {
          "status": "Present",
          "markedByDriver": "driver_username"
        }
      }
    }
  }
}


🚀 Installation & Local Development

Clone the Repository:

git clone https://github.com/your-username/college-bus-tracker.git
cd college-bus-tracker


File Hierarchy Setup:
Ensure your local project workspace includes the following structure:

├── index.html   # Main single-page application interface
├── style.css    # Custom glassmorphism, UI styling, and map adjustments
├── script.js    # Firebase initialization, Geolocation API, and UI logic
└── README.md    # Documentation file


Database Configuration:
Insert your Firebase Realtime Database credentials into script.js:

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};


Execution:
Launch index.html directly using Visual Studio Code's Live Server extension or open it in any modern browser.

🔐 Security & Deployment Requirements

HTTPS Enforcement: Modern mobile browsers require a secure HTTPS context to expose navigator.geolocation permissions. Deploying via Vercel, Netlify, or GitHub Pages provides secure HTTPS endpoints out of the box.

Firebase Rules Setup: Implement read/write permissions tailored to authenticated roles for production environments.
