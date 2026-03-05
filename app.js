/**
 * Developer Race Logic
 */

const PALETTE = [
    '#e06c75', '#e5c07b', '#98c379', '#56b6c2', '#61afef',
    '#c678dd', '#be5046', '#d19a66', '#7ec699', '#4dc9f6',
    '#f7768e', '#ff9e64', '#9ece6a', '#7aa2f7', '#bb9af7',
    '#e0af68', '#73daca', '#b4f9f8', '#ff757f', '#c3e88d'
];

const SYNTAX_COLORS = [
    '#ce9178', '#569cd6', '#dcdcaa', '#9cdcfe', '#4ec9b0', '#b5cea8', '#c586c0'
];

const FEMALE_NAMES = new Set([
    'abril', 'africa', 'ainhoa', 'ainara', 'aitana', 'alba', 'ale', 'alejandra', 'ali', 'alicia',
    'amalia', 'amelia', 'amparo', 'ana', 'andre', 'andrea', 'angeles', 'antonia', 'ariadna', 'aurora',
    'bea', 'beatriz', 'belen', 'beli', 'blanca',
    'carla', 'carmen', 'caro', 'carol', 'carolina', 'celia', 'charo', 'clara', 'claudia', 'concha', 'conchi', 'cris', 'cristina',
    'dani', 'daniela', 'diana', 'dolores',
    'ele', 'elena', 'eli', 'elisa', 'emma', 'estefania', 'eva',
    'fatima', 'fernanda',
    'gloria',
    'ines', 'ingrid', 'inma', 'inmaculada', 'irene', 'isa', 'isabel',
    'jimena', 'josefina', 'judith', 'julia',
    'laia', 'lara', 'lau', 'laura', 'leire', 'leonor', 'leti', 'leticia', 'lidia', 'lola', 'loli',
    'lore', 'lorena', 'lucia', 'lucy', 'luisa',
    'magdalena', 'manuela', 'mari', 'maria', 'marina', 'marta', 'mary', 'mercedes', 'merche', 'mery',
    'mireia', 'miri', 'miriam', 'monica', 'montserrat',
    'nadia', 'nati', 'natalia', 'nerea', 'nieves', 'noa', 'noelia', 'nora', 'nuri', 'nuria',
    'olga',
    'paloma', 'patri', 'patricia', 'paula', 'penelope', 'pili', 'pilar',
    'raquel', 'remedios', 'rocio', 'rosa', 'rosario', 'ruth',
    'sandra', 'sandy', 'sara', 'sheila', 'silvia', 'sofi', 'sofia', 'sonia', 'soraya', 'susi', 'susana',
    'tere', 'teresa', 'toni', 'tonia', 'trinidad',
    'vale', 'valentina', 'vane', 'vanessa', 'veronica', 'vicky', 'viki', 'victoria',
    'yolanda',
    'zoe'
]);

function getGender(name) {
    const first = name.split(' ')[0]
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return FEMALE_NAMES.has(first) ? 'female' : 'male';
}

window.app = {
    state: {
        tab: 'readme',
        participants: [],
        raceDuration: 15,
        runners: [], // objects with state during race
        startTime: 0,
        lastTime: 0,
        raceAnimationFrame: null,
        raceFinished: false,
        winner: null,
        finishedRunners: [],
        prize: 'runs the daily standup!'
    },

    elements: {
        namesInput: document.getElementById('names-input'),
        durationInput: document.getElementById('race-duration'),
        durationLabel: document.getElementById('duration-label'),
        btnRun: document.getElementById('btn-run'),
        devCountLabel: document.getElementById('dev-count-label'),
        statusTime: document.getElementById('status-time'),
        statusLeader: document.getElementById('status-leader'),
        breadcrumb: document.getElementById('breadcrumb-current'),
        prizeInput: document.getElementById('race-prize')
    },

    init() {
        this.updateParticipantCount();
        this.updateDurationLabel();
        this.updatePrizeLabel();

        // Setup initial line numbers
        this.renderLineNumbers(50, 'config-lines');
    },

    switchTab(tabId) {
        // Block race/winner tabs if no race has started yet
        if (tabId === 'race' && this.state.runners.length === 0) {
            this.showToast('Start a race first! Hit ▶ Run Race.', 'info');
            return;
        }
        if (tabId === 'winner' && !this.state.raceFinished) {
            this.showToast('No finished race yet. Run one first!', 'info');
            return;
        }

        if (this.state.tab === 'race' && tabId !== 'race' && !this.state.raceFinished) {
            if (!confirm("Race is in progress. Are you sure you want to stop?")) return;
            cancelAnimationFrame(this.state.raceAnimationFrame);
        }

        this.state.tab = tabId;

        // Hide all views and remove active state from tabs
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.file').forEach(el => el.classList.remove('active'));

        // Show requested
        document.getElementById(`view-${tabId}`).classList.add('active');
        const tabEl = document.getElementById(`tab-${tabId}`);
        if (tabEl) tabEl.classList.add('active');
        const treeEl = document.getElementById(`tree-${tabId}`);
        if (treeEl) treeEl.classList.add('active');

        // Update breadcrumb
        let breadcrumbText = 'README.md';
        if (tabId === 'config') breadcrumbText = 'race-config.json';
        if (tabId === 'race') breadcrumbText = 'race-output.log';
        if (tabId === 'winner') breadcrumbText = 'winner.md';
        this.elements.breadcrumb.textContent = breadcrumbText;

        // Toggle sidebar panels
        document.getElementById('ranking-panel').style.display = (tabId === 'race') ? 'block' : 'none';

        if (tabId === 'race' && this.state.runners.length > 0) {
            this.renderLineNumbers(this.state.runners.length + 5, 'race-lines');
        }
    },

    updateDurationLabel() {
        this.state.raceDuration = parseInt(this.elements.durationInput.value, 10);
        this.elements.durationLabel.textContent = this.state.raceDuration;
    },

    updatePrizeLabel() {
        if (this.elements.prizeInput) {
            this.state.prize = this.elements.prizeInput.value;
        }
    },

    updateParticipantCount() {
        const text = this.elements.namesInput.value;
        const lines = text.split('\n');
        const validNames = lines
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('//'));

        // Remove duplicates
        this.state.participants = [...new Set(validNames)];

        this.elements.devCountLabel.textContent = `// ${this.state.participants.length} developers ready`;

        if (this.state.participants.length >= 2 && this.state.participants.length <= 50) {
            this.elements.btnRun.disabled = false;
        } else {
            this.elements.btnRun.disabled = true;
        }
    },

    renderLineNumbers(count, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        let html = '';
        for (let i = 1; i <= count; i++) {
            html += `<div>${i}</div>`;
        }
        container.innerHTML = html;
    },

    startRace() {
        this.updateParticipantCount();
        if (this.state.participants.length < 2) return;

        // Prepare runners
        const firstNames = this.state.participants.map(name => name.split(' ')[0]);
        const nameCounts = {};
        firstNames.forEach(fn => { nameCounts[fn] = (nameCounts[fn] || 0) + 1; });

        this.state.runners = this.state.participants.map((name, index) => {
            const parts = name.split(' ').filter(p => p.trim() !== '');
            const firstName = parts[0];
            let shortName = firstName;
            if (nameCounts[firstName] > 1 && parts.length > 1) {
                shortName = `${firstName} ${parts[1][0].toUpperCase()}.`;
            }

            return {
                id: `runner-${index}`,
                name: name,
                shortName: shortName,
                gender: getGender(name),
                progress: 0, // 0 to 100
                speed: 0, // current speed
                baseSpeed: 100 / this.state.raceDuration, // % per second
                color: PALETTE[index % PALETTE.length],
                syntaxColor: SYNTAX_COLORS[index % SYNTAX_COLORS.length],
                state: 'normal', // normal, boost, penalty
                stateTimeLeft: 0,
                finished: false,
                finishTime: null
            };
        });

        this.state.finishedRunners = [];
        this.state.raceFinished = false;
        this.state.winner = null;

        this.buildRaceTrack();

        // Disable other tabs and add race tab
        const tabRace = document.getElementById('tab-race');
        if (tabRace) tabRace.style.display = 'flex';

        this.switchTab('race');

        // Reset toast
        document.getElementById('toast-container').innerHTML = '';

        // Start loop
        playSound('start');

        setTimeout(() => {
            if (this.state.tab !== 'race') return;
            // Use performance.now() as the race start reference for high-precision timings
            this.state.startTime = performance.now();
            this.state.lastTime = this.state.startTime;
            this.state.raceAnimationFrame = requestAnimationFrame((t) => this.raceLoop(t));
        }, 1300);
    },

    buildRaceTrack() {
        const container = document.getElementById('track-container');
        let html = `<div class="finish-line"></div><div class="finish-label">// DONE</div>`;

        this.state.runners.forEach((runner, index) => {
            html += `
            <div class="race-lane" id="lane-${runner.id}">
                <div class="lane-label" style="color: ${runner.syntaxColor}">
                    ${index + 1}. "${runner.shortName}":
                </div>
                <div class="lane-track">
                    <div class="sprite-container" id="sprite-${runner.id}" style="left: 0%">
                        <div class="event-icon" id="icon-${runner.id}"></div>
                        <div class="sprite running ${runner.gender === 'female' ? 'female' : ''}" style="--hoodie-color: ${runner.color}"></div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="bar-${runner.id}"></div>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;
        this.updateRankingSidebar();
    },

    raceLoop(timestamp) {
        if (this.state.raceFinished) return;

        const deltaTime = (timestamp - this.state.lastTime) / 1000; // seconds
        this.state.lastTime = timestamp;

        const elapsedTime = (timestamp - this.state.startTime) / 1000;
        const totalDuration = this.state.raceDuration;

        this.elements.statusTime.textContent = `Ln ${Math.floor(elapsedTime)}, Col ${totalDuration}`;

        let anyFinishedThisFrame = false;

        // Calculate progress for each runner
        this.state.runners.forEach(runner => {
            if (runner.finished) return;

            // Handle state durations
            if (runner.state !== 'normal') {
                runner.stateTimeLeft -= deltaTime;
                if (runner.stateTimeLeft <= 0) {
                    this.clearRunnerState(runner);
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
                runner.finishTime = (performance.now() - this.state.startTime) / 1000;
                this.state.finishedRunners.push(runner);

                // Set winner if first
                if (!this.state.winner) {
                    this.state.winner = runner;
                    playSound('winner');
                }

                // Stop running animation
                document.querySelector(`#sprite-${runner.id} .sprite`).classList.remove('running');
                anyFinishedThisFrame = true;
            }

            this.updateRunnerDOM(runner);
        });

        // Chance for random events (not in first 1.5s, not in last 1.5s estimated)
        if (elapsedTime > 1.5 && elapsedTime < totalDuration - 1.5) {
            // Proportional chance for a couple of events total across the duration
            const expectedEvents = 15; // Increased probability for more action
            const probabilityPerFrame = expectedEvents / (totalDuration * 60);
            if (Math.random() < probabilityPerFrame) {
                this.triggerRandomEvent();
            }
        }

        // Update UI ranking rarely (every ~20 frames) to save performance, but always on finish
        if (anyFinishedThisFrame || Math.random() < 0.05) {
            this.updateRankingSidebar();
        }

        // Check if all finished (or ensure at least one winner and let run up to +5 extra seconds)
        if (this.state.finishedRunners.length === this.state.runners.length || (elapsedTime > totalDuration + 5 && this.state.finishedRunners.length > 0)) {
            this.endRace();
        } else {
            this.state.raceAnimationFrame = requestAnimationFrame((t) => this.raceLoop(t));
        }
    },

    updateRunnerDOM(runner) {
        const spriteEl = document.getElementById(`sprite-${runner.id}`);
        const barEl = document.getElementById(`bar-${runner.id}`);
        if (spriteEl && barEl) {
            spriteEl.style.left = `${runner.progress}%`;
            barEl.style.width = `${runner.progress}%`;
        }
    },

    clearRunnerState(runner) {
        runner.state = 'normal';
        const spriteEl = document.getElementById(`sprite-${runner.id}`);
        const barEl = document.getElementById(`bar-${runner.id}`);
        const iconEl = document.getElementById(`icon-${runner.id}`);

        if (spriteEl) {
            spriteEl.classList.remove('boost', 'penalty');
            barEl.classList.remove('boost', 'penalty');
            iconEl.classList.remove('show');
        }
    },

    setRunnerState(runner, stateName, iconContent) {
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
    },

    triggerRandomEvent() {
        const activeRunners = this.state.runners.filter(r => !r.finished && r.state === 'normal');
        if (activeRunners.length === 0) return;

        const target = activeRunners[Math.floor(Math.random() * activeRunners.length)];
        const isBoost = Math.random() > 0.5;

        if (isBoost) {
            const isCoffee = Math.random() > 0.5;
            const boostIcon = isCoffee ? '☕' : '💡';
            const boostMsg = isCoffee ? 'just had a coffee!' : 'had an idea!';
            if (this.setRunnerState(target, 'boost', boostIcon)) {
                this.showToast(`${target.shortName} ${boostMsg} ${boostIcon}`, 'success');
                playSound('boost');
            }
        } else {
            const isMerge = Math.random() > 0.5;
            const penaltyIcon = isMerge ? '🔀' : '🤖';
            const penaltyMsg = isMerge ? 'has a merge conflict!' : 'got a Copilot error!';

            if (this.setRunnerState(target, 'penalty', penaltyIcon)) {
                this.showToast(`${target.shortName} ${penaltyMsg} ${penaltyIcon}`, 'error');
                playSound('error');
            }
        }
    },

    updateRankingSidebar() {
        // Sort by progress desc
        const sorted = [...this.state.runners].sort((a, b) => b.progress - a.progress);

        let html = '';
        sorted.forEach((runner, i) => {
            let icon = '📄';
            if (i === 0) icon = '🥇';
            if (i === 1) icon = '🥈';
            if (i === 2) icon = '🥉';

            html += `
            <div class="rank-item">
                <span class="rank-pos">${i + 1}.</span>
                <span>${icon} ${runner.shortName}</span>
            </div>`;
        });

        document.getElementById('ranking-list').innerHTML = html;
        if (sorted.length > 0) {
            this.elements.statusLeader.textContent = `Leader: ${sorted[0].shortName}`;
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message; // Redundant type prefixes removed

        container.appendChild(toast);

        // Remove after 3s
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }, 3000);
    },

    endRace() {
        this.state.raceFinished = true;

        // Ensure everyone not finished gets a rank based on distance
        const unfinished = this.state.runners.filter(r => !r.finished).sort((a, b) => b.progress - a.progress);
        this.state.finishedRunners.push(...unfinished);

        // Actual winner (in case nobody finished)
        this.state.winner = this.state.finishedRunners[0];

        setTimeout(() => {
            this.showWinnerScreen();
        }, 1000);

        // Clear all states
        this.state.runners.forEach(r => this.clearRunnerState(r));
    },

    showWinnerScreen() {
        const tabWinner = document.getElementById('tab-winner');
        if (tabWinner) tabWinner.style.display = 'flex';

        this.switchTab('winner');

        const viewWinner = document.getElementById('view-winner');
        if (viewWinner) viewWinner.scrollTop = 0;

        const announcement = document.getElementById('winner-announcement');
        const prizeText = this.state.prize || 'runs the daily standup!';
        announcement.innerHTML = `## 🏆 ${this.state.winner.name} ${prizeText}`;

        // Build podium
        const podiumHtml = this.buildPodiumHtml();
        document.getElementById('podium-container').innerHTML = podiumHtml;

        // Build table
        const tbody = document.querySelector('#final-ranking-table tbody');
        let trHtml = '';
        this.state.finishedRunners.forEach((r, i) => {
            const status = r.finished ? `${r.finishTime.toFixed(4)}s` : `DNF (${Math.floor(r.progress)}%)`;
            trHtml += `
            <tr>
                <td>${i + 1}</td>
                <td style="color: ${r.syntaxColor}; font-weight: bold;">${r.name}</td>
                <td>${status}</td>
            </tr>`;
        });
        tbody.innerHTML = trHtml;

        this.startConfetti();
    },

    buildPodiumHtml() {
        const top3 = this.state.finishedRunners.slice(0, 3);
        let html = '';

        // Render order: 2nd, 1st, 3rd
        const places = [
            { rank: 2, obj: top3[1] },
            { rank: 1, obj: top3[0] },
            { rank: 3, obj: top3[2] }
        ];

        places.forEach(p => {
            if (!p.obj) return;
            const rankIcon = p.rank === 1 ? '🥇' : (p.rank === 2 ? '🥈' : '🥉');
            html += `
            <div class="podium-place place-${p.rank}">
                <div class="podium-sprite sprite ${p.obj.gender === 'female' ? 'female' : ''}" style="--hoodie-color: ${p.obj.color}"></div>
                <div class="podium-step">${p.rank}</div>
                <div class="podium-name">${rankIcon} ${p.obj.name}</div>
            </div>`;
        });

        return html;
    },

    resetToConfig() {
        this.stopConfetti();
        document.getElementById('tab-race').style.display = 'none';
        document.getElementById('tab-winner').style.display = 'none';
        this.switchTab('config');
    },

    saveConfig() {
        this.updateParticipantCount();
        this.updateDurationLabel();
        this.updatePrizeLabel();

        const config = {
            duration: this.state.raceDuration,
            prize: this.state.prize,
            participants: this.state.participants
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 4));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "race-config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        this.showToast('Configuration saved to Downloads!', 'success');
    },

    loadConfig(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);

                if (config.duration) {
                    this.elements.durationInput.value = config.duration;
                    this.updateDurationLabel();
                }

                if (config.prize !== undefined) {
                    this.elements.prizeInput.value = config.prize;
                    this.updatePrizeLabel();
                }

                if (config.participants && Array.isArray(config.participants)) {
                    this.elements.namesInput.value = config.participants.join('\n');
                    this.updateParticipantCount();
                }

                this.showToast('Configuration loaded!', 'success');
            } catch (err) {
                this.showToast('Error parsing configuration file', 'error');
            }
        };
        reader.readAsText(file);

        // Reset the input so the same file can be loaded again if needed
        event.target.value = '';
    },

    copyWinnerToClipboard() {
        if (!this.state.winner) return;
        const prizeText = this.state.prize || 'runs the daily standup!';
        const text = `🏆 Winner: *${this.state.winner.name}* ${prizeText}`;
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    },

    // Confetti Implementation
    confettiState: {
        particles: [],
        ctx: null,
        width: 0,
        height: 0,
        animationRef: null
    },

    startConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        this.confettiState.ctx = canvas.getContext('2d');
        this.resizeConfetti();
        window.addEventListener('resize', () => this.resizeConfetti());

        this.confettiState.particles = Array.from({ length: 150 }).map(() => this.createConfettiParticle());

        this.renderConfetti();

        // Stop adding new after 3s, let them fall
        setTimeout(() => {
            this.confettiState.particles = [];
        }, 4000);
    },

    stopConfetti() {
        cancelAnimationFrame(this.confettiState.animationRef);
        const canvas = document.getElementById('confetti-canvas');
        if (this.confettiState.ctx) {
            this.confettiState.ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

    resizeConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.confettiState.width = canvas.width;
        this.confettiState.height = canvas.height;
    },

    createConfettiParticle() {
        const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#00e5ff'];
        return {
            x: Math.random() * this.confettiState.width,
            y: Math.random() * -this.confettiState.height, // start off-screen
            r: Math.random() * 6 + 4, // radius
            dx: Math.random() * 2 - 1, // drift
            dy: Math.random() * 3 + 2, // speed down
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10,
            tiltAngle: 0,
            tiltAngleInc: (Math.random() * 0.07) + 0.05
        };
    },

    renderConfetti() {
        if (this.state.tab !== 'winner') return;

        const ctx = this.confettiState.ctx;
        ctx.clearRect(0, 0, this.confettiState.width, this.confettiState.height);

        let activeParticles = 0;

        this.confettiState.particles.forEach((p) => {
            p.tiltAngle += p.tiltAngleInc;
            p.y += (Math.cos(p.tiltAngle) + p.dy);
            p.x += Math.sin(p.tiltAngle) * 2;

            if (p.y <= this.confettiState.height) activeParticles++;

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            ctx.stroke();
        });

        if (activeParticles > 0) {
            this.confettiState.animationRef = requestAnimationFrame(() => this.renderConfetti());
        }
    }
};

// Very basic sound synthesis
function playSound(type) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();

        switch (type) {
            case 'start':
                beepSequence(ctx, [
                    { f: 440, t: 0, d: 0.1 },
                    { f: 440, t: 0.4, d: 0.1 },
                    { f: 440, t: 0.8, d: 0.1 },
                    { f: 880, t: 1.2, d: 0.3 }
                ]);
                break;
            case 'boost':
                playTone(ctx, 400, 'sine', 0, 0.1, 800);
                break;
            case 'error':
                playTone(ctx, 200, 'sawtooth', 0, 0.3, 100);
                break;
            case 'winner':
                beepSequence(ctx, [
                    { f: 523.25, t: 0, d: 0.1 },
                    { f: 659.25, t: 0.15, d: 0.1 },
                    { f: 783.99, t: 0.3, d: 0.1 },
                    { f: 1046.50, t: 0.45, d: 0.4 }
                ]);
                break;
        }
    } catch (e) { /* ignore if audio not supported/allowed */ }
}

function playTone(ctx, freq, type, start, duration, freqEnd = null) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + start + duration);
    }

    gain.gain.setValueAtTime(0.1, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration);
}

function beepSequence(ctx, notes) {
    notes.forEach(n => playTone(ctx, n.f, 'square', n.t, n.d));
}

// Intercept tab changes from UI
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
