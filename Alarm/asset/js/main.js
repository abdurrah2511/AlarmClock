// Global Application Array
let alarmsArray = [];

// DOM Elements
const currentTimeDisplay = document.getElementById('current-time');
const hrInput = document.getElementById('alarm-hours');
const minInput = document.getElementById('alarm-minutes');
const periodInput = document.getElementById('alarm-period');
const addAlarmBtn = document.getElementById('add-alarm-btn');
const alarmsListContainer = document.getElementById('active-alarms-list');
const themeToggle = document.getElementById('theme-toggle');

// Helper Utility: Prepend Zeros
const appendZero = (val) => String(val).padStart(2, '0');

// ==================== CHRONOLOGICAL SORTING HELPER ====================
// Converts 12-hour format configurations into raw minutes from midnight (0-1439) for precise mathematical sorting
function getAbsoluteMinutes(hours, minutes, period) {
    let internalHours = parseInt(hours);
    const internalMinutes = parseInt(minutes);
    
    if (period === 'PM' && internalHours !== 12) internalHours += 12;
    if (period === 'AM' && internalHours === 12) internalHours = 0;
    
    return internalHours * 60 + internalMinutes;
}

// ==================== DIGITAL CLOCK ENGINE ====================
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const period = hours >= 12 ? 'PM' : 'AM';

    // Transform raw system 24hr format time into traditional 12hr output
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' value evaluated as 12 AM

    const formattedTimeStr = `${appendZero(hours)}:${appendZero(minutes)}:${appendZero(seconds)} ${period}`;
    currentTimeDisplay.textContent = formattedTimeStr;

    // Direct string match comparison validation against running system seconds tick
    if (seconds === 0) {
        const timeKeyToCheck = `${appendZero(hours)}:${appendZero(minutes)} ${period}`;
        
        alarmsArray.forEach(alarm => {
            if (alarm.isActive && alarm.timeString === timeKeyToCheck) {
                // Short break delay prevents blocking background calculations during initial sync rendering
                setTimeout(() => {
                    alert(`⏰ Alarm Ringing! [${alarm.timeString}]`);
                }, 10);
            }
        });
    }
}

// ==================== ALARM LOGIC PIPELINES ====================
function addNewAlarm() {
    let hoursVal = hrInput.value.trim();
    let minutesVal = minInput.value.trim();
    const periodVal = periodInput.value;

    // Input Sanitization Fallbacks
    if (!hoursVal || parseInt(hoursVal) < 1 || parseInt(hoursVal) > 12) hoursVal = "12";
    if (!minutesVal || parseInt(minutesVal) < 0 || parseInt(minutesVal) > 59) minutesVal = "00";

    hoursVal = appendZero(parseInt(hoursVal));
    minutesVal = appendZero(parseInt(minutesVal));

    const timeString = `${hoursVal}:${minutesVal} ${periodVal}`;

    // Block exactly duplicated alarms
    const targetDuplicate = alarmsArray.find(alarm => alarm.timeString === timeString);
    if (targetDuplicate) {
        alert("This exact alarm configuration already exists.");
        return;
    }

    const absoluteWeight = getAbsoluteMinutes(hoursVal, minutesVal, periodVal);

    const newAlarmObj = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        timeString: timeString,
        absoluteWeight: absoluteWeight,
        isActive: true
    };

    alarmsArray.push(newAlarmObj);
    
    // Chronologically sort all alarms
    alarmsArray.sort((a, b) => a.absoluteWeight - b.absoluteWeight);

    renderAlarmsList();

    // Clean inputs up back to baseline placeholders
    hrInput.value = '';
    minInput.value = '';
}

function deleteAlarm(id) {
    alarmsArray = alarmsArray.filter(alarm => alarm.id !== id);
    renderAlarmsList();
}

function toggleAlarmState(id, isChecked) {
    const targetAlarm = alarmsArray.find(alarm => alarm.id === id);
    if (targetAlarm) {
        targetAlarm.isActive = isChecked;
    }
}

// ==================== DOM INJECTION VIEW LAYER ====================
function renderAlarmsList() {
    alarmsListContainer.innerHTML = '';

    if (alarmsArray.length === 0) {
        alarmsListContainer.innerHTML = `<p style="text-align:center; font-size:12px; color:var(--text-muted);">No alarms configured.</p>`;
        return;
    }

    alarmsArray.forEach(alarm => {
        const alarmItemRow = document.createElement('div');
        alarmItemRow.className = 'alarm-item';
        
        alarmItemRow.innerHTML = `
            <div class="alarm-time-spec">${alarm.timeString}</div>
            <div class="alarm-actions-pane">
                <label class="switch-label">
                    <input type="checkbox" data-id="${alarm.id}" class="alarm-toggle-checkbox" ${alarm.isActive ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
                <button class="btn-delete" data-id="${alarm.id}">Delete</button>
            </div>
        `;

        // Attach standalone scoped event attachments directly to child buttons safely
        alarmItemRow.querySelector('.alarm-toggle-checkbox').addEventListener('change', (e) => {
            toggleAlarmState(alarm.id, e.target.checked);
        });

        alarmItemRow.querySelector('.btn-delete').addEventListener('click', () => {
            deleteAlarm(alarm.id);
        });

        alarmsListContainer.appendChild(alarmItemRow);
    });
}

// ==================== CONTEXT MANAGEMENT INITIALIZATION ====================
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.querySelector('.mode-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

addAlarmBtn.addEventListener('click', addNewAlarm);

// Start Runtime Engine Loops
setInterval(updateClock, 1000);
updateClock(); // Initial instant tick execution to avoid empty 1-second blank flash
renderAlarmsList();