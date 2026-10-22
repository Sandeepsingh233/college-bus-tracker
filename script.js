// ==========================================
// FIREBASE CONFIGURATION (Yahan apni Firebase keys daal sakte hain)
// ==========================================
// ==========================================
// FIREBASE CONFIGURATION (Yahan apni keys daal di gayi hain)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBU19BamXpJwbwz9MG1DOiHoTHZwwhwJAQ",
  authDomain: "college-live-bus.firebaseapp.com",
  databaseURL: "https://college-live-bus-default-rtdb.firebaseio.com",
  projectId: "college-live-bus",
  storageBucket: "college-live-bus.appspot.com",
  messagingSenderId: "246758857454",
  appId: "1:246758857454:web:666989b70e7b3a34931ff",
  measurementId: "G-JVK58D6G1Y"
};

// Initialize Firebase (Ye line script.js mein pehle se hogi, bas config replace karna hai)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
// Global Variables
let currentUser = null;
let map = null;
let busMarker = null;
let watchId = null;

// Quick Demo Autofill Helper
function quickFill(role, user, pass) {
  document.getElementById('loginRole').value = role;
  document.getElementById('loginUsername').value = user;
  document.getElementById('loginPassword').value = pass;
}

// Login System
function handleLogin(event) {
  event.preventDefault();
  const role = document.getElementById('loginRole').value;
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  // Default Demo Accounts bypass
  if (username === "admin" && password === "admin123" && role === "admin") {
    loginSuccess({ username: "admin", role: "admin", assignedRoute: "All" });
    return;
  }
  if (username === "student_01" && password === "pass123" && role === "student") {
    loginSuccess({ username: "student_01", role: "student", assignedRoute: "Route-A" });
    return;
  }
  if (username === "driver_01" && password === "driver123" && role === "driver") {
    loginSuccess({ username: "driver_01", role: "driver", assignedRoute: "Route-A" });
    return;
  }

  // Database check
  db.ref('users/' + username).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.password === password && userData.role === role) {
          loginSuccess(userData);
        } else {
          alert("Galat Password ya Role chuna gaya hai!");
        }
      } else {
        alert("Yeh User ID Database mein nahi mili!");
      }
    })
    .catch((err) => alert("Login Error: " + err.message));
}

function loginSuccess(userData) {
  currentUser = userData;
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('userBadgeArea').classList.remove('hidden');
  document.getElementById('userRoleBadge').innerText = userData.role;

  if (userData.role === 'student') {
    document.getElementById('studentDashboard').classList.remove('hidden');
    document.getElementById('assignedRouteName').innerText = userData.assignedRoute;
    initStudentMap();
    listenToBusLocation(userData.assignedRoute);
  } else if (userData.role === 'driver') {
    document.getElementById('driverDashboard').classList.remove('hidden');
    document.getElementById('driverAssignedRoute').innerText = userData.assignedRoute;
  } else if (userData.role === 'admin') {
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadAdminUserTable();
  }
}

function logout() {
  currentUser = null;
  if (watchId) navigator.geolocation.clearWatch(watchId);
  window.location.reload();
}

// Admin Panel Functions
function adminCreateUser() {
  const role = document.getElementById('adminNewRole').value;
  const username = document.getElementById('adminNewUser').value.trim();
  const password = document.getElementById('adminNewPass').value.trim();
  const route = document.getElementById('adminNewRoute').value;

  if (!username || !password) {
    alert("Kripya Username aur Password dono bharein!");
    return;
  }

  db.ref('users/' + username).set({
    username: username,
    password: password,
    role: role,
    assignedRoute: route
  }).then(() => {
    alert(`Success! ${role.toUpperCase()} (${username}) create ho gaya hai.`);
    document.getElementById('adminNewUser').value = '';
    document.getElementById('adminNewPass').value = '';
    loadAdminUserTable();
  }).catch(err => alert("Error: " + err.message));
}

function loadAdminUserTable() {
  db.ref('users').on('value', (snapshot) => {
    const tbody = document.getElementById('adminUserTableBody');
    tbody.innerHTML = '';
    if (!snapshot.exists()) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-slate-400">No users found.</td></tr>`;
      return;
    }
    snapshot.forEach((childSnap) => {
      const user = childSnap.val();
      tbody.innerHTML += `
        <tr class="border-b hover:bg-slate-50">
          <td class="p-2 font-bold">${user.username}</td>
          <td class="p-2 uppercase text-xs"><span class="px-2 py-0.5 rounded bg-slate-200">${user.role}</span></td>
          <td class="p-2">${user.assignedRoute || 'N/A'}</td>
          <td class="p-2"><button onclick="deleteUser('${user.username}')" class="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button></td>
        </tr>
      `;
    });
  });
}

function deleteUser(username) {
  if (confirm(`Kya aap ${username} ko delete karna chahte hain?`)) {
    db.ref('users/' + username).remove().then(() => alert("Deleted successfully!"));
  }
}

// Driver GPS Broadcasting
function toggleDriverGpsBroadcasting() {
  const btn = document.getElementById('toggleGpsBtn');
  const statusTxt = document.getElementById('driverBroadcastStatus');

  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    btn.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> Start Broadcast`;
    btn.className = "bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow transition flex items-center gap-2";
    statusTxt.innerText = "OFFLINE";
    statusTxt.className = "text-amber-400";
    return;
  }

  if (!navigator.geolocation) {
    alert("Aapka browser Geolocation support nahi karta!");
    return;
  }

  btn.innerHTML = `<i class="fa-solid fa-circle-stop"></i> Stop Broadcast`;
  btn.className = "bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow transition flex items-center gap-2";
  statusTxt.innerText = "LIVE & BROADCASTING";
  statusTxt.className = "text-emerald-400 animate-pulse";

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const speed = position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) : 0;
      const timestamp = new Date().toLocaleTimeString();

      document.getElementById('telemetryLat').innerText = lat.toFixed(5);
      document.getElementById('telemetryLng').innerText = lng.toFixed(5);
      document.getElementById('telemetrySpeed').innerText = speed + " km/h";
      document.getElementById('telemetryTime').innerText = timestamp;

      db.ref('liveBuses/' + currentUser.assignedRoute).set({
        latitude: lat,
        longitude: lng,
        speed: speed,
        driver: currentUser.username,
        updatedAt: timestamp
      });
    },
    (error) => alert("GPS Error: " + error.message),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
  );
}

// Student Leaflet Map Tracking
function initStudentMap() {
  if (map) return;
  map = L.map('map').setView([28.6139, 77.2090], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
}

function refreshMapLocation() {
  if (map && busMarker) {
    map.setView(busMarker.getLatLng(), 16);
  }
}

function listenToBusLocation(route) {
  db.ref('liveBuses/' + route).on('value', (snapshot) => {
    if (!snapshot.exists()) {
      document.getElementById('studentBusStatus').innerText = "Bus offline / Signal waiting...";
      return;
    }

    const data = snapshot.val();
    const lat = data.latitude;
    const lng = data.longitude;
    const speed = data.speed;

    document.getElementById('studentBusStatus').innerText = "Connected (Live)";
    document.getElementById('studentBusSpeed').innerText = speed + " km/h";

    const latLng = [lat, lng];

    if (!busMarker) {
      const busIcon = L.divIcon({
        className: 'custom-bus-icon',
        html: `<div style="background:#4f46e5;color:white;padding:8px 12px;border-radius:20px;font-weight:bold;box-shadow:0 4px 6px rgba(0,0,0,0.3);display:flex;align-items:center;gap:6px;"><i class="fa-solid fa-bus"></i> ${route}</div>`,
        iconSize: [90, 40],
        iconAnchor: [45, 20]
      });
      busMarker = L.marker(latLng, { icon: busIcon }).addTo(map);
      map.setView(latLng, 15);
    } else {
      busMarker.setLatLng(latLng);
    }
  });
}