/**
 * ⚠️ IMPORTANT: This is a Browser-Side Application
 * 
 * You cannot run this file directly with Node.js because it relies on the Browser's 'window' and 'document' objects.
 * 
 * 👉 TO RUN THE APP:
 * 1. Open the 'run_app.bat' file in the root directory (double-click it).
 * 2. Or run 'python -m uvicorn src.main:app --reload' in the terminal.
 * 3. Open http://localhost:8000 in your browser.
 */

// State
const state = {
    subjects: [
        { id: 1, name: 'Data Structures', credits: 4, confidence: 2 },
        { id: 2, name: 'Algorithms', credits: 4, confidence: 3 },
        { id: 3, name: 'Operating Systems', credits: 3, confidence: 4 }
    ]
};

// Elements
const subjectsContainer = document.getElementById('subjects-container');
const timelineContainer = document.getElementById('timeline-container');
const insightsList = document.getElementById('insights-list');
const statsContainer = document.getElementById('stats-container');
const loading = document.getElementById('loading');
const dashboard = document.getElementById('dashboard');

// Helpers
function formatDate(dateStr) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

function formatTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Render Input Rows
function renderSubjects() {
    subjectsContainer.innerHTML = '';
    // Header
    const header = document.createElement('div');
    header.className = "grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 mb-2 px-2";
    header.innerHTML = `
        <div class="col-span-4">Subject Name</div>
        <div class="col-span-2">Credits</div>
        <div class="col-span-4">Confidence (1-5)</div>
        <div class="col-span-2"></div>
    `;
    subjectsContainer.appendChild(header);

    state.subjects.forEach((sub, index) => {
        const row = document.createElement('div');
        row.className = "grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100";
        row.innerHTML = `
            <div class="col-span-4">
                <input type="text" value="${sub.name}" onchange="updateSubject(${index}, 'name', this.value)" class="w-full bg-transparent border-0 focus:ring-0 p-0 text-gray-800 font-medium placeholder-gray-400" placeholder="Subject">
            </div>
            <div class="col-span-2">
                <input type="number" value="${sub.credits}" onchange="updateSubject(${index}, 'credits', this.value)" class="w-full bg-transparent border-0 focus:ring-0 p-0 text-center text-gray-600" min="1" max="10">
            </div>
            <div class="col-span-4 flex items-center space-x-2">
                <input type="range" min="1" max="5" value="${sub.confidence}" onchange="updateSubject(${index}, 'confidence', this.value)" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                <span class="text-xs font-bold ${sub.confidence < 3 ? 'text-red-500' : 'text-green-500'} w-4">${sub.confidence}</span>
            </div>
            <div class="col-span-2 text-right">
                <button onclick="removeSubject(${index})" class="text-red-400 hover:text-red-600 font-bold px-2">&times;</button>
            </div>
        `;
        subjectsContainer.appendChild(row);
    });
}

// Export to window for inline HTML handlers
window.updateSubject = function (index, field, value) {
    if (field === 'credits' || field === 'confidence') value = Number(value);
    state.subjects[index][field] = value;
    // Don't re-render entire list on every keystroke for text inputs to avoid focus loss
    if (field !== 'name') renderSubjects();
    // For name, just update state. Using 'change' event instead of 'input' helps.
};

window.addSubjectRow = function () {
    state.subjects.push({ id: Date.now(), name: '', credits: 3, confidence: 3 });
    renderSubjects();
};

window.removeSubject = function (index) {
    if (state.subjects.length > 1) {
        state.subjects.splice(index, 1);
        renderSubjects();
    }
};

window.generateSchedule = async function () {
    const studentName = document.getElementById('studentName').value;
    const dailyHours = document.getElementById('dailyHours').value;
    const branch = document.getElementById('branch').value;

    // Prepare Payload
    const payload = {
        profile: {
            name: studentName,
            branch: branch,
            preferences: {
                daily_study_hours: Number(dailyHours),
                preferred_time: "Morning"
            }
        },
        subjects: state.subjects.map(s => ({
            name: s.name,
            credits: Number(s.credits),
            confidence_level: Number(s.confidence),
            topics: []
        }))
    };

    // UI Loading
    loading.classList.remove('hidden');
    dashboard.classList.add('hidden');
    document.getElementById('generateBtn').disabled = true;

    try {
        const res = await fetch('/api/generate-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'Failed to generate');
        }

        const data = await res.json();
        renderDashboard(data);
    } catch (err) {
        alert("Error generating schedule: " + err.message);
        console.error(err);
    } finally {
        loading.classList.add('hidden');
        document.getElementById('generateBtn').disabled = false;
    }
};

function renderDashboard(data) {
    dashboard.classList.remove('hidden');

    // 1. Insights
    insightsList.innerHTML = data.insights.map(i => `<li class="pb-1">${i}</li>`).join('');

    // 2. Schedule
    timelineContainer.innerHTML = '';

    // Group by Date for cleaner UI
    const grouped = {};
    data.schedule.forEach(session => {
        const dateKey = session.start_time.split('T')[0]; // Simple ISO split
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(session);
    });

    Object.keys(grouped).sort().forEach(dateStr => {
        const daySessions = grouped[dateStr];
        const dayDiv = document.createElement('div');
        dayDiv.className = "mb-6";
        dayDiv.innerHTML = `<h4 class="text-md font-bold text-gray-500 mb-3 ml-1 uppercase tracking-wider">${formatDate(dateStr)}</h4>`;

        daySessions.forEach(session => {
            // Color Coding based on Session Type
            let borderClass = "border-l-4 border-indigo-500";
            let bgClass = "bg-white";
            let icon = "📚";

            if (session.session_type.includes("Foundation")) {
                borderClass = "border-l-4 border-amber-500";
                bgClass = "bg-amber-50";
                icon = "🏗️";
            } else if (session.session_type.includes("Practice")) {
                borderClass = "border-l-4 border-emerald-500";
                bgClass = "bg-emerald-50";
                icon = "✍️";
            }

            const card = document.createElement('div');
            card.className = `flex mb-3 p-4 rounded-r-lg shadow-sm ${bgClass} ${borderClass} hover:shadow-md transition cursor-pointer`;
            card.innerHTML = `
                <div class="mr-4 text-center">
                    <span class="block text-xs font-bold text-gray-500 uppercase">${formatTime(session.start_time)}</span>
                    <span class="text-gray-400 text-xs">${session.duration_minutes}m</span>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                        <h5 class="font-bold text-gray-800 text-lg">${session.subject_name}</h5>
                        <span class="text-xs font-semibold px-2 py-1 rounded bg-white bg-opacity-50 text-gray-600 shadow-sm border border-gray-100">${session.session_type}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2 font-medium">${icon} ${session.topic}</p>
                    <p class="text-xs text-gray-500 italic bg-white inline-block px-2 py-1 rounded border border-gray-200">🤖 Why: ${session.reason}</p>
                </div>
            `;
            dayDiv.appendChild(card);
        });

        timelineContainer.appendChild(dayDiv);
    });

    // 3. Stats (Simple distribution)
    const subjectCounts = {};
    data.schedule.forEach(s => {
        subjectCounts[s.subject_name] = (subjectCounts[s.subject_name] || 0) + s.duration_minutes;
    });

    // Max hours for progress bar calculation
    const maxVal = Math.max(...Object.values(subjectCounts));

    statsContainer.innerHTML = Object.entries(subjectCounts).map(([sub, mins]) => `
        <div>
            <div class="flex justify-between text-xs mb-1">
                <span class="font-semibold text-gray-700">${sub}</span>
                <span class="text-gray-500">${(mins / 60).toFixed(1)}h</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-indigo-600 h-2 rounded-full" style="width: ${(mins / maxVal) * 100}%"></div>
            </div>
        </div>
    `).join('');
}

// Init
renderSubjects();
