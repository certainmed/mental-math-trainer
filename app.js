/**
 * Mental Math Trainer
 * A comprehensive mental arithmetic training application with
 * speedcubing-style analytics and persistent progress tracking.
 */

// ============================================
// Constants & Configuration
// ============================================

const STORAGE_KEYS = {
    SESSIONS: 'mathTrainer_sessions',
    HISTORY: 'mathTrainer_history',
    SETTINGS: 'mathTrainer_settings',
    SOLVE_TIMES: 'mathTrainer_solveTimes'
};

const OPERATIONS = {
    multiplication: { symbol: '×', name: 'Multiplication' },
    addition: { symbol: '+', name: 'Addition' },
    subtraction: { symbol: '−', name: 'Subtraction' },
    division: { symbol: '÷', name: 'Division' },
    mixed: { symbol: '?', name: 'Mixed' },
    chain: { symbol: '⟶', name: 'Chain Math' }
};

const DEFAULT_SETTINGS = {
    digitRange: 2,
    chainLength: 5,
    targetTime: 5,
    targetStreak: 10
};

// ============================================
// State Management
// ============================================

const state = {
    currentScreen: 'home',
    currentMode: null,
    timeLimit: 30,

    // Session state
    session: {
        active: false,
        problems: [],
        currentProblem: null,
        correct: 0,
        total: 0,
        times: [],
        startTime: null,
        timerInterval: null
    },

    // Chain Math state
    chain: {
        numbers: [],
        currentIndex: 0,
        displayInterval: null,
        isDisplaying: false
    },

    // Settings
    settings: { ...DEFAULT_SETTINGS }
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    screens: {
        home: document.getElementById('home-screen'),
        practice: document.getElementById('practice-screen'),
        complete: document.getElementById('complete-screen'),
        analytics: document.getElementById('analytics-screen'),
        history: document.getElementById('history-screen'),
        settings: document.getElementById('settings-screen'),
        power: document.getElementById('power-screen'),
        multiplication: document.getElementById('multiplication-screen')
    },

    // Power Table elements
    powerHeaderRow: document.getElementById('power-header-row'),
    powerTableBody: document.getElementById('power-table-body'),

    // Multiplication Table elements
    // Note: defined in render function via getElementById directly for simplicity, 
    // but proper practice is to add here if used repeatedly.
    // However, since I used getElementById inside renderMultiplicationTable, this step is optional 
    // for functionality but good for consistency. I will leave it as is to avoid conflict 
    // with the code I wrote which fetches them inside the function.
    // Wait, I should verify if I used 'elements.multiHeaderRow' or 'document.getElementById'.
    // Checking previous step... I used document.getElementById inside the function.
    // So I don't strictly need to update this, but adding the screen to 'screens' is CRITICAL for showScreen to work.

    // Home screen
    modeButtons: document.querySelectorAll('.mode-btn'),
    timeButtons: document.querySelectorAll('.time-btn'),

    // Practice screen
    currentMode: document.getElementById('current-mode'),
    sessionProgress: document.getElementById('session-progress'),
    timerFill: document.getElementById('timer-fill'),
    timerText: document.getElementById('timer-text'),
    problemDisplay: document.getElementById('problem-display'),
    chainDisplay: document.getElementById('chain-display'),
    chainNumbers: document.getElementById('chain-numbers'),
    chainProgress: document.getElementById('chain-progress'),
    answerInput: document.getElementById('answer-input'),
    answerFeedback: document.getElementById('answer-feedback'),
    statCorrect: document.getElementById('stat-correct'),
    statAccuracy: document.getElementById('stat-accuracy'),
    statAvgTime: document.getElementById('stat-avg-time'),

    // Complete screen
    completeScore: document.getElementById('complete-score'),
    completeAccuracy: document.getElementById('complete-accuracy'),
    completeAvgTime: document.getElementById('complete-avg-time'),
    completeBestTime: document.getElementById('complete-best-time'),

    // Analytics screen
    ao5Value: document.getElementById('ao5-value'),
    ao12Value: document.getElementById('ao12-value'),
    totalProblems: document.getElementById('total-problems'),
    overallAccuracy: document.getElementById('overall-accuracy'),
    overallAvgTime: document.getElementById('overall-avg-time'),
    personalBest: document.getElementById('personal-best'),
    operationStats: document.getElementById('operation-stats'),

    // History screen
    sessionsList: document.getElementById('sessions-list'),
    wrongList: document.getElementById('wrong-list'),

    // Settings
    digitRange: document.getElementById('digit-range'),
    chainLength: document.getElementById('chain-length'),
    targetTime: document.getElementById('target-time'),
    targetStreak: document.getElementById('target-streak')
};

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get maximum number based on digit range setting
 */
function getMaxNumber() {
    const ranges = { 1: 9, 2: 99, 3: 999 };
    return ranges[state.settings.digitRange] || 99;
}

/**
 * Format time in seconds to display string
 */
function formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
        return '--';
    }
    return seconds.toFixed(2) + 's';
}

/**
 * Format date to readable string
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// Problem Generation
// ============================================

/**
 * Generate a math problem based on operation type
 */
function generateProblem(operation) {
    const max = getMaxNumber();
    let a, b, answer, symbol;

    // Handle mixed mode by randomly selecting an operation
    if (operation === 'mixed') {
        const ops = ['multiplication', 'addition', 'subtraction', 'division'];
        operation = ops[randomInt(0, ops.length - 1)];
    }

    switch (operation) {
        case 'multiplication':
            a = randomInt(2, Math.min(max, 12));
            b = randomInt(2, Math.min(max, 12));
            answer = a * b;
            symbol = '×';
            break;

        case 'addition':
            a = randomInt(1, max);
            b = randomInt(1, max);
            answer = a + b;
            symbol = '+';
            break;

        case 'subtraction':
            a = randomInt(1, max);
            b = randomInt(1, a); // Ensure positive result
            answer = a - b;
            symbol = '−';
            break;

        case 'division':
            // Generate problems with clean division
            b = randomInt(2, Math.min(max, 12));
            answer = randomInt(1, Math.min(max, 12));
            a = b * answer;
            symbol = '÷';
            break;

        default:
            a = randomInt(1, max);
            b = randomInt(1, max);
            answer = a + b;
            symbol = '+';
    }

    return {
        a,
        b,
        answer,
        symbol,
        operation,
        displayText: `${a} ${symbol} ${b}`
    };
}

/**
 * Generate chain math (Flash Anzan) numbers
 */
function generateChain() {
    const length = state.settings.chainLength;
    const max = getMaxNumber();
    const numbers = [];
    let runningTotal = 0;

    for (let i = 0; i < length; i++) {
        // Alternate between addition and subtraction to keep totals manageable
        if (i === 0 || Math.random() > 0.4) {
            const num = randomInt(1, Math.min(max, 50));
            numbers.push({ value: num, operation: '+' });
            runningTotal += num;
        } else {
            // Ensure we don't go negative
            const maxSub = Math.min(runningTotal - 1, Math.min(max, 50));
            if (maxSub > 0) {
                const num = randomInt(1, maxSub);
                numbers.push({ value: num, operation: '-' });
                runningTotal -= num;
            } else {
                const num = randomInt(1, Math.min(max, 50));
                numbers.push({ value: num, operation: '+' });
                runningTotal += num;
            }
        }
    }

    return {
        numbers,
        answer: runningTotal
    };
}

// ============================================
// Timer Functions
// ============================================

/**
 * Start the problem timer
 */
function startTimer() {
    state.session.startTime = performance.now();

    if (state.session.timerInterval) {
        clearInterval(state.session.timerInterval);
    }

    state.session.timerInterval = setInterval(updateTimerDisplay, 50);
}

/**
 * Stop the timer and return elapsed time
 */
function stopTimer() {
    if (state.session.timerInterval) {
        clearInterval(state.session.timerInterval);
        state.session.timerInterval = null;
    }

    if (state.session.startTime) {
        const elapsed = (performance.now() - state.session.startTime) / 1000;
        state.session.startTime = null;
        return elapsed;
    }

    return 0;
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    if (!state.session.startTime) return;

    const elapsed = (performance.now() - state.session.startTime) / 1000;
    elements.timerText.textContent = formatTime(elapsed);

    // Update progress bar if time limit is set
    if (state.timeLimit > 0) {
        const progress = Math.min((elapsed / state.timeLimit) * 100, 100);
        elements.timerFill.style.width = progress + '%';

        // Update color based on time remaining
        elements.timerFill.classList.remove('warning', 'danger');
        if (progress > 80) {
            elements.timerFill.classList.add('danger');
        } else if (progress > 60) {
            elements.timerFill.classList.add('warning');
        }

        // Auto-skip if time runs out
        if (elapsed >= state.timeLimit) {
            handleTimeout();
        }
    } else {
        // Unlimited time - show full progress bar
        elements.timerFill.style.width = '100%';
    }
}

/**
 * Handle timeout when time limit is exceeded
 */
function handleTimeout() {
    const elapsed = stopTimer();

    // Record as wrong answer
    recordAnswer(false, elapsed);

    // Show feedback
    elements.answerInput.classList.add('incorrect');
    elements.answerFeedback.textContent = `Time's up! Answer: ${state.session.currentProblem.answer}`;
    elements.answerFeedback.className = 'answer-feedback incorrect';

    // Move to next problem after a short delay
    setTimeout(() => {
        nextProblem();
    }, 1000);
}

// ============================================
// Session Management
// ============================================

/**
 * Start a new practice session
 */
function startSession(mode) {
    state.currentMode = mode;
    state.session = {
        active: true,
        problems: [],
        currentProblem: null,
        correct: 0,
        total: 0,
        times: [],
        startTime: null,
        timerInterval: null,
        sessionStart: Date.now()
    };

    // Update UI
    elements.currentMode.textContent = OPERATIONS[mode].name;
    updateSessionStats();

    // Show practice screen
    showScreen('practice');

    // Start first problem
    if (mode === 'chain') {
        startChainRound();
    } else {
        nextProblem();
    }
}

/**
 * Generate and display the next problem
 */
function nextProblem() {
    // Reset UI
    elements.answerInput.value = '';
    elements.answerInput.className = 'answer-input';
    elements.answerFeedback.textContent = '';
    elements.answerFeedback.className = 'answer-feedback';
    elements.timerFill.style.width = '0%';
    elements.timerFill.classList.remove('warning', 'danger');

    // Generate new problem
    state.session.currentProblem = generateProblem(state.currentMode);

    // Display problem
    elements.problemDisplay.querySelector('.problem-text').textContent =
        state.session.currentProblem.displayText;

    // Show problem display, hide chain display
    elements.problemDisplay.style.display = 'block';
    elements.chainDisplay.style.display = 'none';

    // Focus input and start timer
    elements.answerInput.focus();
    startTimer();
}

/**
 * Start a chain math round
 */
function startChainRound() {
    // Generate chain
    const chain = generateChain();
    state.chain = {
        numbers: chain.numbers,
        answer: chain.answer,
        currentIndex: 0,
        isDisplaying: true
    };

    state.session.currentProblem = {
        answer: chain.answer,
        displayText: 'Chain Math',
        operation: 'chain'
    };

    // Setup UI
    elements.problemDisplay.style.display = 'none';
    elements.chainDisplay.style.display = 'block';
    elements.answerInput.value = '';
    elements.answerInput.className = 'answer-input';
    elements.answerInput.disabled = true;
    elements.answerFeedback.textContent = 'Watch the numbers...';
    elements.answerFeedback.className = 'answer-feedback';

    // Create progress dots
    elements.chainProgress.innerHTML = chain.numbers.map((_, i) =>
        `<span class="dot" data-index="${i}"></span>`
    ).join('');

    // Start displaying numbers
    displayChainNumbers();
}

/**
 * Display chain numbers one by one
 */
function displayChainNumbers() {
    const displayTime = 1000; // Time to show each number

    function showNumber(index) {
        if (index >= state.chain.numbers.length) {
            // All numbers shown, start answer phase
            elements.chainNumbers.textContent = '?';
            elements.answerFeedback.textContent = 'What is the total?';
            elements.answerInput.disabled = false;
            elements.answerInput.focus();
            state.chain.isDisplaying = false;
            startTimer();
            return;
        }

        const item = state.chain.numbers[index];
        const sign = item.operation === '+' ? '+' : '−';
        elements.chainNumbers.textContent = index === 0 ? item.value : `${sign}${item.value}`;

        // Update progress dots
        const dots = elements.chainProgress.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('active', 'done');
            if (i < index) dot.classList.add('done');
            if (i === index) dot.classList.add('active');
        });

        setTimeout(() => showNumber(index + 1), displayTime);
    }

    showNumber(0);
}

/**
 * Submit the current answer
 */
function submitAnswer() {
    if (state.chain.isDisplaying) return;

    const userAnswer = parseInt(elements.answerInput.value);
    const correctAnswer = state.session.currentProblem.answer;
    const elapsed = stopTimer();

    if (isNaN(userAnswer)) {
        elements.answerInput.focus();
        return;
    }

    const isCorrect = userAnswer === correctAnswer;
    recordAnswer(isCorrect, elapsed);

    // Show feedback
    if (isCorrect) {
        elements.answerInput.classList.add('correct');
        elements.answerFeedback.textContent = `Correct! ${formatTime(elapsed)}`;
        elements.answerFeedback.className = 'answer-feedback correct';
    } else {
        elements.answerInput.classList.add('incorrect');
        elements.answerFeedback.textContent = `Wrong! Answer: ${correctAnswer}`;
        elements.answerFeedback.className = 'answer-feedback incorrect';

        // Save wrong answer to history
        saveWrongAnswer({
            problem: state.session.currentProblem.displayText,
            userAnswer,
            correctAnswer,
            operation: state.session.currentProblem.operation,
            timestamp: Date.now()
        });
    }

    // Move to next problem after delay
    setTimeout(() => {
        if (state.currentMode === 'chain') {
            startChainRound();
        } else {
            nextProblem();
        }
    }, 800);
}

/**
 * Skip the current problem
 */
function skipProblem() {
    if (state.chain.isDisplaying) return;

    const elapsed = stopTimer();
    recordAnswer(false, elapsed);

    elements.answerFeedback.textContent = `Skipped. Answer: ${state.session.currentProblem.answer}`;
    elements.answerFeedback.className = 'answer-feedback incorrect';

    setTimeout(() => {
        if (state.currentMode === 'chain') {
            startChainRound();
        } else {
            nextProblem();
        }
    }, 600);
}

/**
 * Record an answer result
 */
function recordAnswer(isCorrect, time) {
    state.session.total++;
    if (isCorrect) {
        state.session.correct++;
        state.session.times.push(time);

        // Save solve time globally
        saveSolveTime(time, state.currentMode);
    }

    state.session.problems.push({
        problem: state.session.currentProblem,
        correct: isCorrect,
        time
    });

    updateSessionStats();
}

/**
 * Update session statistics display
 */
function updateSessionStats() {
    const { correct, total, times } = state.session;

    elements.statCorrect.textContent = correct;
    elements.sessionProgress.textContent = `${total} solved`;

    if (total > 0) {
        const accuracy = ((correct / total) * 100).toFixed(0);
        elements.statAccuracy.textContent = accuracy + '%';
    } else {
        elements.statAccuracy.textContent = '0%';
    }

    if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        elements.statAvgTime.textContent = formatTime(avgTime);
    } else {
        elements.statAvgTime.textContent = '0.0s';
    }
}

/**
 * End the current session and show results
 */
function endSession() {
    stopTimer();

    if (state.chain.displayInterval) {
        clearInterval(state.chain.displayInterval);
    }

    const { correct, total, times } = state.session;

    // Calculate final stats
    const accuracy = total > 0 ? ((correct / total) * 100).toFixed(0) : 0;
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const bestTime = times.length > 0 ? Math.min(...times) : 0;

    // Update complete screen
    elements.completeScore.textContent = correct;
    elements.completeAccuracy.textContent = accuracy + '%';
    elements.completeAvgTime.textContent = formatTime(avgTime);
    elements.completeBestTime.textContent = formatTime(bestTime);

    // Save session to history
    saveSession({
        mode: state.currentMode,
        correct,
        total,
        accuracy: parseFloat(accuracy),
        avgTime,
        bestTime,
        times,
        timestamp: Date.now()
    });

    state.session.active = false;
    showScreen('complete');
}

// ============================================
// Analytics Functions
// ============================================

/**
 * Calculate Average of N (speedcubing style)
 * Removes best and worst times, averages the rest
 */
function calculateAoN(times, n) {
    if (times.length < n) return null;

    // Get last N times
    const lastN = times.slice(-n);

    // Sort to find best and worst
    const sorted = [...lastN].sort((a, b) => a - b);

    // Remove best (first) and worst (last)
    const trimmed = sorted.slice(1, -1);

    // Calculate average
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

/**
 * Update analytics display
 */
function updateAnalytics() {
    const solveTimes = loadSolveTimes();
    const sessions = loadSessions();
    const allTimes = solveTimes.map(st => st.time);

    // Calculate Ao5 and Ao12
    const ao5 = calculateAoN(allTimes, 5);
    const ao12 = calculateAoN(allTimes, 12);

    elements.ao5Value.textContent = ao5 !== null ? formatTime(ao5) : '--';
    elements.ao12Value.textContent = ao12 !== null ? formatTime(ao12) : '--';

    // Calculate overall stats
    let totalProblems = 0;
    let totalCorrect = 0;

    sessions.forEach(session => {
        totalProblems += session.total;
        totalCorrect += session.correct;
    });

    elements.totalProblems.textContent = totalProblems;

    if (totalProblems > 0) {
        elements.overallAccuracy.textContent = ((totalCorrect / totalProblems) * 100).toFixed(1) + '%';
    } else {
        elements.overallAccuracy.textContent = '0%';
    }

    if (allTimes.length > 0) {
        const avgTime = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
        elements.overallAvgTime.textContent = formatTime(avgTime);
        elements.personalBest.textContent = formatTime(Math.min(...allTimes));
    } else {
        elements.overallAvgTime.textContent = '--';
        elements.personalBest.textContent = '--';
    }

    // Calculate per-operation stats
    updateOperationStats(sessions, solveTimes);
}

/**
 * Update per-operation statistics
 */
function updateOperationStats(sessions, solveTimes) {
    const stats = {};

    // Initialize stats for each operation
    Object.keys(OPERATIONS).forEach(op => {
        stats[op] = { correct: 0, total: 0, times: [] };
    });

    // Aggregate session data
    sessions.forEach(session => {
        if (stats[session.mode]) {
            stats[session.mode].correct += session.correct;
            stats[session.mode].total += session.total;
        }
    });

    // Add times
    solveTimes.forEach(st => {
        if (stats[st.mode]) {
            stats[st.mode].times.push(st.time);
        }
    });

    // Render operation stats
    let html = '';
    Object.entries(OPERATIONS).forEach(([key, value]) => {
        const stat = stats[key];
        if (stat.total > 0) {
            const accuracy = ((stat.correct / stat.total) * 100).toFixed(0);
            html += `
                <div class="operation-stat">
                    <span class="op-name">${value.name}</span>
                    <span class="op-accuracy">${accuracy}%</span>
                    <span class="op-count">${stat.total} problems</span>
                </div>
            `;
        }
    });

    if (html === '') {
        html = '<div class="empty-state"><span class="icon">📊</span><p>No data yet. Complete some practice sessions!</p></div>';
    }

    elements.operationStats.innerHTML = html;
}

// ============================================
// History Functions
// ============================================

/**
 * Update history display
 */
function updateHistory() {
    const sessions = loadSessions();
    const wrongAnswers = loadWrongAnswers();

    // Render sessions
    if (sessions.length > 0) {
        elements.sessionsList.innerHTML = sessions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50)
            .map(session => `
                <div class="history-item">
                    <div class="item-header">
                        <span class="item-mode">${OPERATIONS[session.mode]?.name || session.mode}</span>
                        <span class="item-date">${formatDate(session.timestamp)}</span>
                    </div>
                    <div class="item-stats">
                        <span>✓ ${session.correct}/${session.total}</span>
                        <span>📊 ${session.accuracy}%</span>
                        <span>⏱️ ${formatTime(session.avgTime)}</span>
                    </div>
                </div>
            `).join('');
    } else {
        elements.sessionsList.innerHTML = '<div class="empty-state"><span class="icon">📜</span><p>No sessions yet. Start practicing!</p></div>';
    }

    // Render wrong answers
    if (wrongAnswers.length > 0) {
        elements.wrongList.innerHTML = wrongAnswers
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50)
            .map(wrong => `
                <div class="wrong-item">
                    <span class="problem">${wrong.problem}</span>
                    <span class="your-answer">Your: ${wrong.userAnswer}</span>
                    <span class="correct-answer">Correct: ${wrong.correctAnswer}</span>
                </div>
            `).join('');
    } else {
        elements.wrongList.innerHTML = '<div class="empty-state"><span class="icon">✨</span><p>No wrong answers! Keep it up!</p></div>';
    }
}

// ============================================
// Data Persistence (localStorage)
// ============================================

/**
 * Save a session to history
 */
function saveSession(session) {
    const sessions = loadSessions();
    sessions.push(session);

    // Keep only last 100 sessions
    const trimmed = sessions.slice(-100);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(trimmed));
}

/**
 * Load sessions from storage
 */
function loadSessions() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS)) || [];
    } catch {
        return [];
    }
}

/**
 * Save a solve time
 */
function saveSolveTime(time, mode) {
    const times = loadSolveTimes();
    times.push({ time, mode, timestamp: Date.now() });

    // Keep only last 500 times
    const trimmed = times.slice(-500);
    localStorage.setItem(STORAGE_KEYS.SOLVE_TIMES, JSON.stringify(trimmed));
}

/**
 * Load solve times from storage
 */
function loadSolveTimes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SOLVE_TIMES)) || [];
    } catch {
        return [];
    }
}

/**
 * Save a wrong answer
 */
function saveWrongAnswer(wrong) {
    const wrongs = loadWrongAnswers();
    wrongs.push(wrong);

    // Keep only last 100 wrong answers
    const trimmed = wrongs.slice(-100);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
}

/**
 * Load wrong answers from storage
 */
function loadWrongAnswers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
    } catch {
        return [];
    }
}

/**
 * Save settings
 */
function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
}

/**
 * Load settings from storage
 */
function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
        return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * Clear all data
 */
function clearAllData() {
    if (confirm('Are you sure you want to delete ALL your progress? This cannot be undone!')) {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        // Reset state
        state.settings = { ...DEFAULT_SETTINGS };

        // Update UI
        updateAnalytics();
        updateHistory();
        updateSettingsUI();

        alert('All data has been cleared.');
    }
}

// ============================================
// Navigation & Screen Management
// ============================================

/**
 * Show a specific screen
 */
function showScreen(screenName) {
    // Hide all screens
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    if (elements.screens[screenName]) {
        elements.screens[screenName].classList.add('active');
        state.currentScreen = screenName;

        // Run screen-specific updates
        if (screenName === 'analytics') {
            updateAnalytics();
        } else if (screenName === 'history') {
            updateHistory();
        }
    }
}

/**
 * Go back to home screen
 */
function goHome() {
    if (state.session.active) {
        if (!confirm('End current session?')) {
            return;
        }
        endSession();
        return;
    }
    showScreen('home');
}

// ============================================
// Power Table Functions
// ============================================

let powerTableInitialized = false;

function renderPowerTable() {
    if (powerTableInitialized) return;

    const MAX_BASE = 20;
    const MAX_POWER = 20;

    // Clear existing content if any (safeguard)
    // elements.powerHeaderRow.innerHTML = '<th>x \\ n</th>'; // Keep the first th
    // elements.powerTableBody.innerHTML = '';

    // 1. Create Headers (Exponent n)
    // First confirm we only have the first child
    while (elements.powerHeaderRow.children.length > 1) {
        elements.powerHeaderRow.removeChild(elements.powerHeaderRow.lastChild);
    }

    for (let n = 1; n <= MAX_POWER; n++) {
        const th = document.createElement('th');
        th.innerHTML = `x<sup class="math-sup">${n}</sup>`;
        th.title = `Exponent ${n}`;
        elements.powerHeaderRow.appendChild(th);
    }

    // 2. Create Rows (Base x)
    elements.powerTableBody.innerHTML = '';
    for (let x = 1; x <= MAX_BASE; x++) {
        const tr = document.createElement('tr');

        // First column: Sticky Base Number Header
        const thRow = document.createElement('th');
        thRow.textContent = x;
        thRow.title = `Base ${x}`;
        tr.appendChild(thRow);

        // Data Cells
        for (let n = 1; n <= MAX_POWER; n++) {
            const td = document.createElement('td');

            // Calculation using BigInt for accuracy with large numbers
            const val = BigInt(x) ** BigInt(n);

            // Formatting with commas
            td.textContent = val.toLocaleString('en-US');

            // Tooltip
            td.title = `${x}^${n} = ${val.toLocaleString('en-US')}`;

            tr.appendChild(td);
        }
        elements.powerTableBody.appendChild(tr);
    }

    powerTableInitialized = true;
}

// Multiplication Table Function
let multiTableInitialized = false;

function renderMultiplicationTable() {
    if (multiTableInitialized) return;

    const MAX_NUM = 40;
    const headerRow = document.getElementById('multi-header-row');
    const tableBody = document.getElementById('multi-table-body');

    // 1. Generate Header Row (Top)
    // Clear check
    while (headerRow.children.length > 1) {
        headerRow.removeChild(headerRow.lastChild);
    }

    for (let i = 1; i <= MAX_NUM; i++) {
        const th = document.createElement('th');
        th.textContent = i;
        headerRow.appendChild(th);
    }

    // 2. Generate Data Rows
    tableBody.innerHTML = '';
    for (let r = 1; r <= MAX_NUM; r++) {
        const tr = document.createElement('tr');

        // Row Header (Left)
        const thRow = document.createElement('th');
        thRow.textContent = r;
        tr.appendChild(thRow);

        // Cells
        for (let c = 1; c <= MAX_NUM; c++) {
            const td = document.createElement('td');
            const value = r * c;
            td.textContent = value.toLocaleString();
            td.title = `${r} x ${c} = ${value}`;
            tr.appendChild(td);
        }

        tableBody.appendChild(tr);
    }

    multiTableInitialized = true;
}

// ============================================
// Settings UI
// ============================================

/**
 * Update settings UI from state
 */
function updateSettingsUI() {
    elements.digitRange.value = state.settings.digitRange;
    elements.chainLength.value = state.settings.chainLength;
    elements.targetTime.value = state.settings.targetTime;
    elements.targetStreak.value = state.settings.targetStreak;
}

/**
 * Handle settings change
 */
function handleSettingChange(event) {
    const { id, value } = event.target;

    switch (id) {
        case 'digit-range':
            state.settings.digitRange = parseInt(value);
            break;
        case 'chain-length':
            state.settings.chainLength = parseInt(value);
            break;
        case 'target-time':
            state.settings.targetTime = parseInt(value);
            break;
        case 'target-streak':
            state.settings.targetStreak = parseInt(value);
            break;
    }

    saveSettings();
}

// ============================================
// Event Handlers
// ============================================

function initEventListeners() {
    // Mode selection
    elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            startSession(mode);
        });
    });

    // Time limit selection
    elements.timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.timeLimit = parseInt(btn.dataset.time);
        });
    });

    // Navigation buttons
    document.getElementById('view-analytics-btn').addEventListener('click', () => showScreen('analytics'));
    document.getElementById('view-history-btn').addEventListener('click', () => showScreen('history'));
    document.getElementById('view-settings-btn').addEventListener('click', () => showScreen('settings'));

    // Power Table button
    document.getElementById('power-table-btn').addEventListener('click', () => {
        renderPowerTable();
        showScreen('power');
    });

    // Multiplication Table button
    document.getElementById('multiplication-table-btn').addEventListener('click', () => {
        renderMultiplicationTable();
        showScreen('multiplication');
    });

    // Back buttons
    document.getElementById('back-to-home').addEventListener('click', goHome);
    document.getElementById('analytics-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('history-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('settings-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('power-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('multiplication-back').addEventListener('click', () => showScreen('home'));

    // Practice controls
    document.getElementById('submit-btn').addEventListener('click', submitAnswer);
    document.getElementById('skip-btn').addEventListener('click', skipProblem);

    // Answer input - submit on Enter
    elements.answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitAnswer();
        }
    });

    // Complete screen buttons
    document.getElementById('try-again-btn').addEventListener('click', () => {
        startSession(state.currentMode);
    });
    document.getElementById('go-home-btn').addEventListener('click', () => showScreen('home'));

    // History tabs
    document.querySelectorAll('.history-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.history-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.history-tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Settings changes
    elements.digitRange.addEventListener('change', handleSettingChange);
    elements.chainLength.addEventListener('change', handleSettingChange);
    elements.targetTime.addEventListener('change', handleSettingChange);
    elements.targetStreak.addEventListener('change', handleSettingChange);

    // Clear data button
    document.getElementById('clear-all-data').addEventListener('click', clearAllData);
}

// ============================================
// Initialization
// ============================================

function init() {
    // Load saved settings
    state.settings = loadSettings();
    updateSettingsUI();

    // Initialize event listeners
    initEventListeners();

    // Show home screen
    showScreen('home');

    console.log('Mental Math Trainer initialized!');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
