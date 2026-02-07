/**
 * AI Study OS Core v2.0
 * Handles the advanced frontend logic for the Study Planner.
 */

// State Management
// State Management
const SystemState = {
    profile: {
        name: "", // User will enter
        college: "",
        branch: "", // User will enter
        year: 2026,
        email: "",
        preferences: { daily_study_hours: 4, preferred_time: "Morning" },
        behavior: { missed_streak: 0, last_session_delay_minutes: 0 }
    },
    subjects: [
        { id: "s1", name: "Data Structures", credits: 4, difficulty: "Hard" },
        { id: "s2", name: "Operating Systems", credits: 3, difficulty: "Medium" },
        { id: "s3", name: "Engineering Mathematics", credits: 4, difficulty: "Hard" }
    ],
    generatedData: null
};

// --- RANDOM DATA GENERATOR FOR DEMO ---
function generateMockTopics(subjectName, subjectId) {
    // Determine complexity based on name
    const topics = [];
    const prefixes = ["Intro to", "Advanced", "Applications of", "Theory of"];

    // Create 3 topics per subject for the graph
    topics.push({
        id: `${subjectId}_t1`,
        name: `${prefixes[0]} ${subjectName}`,
        subject_id: subjectName,
        difficulty_level: "Easy", // Start easy
        avg_quiz_score: 85,
        prerequisites: []
    });

    topics.push({
        id: `${subjectId}_t2`,
        name: `${prefixes[3]} ${subjectName}`,
        subject_id: subjectName,
        difficulty_level: "Medium",
        avg_quiz_score: 60,
        prerequisites: [`${subjectId}_t1`] // Dependency!
    });

    topics.push({
        id: `${subjectId}_t3`,
        name: `${prefixes[1]} ${subjectName}`,
        subject_id: subjectName,
        difficulty_level: "Hard",
        avg_quiz_score: 40, // Low score -> Needs focus
        prerequisites: [`${subjectId}_t2`] // Dependency!
    });

    return topics;
}

// --- UI RENDERING ---

async function runAIEngine() {
    // Show Loading
    document.getElementById('ai-loading').classList.remove('hidden');
    document.getElementById('dashboard-content').classList.add('hidden');
    document.getElementById('setup-panel').classList.add('opacity-50', 'pointer-events-none');

    // Construct Payload
    let allTopics = [];
    SystemState.subjects.forEach(sub => {
        const subTopics = generateMockTopics(sub.name, sub.id);
        allTopics = [...allTopics, ...subTopics];
    });

    const payload = {
        profile: SystemState.profile,
        topics: allTopics
    };

    try {
        const res = await fetch('/api/generate-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        SystemState.generatedData = data;

        // Enhance UI
        setTimeout(() => {
            renderDashboard(data);
            document.getElementById('ai-loading').classList.add('hidden');
            document.getElementById('dashboard-content').classList.remove('hidden');
            document.getElementById('setup-panel').classList.remove('opacity-50', 'pointer-events-none');
            document.getElementById('mission-card').classList.remove('hidden');
            document.getElementById('sim-controls').classList.remove('hidden');
        }, 1500); // Fake delay for "AI Thinking" effect

    } catch (err) {
        alert("System Error: " + err.message);
        console.error(err);
        document.getElementById('ai-loading').classList.add('hidden');
        document.getElementById('setup-panel').classList.remove('opacity-50', 'pointer-events-none');
    }
}

function renderDashboard(data) {
    // 1. Daily Mission (Module 3)
    const mission = data.daily_mission;
    document.getElementById('mission-theme').textContent = mission.focus_theme;
    document.getElementById('mission-tip').textContent = "🧠 AI Tip: " + mission.energy_tip;

    const tasksHtml = mission.sessions.map((s, i) => `
        <div class="flex items-center justify-between bg-black/20 p-2 rounded border border-white/5">
            <div class="flex items-center space-x-3">
                <span class="text-xs font-mono text-gray-400">0${i + 1}</span>
                <div>
                    <div class="text-sm font-bold text-white">${s.topic_name}</div>
                    <div class="text-xs text-indigo-300">${s.session_type}</div>
                </div>
            </div>
            <span class="text-xs font-mono bg-indigo-900/50 px-2 py-1 rounded text-indigo-200">${s.duration_minutes}m</span>
        </div>
    `).join('');
    document.getElementById('mission-tasks').innerHTML = tasksHtml;

    // 2. Timeline Feed
    const feed = document.getElementById('timeline-feed');
    feed.innerHTML = data.upcoming_schedule.map(s => {
        let borderColor = "border-slate-600";
        if (s.session_type.includes("Emergency")) borderColor = "border-red-500";
        if (s.session_type === "Deep Work") borderColor = "border-indigo-500";

        return `
        <div class="relative group">
            <div class="absolute -left-[37px] top-4 w-4 h-4 rounded-full border-2 ${borderColor} bg-slate-900 z-10 group-hover:scale-125 transition"></div>
            <div class="ml-4 bg-slate-800/50 p-4 rounded border-l-2 ${borderColor} border-t border-r border-b border-slate-700 hover:bg-slate-800 transition">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-slate-200">${s.topic_name}</h4>
                    <span class="text-xs font-mono text-slate-500">${new Date(s.start_time).toLocaleDateString()}</span>
                </div>
                <div class="text-xs text-slate-400 mb-2">
                    <span class="px-2 py-1 bg-black/30 rounded text-slate-300 mr-2">📌 ${s.subject_name}</span>
                    <span class="px-2 py-1 bg-black/30 rounded ${s.session_type.includes('Alert') ? 'text-red-300' : 'text-emerald-300'}">
                        ${s.session_type}
                    </span>
                </div>
                <p class="text-xs text-slate-500 italic">🤖 reasoning: ${s.reason}</p>
            </div>
        </div>
        `;
    }).join('');

    // 3. Analytics Charts (Module 10)
    renderCharts(data);
}

function renderCharts(data) {
    // Confidence Chart
    const ctxConf = document.getElementById('confidenceChart').getContext('2d');

    // Destroy if exists
    if (window.confChartInstance) window.confChartInstance.destroy();

    window.confChartInstance = new Chart(ctxConf, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4 - Exam'],
            datasets: [{
                label: 'Predicted Confidence',
                data: [65, 72, 85, data.analytics.predicted_confidence * 100],
                borderColor: '#818cf8',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(129, 140, 248, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });

    // Dependency Graph (Simplified as Bar for MVP or another viz)
    // Actually, let's use a Polar Area chart to show "Risk Distribution" instead of a raw graph
    // because drawing a node-link diagram in canvas without a lib like Cytoscape is hard.
    const ctxDep = document.getElementById('dependencyChart').getContext('2d');
    if (window.depChartInstance) window.depChartInstance.destroy();

    // Count dependencies per subject
    const subjectCounts = {};
    data.upcoming_schedule.forEach(s => {
        subjectCounts[s.subject_name] = (subjectCounts[s.subject_name] || 0) + 1;
    });

    window.depChartInstance = new Chart(ctxDep, {
        type: 'doughnut',
        data: {
            labels: Object.keys(subjectCounts),
            datasets: [{
                data: Object.values(subjectCounts),
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8' } },
                title: { display: true, text: 'Study Load Distribution', color: '#cbd5e1' }
            }
        }
    });
}

// --- SIMULATION EVENTS (Module 2 & 6) ---
function simEvent(type) {
    if (!SystemState.generatedData) return;

    const alertBox = document.getElementById('procrastination-alert');

    if (type === 'missed') {
        // Module 6: Procrastination Logic
        alert("📢 AI Adaptation Triggered: Missed session recorded. Rescheduling subsequent nodes in the dependency graph...");
        SystemState.profile.behavior.missed_streak += 1;
        runAIEngine(); // Re-run to adapt!

        alertBox.classList.remove('hidden');
        alertBox.classList.add('flex');
    } else if (type === 'aced') {
        alert("🏆 High Performance Detected! Difficulty rating dropped for this topic chain.");
        // Simulate "Easy" rating update
        runAIEngine();
    } else if (type === 'distracted') {
        alert("💤 Idle time detected. Suggesting 'Micro-Sprint' mode to recover focus.");
        SystemState.profile.behavior.last_session_delay_minutes = 45;
        runAIEngine();
    }
}

// --- SETUP HELPERS ---
function addSubjectRow() {
    // Basic prompts for MVP
    const name = prompt("Enter Subject Name (e.g. Thermodynamics):");
    if (!name) return;
    SystemState.subjects.push({ id: Date.now().toString(), name: name, difficulty: "Medium" });
    renderSubjectsList();
}



function removeSubjectRow(id) {
    SystemState.subjects = SystemState.subjects.filter(s => s.id !== id);
    renderSubjectsList();
}

function renderSubjectsList() {
    const list = document.getElementById('subjects-container');
    list.innerHTML = SystemState.subjects.map(s => `
        <div class="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700 group">
            <div>
                <span class="block text-sm font-medium text-slate-300">${s.name}</span>
                <span class="text-xs text-slate-500">${s.credits || '?'} Credits</span>
            </div>
            <div class="flex items-center space-x-2">
                <span class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400">${s.difficulty}</span>
                <button onclick="removeSubjectRow('${s.id}')" class="text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 px-1 font-bold" title="Remove Subject">
                    ✕
                </button>
            </div>
        </div>
    `).join('');

    // Sync all profile inputs
    const fieldMap = {
        'studentName': 'name',
        'college': 'college',
        'branch': 'branch',
        'year': 'year'
    };

    for (const [id, key] of Object.entries(fieldMap)) {
        const el = document.getElementById(id);
        if (el) el.value = SystemState.profile[key] || "";
    }
}

// Global Exports
window.updateProfile = function (field, value) {
    if (field === 'year') value = parseInt(value);
    SystemState.profile[field] = value;
};
window.removeSubjectRow = removeSubjectRow;
window.addSubjectRow = addSubjectRow;
window.runAIEngine = runAIEngine;
window.simEvent = simEvent;

// Init
renderSubjectsList();
