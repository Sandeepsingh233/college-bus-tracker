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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "Sandeep09@" 
};

let currentUserData = null;
let currentRole = null;
let proximityDismissed = false;
let stopArrivalDismissed = false;
let selectedCurrentStop = "None";

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 30-SECOND CINEMATIC POPUP REVEAL SEQUENCE
function runSequentialLoginReveal() {
  // Step 0: Main Card Popup (0s)
  setTimeout(() => {
    document.getElementById('loginMainBox').classList.add('seq-show');
  }, 200);

  // Step 1: Badge Reveal (3s)
  setTimeout(() => {
    document.getElementById('seq-badge').classList.add('seq-show');
  }, 3000);

  // Step 2: VERMA BUS PORTAL Title Reveal (5s)
  setTimeout(() => {
    document.getElementById('seq-title').classList.add('seq-show');
  }, 5000);

  // Step 3: Typewriter Description Reveal (10s to 20s)
  setTimeout(() => {
    const typewriterEl = document.getElementById('typewriterText');
    typewriterEl.classList.add('seq-show');
    startWordByWordTypewriter();
  }, 10000);

  // Step 4: Spider-Man Heroic Card Reveal (20s)
  setTimeout(() => {
    document.getElementById('seq-hero-card').classList.add('seq-show');
  }, 20000);

  // Step 5: Role Cards Staggered Popups (23s, 25s, 27s)
  setTimeout(() => { document.getElementById('card-student').classList.add('seq-show'); }, 23000);
  setTimeout(() => { document.getElementById('card-driver').classList.add('seq-show'); }, 25000);
  setTimeout(() => { document.getElementById('card-admin').classList.add('seq-show'); }, 27000);

  // Step 6: Form Reveal (29s - 30s)
  setTimeout(() => {
    document.getElementById('seq-form').classList.add('seq-show');
  }, 29000);
}

// Typewriter Function (Runs within 10-second duration inside timeline)
function startWordByWordTypewriter() {
  const targetEl = document.getElementById('typewriterText');
  if (!targetEl) return;

  const fullText = "Welcome to Verma Bus Tracking Portal. Live GPS tracking, instant stop arrival announcements, geofencing proximity alerts, and automated attendance management.";
  const words = fullText.split(' ');
  
  targetEl.innerHTML = '';
  let currentWordIndex = 0;
  const delayPerWord = Math.floor(10000 / words.length); // 10s word sync

  const timer = setInterval(() => {
    if (currentWordIndex < words.length) {
      targetEl.innerHTML += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
      currentWordIndex++;
    } else {
      clearInterval(timer);
    }
  }, delayPerWord);
}

// Visual Role Selection Card Logic
function selectRoleCard(role) {
  document.getElementById('roleSelect').value = role;
  document.querySelectorAll('.role-card').forEach(card => card.classList.remove('active'));
  document.getElementById(`card-${role}`).classList.add('active');
}

window.addEventListener('DOMContentLoaded', () => {
  selectRoleCard('student');
  runSequentialLoginReveal();
});

// Admin Dashboard Accordion Toggle
function toggleAdminAccordion(id) {
  const el = document.getElementById(id);
  const icon = document.getElementById(`icon-${id}`);
  if (el) {
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      if (icon) icon.innerText = '▲';
    } else {
      el.classList.add('hidden');
      if (icon) icon.innerText = '▼';
    }
  }
}

function toggleUserFields() {
  const role = document.getElementById('newRole').value;
  const driverFields = document.getElementById('driverFields');
  const studentFields = document.getElementById('studentFields');
  if (role === 'driver') {
    driverFields.style.display = 'grid';
    studentFields.style.display = 'none';
  } else {
    driverFields.style.display = 'none';
    studentFields.style.display = 'grid';
  }
}

function toggleRouteBox(boxId) {
  const content = document.getElementById(boxId);
  const icon = document.getElementById(`icon-${boxId}`);
  if (content) {
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
      if (icon) icon.innerText = '▲';
    } else {
      content.classList.add('hidden');
      if (icon) icon.innerText = '▼';
    }
  }
}

function handleScheduleKeydown(event) {
  if (event.key === 'Enter') {
    event.stopPropagation();
  }
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Audio Beep Sound Generator
function playBeepSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.log("Audio Context blocked", e);
  }
}

function dismissProximityAlert() {
  proximityDismissed = true;
  document.getElementById('proximityAlertBanner').classList.add('hidden');
}

function dismissStopArrivalAlert() {
  stopArrivalDismissed = true;
  document.getElementById('busArrivedStopBanner').classList.add('hidden');
  if (currentUserData) {
    db.ref(`liveBus/stopArrivals/${currentUserData.route}`).remove();
  }
}

// ==========================================
// LOGIN HANDLER
// ==========================================
async function handleLogin(event) {
  if (event) event.preventDefault();

  const role = document.getElementById('roleSelect').value;
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  if (!username || !password) return alert("Kripya username aur password dono bharein!");

  if (role === "admin") {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      showDashboard("admin");
    } else alert("Galat Admin credentials hain!");
  } 
  else if (role === "driver") {
    const snapshot = await db.ref(`users/drivers/${username}`).once('value');
    const userData = snapshot.val();
    if (userData && userData.password === password) {
      currentUserData = userData;
      currentRole = "driver";
      showDashboard("driver", userData);
    } else alert("Driver username ya password galat hai!");
  } 
  else if (role === "student") {
    const snapshot = await db.ref(`users/students/${username}`).once('value');
    const userData = snapshot.val();
    if (userData && userData.password === password) {
      currentUserData = userData;
      currentRole = "student";
      showDashboard("student", userData);
    } else alert("Student username ya password galat hai!");
  }
}

function showDashboard(role, userData = null) {
  document.getElementById('loginSection').style.display = 'none';

  if (role === 'admin') {
    document.getElementById('adminDashboard').style.display = 'block';
    initAdminDashboard();
  } else if (role === 'driver') {
    document.getElementById('driverDashboard').style.display = 'block';
    initDriverDashboard(userData);
  } else if (role === 'student') {
    document.getElementById('studentDashboard').style.display = 'block';
    initStudentDashboard(userData);
  }
  listenForWarnings();
}

// ==========================================
// ATTENDANCE LOGIC
// ==========================================
function markDriverSelfAttendance() {
  if (!currentUserData || currentRole !== 'driver') return;
  const today = getTodayDateString();
  const username = currentUserData.username;

  const attendanceObj = {
    username, name: currentUserData.name,
    driverId: currentUserData.driverId || "N/A",
    busNumber: currentUserData.busNumber || "N/A",
    route: currentUserData.route || "N/A",
    status: "Present", timestamp: Date.now()
  };

  db.ref(`attendance/drivers/${today}/${username}`).set(attendanceObj).then(() => {
    alert("Aapki (Driver) attendance successfully mark ho gayi hai!");
    checkDriverSelfAttendanceStatus();
  });
}

function checkDriverSelfAttendanceStatus() {
  if (!currentUserData || currentRole !== 'driver') return;
  const today = getTodayDateString();
  const username = currentUserData.username;

  db.ref(`attendance/drivers/${today}/${username}`).on('value', (snapshot) => {
    const data = snapshot.val();
    const statusText = document.getElementById('driverSelfAttendanceStatusText');
    const btn = document.getElementById('markDriverSelfAttendanceBtn');

    if (data && data.status === "Present") {
      if (statusText) statusText.innerText = "Status: Present Today ✅";
      if (btn) { btn.innerText = "Marked ✅"; btn.disabled = true; btn.style.opacity = '0.5'; }
    } else {
      if (statusText) statusText.innerText = "Status: Not Marked Yet ❌";
    }
  });
}

function driverMarkStudentAttendance(studentUsername, status) {
  if (!currentUserData || currentRole !== 'driver') return;
  const today = getTodayDateString();

  db.ref(`users/students/${studentUsername}`).once('value', (snapshot) => {
    const studentData = snapshot.val();
    if (!studentData) return;

    const attendanceObj = {
      username: studentUsername,
      name: studentData.name,
      studentId: studentData.studentId || "N/A",
      course: studentData.course || "N/A",
      route: studentData.route || "N/A",
      pickupStop: studentData.pickupStop || "N/A",
      status: status,
      markedByDriver: currentUserData.username,
      timestamp: Date.now()
    };

    db.ref(`attendance/students/${today}/${studentUsername}`).set(attendanceObj).then(() => {
      alert(`${studentData.name} ki attendance '${status}' mark ho gayi hai!`);
    });
  });
}

function checkMyAttendanceStatus() {
  if (!currentUserData || currentRole !== 'student') return;
  const today = getTodayDateString();
  const username = currentUserData.username;

  db.ref(`attendance/students/${today}/${username}`).on('value', (snapshot) => {
    const data = snapshot.val();
    const statusText = document.getElementById('studentAttendanceStatusText');
    if (!statusText) return;

    if (data && data.status === "Present") {
      statusText.innerText = "Attendance Today: Present ✅";
      statusText.className = "text-xs font-bold text-emerald-400";
    } else if (data && data.status === "Absent") {
      statusText.innerText = "Attendance Today: Absent ❌";
      statusText.className = "text-xs font-bold text-red-400";
    } else {
      statusText.innerText = "Attendance Today: Not Marked Yet ⏳";
      statusText.className = "text-xs font-bold text-slate-400";
    }
  });
}

function loadStudentAttendanceHistory() {
  if (!currentUserData || currentRole !== 'student') return;
  const username = currentUserData.username;
  const historyBody = document.getElementById('studentAttendanceHistoryBody');

  db.ref('attendance/students').on('value', (snapshot) => {
    const allDatesData = snapshot.val() || {};
    if (!historyBody) return;
    historyBody.innerHTML = '';

    const dates = Object.keys(allDatesData).sort().reverse();
    let hasRecords = false;

    dates.forEach(date => {
      const dayRecords = allDatesData[date];
      if (dayRecords && dayRecords[username]) {
        hasRecords = true;
        const record = dayRecords[username];
        const statusBadge = record.status === "Present" 
          ? '<span class="text-emerald-400 font-extrabold">Present ✅</span>' 
          : '<span class="text-red-400 font-extrabold">Absent ❌</span>';

        historyBody.innerHTML += `
          <tr class="border-b border-slate-800">
            <td class="p-2 font-bold text-slate-300">${date}</td>
            <td class="p-2">${statusBadge}</td>
          </tr>
        `;
      }
    });

    if (!hasRecords) {
      historyBody.innerHTML = `<tr><td colspan="2" class="p-3 text-center text-slate-500">No attendance history found.</td></tr>`;
    }
  });
}

// ==========================================
// ADMIN SEARCH USER DETAILS
// ==========================================
async function searchStudentDetails() {
  const searchId = document.getElementById('searchStudentIdInput').value.trim().toLowerCase();
  const resultBox = document.getElementById('searchResultBox');
  
  if (!searchId) return alert("Kripya Student ID enter karein!");

  const snapshot = await db.ref('users/students').once('value');
  const students = snapshot.val() || {};
  let found = null;

  Object.keys(students).forEach(username => {
    const stu = students[username];
    const stuId = stu.studentId ? String(stu.studentId).toLowerCase() : "";
    const uName = username.toLowerCase();
    if (stuId === searchId || uName === searchId || stuId.includes(searchId)) found = stu;
  });

  resultBox.classList.remove('hidden');
  if (found) {
    resultBox.innerHTML = `
      <h3 class="font-bold text-cyan-400 text-sm mb-1">Student Found:</h3>
      <p><strong>Name:</strong> ${found.name || 'N/A'}</p>
      <p><strong>Student ID:</strong> ${found.studentId || 'N/A'}</p>
      <p><strong>Username:</strong> ${found.username || 'N/A'}</p>
      <p><strong>Course:</strong> ${found.course || 'N/A'}</p>
      <p><strong>Assigned Route:</strong> ${found.route || 'N/A'}</p>
      <p><strong>Boarding / Pickup Stop:</strong> <span class="text-cyan-400 font-bold">${found.pickupStop || 'Not Set'}</span></p>
    `;
  } else {
    resultBox.innerHTML = `<p class="text-red-400 font-semibold">No student found matching: "${searchId}"</p>`;
  }
}

async function searchDriverDetails() {
  const searchId = document.getElementById('searchDriverIdInput').value.trim().toLowerCase();
  const resultBox = document.getElementById('searchResultBox');
  
  if (!searchId) return alert("Kripya Driver ID ya Username enter karein!");

  const snapshot = await db.ref('users/drivers').once('value');
  const drivers = snapshot.val() || {};
  let found = null;

  Object.keys(drivers).forEach(username => {
    const drv = drivers[username];
    const drvId = drv.driverId ? String(drv.driverId).toLowerCase() : "";
    const uName = username.toLowerCase();
    const phone = drv.phone ? String(drv.phone).toLowerCase() : "";
    if (drvId === searchId || uName === searchId || phone.includes(searchId) || drvId.includes(searchId)) found = drv;
  });

  resultBox.classList.remove('hidden');
  if (found) {
    resultBox.innerHTML = `
      <h3 class="font-bold text-cyan-400 text-sm mb-1">Driver Found:</h3>
      <p><strong>Name:</strong> ${found.name || 'N/A'}</p>
      <p><strong>Driver ID:</strong> ${found.driverId || 'N/A'}</p>
      <p><strong>Username:</strong> ${found.username || 'N/A'}</p>
      <p><strong>Phone:</strong> ${found.phone || 'N/A'}</p>
      <p><strong>Bus Number:</strong> ${found.busNumber || 'N/A'}</p>
      <p><strong>Reg. Number:</strong> ${found.regNumber || 'N/A'}</p>
      <p><strong>Assigned Route:</strong> ${found.route || 'N/A'}</p>
    `;
  } else {
    resultBox.innerHTML = `<p class="text-red-400 font-semibold">No driver found matching: "${searchId}"</p>`;
  }
}

// ==========================================
// USER MANAGEMENT & DELETE CLEANUP
// ==========================================
function addNewUser(event) {
  if (event) event.preventDefault();
  const role = document.getElementById('newRole').value;
  const name = document.getElementById('newName').value.trim();
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const route = document.getElementById('newRoute').value.trim();

  let userData = { username, password, name, route, createdAt: new Date().toISOString() };
  if (role === 'driver') {
    userData.driverId = document.getElementById('newDriverId').value.trim();
    userData.phone = document.getElementById('newPhone').value.trim();
    userData.busNumber = document.getElementById('newBusNumber').value.trim();
    userData.regNumber = document.getElementById('newRegNumber').value.trim();
    userData.schedule = document.getElementById('newSchedule').value.trim();
  } else {
    userData.studentId = document.getElementById('newStudentId').value.trim();
    userData.course = document.getElementById('newCourse').value.trim();
    userData.pickupStop = document.getElementById('newPickupStop').value.trim();
  }

  db.ref(`users/${role}s/${username}`).set(userData).then(() => {
    alert(`${role.toUpperCase()} account successfully ban gaya hai!`);
    document.getElementById('addUserForm').reset();
    toggleUserFields();
  });
}

async function deleteUser(role, username) {
  if (!confirm(`Kya aap '${username}' aur uske sabhi purane attendance records ko permanently delete karna chahte hain?`)) {
    return;
  }

  try {
    if (role === 'driver') {
      await db.ref(`liveBus/buses/${username}`).remove();
    }

    await db.ref(`users/${role}s/${username}`).remove();

    const attendanceRef = db.ref(`attendance/${role === 'driver' ? 'drivers' : 'students'}`);
    const snapshot = await attendanceRef.once('value');
    const allDates = snapshot.val() || {};

    const deletePromises = [];
    Object.keys(allDates).forEach(dateStr => {
      if (allDates[dateStr] && allDates[dateStr][username]) {
        deletePromises.push(db.ref(`attendance/${role === 'driver' ? 'drivers' : 'students'}/${dateStr}/${username}`).remove());
      }
    });

    await Promise.all(deletePromises);

    alert(`User '${username}' aur uske saare purane attendance records successfully delete kar diye gaye hain!`);
    fetchAndRenderData();

  } catch (error) {
    console.error("Delete user error:", error);
    alert("Delete karne mein error aaya: " + error.message);
  }
}

function forceStopBus(driverKey) {
  if (confirm(`Force stop tracking for '${driverKey}'?`)) db.ref(`liveBus/buses/${driverKey}`).remove();
}

function sendEmergencyAlert() {
  if (!currentUserData) return;
  const emergencyData = {
    driver: currentUserData.username,
    driverName: currentUserData.name,
    busNumber: currentUserData.busNumber || "Unknown Bus",
    route: currentUserData.route || "Unknown Route",
    timestamp: Date.now()
  };
  db.ref(`liveBus/emergencies/${currentUserData.username}`).set(emergencyData).then(() => alert("🚨 Emergency alert sent!"));
}

function clearEmergencyAlerts() {
  db.ref(`liveBus/emergencies`).remove().then(() => alert("Alerts dismissed."));
}

function sendBusArrivedAnnouncement() {
  if (!currentUserData || currentRole !== 'driver') return;
  if (!selectedCurrentStop || selectedCurrentStop === "None") {
    return alert("Kripya pehle niche schedule list mein se stop par click karke select karein!");
  }

  const arrivalObj = {
    driver: currentUserData.username,
    driverName: currentUserData.name,
    busNumber: currentUserData.busNumber || "Bus",
    route: currentUserData.route,
    stopName: selectedCurrentStop,
    timestamp: Date.now()
  };

  db.ref(`liveBus/stopArrivals/${currentUserData.route}`).set(arrivalObj).then(() => {
    alert(`📢 Announcement sent! Bus Arrived at: ${selectedCurrentStop}`);
  });
}

function selectDriverStop(stopName) {
  selectedCurrentStop = stopName;
  const displayEl = document.getElementById('driverActiveStopDisplay');
  if (displayEl) displayEl.innerText = `🛑 Selected Stop: ${stopName}`;
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
let adminMap = null;
let adminBusMarkers = {};

function initAdminDashboard() {
  const dateFilter = document.getElementById('attendanceDateFilter');
  if (dateFilter && !dateFilter.value) dateFilter.value = getTodayDateString();

  if (!adminMap && document.getElementById('adminMap')) {
    adminMap = L.map('adminMap').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(adminMap);
  }

  setupRealtimeListeners();

  db.ref('liveBus/emergencies').on('value', (snapshot) => {
    const emergencies = snapshot.val();
    const container = document.getElementById('adminEmergencyContainer');
    const list = document.getElementById('adminEmergencyList');
    if (!emergencies) {
      if (container) container.classList.add('hidden');
      if (list) list.innerHTML = '';
      return;
    }
    if (container) container.classList.remove('hidden');
    if (list) {
      list.innerHTML = '';
      Object.keys(emergencies).forEach(key => {
        const em = emergencies[key];
        list.innerHTML += `<p>• Driver: <strong>${em.driverName}</strong> | Bus No: <strong>${em.busNumber}</strong> | Route: ${em.route}</p>`;
      });
    }
  });

  db.ref('liveBus/buses').on('value', (snapshot) => {
    const buses = snapshot.val();
    const activeCountEl = document.getElementById('activeBusesCount');
    const activeBusTableBody = document.getElementById('adminActiveBusesTableBody');

    if (!buses) {
      if (activeCountEl) activeCountEl.innerText = "0 Active Buses";
      if (activeBusTableBody) activeBusTableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-slate-500">No active buses broadcasting.</td></tr>';
      Object.keys(adminBusMarkers).forEach(key => adminMap.removeLayer(adminBusMarkers[key]));
      adminBusMarkers = {};
      return;
    }

    const activeKeys = Object.keys(buses);
    if (activeCountEl) activeCountEl.innerText = `${activeKeys.length} Active Bus${activeKeys.length > 1 ? 'es' : ''}`;

    if (activeBusTableBody) {
      activeBusTableBody.innerHTML = '';
      activeKeys.forEach(driverKey => {
        const bus = buses[driverKey];
        const speed = bus.speed ? (bus.speed * 3.6).toFixed(1) : "0.0";
        activeBusTableBody.innerHTML += `
          <tr class="border-b border-cyan-500/10 hover:bg-slate-800/50">
            <td class="p-2 font-bold text-cyan-400">${bus.busNumber || 'N/A'}</td>
            <td class="p-2 text-slate-300">${driverKey}</td>
            <td class="p-2 text-slate-400">${bus.route || 'Route'}</td>
            <td class="p-2 text-emerald-400 font-mono">${speed} km/h</td>
            <td class="p-2"><button onclick="forceStopBus('${driverKey}')" class="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">Force Stop</button></td>
          </tr>
        `;
      });
    }

    const bounds = [];
    activeKeys.forEach(driverKey => {
      const bus = buses[driverKey];
      if (bus && bus.lat && bus.lng) {
        bounds.push([bus.lat, bus.lng]);
        const popupText = `<div class="text-xs"><h3 class="font-bold text-cyan-400">Bus: ${bus.busNumber || 'N/A'}</h3><p>Route: ${bus.route}</p><p>Driver: ${bus.driverName}</p></div>`;
        if (!adminBusMarkers[driverKey]) {
          adminBusMarkers[driverKey] = L.marker([bus.lat, bus.lng]).addTo(adminMap).bindPopup(popupText);
        } else {
          adminBusMarkers[driverKey].setLatLng([bus.lat, bus.lng]);
          adminBusMarkers[driverKey].setPopupContent(popupText);
        }
      }
    });

    Object.keys(adminBusMarkers).forEach(key => {
      if (!buses[key]) { adminMap.removeLayer(adminBusMarkers[key]); delete adminBusMarkers[key]; }
    });

    if (bounds.length > 0 && adminMap) adminMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  });
}

function setupRealtimeListeners() {
  const dateFilter = document.getElementById('attendanceDateFilter');
  db.ref('users').on('value', () => fetchAndRenderData());
  db.ref('attendance').on('value', () => fetchAndRenderData());
  if (dateFilter) dateFilter.onchange = () => fetchAndRenderData();
}

function fetchAndRenderData() {
  const dateFilter = document.getElementById('attendanceDateFilter');
  const selectedDate = dateFilter ? dateFilter.value : getTodayDateString();

  const routeCardsContainer = document.getElementById('routeCardsContainer');
  const routeWiseAttendanceContainer = document.getElementById('routeWiseAttendanceContainer');

  db.ref('users').once('value', (userSnapshot) => {
    const usersData = userSnapshot.val() || {};
    const drivers = usersData.drivers || {};
    const students = usersData.students || {};

    db.ref(`attendance`).once('value', (attSnapshot) => {
      const attData = attSnapshot.val() || {};
      const driverAtt = (attData.drivers && attData.drivers[selectedDate]) || {};
      const studentAtt = (attData.students && attData.students[selectedDate]) || {};

      const routesMap = {};
      Object.keys(drivers).forEach(username => {
        const drv = drivers[username];
        const routeName = drv.route ? drv.route.trim() : "Unassigned Route";
        if (!routesMap[routeName]) routesMap[routeName] = { drivers: [], students: [] };
        routesMap[routeName].drivers.push(drv);
      });
      Object.keys(students).forEach(username => {
        const stu = students[username];
        const routeName = stu.route ? stu.route.trim() : "Unassigned Route";
        if (!routesMap[routeName]) routesMap[routeName] = { drivers: [], students: [] };
        routesMap[routeName].students.push(stu);
      });

      if (routeWiseAttendanceContainer) {
        routeWiseAttendanceContainer.innerHTML = '';
        const routeNames = Object.keys(routesMap);

        if (routeNames.length === 0) {
          routeWiseAttendanceContainer.innerHTML = `<p class="text-slate-500 text-xs italic">No route records available.</p>`;
        } else {
          routeNames.forEach((routeName, index) => {
            const group = routesMap[routeName];
            const attBoxId = `att-route-box-${index}`;

            let driversAttHTML = group.drivers.map(drv => {
              const isPresent = driverAtt[drv.username] && driverAtt[drv.username].status === "Present";
              return `<tr class="border-b border-slate-800"><td class="p-2 font-bold text-slate-200">${drv.name} <span class="text-[10px] text-amber-400">(Driver)</span></td><td class="p-2 text-cyan-400 font-mono">${drv.driverId || drv.username}</td><td class="p-2">${isPresent ? '<span class="text-emerald-400 font-bold">Present ✅</span>' : '<span class="text-red-400 font-bold">Absent ❌</span>'}</td></tr>`;
            }).join('');

            let studentsAttHTML = group.students.map(stu => {
              const isPresent = studentAtt[stu.username] && studentAtt[stu.username].status === "Present";
              const isAbsent = studentAtt[stu.username] && studentAtt[stu.username].status === "Absent";
              const statusBadge = isPresent ? '<span class="text-emerald-400 font-bold">Present ✅</span>' : isAbsent ? '<span class="text-red-400 font-bold">Absent ❌</span>' : '<span class="text-slate-500">Not Marked ⏳</span>';
              return `<tr class="border-b border-slate-800"><td class="p-2 text-slate-300">${stu.name}</td><td class="p-2 text-cyan-400 font-mono">${stu.studentId || 'N/A'}</td><td class="p-2">${statusBadge}</td></tr>`;
            }).join('');

            routeWiseAttendanceContainer.innerHTML += `
              <div class="bg-[#111827] border border-cyan-500/30 rounded-xl overflow-hidden shadow">
                <div onclick="toggleRouteBox('${attBoxId}')" class="p-3 bg-slate-900/80 hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-800">
                  <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span><h3 class="font-extrabold text-cyan-400 text-xs uppercase">${routeName}</h3></div>
                  <span id="icon-${attBoxId}" class="text-cyan-400 font-bold text-xs">▼</span>
                </div>
                <div id="${attBoxId}" class="p-3 hidden bg-[#0a0f1d] overflow-x-auto">
                  <table class="w-full text-left text-xs font-mono">
                    <thead><tr class="bg-slate-900 text-slate-400"><th class="p-2">Name</th><th class="p-2">ID</th><th class="p-2">Status (${selectedDate})</th></tr></thead>
                    <tbody>${driversAttHTML}${studentsAttHTML}</tbody>
                  </table>
                </div>
              </div>
            `;
          });
        }
      }

      if (routeCardsContainer) {
        routeCardsContainer.innerHTML = '';
        const routeNames = Object.keys(routesMap);
        if (routeNames.length === 0) {
          routeCardsContainer.innerHTML = `<p class="text-slate-500 text-xs">No registered routes.</p>`;
        } else {
          routeNames.forEach((routeName, index) => {
            const group = routesMap[routeName];
            const boxId = `route-box-${index}`;
            const totalCount = group.drivers.length + group.students.length;

            let driversHTML = group.drivers.length > 0 ? group.drivers.map(drv => `
              <div class="bg-cyan-950/40 border border-cyan-500/30 p-2.5 rounded-xl mb-2 flex justify-between items-center text-xs">
                <div><span class="bg-cyan-500 text-black font-extrabold px-1.5 py-0.5 rounded text-[10px] mr-2">DRIVER</span><strong>${drv.name}</strong></div>
                <div class="space-x-2"><span>Bus: <b class="text-cyan-400">${drv.busNumber || 'N/A'}</b></span><button onclick="deleteUser('driver', '${drv.username}')" class="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">Delete</button></div>
              </div>
            `).join('') : `<p class="text-amber-400 text-xs italic mb-2">⚠️ No Driver assigned.</p>`;

            let studentsHTML = group.students.length > 0 ? `
              <table class="w-full text-left text-xs font-mono mt-2">
                <thead><tr class="bg-slate-900 text-slate-400"><th class="p-2">Name</th><th class="p-2">ID</th><th class="p-2">Pickup Stop 📍</th><th class="p-2">Action</th></tr></thead>
                <tbody>${group.students.map(stu => `<tr class="border-b border-slate-800"><td class="p-2 font-bold text-slate-200">${stu.name}</td><td class="p-2 text-cyan-400">${stu.studentId || 'N/A'}</td><td class="p-2 text-amber-300 font-semibold">${stu.pickupStop || 'Not Set'}</td><td class="p-2"><button onclick="deleteUser('student', '${stu.username}')" class="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">Delete</button></td></tr>`).join('')}</tbody>
              </table>
            ` : `<p class="text-slate-500 text-xs italic">No students registered.</p>`;

            routeCardsContainer.innerHTML += `
              <div class="bg-[#111827] border border-cyan-500/30 rounded-xl overflow-hidden shadow-lg">
                <div onclick="toggleRouteBox('${boxId}')" class="p-3 bg-slate-900/80 hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-800">
                  <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span><h3 class="font-extrabold text-cyan-400 text-xs uppercase">${routeName}</h3><span class="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full">${totalCount} Members</span></div>
                  <span id="icon-${boxId}" class="text-cyan-400 font-bold text-xs">▼</span>
                </div>
                <div id="${boxId}" class="p-3 hidden space-y-3 bg-[#0a0f1d]">
                  <div><h4 class="text-[11px] font-bold uppercase text-slate-400 mb-1">Assigned Driver</h4>${driversHTML}</div>
                  <div><h4 class="text-[11px] font-bold uppercase text-slate-400 mb-1">Students List (${group.students.length})</h4>${studentsHTML}</div>
                </div>
              </div>
            `;
          });
        }
      }
    });
  });
}

function sendWarning() {
  const msg = document.getElementById('warningMessage').value.trim();
  if (!msg) return;
  db.ref('liveBus/warning').set(msg).then(() => { alert("Warning broadcasted!"); document.getElementById('warningMessage').value = ''; });
}

function clearWarning() { db.ref('liveBus/warning').remove(); }

function listenForWarnings() {
  db.ref('liveBus/warning').on('value', (snapshot) => {
    const warningMsg = snapshot.val();
    ['driverWarningBanner', 'studentWarningBanner'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (warningMsg) { el.querySelector('span').innerText = warningMsg; el.classList.remove('hidden'); }
        else { el.classList.add('hidden'); }
      }
    });
  });
}

// ==========================================
// DRIVER DASHBOARD
// ==========================================
let watchId = null;

function initDriverDashboard(userData) {
  if (userData) {
    document.getElementById('driverNameDisplay').innerText = userData.name || userData.username;
    document.getElementById('driverIdDisplay').innerText = userData.driverId || "N/A";
    document.getElementById('driverBusNumberDisplay').innerText = userData.busNumber || "N/A";
    document.getElementById('driverPhoneDisplay').innerText = userData.phone || "Not set";

    const stopsListEl = document.getElementById('driverClickableStopsList');
    if (userData.schedule && stopsListEl) {
      const lines = userData.schedule.split('\n').map(s => s.trim()).filter(Boolean);
      stopsListEl.innerHTML = lines.map(line => `
        <div onclick="selectDriverStop('${line.replace(/'/g, "\\'")}')" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-xl cursor-pointer flex justify-between items-center transition">
          <span class="text-slate-200 font-semibold">${line}</span>
          <span class="bg-cyan-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">Select 📍</span>
        </div>
      `).join('');
    } else if (stopsListEl) {
      stopsListEl.innerHTML = `<span class="text-zinc-500 italic">No schedule set by admin.</span>`;
    }
  }

  checkDriverSelfAttendanceStatus();

  const driverRoute = (userData && userData.route) ? userData.route.trim().toLowerCase() : "";
  const today = getTodayDateString();

  db.ref('users/students').on('value', (snapshot) => {
    const students = snapshot.val() || {};
    const tableBody = document.getElementById('driverStudentAttendanceTableBody');
    const badge = document.getElementById('routeStudentCountBadge');

    db.ref(`attendance/students/${today}`).on('value', (attSnapshot) => {
      const todayAttendance = attSnapshot.val() || {};
      if (!tableBody) return;
      tableBody.innerHTML = '';

      let matchingStudents = [];
      Object.keys(students).forEach(username => {
        const student = students[username];
        const studentRoute = (student.route || "").trim().toLowerCase();
        if (!driverRoute || studentRoute === driverRoute || studentRoute.includes(driverRoute) || driverRoute.includes(studentRoute)) {
          matchingStudents.push(student);
        }
      });

      if (badge) badge.innerText = `${matchingStudents.length} Students`;
      if (matchingStudents.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-zinc-500">No students on your route.</td></tr>';
        return;
      }

      matchingStudents.forEach(student => {
        const attRecord = todayAttendance[student.username];
        const currentStatus = attRecord ? attRecord.status : "Pending";
        let statusBadge = currentStatus === "Present" ? '<span class="text-emerald-400 font-bold">Present ✅</span>' : currentStatus === "Absent" ? '<span class="text-red-400 font-bold">Absent ❌</span>' : '<span class="text-zinc-500">Pending</span>';

        tableBody.innerHTML += `
          <tr class="border-b border-zinc-800 hover:bg-zinc-900/50">
            <td class="p-3 font-semibold text-white">${student.name}</td>
            <td class="p-3 text-amber-300 font-semibold">${student.pickupStop || 'Not Set'}</td>
            <td class="p-3 text-slate-400">${student.studentId || 'N/A'} (${student.course || ''})</td>
            <td class="p-3 text-center">
              <div class="flex justify-center items-center gap-2">
                <button onclick="driverMarkStudentAttendance('${student.username}', 'Present')" class="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Present</button>
                <button onclick="driverMarkStudentAttendance('${student.username}', 'Absent')" class="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Absent</button>
              </div>
              <div class="mt-1 text-[11px]">${statusBadge}</div>
            </td>
          </tr>
        `;
      });
    });
  });

  document.getElementById('startBtn').onclick = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    alert("GPS Broadcasting Started!");
    watchId = navigator.geolocation.watchPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const speed = position.coords.speed || 0;
      document.getElementById('speedDisplay').innerText = (speed * 3.6).toFixed(1) + " km/h";

      db.ref(`liveBus/buses/${userData.username}`).set({
        lat, lng, speed, driver: userData.username, driverName: userData.name, busNumber: userData.busNumber, route: userData.route, updatedAt: Date.now()
      });
    }, (error) => alert("Location error: " + error.message), { enableHighAccuracy: true });
  };

  document.getElementById('stopBtn').onclick = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      db.ref(`liveBus/buses/${userData.username}`).remove();
      alert("Broadcast stopped.");
    }
  };
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================
let studentMap = null;
let studentBusMarker = null;

function initStudentDashboard(userData) {
  if (userData) {
    document.getElementById('studentNameDisplay').innerText = userData.name || userData.username;
    document.getElementById('studentIdDisplay').innerText = userData.studentId || "N/A";
    document.getElementById('studentCourseDisplay').innerText = userData.course || "N/A";
    document.getElementById('studentRouteDisplay').innerText = userData.route || "N/A";
    document.getElementById('studentPickupStopDisplay').innerText = userData.pickupStop || "Not Set";
  }

  checkMyAttendanceStatus();
  loadStudentAttendanceHistory();

  const studentRoute = (userData && userData.route) ? userData.route.trim() : "";
  const studentPickup = (userData && userData.pickupStop) ? userData.pickupStop.trim().toLowerCase() : "";

  db.ref(`liveBus/stopArrivals`).on('value', (snapshot) => {
    const arrivals = snapshot.val() || {};
    const arrivalBanner = document.getElementById('busArrivedStopBanner');
    const stopNameTextEl = document.getElementById('arrivedStopNameText');

    let matchedArrival = null;
    Object.keys(arrivals).forEach(routeKey => {
      const arrival = arrivals[routeKey];
      if (arrival && arrival.route && arrival.route.trim().toLowerCase() === studentRoute.toLowerCase()) {
        matchedArrival = arrival;
      }
    });

    if (matchedArrival && !stopArrivalDismissed) {
      if (stopNameTextEl) stopNameTextEl.innerText = matchedArrival.stopName || "Pickup Stop";
      if (arrivalBanner) arrivalBanner.classList.remove('hidden');
      playBeepSound();
    } else {
      if (arrivalBanner) arrivalBanner.classList.add('hidden');
    }
  });

  db.ref('users/drivers').on('value', (snapshot) => {
    const drivers = snapshot.val() || {};
    let assignedDriver = null;

    Object.keys(drivers).forEach(username => {
      const drv = drivers[username];
      if (drv.route && drv.route.trim().toLowerCase() === studentRoute.toLowerCase()) {
        assignedDriver = drv;
      }
    });

    const contactBox = document.getElementById('studentDriverContactInfo');
    const callBtn = document.getElementById('driverCallButton');
    const timetableBox = document.getElementById('routeTimetableList');

    if (assignedDriver) {
      contactBox.innerHTML = `
        <p>Driver: <strong class="text-white">${assignedDriver.name}</strong></p>
        <p>Bus No: <strong class="text-cyan-400">${assignedDriver.busNumber || 'N/A'}</strong></p>
        <p>Phone: <strong class="text-slate-200">${assignedDriver.phone || 'N/A'}</strong></p>
      `;

      if (assignedDriver.phone) {
        callBtn.href = `tel:${assignedDriver.phone}`;
        callBtn.classList.remove('hidden');
      } else {
        callBtn.classList.add('hidden');
      }

      if (timetableBox) {
        if (assignedDriver.schedule) {
          const lines = assignedDriver.schedule.split('\n');
          timetableBox.innerHTML = lines.map(line => {
            const isMyStop = studentPickup && line.toLowerCase().includes(studentPickup);
            const borderClass = isMyStop ? 'border-amber-400 bg-amber-950/30' : 'border-cyan-500';
            const badge = isMyStop ? '<span class="ml-2 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded">MY STOP📍</span>' : '';
            return `
              <div class="flex items-center gap-3 border-l-2 ${borderClass} pl-3 py-1.5 rounded-r-lg">
                <div><strong class="text-slate-200">${line.trim()}</strong>${badge}</div>
              </div>
            `;
          }).join('');
        } else {
          timetableBox.innerHTML = `<p class="text-slate-500 italic">No specific schedule set by Admin.</p>`;
        }
      }
    } else {
      contactBox.innerHTML = `<p class="text-slate-500">No driver assigned to route yet.</p>`;
      callBtn.classList.add('hidden');
      if (timetableBox) timetableBox.innerHTML = `<p class="text-slate-500 italic">No route schedule available.</p>`;
    }
  });

  if (!studentMap && document.getElementById('studentMap')) {
    studentMap = L.map('studentMap').setView([28.6139, 77.2090], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(studentMap);
  }

  db.ref('liveBus/buses').on('value', (snapshot) => {
    const buses = snapshot.val();
    const etaDisplay = document.getElementById('busArrivalTimeDisplay');
    const proximityBanner = document.getElementById('proximityAlertBanner');

    if (!buses) {
      if (studentBusMarker) { studentMap.removeLayer(studentBusMarker); studentBusMarker = null; }
      etaDisplay.innerText = "Bus ETA: Offline";
      if (proximityBanner) proximityBanner.classList.add('hidden');
      proximityDismissed = false;
      return;
    }

    let foundBus = null;
    Object.keys(buses).forEach(driverKey => {
      const bus = buses[driverKey];
      const busRoute = (bus.route || "").trim().toLowerCase();
      if (!studentRoute || busRoute === studentRoute.toLowerCase() || busRoute.includes(studentRoute.toLowerCase())) {
        foundBus = bus;
      }
    });

    if (foundBus && foundBus.lat && foundBus.lng) {
      const lat = foundBus.lat;
      const lng = foundBus.lng;
      const busNo = foundBus.busNumber || "Bus";
      const popupContent = `<b>Bus: ${busNo}</b><br>Route: ${foundBus.route}<br>Driver: ${foundBus.driverName}`;

      if (!studentBusMarker) {
        studentBusMarker = L.marker([lat, lng]).addTo(studentMap).bindPopup(popupContent);
      } else {
        studentBusMarker.setLatLng([lat, lng]);
        studentBusMarker.setPopupContent(popupContent);
      }
      studentMap.setView([lat, lng], 15);

      etaDisplay.innerText = `Bus ETA: ~5 mins (${busNo})`;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const dist = calculateDistanceKm(pos.coords.latitude, pos.coords.longitude, lat, lng);
          if (dist <= 1.5) {
            if (!proximityDismissed) {
              if (proximityBanner) proximityBanner.classList.remove('hidden');
              playBeepSound();
            }
          } else {
            if (proximityBanner) proximityBanner.classList.add('hidden');
            proximityDismissed = false;
          }
        });
      }
    } else {
      if (studentBusMarker) { studentMap.removeLayer(studentBusMarker); studentBusMarker = null; }
      etaDisplay.innerText = "Bus ETA: Bus offline";
      if (proximityBanner) proximityBanner.classList.add('hidden');
      proximityDismissed = false;
    }
  });
}

// Universal Water Ripple & Liquid Shake Handler
document.addEventListener('click', function (e) {
  const btn = e.target.closest('button, .role-card, a.button');
  if (!btn) return;

  btn.classList.remove('water-tap-shake');
  void btn.offsetWidth;
  btn.classList.add('water-tap-shake');

  const rect = btn.getBoundingClientRect();
  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - radius}px`;
  circle.style.top = `${e.clientY - rect.top - radius}px`;
  circle.classList.add('water-ripple');

  const existing = btn.querySelector('.water-ripple');
  if (existing) existing.remove();

  btn.appendChild(circle);

  setTimeout(() => {
    circle.remove();
  }, 600);
});
