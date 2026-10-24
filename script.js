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

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

// Helper Function to Toggle Accordion Box Body
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
// DRIVER MARKS STUDENT ATTENDANCE LOGIC
// ==========================================
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
      status: status, // "Present" or "Absent"
      markedByDriver: currentUserData.username,
      timestamp: Date.now()
    };

    db.ref(`attendance/students/${today}/${studentUsername}`).set(attendanceObj).then(() => {
      alert(`${studentData.name} ki attendance '${status}' mark ho gayi hai!`);
    }).catch((error) => {
      alert("Error: " + error.message);
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
            <td class="p-2.5 font-bold text-slate-300">${date}</td>
            <td class="p-2.5">${statusBadge}</td>
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
  if (!searchId) {
    alert("Kripya Student ID enter karein!");
    return;
  }

  const snapshot = await db.ref('users/students').once('value');
  const students = snapshot.val() || {};
  let found = null;

  Object.keys(students).forEach(username => {
    const stu = students[username];
    if (stu.studentId && stu.studentId.toLowerCase() === searchId) {
      found = stu;
    }
  });

  resultBox.classList.remove('hidden');
  if (found) {
    resultBox.innerHTML = `
      <h3 class="font-bold text-blue-400 text-base mb-1">Student Found:</h3>
      <p><strong>Name:</strong> ${found.name}</p>
      <p><strong>Student ID:</strong> ${found.studentId}</p>
      <p><strong>Username:</strong> ${found.username}</p>
      <p><strong>Course:</strong> ${found.course}</p>
      <p><strong>Assigned Route:</strong> ${found.route}</p>
    `;
  } else {
    resultBox.innerHTML = `<p class="text-red-400 font-semibold">No student found with ID: ${searchId}</p>`;
  }
}

async function searchDriverDetails() {
  const searchId = document.getElementById('searchDriverIdInput').value.trim().toLowerCase();
  const resultBox = document.getElementById('searchResultBox');
  if (!searchId) {
    alert("Kripya Driver ID enter karein!");
    return;
  }

  const snapshot = await db.ref('users/drivers').once('value');
  const drivers = snapshot.val() || {};
  let found = null;

  Object.keys(drivers).forEach(username => {
    const drv = drivers[username];
    if ((drv.driverId && drv.driverId.toLowerCase() === searchId) || drv.username.toLowerCase() === searchId) {
      found = drv;
    }
  });

  resultBox.classList.remove('hidden');
  if (found) {
    resultBox.innerHTML = `
      <h3 class="font-bold text-blue-400 text-base mb-1">Driver Found:</h3>
      <p><strong>Name:</strong> ${found.name}</p>
      <p><strong>Driver ID:</strong> ${found.driverId || 'N/A'}</p>
      <p><strong>Username:</strong> ${found.username}</p>
      <p><strong>Bus Number:</strong> ${found.busNumber}</p>
      <p><strong>Reg. Number:</strong> ${found.regNumber || 'N/A'}</p>
      <p><strong>Assigned Route:</strong> ${found.route}</p>
    `;
  } else {
    resultBox.innerHTML = `<p class="text-red-400 font-semibold">No driver found with ID/Username: ${searchId}</p>`;
  }
}

// ==========================================
// USER MANAGEMENT & EMERGENCY
// ==========================================
function addNewUser(event) {
  if (event) event.preventDefault();

  const role = document.getElementById('newRole').value;
  const name = document.getElementById('newName').value.trim();
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const route = document.getElementById('newRoute').value.trim();

  let userData = {
    username: username,
    password: password,
    name: name,
    route: route,
    createdAt: new Date().toISOString()
  };

  if (role === 'driver') {
    userData.driverId = document.getElementById('newDriverId').value.trim();
    userData.busNumber = document.getElementById('newBusNumber').value.trim();
    userData.regNumber = document.getElementById('newRegNumber').value.trim();
  } else {
    userData.studentId = document.getElementById('newStudentId').value.trim();
    userData.course = document.getElementById('newCourse').value.trim();
  }

  db.ref(`users/${role}s/${username}`).set(userData).then(() => {
    alert(`${role.toUpperCase()} account successfully ban gaya hai!`);
    document.getElementById('addUserForm').reset();
    toggleUserFields();
  }).catch((error) => {
    alert("Error: " + error.message);
  });
}

function deleteUser(role, username) {
  if (confirm(`Kya aap waqai ${username} (${role}) ko delete karna chahte hain?`)) {
    if (role === 'driver') {
      db.ref(`liveBus/buses/${username}`).remove();
    }
    db.ref(`users/${role}s/${username}`).remove().then(() => {
      alert("User successfully delete ho gaya hai!");
    });
  }
}

function forceStopBus(driverKey) {
  if (confirm(`Kya aap driver '${driverKey}' ki live bus tracking force-stop karna chahte hain?`)) {
    db.ref(`liveBus/buses/${driverKey}`).remove();
  }
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

  db.ref(`liveBus/emergencies/${currentUserData.username}`).set(emergencyData).then(() => {
    alert("🚨 Emergency alert Admin ko bhej diya gaya hai!");
  });
}

function clearEmergencyAlerts() {
  db.ref(`liveBus/emergencies`).remove().then(() => {
    alert("Emergency alerts dismiss kar diye gaye hain.");
  });
}

// ==========================================
// ADMIN DASHBOARD INITIALIZATION
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
      Object.keys(emergencies).forEach((key) => {
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
      if (activeBusTableBody) activeBusTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">No active buses broadcasting.</td></tr>';
      Object.keys(adminBusMarkers).forEach(key => adminMap.removeLayer(adminBusMarkers[key]));
      adminBusMarkers = {};
      return;
    }

    const activeKeys = Object.keys(buses);
    if (activeCountEl) activeCountEl.innerText = `${activeKeys.length} Active Bus${activeKeys.length > 1 ? 'es' : ''}`;

    if (activeBusTableBody) {
      activeBusTableBody.innerHTML = '';
      activeKeys.forEach((driverKey) => {
        const bus = buses[driverKey];
        const speed = bus.speed ? (bus.speed * 3.6).toFixed(1) : "0.0";
        activeBusTableBody.innerHTML += `
          <tr class="border-b border-blue-500/10 hover:bg-slate-800/50">
            <td class="p-3 font-bold text-blue-400">${bus.busNumber || 'N/A'}</td>
            <td class="p-3 text-slate-300">${driverKey}</td>
            <td class="p-3 text-slate-400">${bus.route || 'Route'}</td>
            <td class="p-3 text-emerald-400 font-mono">${speed} km/h</td>
            <td class="p-3"><button onclick="forceStopBus('${driverKey}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-xl text-xs font-bold uppercase">Force Stop</button></td>
          </tr>
        `;
      });
    }

    const bounds = [];
    activeKeys.forEach((driverKey) => {
      const bus = buses[driverKey];
      if (bus && bus.lat && bus.lng) {
        bounds.push([bus.lat, bus.lng]);
        const popupText = `<div class="text-sm"><h3 class="font-bold text-blue-400">Bus: ${bus.busNumber || 'N/A'}</h3><p>Route: ${bus.route}</p><p>Driver: ${bus.driverName}</p></div>`;

        if (!adminBusMarkers[driverKey]) {
          adminBusMarkers[driverKey] = L.marker([bus.lat, bus.lng]).addTo(adminMap).bindPopup(popupText);
        } else {
          adminBusMarkers[driverKey].setLatLng([bus.lat, bus.lng]);
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

function setupRealtimeListeners() {
  const dateFilter = document.getElementById('attendanceDateFilter');
  db.ref('users').on('value', () => fetchAndRenderData());
  db.ref('attendance').on('value', () => fetchAndRenderData());
  if (dateFilter) dateFilter.onchange = () => fetchAndRenderData();
}

function fetchAndRenderData() {
  const dateFilter = document.getElementById('attendanceDateFilter');
  const selectedDate = dateFilter ? dateFilter.value : getTodayDateString();

  const driverTableBody = document.getElementById('adminDriverAttendanceBody');
  const studentTableBody = document.getElementById('adminStudentAttendanceBody');
  const routeCardsContainer = document.getElementById('routeCardsContainer');

  db.ref('users').once('value', (userSnapshot) => {
    const usersData = userSnapshot.val() || {};
    const drivers = usersData.drivers || {};
    const students = usersData.students || {};

    db.ref(`attendance`).once('value', (attSnapshot) => {
      const attData = attSnapshot.val() || {};
      const driverAtt = (attData.drivers && attData.drivers[selectedDate]) || {};
      const studentAtt = (attData.students && attData.students[selectedDate]) || {};

      // Group Users by Route
      const routesMap = {};

      // Process Drivers
      Object.keys(drivers).forEach((username) => {
        const drv = drivers[username];
        const routeName = drv.route ? drv.route.trim() : "Unassigned Route";
        if (!routesMap[routeName]) {
          routesMap[routeName] = { drivers: [], students: [] };
        }
        routesMap[routeName].drivers.push(drv);
      });

      // Process Students
      Object.keys(students).forEach((username) => {
        const stu = students[username];
        const routeName = stu.route ? stu.route.trim() : "Unassigned Route";
        if (!routesMap[routeName]) {
          routesMap[routeName] = { drivers: [], students: [] };
        }
        routesMap[routeName].students.push(stu);
      });

      // Render Route Accordion Cards in Admin Dashboard
      if (routeCardsContainer) {
        routeCardsContainer.innerHTML = '';
        const routeNames = Object.keys(routesMap);

        if (routeNames.length === 0) {
          routeCardsContainer.innerHTML = `<p class="text-slate-500 text-sm">No registered routes or users found.</p>`;
        } else {
          routeNames.forEach((routeName, index) => {
            const group = routesMap[routeName];
            const boxId = `route-box-${index}`;
            const totalCount = group.drivers.length + group.students.length;

            let driversHTML = '';
            if (group.drivers.length > 0) {
              group.drivers.forEach((drv) => {
                driversHTML += `
                  <div class="bg-blue-950/40 border border-blue-500/30 p-3 rounded-xl mb-2 flex flex-wrap justify-between items-center text-xs">
                    <div>
                      <span class="bg-blue-500 text-black font-extrabold px-2 py-0.5 rounded text-[10px] mr-2">DRIVER</span>
                      <strong class="text-white text-sm">${drv.name}</strong>
                      <span class="text-slate-400 ml-2">(User: ${drv.username})</span>
                    </div>
                    <div class="text-slate-300 space-x-3">
                      <span>ID: <b class="text-blue-400">${drv.driverId || 'N/A'}</b></span>
                      <span>Bus No: <b class="text-blue-400">${drv.busNumber || 'N/A'}</b></span>
                      <span>Reg: <b class="text-blue-400">${drv.regNumber || 'N/A'}</b></span>
                      <button onclick="deleteUser('driver', '${drv.username}')" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[10px] font-bold uppercase ml-2">Delete</button>
                    </div>
                  </div>
                `;
              });
            } else {
              driversHTML = `<p class="text-amber-400/80 text-xs italic mb-2">⚠️ No Driver assigned to this route yet.</p>`;
            }

            let studentsHTML = '';
            if (group.students.length > 0) {
              studentsHTML += `
                <div class="overflow-x-auto mt-2">
                  <table class="w-full text-left text-xs font-mono">
                    <thead>
                      <tr class="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <th class="p-2">Student Name</th>
                        <th class="p-2">Student ID</th>
                        <th class="p-2">Username</th>
                        <th class="p-2">Course</th>
                        <th class="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
              `;
              group.students.forEach((stu) => {
                studentsHTML += `
                  <tr class="border-b border-slate-800/60 hover:bg-slate-800/40">
                    <td class="p-2 font-bold text-slate-200">${stu.name}</td>
                    <td class="p-2 text-blue-400">${stu.studentId || 'N/A'}</td>
                    <td class="p-2 text-slate-400">${stu.username}</td>
                    <td class="p-2 text-slate-400">${stu.course || 'N/A'}</td>
                    <td class="p-2"><button onclick="deleteUser('student', '${stu.username}')" class="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">Delete</button></td>
                  </tr>
                `;
              });
              studentsHTML += `</tbody></table></div>`;
            } else {
              studentsHTML = `<p class="text-slate-500 text-xs italic">No Students registered on this route yet.</p>`;
            }

            routeCardsContainer.innerHTML += `
              <div class="bg-[#111827] border border-blue-500/30 rounded-2xl overflow-hidden shadow-lg">
                <!-- Route Box Header (Clickable) -->
                <div onclick="toggleRouteBox('${boxId}')" class="p-4 bg-slate-900/80 hover:bg-slate-800/80 cursor-pointer flex justify-between items-center border-b border-slate-800 transition">
                  <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                    <h3 class="font-extrabold text-blue-400 text-sm uppercase tracking-wider">${routeName}</h3>
                    <span class="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">${totalCount} Members</span>
                  </div>
                  <span id="icon-${boxId}" class="text-blue-400 font-bold text-xs">▼</span>
                </div>

                <!-- Route Details (Driver on Top, Students Below) -->
                <div id="${boxId}" class="p-4 hidden space-y-4 bg-[#0a0f1d]">
                  <div>
                    <h4 class="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Assigned Driver Info</h4>
                    ${driversHTML}
                  </div>
                  <div>
                    <h4 class="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Assigned Students List (${group.students.length})</h4>
                    ${studentsHTML}
                  </div>
                </div>
              </div>
            `;
          });
        }
      }

      // Render Admin Attendance Tables
      if (driverTableBody) {
        driverTableBody.innerHTML = '';
        Object.keys(drivers).forEach((username) => {
          const user = drivers[username];
          const isPresent = driverAtt[username] && driverAtt[username].status === "Present";
          const badge = isPresent ? '<span class="text-emerald-400 font-bold">Present ✅</span>' : '<span class="text-red-400 font-bold">Absent ❌</span>';
          driverTableBody.innerHTML += `<tr class="border-b border-blue-500/10"><td class="p-2.5 font-semibold text-slate-300">${user.name}</td><td class="p-2.5 text-blue-400 font-bold">${user.driverId || username} (Bus: ${user.busNumber || 'N/A'})</td><td class="p-2.5">${badge}</td></tr>`;
        });
      }

      if (studentTableBody) {
        studentTableBody.innerHTML = '';
        Object.keys(students).forEach((username) => {
          const user = students[username];
          const isPresent = studentAtt[username] && studentAtt[username].status === "Present";
          const badge = isPresent ? '<span class="text-emerald-400 font-bold">Present ✅</span>' : '<span class="text-red-400 font-bold">Absent ❌</span>';
          studentTableBody.innerHTML += `<tr class="border-b border-blue-500/10"><td class="p-2.5 font-semibold text-slate-300">${user.name}</td><td class="p-2.5 text-slate-400">${user.studentId || 'N/A'}</td><td class="p-2.5 text-slate-400">${user.course || 'N/A'}</td><td class="p-2.5">${badge}</td></tr>`;
        });
      }
    });
  });
}

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
  db.ref('liveBus/warning').remove();
}

function listenForWarnings() {
  db.ref('liveBus/warning').on('value', (snapshot) => {
    const warningMsg = snapshot.val();
    const driverBanner = document.getElementById('driverWarningBanner');
    const driverText = document.getElementById('driverWarningText');
    const studentBanner = document.getElementById('studentWarningBanner');
    const studentText = document.getElementById('studentWarningText');

    if (warningMsg) {
      if (driverBanner) { driverText.innerText = warningMsg; driverBanner.classList.remove('hidden'); }
      if (studentBanner) { studentText.innerText = warningMsg; studentBanner.classList.remove('hidden'); }
    } else {
      if (driverBanner) driverBanner.classList.add('hidden');
      if (studentBanner) studentBanner.classList.add('hidden');
    }
  });
}

// ==========================================
// DRIVER DASHBOARD
// ==========================================
let watchId = null;

function initDriverDashboard(userData) {
  if (userData) {
    if (document.getElementById('driverNameDisplay')) document.getElementById('driverNameDisplay').innerText = userData.name || userData.username;
    if (document.getElementById('driverIdDisplay')) document.getElementById('driverIdDisplay').innerText = userData.driverId || "N/A";
    if (document.getElementById('driverBusNumberDisplay')) document.getElementById('driverBusNumberDisplay').innerText = userData.busNumber || "N/A";
  }

  // Load Students assigned to Driver's Route
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

      Object.keys(students).forEach((username) => {
        const student = students[username];
        const studentRoute = (student.route || "").trim().toLowerCase();
        
        if (!driverRoute || studentRoute === driverRoute || studentRoute.includes(driverRoute) || driverRoute.includes(studentRoute)) {
          matchingStudents.push(student);
        }
      });

      if (badge) badge.innerText = `${matchingStudents.length} Students`;

      if (matchingStudents.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-zinc-500">No students registered on your route.</td></tr>';
        return;
      }

      matchingStudents.forEach((student) => {
        const attRecord = todayAttendance[student.username];
        const currentStatus = attRecord ? attRecord.status : "Not Marked";

        let statusBadge = `<span class="text-zinc-500">Pending</span>`;
        if (currentStatus === "Present") statusBadge = `<span class="text-emerald-400 font-bold">Present ✅</span>`;
        if (currentStatus === "Absent") statusBadge = `<span class="text-red-400 font-bold">Absent ❌</span>`;

        tableBody.innerHTML += `
          <tr class="border-b border-zinc-800 hover:bg-zinc-900/50">
            <td class="p-3 font-semibold text-white">${student.name}</td>
            <td class="p-3 text-slate-400">${student.studentId || 'N/A'}</td>
            <td class="p-3 text-slate-400">${student.course || 'N/A'}</td>
            <td class="p-3 text-center">
              <div class="flex justify-center items-center gap-2">
                <button onclick="driverMarkStudentAttendance('${student.username}', 'Present')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">Present</button>
                <button onclick="driverMarkStudentAttendance('${student.username}', 'Absent')" class="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">Absent</button>
              </div>
              <div class="mt-1 text-[11px]">${statusBadge}</div>
            </td>
          </tr>
        `;
      });
    });
  });

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');

  if (startBtn) {
    startBtn.onclick = () => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
      }
      alert("GPS Broadcasting Started!");
      watchId = navigator.geolocation.watchPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed || 0;

        if (document.getElementById('speedDisplay')) document.getElementById('speedDisplay').innerText = (speed * 3.6).toFixed(1) + " km/h";

        const driverId = userData ? userData.username : "driver_default";
        db.ref(`liveBus/buses/${driverId}`).set({
          lat: lat,
          lng: lng,
          speed: speed,
          driver: driverId,
          driverName: userData ? userData.name : "Driver",
          busNumber: userData ? userData.busNumber : "BUS-01",
          route: userData ? userData.route : "College Route",
          updatedAt: Date.now()
        });
      }, (error) => {
        alert("Location error: " + error.message);
      }, { enableHighAccuracy: true });
    };
  }

  if (stopBtn) {
    stopBtn.onclick = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        db.ref(`liveBus/buses/${userData.username}`).remove();
        alert("Broadcast stopped.");
      }
    };
  }
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================
let studentMap = null;
let studentBusMarker = null;

function initStudentDashboard(userData) {
  if (userData) {
    if (document.getElementById('studentNameDisplay')) document.getElementById('studentNameDisplay').innerText = userData.name || userData.username;
    if (document.getElementById('studentIdDisplay')) document.getElementById('studentIdDisplay').innerText = userData.studentId || "N/A";
    if (document.getElementById('studentCourseDisplay')) document.getElementById('studentCourseDisplay').innerText = userData.course || "N/A";
  }

  checkMyAttendanceStatus();
  loadStudentAttendanceHistory();

  if (!studentMap && document.getElementById('studentMap')) {
    studentMap = L.map('studentMap').setView([28.6139, 77.2090], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(studentMap);
  }

  const studentRoute = (userData && userData.route) ? userData.route.trim().toLowerCase() : "";

  db.ref('liveBus/buses').on('value', (snapshot) => {
    const buses = snapshot.val();
    const etaDisplay = document.getElementById('busArrivalTimeDisplay');

    if (!buses) {
      if (studentBusMarker) { studentMap.removeLayer(studentBusMarker); studentBusMarker = null; }
      if (etaDisplay) etaDisplay.innerText = "Bus ETA: Not Active";
      return;
    }

    let foundBus = null;
    Object.keys(buses).forEach((driverKey) => {
      const bus = buses[driverKey];
      const busRoute = (bus.route || "").trim().toLowerCase();
      if (!studentRoute || busRoute === studentRoute || busRoute.includes(studentRoute) || studentRoute.includes(busRoute)) {
        foundBus = bus;
      }
    });

    if (foundBus && foundBus.lat && foundBus.lng) {
      const lat = foundBus.lat;
      const lng = foundBus.lng;
      const busNo = foundBus.busNumber || "Bus";
      const routeName = foundBus.route || "";

      const popupContent = `<b>Bus: ${busNo}</b><br>Route: ${routeName}<br>Driver: ${foundBus.driverName}`;

      if (!studentBusMarker) {
        studentBusMarker = L.marker([lat, lng]).addTo(studentMap).bindPopup(popupContent);
      } else {
        studentBusMarker.setLatLng([lat, lng]);
        studentBusMarker.setPopupContent(popupContent);
      }
      studentMap.setView([lat, lng], 15);

      if (etaDisplay) {
        const randomEta = Math.floor(Math.random() * 10) + 3; 
        etaDisplay.innerText = `Bus ETA: ~${randomEta} mins (${busNo})`;
      }
    } else {
      if (studentBusMarker) { studentMap.removeLayer(studentBusMarker); studentBusMarker = null; }
      if (etaDisplay) etaDisplay.innerText = "Bus ETA: Bus offline";
    }
  });
}
