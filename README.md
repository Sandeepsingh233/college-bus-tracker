# 🚌 Real-Time College Bus Tracking & Fleet Management Portal

A full-stack, real-time web application built for educational institutions to streamline college transport logistics, student safety, and daily attendance tracking. 

The system features multi-role role-based access control (**Admin**, **Driver**, and **Student**), live geolocation broadcasting, route-based map filtering, emergency alert triggers, and structured UI/UX design themes.

---

## 🌟 Key Features & Role Specifications

### 👨‍💼 1. Admin Control Panel *(Theme: High-Contrast Black & Neon Blue)*
* **Multi-Bus Live Fleet Overview:** Tracks all actively broadcasting college buses on a single interactive Leaflet map using real-time Firebase syncing.
* **Instant ID Search & Lookup:** Dedicated search module allowing admins to retrieve full profile details (Route, Course, Assigned Bus, Reg. Number, Contact details) for any **Student ID** or **Driver ID**.
* **Active Fleet Control & Force Stop:** Allows administrators to remotely terminate a driver's live GPS broadcast node if the driver forgets to turn off location sharing upon completing their route.
* **Daily Attendance Management:** Real-time logging of daily driver and student attendance with date-filtering capabilities.
* **Emergency Broadcast Monitor:** Receives instantaneous, high-priority emergency alerts triggered by drivers in distress.
* **Account Onboarding & Route Allocation:** Admin interface to dynamically create and delete driver/student credentials along with custom metadata (Student ID, Course, Driver ID, Bus Number, Vehicle Registration No., and Assigned Route).

### 🚍 2. Driver Interface *(Theme: Minimalist Uber-Style Minimal Dark)*
* **One-Touch GPS Broadcast:** Live geolocation tracking that captures real-time latitude, longitude, and movement speed using the HTML5 Geolocation API.
* **Vehicle Spec Card:** Displays assigned Driver ID, Vehicle Bus Number, and designated route.
* **Daily Attendance Marker:** Allows drivers to mark today's attendance with real-time database validation.
* **Panic / Emergency Button:** Instant SOS trigger that broadcasts an urgent notification to the Admin Control Panel during breakdowns or emergencies.

### 🎓 3. Student Interface *(Theme: 70-20-10 Dark Navy & Electric Blue)*
* **Allocated Route Filtering:** The live tracking map dynamically filters and displays **only** the bus assigned to the student's specific route, keeping the map focused and clean.
* **Estimated Arrival Time (ETA):** Live arrival estimates based on active bus telemetry and tracking status.
* **Historical Attendance Tracker:** Displays today's attendance status alongside a complete historical log of past attendance records.
* **System Warning Banners:** Live noticeboard that displays urgent administrative warnings or delay announcements.

---

## 🛠️ Tech Stack & Architecture

* **Frontend Framework:** HTML5, Tailwind CSS, JavaScript (ES6+ Vanilla)
* **Interactive Mapping:** [Leaflet.js](https://leafletjs.org/) + OpenStreetMap API
* **Backend Database:** Firebase Realtime Database (NoSQL WebSocket Sync)
* **Geolocation Engine:** Browser Geolocation API (`navigator.geolocation.watchPosition`)
* **Deployment & Hosting:** Vercel / GitHub Pages

---

## 🔒 Security & Privacy Notice

To adhere to web security best practices:
* **Firebase Configuration Secrets:** Production API keys and database references should be secured via environment variables or restricted domain referrers in your Firebase Console.
* **Admin Credentials:** Hardcoded administrative login credentials have been removed from public display. Please consult your institution's system administrator for root access setup.

---

## 🚀 Installation & Local Development

### Prerequisites
* A web browser supporting ES6 JavaScript and HTML5 Geolocation (Chrome, Safari, Firefox, Edge).
* A Firebase project with a **Realtime Database** instance initialized.

### Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/YOUR_GITHUB_USERNAME/college-bus-tracker.git](https://github.com/YOUR_GITHUB_USERNAME/college-bus-tracker.git)
   cd college-bus-tracker
