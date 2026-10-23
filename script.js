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

let currentDriver = null;

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

  if (role === "admin") {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      showDashboard("admin");
    } else {
      alert("Galat Admin credentials hain!");
    }
  } 
  else if (role === "driver") {
    const snapshot = await db.ref(`users/drivers/${username}`).once('value');
    const userData = snapshot.val();
    
    if (userData && userData.password === password) {
      currentDriver = userData;
      showDashboard("driver", userData);
    } else {
      alert("Driver username ya password galat hai!");
    }
  } 
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
  const loginSection = document.getElementById('loginSection');
  if (loginSection) loginSection.style.display = 'none';

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
  
  listenForWarnings();
}

// ==========================================
// ADMIN: ADD & DELETE USERS
// ==========================================
function addNewUser(event) {
  if (event) event.preventDefault();

  const role = document.getElementById('newRole').value;
  const name = document.getElementById('newName').value.trim();
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const route = document.getElementById('newRoute').value.trim();

  if (!username || !password || !name || !route) {
    alert("Saari fields bharein!");
    return;
  }

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

function deleteUser(role, username) {
  if (confirm(`Kya aap waqai ${username} (${role}) ko delete karna chahte hain?`)) {
    db.ref(`users/${role}s/${username}`).remove().then(() => {
      alert("User successfully delete ho gaya hai!");
    }).catch((error) => {
      alert("Error deleting user: " + error.message);
    });
  }
}

// ==========================================
// ADMIN DASHBOARD: MULTI-BUS LIVE MAP
// ==========================================
let adminMap = null;
let adminBusMarkers = {};

function initAdminDashboard() {
  // Initialize Admin Leaflet Map if not initialized
  if (!adminMap && document.getElementById('adminMap')) {
    adminMap = L.map('adminMap').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(adminMap);
  }

  // 1. Registered Users Table
  const tableBody = document.getElementById('userTableBody');
  db.ref('users').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!data || (!data.drivers && !data.students)) {
      tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Koi user add nahi hua hai abhi tak.</td></tr>';
      return;
    }

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
            <td class="p-3"><button onclick="deleteUser('driver', '${user.username}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">Delete</button></td>
          </tr>
        `;
      });
    }

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
            <td class="p-3"><button onclick="deleteUser('student', '${user.username}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">Delete</button></td>
          </tr>
        `;
      });
    }
  });

  // 2. Track All Buses Simultaneously on Admin Map
  db.ref('liveBus/buses').on('value', (snapshot) => {
    const buses = snapshot.val();
    const activeCountEl = document.getElementById('activeBusesCount');

    if (!buses) {
      if (activeCountEl) activeCountEl.innerText = "0 Active Buses";
      Object.keys(adminBusMarkers).forEach(key => {
        adminMap.removeLayer(adminBusMarkers[key]);
      });
      adminBusMarkers = {};
      return;
    }

    const activeKeys = Object.keys(buses);
    if (activeCountEl) activeCountEl.innerText = `${activeKeys.length} Active Bus${activeKeys.length > 1 ? 'es' : ''}`;

    const bounds = [];

    activeKeys.forEach((driverKey) => {
      const bus = buses[driverKey];
      if (bus && bus.lat && bus.lng) {
        const lat = bus.lat;
        const lng = bus.lng;
        const speed = bus.speed ? (bus.speed * 3.6).toFixed(1) : "0.0";
        const route = bus.route || "College Bus Route";
        const driverName = bus.driverName || bus.driver || driverKey;

        bounds.push([lat, lng]);

        const popupText = `
          <div class="text-sm">
            <h3 class="font-bold text-indigo-600">${route}</h3>
            <p><strong>Driver:</strong> ${driverName}</p>
            <p><strong>Speed:</strong> ${speed} km/h</p>
          </div>
        `;

        if (!adminBusMarkers[driverKey]) {
          adminBusMarkers[driverKey] = L.marker([lat, lng]).addTo(adminMap).bindPopup(popupText);
        } else {
          adminBusMarkers[driverKey].setLatLng([lat, lng]);
          adminBusMarkers[driverKey].setPopupContent(popupText);
        }
      }
    });

    // Remove inactive buses from map
    Object.keys(adminBusMarkers).forEach(key => {
      if (!buses[key]) {
        adminMap.removeLayer(adminBusMarkers[key]);
        delete adminBusMarkers[key];
      }
    });

    // Auto fit map bounds to show all active buses
    if (bounds.length > 0 && adminMap) {
      adminMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  });
}

// ==========================================
// WARNING / NOTICE BROADCAST SYSTEM
// ==========================================
function sendWarning(event) {
  if (event) event.preventDefault();
  const msg = document.getElementById('warningMessage').value.trim();
  if (!msg) return;

  db.ref('liveBus/warning').set(msg).then(() => {
    alert("Warning successfully broadcasted to all drivers and students!");
    document.getElementById('warningForm').reset();
  });
}

function clearWarning() {
  db.ref('liveBus/warning').remove().then(() => {
    alert("Warning cleared successfully!");
  });
}

function listenForWarnings() {
  db.ref('liveBus/warning').on('value', (snapshot) => {
    const warningMsg = snapshot.val();
    
    const driverBanner = document.getElementById('driverWarningBanner');
    const driverText = document.getElementById('driverWarningText');
    const studentBanner = document.getElementById('studentWarningBanner');
    const studentText = document.getElementById('studentWarningText');

    if (warningMsg) {
      if (driverBanner && driverText) {
        driverText.innerText = warningMsg;
        driverBanner.classList.remove('hidden');
      }
      if (studentBanner && studentText) {
        studentText.innerText = warningMsg;
        studentBanner.classList.remove('hidden');
      }
    } else {
      if (driverBanner) driverBanner.classList.add('hidden');
      if (studentBanner) studentBanner.classList.add('hidden');
    }
  });
}

// ==========================================
// DRIVER GPS BROADCAST LOGIC
// ==========================================
let watchId = null;

function initDriverDashboard(userData) {
  if (userData) {
    if (document.getElementById('driverNameDisplay')) document.getElementById('driverNameDisplay').innerText = userData.name || userData.username;
    if (document.getElementById('driverRouteDisplay')) document.getElementById('driverRouteDisplay').innerText = userData.route || "Default Route";
  }

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

        if (document.getElementById('latDisplay')) document.getElementById('latDisplay').innerText = lat.toFixed(4);
        if (document.getElementById('lngDisplay')) document.getElementById('lngDisplay').innerText = lng.toFixed(4);
        if (document.getElementById('speedDisplay')) document.getElementById('speedDisplay').innerText = (speed * 3.6).toFixed(1) + " km/h";

        const driverId = userData ? userData.username : "driver_default";

        // Save location per driver under `liveBus/buses/{driverId}`
        db.ref(`liveBus/buses/${driverId}`).set({
          lat: lat,
          lng: lng,
          speed: speed,
          driver: driverId,
          driverName: userData ? userData.name : "Driver",
          route: userData ? userData.route : "College Route",
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
        
        const driverId = userData ? userData.username : "driver_default";
        db.ref(`liveBus/buses/${driverId}`).remove();
        
        alert("Broadcast rok di gayi hai.");
      }
    };
  }
}

// ==========================================
// STUDENT MAP TRACKING LOGIC
// ==========================================
let studentMap = null;
let studentBusMarkers = {};

function initStudentDashboard() {
  if (!studentMap && document.getElementById('studentMap')) {
    studentMap = L.map('studentMap').setView([28.6139, 77.2090], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(studentMap);
  }

  db.ref('liveBus/buses').on('value', (snapshot) => {
    const buses = snapshot.val();
    if (!buses) {
      Object.keys(studentBusMarkers).forEach(key => studentMap.removeLayer(studentBusMarkers[key]));
      studentBusMarkers = {};
      return;
    }

    const bounds = [];
    Object.keys(buses).forEach((driverKey) => {
      const bus = buses[driverKey];
      if (bus && bus.lat && bus.lng) {
        const lat = bus.lat;
        const lng = bus.lng;
        const route = bus.route || "College Bus Route";
        const driverName = bus.driverName || bus.driver;

        bounds.push([lat, lng]);

        const popupContent = `<b>${route}</b><br>Driver: ${driverName}`;

        if (!studentBusMarkers[driverKey]) {
          studentBusMarkers[driverKey] = L.marker([lat, lng]).addTo(studentMap).bindPopup(popupContent);
        } else {
          studentBusMarkers[driverKey].setLatLng([lat, lng]);
          studentBusMarkers[driverKey].setPopupContent(popupContent);
        }
      }
    });

    Object.keys(studentBusMarkers).forEach(key => {
      if (!buses[key]) {
        studentMap.removeLayer(studentBusMarkers[key]);
        delete studentBusMarkers[key];
      }
    });

    if (bounds.length > 0 && studentMap) {
      studentMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  });
}
