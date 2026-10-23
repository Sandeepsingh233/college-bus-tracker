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

let currentUserData = null;
let currentRole = null;

// Helper to get today's date string (YYYY-MM-DD)
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
      currentUserData = userData;
      currentRole = "driver";
      showDashboard("driver", userData);
    } else {
      alert("Driver username ya password galat hai!");
    }
  } 
  else if (role === "student") {
    const snapshot = await db.ref(`users/students/${username}`).once('value');
    const userData = snapshot.val();
    
    if (userData && userData.password === password) {
      currentUserData = userData;
      currentRole = "student";
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
    initStudentDashboard(userData);
  }
  
  listenForWarnings();
}

// ==========================================
// ATTENDANCE MARKING LOGIC (Driver & Student)
// ==========================================
function markAttendance(role) {
  if (!currentUserData) return;
  const today = getTodayDateString();
  const username = currentUserData.username;

  db.ref(`attendance/${role}s/${today}/${username}`).set({
    username: username,
    name: currentUserData.name,
    status: "Present",
    timestamp: Date.now()
  }).then(() => {
    alert("Aapki attendance successfully mark ho gayi hai!");
    checkMyAttendanceStatus(role);
  }).catch((error) => {
    alert("Error marking attendance: " + error.message);
  });
}

function checkMyAttendanceStatus(role) {
  if (!currentUserData) return;
  const today = getTodayDateString();
  const username = currentUserData.username;

  db.ref(`attendance/${role}s/${today}/${username}`).on('value', (snapshot) => {
    const data = snapshot.val();
    if (role === 'driver') {
      const statusText = document.getElementById('driverAttendanceStatusText');
      const btn = document.getElementById('markDriverAttendanceBtn');
      if (data && data.status === "Present") {
        if (statusText) statusText.innerText = "Status: Present Today ✅";
        if (btn) { btn.innerText = "Attendance Marked"; btn.disabled = true; btn.classList.replace('bg-blue-600', 'bg-gray-400'); }
      } else {
        if (statusText) statusText.innerText = "Status: Not Marked Yet ❌";
      }
    } else if (role === 'student') {
      const statusText = document.getElementById('studentAttendanceStatusText');
      const btn = document.getElementById('markStudentAttendanceBtn');
      if (data && data.status === "Present") {
        if (statusText) statusText.innerText = "Attendance: Present ✅";
        if (btn) { btn.innerText = "Marked"; btn.disabled = true; btn.classList.replace('bg-green-600', 'bg-gray-400'); }
      } else {
        if (statusText) statusText.innerText = "Attendance: Absent ❌";
      }
    }
  });
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
// ADMIN DASHBOARD: MULTI-BUS LIVE MAP & ATTENDANCE
// ==========================================
let adminMap = null;
let adminBusMarkers = {};

function initAdminDashboard() {
  const dateFilter = document.getElementById('attendanceDateFilter');
  if (dateFilter && !dateFilter.value) {
    dateFilter.value = getTodayDateString();
  }

  if (!adminMap && document.getElementById('adminMap')) {
    adminMap = L.map('adminMap').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(adminMap);
  }

  setupRealtimeAttendanceListener();

  db.ref('liveBus/buses').on('value', (snapshot) => {
    const buses = snapshot.val();
    const activeCountEl = document.getElementById('activeBusesCount');

    if (!buses) {
      if (activeCountEl) activeCountEl.innerText = "0 Active Buses";
      Object.keys(adminBusMarkers).forEach(key => adminMap.removeLayer(adminBusMarkers[key]));
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
        const driverName = bus.driverName || bus.driver;

        bounds.push([lat, lng]);
        const popupText = `<div class="text-sm"><h3 class="font-bold text-indigo-600">${route}</h3><p><strong>Driver:</strong> ${driverName}</p><p><strong>Speed:</strong> ${speed} km/h</p></div>`;

        if (!adminBusMarkers[driverKey]) {
          adminBusMarkers[driverKey] = L.marker([lat, lng]).addTo(adminMap).bindPopup(popupText);
        } else {
          adminBusMarkers[driverKey].setLatLng([lat, lng]);
          adminBusMarkers[driverKey].setPopupContent(popupText);
        }
      }
    });

    Object.keys(adminBusMarkers).forEach(key => {
      if (!buses[key]) {
        adminMap.removeLayer(adminBusMarkers[key]);
        delete adminBusMarkers[key];
      }
    });

    if (bounds.length > 0 && adminMap) {
      adminMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  });
}

function setupRealtimeAttendanceListener() {
  const dateFilter = document.getElementById('attendanceDateFilter');

  db.ref('users').on('value', () => {
    fetchAndRenderAttendanceData();
  });

  db.ref('attendance').on('value', () => {
    fetchAndRenderAttendanceData();
  });

  if (dateFilter) {
    dateFilter.onchange = () => {
      fetchAndRenderAttendanceData();
    };
  }
}

function fetchAndRenderAttendanceData() {
  const dateFilter = document.getElementById('attendanceDateFilter');
  const selectedDate = dateFilter ? dateFilter.value : getTodayDateString();

  const driverTableBody = document.getElementById('adminDriverAttendanceBody');
  const studentTableBody = document.getElementById('adminStudentAttendanceBody');
  const userTableBody = document.getElementById('userTableBody');

  db.ref('users').once('value', (userSnapshot) => {
    const usersData = userSnapshot.val() || {};
    const drivers = usersData.drivers || {};
    const students = usersData.students || {};

    db.ref(`attendance`).once('value', (attSnapshot) => {
      const attData = attSnapshot.val() || {};
      const driverAtt = (attData.drivers && attData.drivers[selectedDate]) || {};
      const studentAtt = (attData.students && attData.students[selectedDate]) || {};

      if (userTableBody) {
        userTableBody.innerHTML = '';
        if (Object.keys(drivers).length === 0 && Object.keys(students).length === 0) {
          userTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Koi user add nahi hua hai abhi tak.</td></tr>';
        } else {
          Object.keys(drivers).forEach((username) => {
            const user = drivers[username];
            userTableBody.innerHTML += `<tr class="border-b hover:bg-gray-50 text-sm"><td class="p-3"><span class="bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded text-xs">DRIVER</span></td><td class="p-3 font-medium text-gray-800">${user.name}</td><td class="p-3 text-gray-600">${user.username}</td><td class="p-3 text-gray-600">${user.password}</td><td class="p-3 font-medium text-indigo-600">${user.route}</td><td class="p-3"><button onclick="deleteUser('driver', '${user.username}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">Delete</button></td></tr>`;
          });
          Object.keys(students).forEach((username) => {
            const user = students[username];
            userTableBody.innerHTML += `<tr class="border-b hover:bg-gray-50 text-sm"><td class="p-3"><span class="bg-green-100 text-green-800 font-semibold px-2.5 py-0.5 rounded text-xs">STUDENT</span></td><td class="p-3 font-medium text-gray-800">${user.name}</td><td class="p-3 text-gray-600">${user.username}</td><td class="p-3 text-gray-600">${user.password}</td><td class="p-3 font-medium text-indigo-600">${user.route}</td><td class="p-3"><button onclick="deleteUser('student', '${user.username}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">Delete</button></td></tr>`;
          });
        }
      }

      if (driverTableBody) {
        driverTableBody.innerHTML = '';
        if (Object.keys(drivers).length === 0) {
          driverTableBody.innerHTML = '<tr><td colspan="3" class="p-3 text-center text-gray-500">No drivers registered.</td></tr>';
        } else {
          Object.keys(drivers).forEach((username) => {
            const user = drivers[username];
            const isPresent = driverAtt[username] && driverAtt[username].status === "Present";
            const badge = isPresent 
              ? '<span class="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">Present ✅</span>' 
              : '<span class="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold">Absent ❌</span>';
            driverTableBody.innerHTML += `<tr class="border-b"><td class="p-2.5 font-medium">${user.name}</td><td class="p-2.5 text-gray-600">${username}</td><td class="p-2.5">${badge}</td></tr>`;
          });
        }
      }

      if (studentTableBody) {
        studentTableBody.innerHTML = '';
        if (Object.keys(students).length === 0) {
          studentTableBody.innerHTML = '<tr><td colspan="3" class="p-3 text-center text-gray-500">No students registered.</td></tr>';
        } else {
          Object.keys(students).forEach((username) => {
            const user = students[username];
            const isPresent = studentAtt[username] && studentAtt[username].status === "Present";
            const badge = isPresent 
              ? '<span class="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">Present ✅</span>' 
              : '<span class="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold">Absent ❌</span>';
            studentTableBody.innerHTML += `<tr class="border-b"><td class="p-2.5 font-medium">${user.name}</td><td class="p-2.5 text-gray-600">${username}</td><td class="p-2.5">${badge}</td></tr>`;
          });
        }
      }
    });
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
    alert("Warning successfully broadcasted!");
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
      if (driverBanner && driverText) { driverText.innerText = warningMsg; driverBanner.classList.remove('hidden'); }
      if (studentBanner && studentText) { studentText.innerText = warningMsg; studentBanner.classList.remove('hidden'); }
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

  checkMyAttendanceStatus('driver');

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
// STUDENT MAP TRACKING LOGIC (ALLOCATED ROUTE FILTER)
// ==========================================
let studentMap = null;
let studentBusMarkers = {};

function initStudentDashboard(userData) {
  if (userData) {
    if (document.getElementById('studentNameDisplay')) {
      document.getElementById('studentNameDisplay').innerText = `${userData.name || userData.username} (${userData.route || 'No Route'})`;
    }
  }

  checkMyAttendanceStatus('student');

  if (!studentMap && document.getElementById('studentMap')) {
    studentMap = L.map('studentMap').setView([28.6139, 77.2090], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(studentMap);
  }

  const studentAllocatedRoute = (userData && userData.route) ? userData.route.trim().toLowerCase() : "";

  db.ref('liveBus/buses').on('value', (snapshot) => {
    const buses = snapshot.val();
    if (!buses) {
      Object.keys(studentBusMarkers).forEach(key => studentMap.removeLayer(studentBusMarkers[key]));
      studentBusMarkers = {};
      return;
    }

    const bounds = [];
    const activeRouteKeys = [];

    Object.keys(buses).forEach((driverKey) => {
      const bus = buses[driverKey];
      if (bus && bus.lat && bus.lng) {
        const busRoute = (bus.route || "").trim().toLowerCase();

        // SIRF TABHI SHOW KAREIN JAB ROUTE MATCH KARE YAA PEHLE SE KOI ROUTE ASSIGN NA HO
        if (!studentAllocatedRoute || busRoute === studentAllocatedRoute || busRoute.includes(studentAllocatedRoute) || studentAllocatedRoute.includes(busRoute)) {
          const lat = bus.lat;
          const lng = bus.lng;
          const route = bus.route || "College Bus Route";
          const driverName = bus.driverName || bus.driver;

          bounds.push([lat, lng]);
          activeRouteKeys.push(driverKey);

          const popupContent = `<b>${route}</b><br>Driver: ${driverName}`;

          if (!studentBusMarkers[driverKey]) {
            studentBusMarkers[driverKey] = L.marker([lat, lng]).addTo(studentMap).bindPopup(popupContent);
          } else {
            studentBusMarkers[driverKey].setLatLng([lat, lng]);
            studentBusMarkers[driverKey].setPopupContent(popupContent);
          }
        }
      }
    });

    // Remove any markers that do not match the student's route
    Object.keys(studentBusMarkers).forEach(key => {
      if (!activeRouteKeys.includes(key)) {
        studentMap.removeLayer(studentBusMarkers[key]);
        delete studentBusMarkers[key];
      }
    });

    if (bounds.length > 0 && studentMap) {
      studentMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  });
}
