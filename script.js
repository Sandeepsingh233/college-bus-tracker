// ==========================================
// FIREBASE CONFIGURATION
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// ADMIN HARDCODED CREDENTIALS
// ==========================================
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "Sandeep09@" 
};

// ==========================================
// LOGIN HANDLER
// ==========================================
async function handleLogin(event) {
  if (event) event.preventDefault();

  const role = document.getElementById('roleSelect').value;
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  if (!username || !password) {
    alert("Kripya username aur password dono bharein!");
    return;
  }

  // 1. Admin Login Check
  if (role === "admin") {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      showDashboard("admin");
    } else {
      alert("Galat Admin credentials hain!");
    }
  } 
  // 2. Driver Login Check (Database se verify)
  else if (role === "driver") {
    const snapshot = await db.ref(`users/drivers/${username}`).once('value');
    const userData = snapshot.val();
    
    if (userData && userData.password === password) {
      showDashboard("driver", userData);
    } else {
      alert("Driver username ya password galat hai!");
    }
  } 
  // 3. Student Login Check (Database se verify)
  else if (role === "student") {
    const snapshot = await db.ref(`users/students/${username}`).once('value');
    const userData = snapshot.val();
    
    if (userData && userData.password === password) {
      showDashboard("student", userData);
    } else {
      alert("Student username ya password galat hai!");
    }
  }
}

// ==========================================
// DASHBOARD SWITCHER
// ==========================================
function showDashboard(role, userData = null) {
  // Hide Login Section
  const loginSection = document.getElementById('loginSection');
  if (loginSection) loginSection.style.display = 'none';

  // Show respective dashboard
  if (role === 'admin') {
    const adminDash = document.getElementById('adminDashboard');
    if (adminDash) adminDash.style.display = 'block';
    initAdminDashboard();
  } else if (role === 'driver') {
    const driverDash = document.getElementById('driverDashboard');
    if (driverDash) driverDash.style.display = 'block';
    initDriverDashboard(userData);
  } else if (role === 'student') {
    const studentDash = document.getElementById('studentDashboard');
    if (studentDash) studentDash.style.display = 'block';
    initStudentDashboard();
  }
}

// ==========================================
// ADMIN: ADD NEW USER (WITH ROUTE)
// ==========================================
function addNewUser(event) {
  if (event) event.preventDefault();

  const role = document.getElementById('newRole').value; // 'driver' ya 'student'
  const name = document.getElementById('newName').value.trim();
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const route = document.getElementById('newRoute').value.trim();

  if (!username || !password || !name || !route) {
    alert("Saari fields bharein!");
    return;
  }

  // Firebase Realtime Database mein save karna
  db.ref(`users/${role}s/${username}`).set({
    username: username,
    password: password,
    name: name,
    route: route,
    createdAt: new Date().toISOString()
  }).then(() => {
    alert(`${role.toUpperCase()} account successfully ban gaya hai!`);
    document.getElementById('addUserForm').reset();
  }).catch((error) => {
    alert("Error: " + error.message);
  });
}

// ==========================================
// ADMIN: LOAD USERS & ROUTES TABLE LIVE
// ==========================================
function initAdminDashboard() {
  const tableBody = document.getElementById('userTableBody');
  if (!tableBody) return;

  // Realtime database listener for users list
  db.ref('users').on('value', (snapshot) => {
    const data = snapshot.val();
    tableBody.innerHTML = ''; // Purani rows clear karein

    if (!data || (!data.drivers && !data.students)) {
      tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Koi user add nahi hua hai abhi tak.</td></tr>';
      return;
    }

    // 1. Render Drivers List
    if (data.drivers) {
      Object.keys(data.drivers).forEach((username) => {
        const user = data.drivers[username];
        tableBody.innerHTML += `
          <tr class="border-b hover:bg-gray-50 text-sm">
            <td class="p-3"><span class="bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded text-xs">DRIVER</span></td>
            <td class="p-3 font-medium text-gray-800">${user.name || '-'}</td>
            <td class="p-3 text-gray-600">${user.username}</td>
            <td class="p-3 text-gray-600">${user.password}</td>
            <td class="p-3 font-medium text-indigo-600">${user.route || '-'}</td>
          </tr>
        `;
      });
    }

    // 2. Render Students List
    if (data.students) {
      Object.keys(data.students).forEach((username) => {
        const user = data.students[username];
        tableBody.innerHTML += `
          <tr class="border-b hover:bg-gray-50 text-sm">
            <td class="p-3"><span class="bg-green-100 text-green-800 font-semibold px-2.5 py-0.5 rounded text-xs">STUDENT</span></td>
            <td class="p-3 font-medium text-gray-800">${user.name || '-'}</td>
            <td class="p-3 text-gray-600">${user.username}</td>
            <td class="p-3 text-gray-600">${user.password}</td>
            <td class="p-3 font-medium text-indigo-600">${user.route || '-'}</td>
          </tr>
        `;
      });
    }
  });
}

// ==========================================
// DRIVER GPS BROADCAST LOGIC
// ==========================================
let watchId = null;

function initDriverDashboard(userData) {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');

  if (startBtn) {
    startBtn.onclick = () => {
      if (!navigator.geolocation) {
        alert("Aapka browser Geolocation support nahi karta.");
        return;
      }

      alert("GPS Broadcasting Shuru ho gayi hai!");
      watchId = navigator.geolocation.watchPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed || 0;

        if(document.getElementById('latDisplay')) document.getElementById('latDisplay').innerText = lat.toFixed(4);
        if(document.getElementById('lngDisplay')) document.getElementById('lngDisplay').innerText = lng.toFixed(4);
        if(document.getElementById('speedDisplay')) document.getElementById('speedDisplay').innerText = (speed * 3.6).toFixed(1) + " km/h";

        db.ref('liveBus/location').set({
          lat: lat,
          lng: lng,
          speed: speed,
          driver: userData ? userData.username : "Driver",
          route: userData ? userData.route : "Default Route",
          updatedAt: Date.now()
        });
      }, (error) => {
        alert("Location error: " + error.message);
      }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      });
    };
  }

  if (stopBtn) {
    stopBtn.onclick = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        alert("Broadcast rok di gayi hai.");
      }
    };
  }
}

// ==========================================
// STUDENT MAP TRACKING LOGIC (Leaflet.js)
// ==========================================
function initStudentDashboard() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  const map = L.map('map').setView([28.6139, 77.2090], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let busMarker = null;

  db.ref('liveBus/location').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const lat = data.lat;
      const lng = data.lng;
      const route = data.route || "Live Bus";

      if (!busMarker) {
        busMarker = L.marker([lat, lng]).addTo(map).bindPopup(`<b>${route}</b><br>Bus is moving`).openPopup();
      } else {
        busMarker.setLatLng([lat, lng]);
      }
      map.setView([lat, lng], 15);
    }
  });
}
