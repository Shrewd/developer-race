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
    'alice', 'amalia', 'amelia', 'amparo', 'ana', 'andre', 'andrea', 'angeles', 'anna', 'anne', 'antonia', 'ariadna', 'ashley', 'aurora', 'ava',
    'bea', 'beatriz', 'belen', 'beli', 'blanca',
    'carla', 'carmen', 'caro', 'carol', 'carolina', 'celia', 'charo', 'chloe', 'clara', 'claudia', 'concha', 'conchi', 'cris', 'cristina',
    'dani', 'daniela', 'diana', 'dolores',
    'ele', 'elena', 'eli', 'elisa', 'ella', 'emily', 'emma', 'estefania', 'eva',
    'fatima', 'fernanda',
    'gloria', 'grace',
    'hannah',
    'ines', 'ingrid', 'inma', 'inmaculada', 'irene', 'isa', 'isabel', 'isabella',
    'jane', 'jennifer', 'jessica', 'jimena', 'josefina', 'judith', 'julia',
    'kate',
    'laia', 'lara', 'lau', 'laura', 'leire', 'leonor', 'leti', 'leticia', 'lidia', 'lilly', 'lola', 'loli',
    'lore', 'lorena', 'lucia', 'lucy', 'luisa',
    'magdalena', 'manuela', 'margaret', 'mari', 'maria', 'marina', 'marta', 'mary', 'mercedes', 'merche', 'mery', 'mia',
    'mireia', 'miri', 'miriam', 'monica', 'montserrat',
    'nadia', 'nati', 'natalia', 'nerea', 'nieves', 'noa', 'noelia', 'nora', 'nuri', 'nuria',
    'olga', 'olivia',
    'paloma', 'pam', 'patri', 'patricia', 'paula', 'penelope', 'pili', 'pilar',
    'rachel', 'raquel', 'remedios', 'rocio', 'rosa', 'rosario', 'ruth',
    'sandra', 'sandy', 'sara', 'sarah', 'sheila', 'silvia', 'sofi', 'sofia', 'sonia', 'sophia', 'soraya', 'susan', 'susi', 'susana',
    'taylor', 'tere', 'teresa', 'toni', 'tonia', 'trinidad',
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
        // Ensure minimum line count for visual appearance
        const finalCount = Math.max(count, 35);
        let html = '';
        for (let i = 1; i <= finalCount; i++) {
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

        if (this.state.runners.length > 12) {
            container.classList.add('compact-mode');
        } else {
            container.classList.remove('compact-mode');
        }

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
                        <div class="sprite running ${runner.gender === 'female' ? 'female' : ''}" style="--hoodie-color: ${runner.color}">
                            ${this.getRunnerSvg(runner)}
                        </div>
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
                <div class="podium-sprite sprite ${p.obj.gender === 'female' ? 'female' : ''}" style="--hoodie-color: ${p.obj.color}">
                    ${this.getRunnerSvg(p.obj)}
                </div>
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
    },

    getRunnerSvg(runner) {
        const isFemale = runner.gender === 'female';

        // Generate a pseudo-random stable hash from the runner's name for visual variety
        let hash = 0;
        for (let i = 0; i < runner.name.length; i++) {
            hash = runner.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);

        const hasGlasses = hash % 3 === 0;
        const hasBeard = !isFemale && hash % 2 === 0;
        const hairStyle = hash % 3; // 0, 1, 2 for variations

        const svgDeskAndLaptop = `
            <!-- Desk -->
            <path d="M 15 65 L 75 65 L 70 72 L 10 72 Z" fill="#5D4037"/>
            <rect x="15" y="65" width="60" height="3" fill="#8D6E63"/>
            <!-- Laptop Back -->
            <path d="M 50 62 L 40 35 L 70 35 L 75 62 Z" fill="#90A4AE"/>
            <path d="M 49 61 L 41 37 L 68 37 L 73 61 Z" fill="#263238"/>
            <path d="M 48 60 L 42 39 L 66 39 L 71 60 Z" fill="#4FC3F7"/>
            <line x1="45" y1="43" x2="60" y2="43" stroke="#81D4FA" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="44" y1="47" x2="55" y2="47" stroke="#81D4FA" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="44" y1="51" x2="63" y2="51" stroke="#81D4FA" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="43" y1="55" x2="50" y2="55" stroke="#81D4FA" stroke-width="1.5" stroke-linecap="round"/>
            <!-- Laptop Base -->
            <path d="M 40 62 L 75 62 L 78 65 L 37 65 Z" fill="#B0BEC5"/>
            <path d="M 42 63 L 73 63 L 74 64 L 41 64 Z" fill="#78909C"/>
        `;

        const svgBodyAndHands = `
            <!-- Developer Body (Hoodie) -->
            <path d="M 12 65 C 10 40 38 40 40 65 Z" fill="var(--hoodie-color)"/>
            <!-- Hoodie Strings -->
            <path d="M 22 45 Q 24 52 23 58" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M 28 45 Q 26 52 27 58" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
            <!-- Neck -->
            <rect x="22" y="32" width="6" height="6" fill="#E65100" opacity="0.3"/>
            <rect x="22" y="30" width="6" height="8" fill="#FFCC80"/>
            <!-- Arm & Hand typing -->
            <path d="M 20 48 Q 30 55 45 58" fill="none" stroke="var(--hoodie-color)" stroke-width="8" stroke-linecap="round"/>
            <circle cx="48" cy="59" r="4" fill="#FFCC80"/>
            <path d="M 20 46 Q 30 53 45 56" fill="none" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="2" stroke-linecap="round"/>
        `;

        const glassesMaleSvg = hasGlasses ? `
            <rect x="24" y="22" width="12" height="6" rx="2" fill="none" stroke="#333" stroke-width="1.5"/>
            <line x1="15" y1="24" x2="24" y2="24" stroke="#333" stroke-width="1.5"/>
            <circle cx="30" cy="25" r="1.5" fill="#333"/>
        ` : `<circle cx="30" cy="25" r="2" fill="#333"/>`;

        const beardSvg = hasBeard ? `
            <path d="M 28 28 L 36 28 C 36 35 30 38 25 38 L 22 35 Z" fill="#3E2723" opacity="0.9"/>
        ` : ``;

        const svgMaleHead = `
            <!-- Head -->
            <rect x="15" y="16" width="20" height="22" rx="8" fill="#FFCC80"/>
            <circle cx="15" cy="27" r="3" fill="#FFB74D"/>
            <!-- Glasses & Eye -->
            ${glassesMaleSvg}
            <path d="M 30 32 Q 33 34 35 30" fill="none" stroke="#A1887F" stroke-width="1.5" stroke-linecap="round"/>
            <!-- Hair -->
            <path d="M 13 22 C 10 10 25 10 35 15 C 38 17 35 22 35 22 C 35 22 30 15 25 15 C 20 15 15 18 13 22 Z" fill="#3E2723"/>
            <path d="M 13 22 L 13 28 C 10 27 12 20 12 18 C 12 10 30 10 35 18 L 35 20 C 33 16 28 13 20 14 C 15 15 13 18 13 22 Z" fill="#3E2723"/>
            <path d="M 13 28 Q 11 20 18 15 Q 28 12 34 20 Q 28 15 20 16 Q 14 18 13 28 Z" fill="#4E342E"/>
            ${beardSvg}
        `;

        const femaleHairBack = hairStyle === 1 ? `
            <path d="M 10 25 C 0 25 0 35 5 45 C 8 50 15 50 17 40 Z" fill="#3E2723"/>
        ` : hairStyle === 2 ? `
            <path d="M 13 18 C 5 20 8 35 12 40 C 16 40 18 35 17 30 Z" fill="#3E2723"/>
        ` : `
            <path d="M 13 18 C 5 25 8 45 12 55 C 16 55 18 50 17 40 C 17 30 20 20 25 15 C 20 15 15 15 13 18 Z" fill="#3E2723"/>
        `;

        const glassesFemaleSvg = hasGlasses ? `
            <rect x="24" y="22" width="12" height="6" rx="2" fill="none" stroke="#F06292" stroke-width="1.5"/>
            <line x1="15" y1="24" x2="24" y2="24" stroke="#F06292" stroke-width="1.5"/>
            <circle cx="30" cy="25" r="1.5" fill="#333"/>
        ` : `
            <circle cx="28" cy="25" r="2" fill="#333"/>
            <circle cx="34" cy="25" r="2" fill="#333"/>
            <path d="M 26 24 C 27 22 29 22 30 24" fill="none" stroke="#333" stroke-width="1"/>
            <path d="M 32 24 C 33 22 35 22 36 24" fill="none" stroke="#333" stroke-width="1"/>
        `;

        const svgFemaleHead = `
            <!-- Back Hair -->
            ${femaleHairBack}
            <!-- Head -->
            <rect x="15" y="16" width="20" height="22" rx="8" fill="#FFCC80"/>
            <circle cx="15" cy="27" r="3" fill="#FFB74D"/>
            <!-- Face Details -->
            ${glassesFemaleSvg}
            <circle cx="24" cy="28" r="2" fill="#FF8A65" opacity="0.6"/>
            <path d="M 30 33 Q 32 35 34 33" fill="none" stroke="#F06292" stroke-width="1.5" stroke-linecap="round"/>
            <!-- Top & Front Hair -->
            <path d="M 13 22 C 10 10 28 8 36 15 C 38 17 38 22 35 22 C 32 15 25 13 18 15 L 13 22 Z" fill="#3E2723"/>
            <path d="M 15 18 Q 20 10 30 15 Q 25 16 18 20 Z" fill="#4E342E"/>
            <path d="M 12 28 Q 8 35 15 45 Q 18 40 16 30 Z" fill="#4E342E"/>
        `;

        return `
            <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                ${svgDeskAndLaptop}
                ${isFemale ? svgFemaleHead : ''}
                ${svgBodyAndHands}
                ${!isFemale ? svgMaleHead : ''}
            </svg>
        `;
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
