import { state, elements } from './state.js';
import { PALETTE, SYNTAX_COLORS } from './constants.js';
import { getGender, showToast } from './utils.js';
import { playSound } from './audio.js';
import { getRunnerSvg } from './sprites.js';
import { switchTab, updateRankingSidebar, showWinnerScreen, updateParticipantCount } from './ui.js';

export function startRace() {
    updateParticipantCount();
    if (state.participants.length < 2) return;

    // Prepare runners
    const firstNames = state.participants.map(name => name.split(' ')[0]);
    const nameCounts = {};
    const shortNameCounts = {};

    firstNames.forEach(fn => { nameCounts[fn] = (nameCounts[fn] || 0) + 1; });

    state.runners = state.participants.map((name, index) => {
        const parts = name.split(' ').filter(p => p.trim() !== '');
        const firstName = parts[0];
        let shortName = firstName;
        if (nameCounts[firstName] > 1 && parts.length > 1) {
            shortName = `${firstName} ${parts[1][0].toUpperCase()}.`;
        }

        // Handle identical shortNames (e.g. Juan Gomez and Juan Garcia both become Juan G.)
        shortNameCounts[shortName] = (shortNameCounts[shortName] || 0) + 1;
        if (shortNameCounts[shortName] > 1) {
            shortName = `${shortName} (${shortNameCounts[shortName]})`;
        }

        return {
            id: `runner-${index}`,
            name: name,
            shortName: shortName,
            gender: getGender(name),
            progress: 0, // 0 to 100
            speed: 0, // current speed
            baseSpeed: 100 / state.raceDuration, // % per second
            color: PALETTE[index % PALETTE.length],
            syntaxColor: SYNTAX_COLORS[index % SYNTAX_COLORS.length],
            state: 'normal', // normal, boost, penalty
            stateTimeLeft: 0,
            finished: false,
            finishTime: null
        };
    });

    state.finishedRunners = [];
    state.raceFinished = false;
    state.winner = null;

    buildRaceTrack();

    // Disable other tabs and add race tab
    const tabRace = document.getElementById('tab-race');
    if (tabRace) tabRace.style.display = 'flex';

    switchTab('race');

    // Reset toast
    document.getElementById('toast-container').innerHTML = '';

    // Start loop
    playSound('start');

    setTimeout(() => {
        if (state.tab !== 'race') return;
        // Use performance.now() as the race start reference for high-precision timings
        state.startTime = performance.now();
        state.lastTime = state.startTime;
        state.raceAnimationFrame = requestAnimationFrame((t) => raceLoop(t));
    }, 1300);
}

export function buildRaceTrack() {
    const container = document.getElementById('track-container');

    if (state.runners.length > 12) {
        container.classList.add('compact-mode');
    } else {
        container.classList.remove('compact-mode');
    }

    let html = `<div class="finish-line"></div><div class="finish-label">// DONE</div>`;

    state.runners.forEach((runner, index) => {
        html += `
        <div class="race-lane" id="lane-${runner.id}">
            <div class="lane-label" style="color: ${runner.syntaxColor}">
                ${index + 1}. "${runner.shortName}":
            </div>
            <div class="lane-track">
                <div class="sprite-container" id="sprite-${runner.id}">
                    <div class="event-icon" id="icon-${runner.id}"></div>
                    <div class="sprite running ${runner.gender === 'female' ? 'female' : ''}" style="--hoodie-color: ${runner.color}">
                        ${getRunnerSvg(runner)}
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="bar-${runner.id}"></div>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    updateRankingSidebar();
}

export function raceLoop(timestamp) {
    if (state.raceFinished) return;

    let deltaTime = (timestamp - state.lastTime) / 1000; // seconds
    if (deltaTime > 0.1) deltaTime = 0.1; // clamp to 0.1s max to prevent tab throttling jump
    state.lastTime = timestamp;

    const elapsedTime = (timestamp - state.startTime) / 1000;
    const totalDuration = state.raceDuration;

    elements.statusTime.textContent = `Ln ${Math.floor(elapsedTime)}, Col ${totalDuration}`;

    let anyFinishedThisFrame = false;

    // Calculate progress for each runner
    state.runners.forEach(runner => {
        if (runner.finished) return;

        // Handle state durations
        if (runner.state !== 'normal') {
            runner.stateTimeLeft -= deltaTime;
            if (runner.stateTimeLeft <= 0) {
                clearRunnerState(runner);
            }
        }

        // Variabilidad base aleatoria (micro-cambios de velocidad)
        let currentSpeed = runner.baseSpeed * (0.8 + Math.random() * 0.4);

        // Aplicar efectos de estado
        if (runner.state === 'boost') {
            currentSpeed *= 3.0;
        } else if (runner.state === 'penalty') {
            currentSpeed *= 0.1;
        }

        runner.progress += currentSpeed * deltaTime;

        // Reached finish line
        if (runner.progress >= 100) {
            runner.progress = 100;
            runner.finished = true;
            // Use performance.now() for high-precision timestamps so that
            // runners crossing in the same animation frame still get distinct
            // finish times and a clear winner can always be determined.
            runner.finishTime = (performance.now() - state.startTime) / 1000;
            state.finishedRunners.push(runner);

            // Set winner if first
            if (!state.winner) {
                state.winner = runner;
                playSound('winner');
            }

            // Stop running animation
            document.querySelector(`#sprite-${runner.id} .sprite`).classList.remove('running');
            anyFinishedThisFrame = true;
        }

        updateRunnerDOM(runner);
    });

    // Chance for random events (not in first 1.5s, not in last 1.5s estimated)
    if (elapsedTime > 1.5 && elapsedTime < totalDuration - 1.5) {
        // Proportional chance for a couple of events total across the duration
        const expectedEvents = 15; // Increased probability for more action
        const probabilityPerFrame = expectedEvents / (totalDuration * 60);
        if (Math.random() < probabilityPerFrame) {
            triggerRandomEvent();
        }
    }

    // Update UI ranking rarely (every ~20 frames) to save performance, but always on finish
    if (anyFinishedThisFrame || Math.random() < 0.05) {
        updateRankingSidebar();
    }

    // Check if all finished (or ensure at least one winner and let run up to +5 extra seconds)
    if (state.finishedRunners.length === state.runners.length || (elapsedTime > totalDuration + 5 && state.finishedRunners.length > 0)) {
        endRace();
    } else {
        state.raceAnimationFrame = requestAnimationFrame((t) => raceLoop(t));
    }
}

function updateRunnerDOM(runner) {
    const spriteEl = document.getElementById(`sprite-${runner.id}`);
    const barEl = document.getElementById(`bar-${runner.id}`);
    if (spriteEl && barEl) {
        spriteEl.style.transform = `translate(${runner.progress}cqw, -50%)`;
        barEl.style.transform = `scaleX(${runner.progress / 100})`;
    }
}

export function clearRunnerState(runner) {
    runner.state = 'normal';
    const spriteEl = document.getElementById(`sprite-${runner.id}`);
    const barEl = document.getElementById(`bar-${runner.id}`);
    const iconEl = document.getElementById(`icon-${runner.id}`);

    if (spriteEl) {
        spriteEl.classList.remove('boost', 'penalty');
        barEl.classList.remove('boost', 'penalty');
        iconEl.classList.remove('show');
    }
}

export function setRunnerState(runner, stateName, iconContent) {
    // Can't receive event if already in one, or finished
    if (runner.state !== 'normal' || runner.finished) return false;

    runner.state = stateName;
    // Make events not last too long
    runner.stateTimeLeft = 0.5 + Math.random() * 0.5; // 0.5 to 1.0 seconds

    const spriteEl = document.getElementById(`sprite-${runner.id}`);
    const barEl = document.getElementById(`bar-${runner.id}`);
    const iconEl = document.getElementById(`icon-${runner.id}`);

    if (spriteEl) {
        spriteEl.classList.add(stateName);
        barEl.classList.add(stateName);
        iconEl.textContent = iconContent;
        iconEl.classList.add('show');
    }

    return true;
}

export function triggerRandomEvent() {
    const activeRunners = state.runners.filter(r => !r.finished && r.state === 'normal');
    if (activeRunners.length === 0) return;

    const target = activeRunners[Math.floor(Math.random() * activeRunners.length)];
    const isBoost = Math.random() > 0.5;

    if (isBoost) {
        const isCoffee = Math.random() > 0.5;
        const boostIcon = isCoffee ? '☕' : '💡';
        const boostMsg = isCoffee ? 'just had a coffee!' : 'had an idea!';
        if (setRunnerState(target, 'boost', boostIcon)) {
            showToast(`${target.shortName} ${boostMsg} ${boostIcon}`, 'success');
            playSound('boost');
        }
    } else {
        const isMerge = Math.random() > 0.5;
        const penaltyIcon = isMerge ? '🔀' : '🤖';
        const penaltyMsg = isMerge ? 'has a merge conflict!' : 'got a Copilot error!';

        if (setRunnerState(target, 'penalty', penaltyIcon)) {
            showToast(`${target.shortName} ${penaltyMsg} ${penaltyIcon}`, 'error');
            playSound('error');
        }
    }
}

export function endRace() {
    state.raceFinished = true;

    // Ensure everyone not finished gets a rank based on distance
    const unfinished = state.runners.filter(r => !r.finished).sort((a, b) => b.progress - a.progress);
    state.finishedRunners.push(...unfinished);

    // Actual winner (in case nobody finished)
    state.winner = state.finishedRunners[0];

    setTimeout(() => {
        showWinnerScreen();
    }, 1000);

    // Clear all states
    state.runners.forEach(r => clearRunnerState(r));
}
