import { state, elements } from './state.js';
import { getRunnerSvg } from './sprites.js';
import { showToast } from './utils.js';
import { startConfetti, stopConfetti } from './confetti.js';

export function switchTab(tabId) {
    // Block race/winner tabs if no race has started yet
    if (tabId === 'race' && state.runners.length === 0) {
        showToast('Start a race first! Hit ▶ Run Race.', 'info');
        return;
    }
    if (tabId === 'winner' && !state.raceFinished) {
        showToast('No finished race yet. Run one first!', 'info');
        return;
    }

    if (state.tab === 'race' && tabId !== 'race' && !state.raceFinished) {
        if (!confirm("Race is in progress. Are you sure you want to stop?")) return;
        cancelAnimationFrame(state.raceAnimationFrame);
    }

    state.tab = tabId;

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
    elements.breadcrumb.textContent = breadcrumbText;

    // Toggle sidebar panels
    document.getElementById('ranking-panel').style.display = (tabId === 'race') ? 'block' : 'none';

    if (tabId === 'race' && state.runners.length > 0) {
        renderLineNumbers(state.runners.length + 5, 'race-lines');
    }
}

export function updateDurationLabel() {
    state.raceDuration = parseInt(elements.durationInput.value, 10);
    elements.durationLabel.textContent = state.raceDuration;
}

export function updatePrizeLabel() {
    if (elements.prizeInput) {
        state.prize = elements.prizeInput.value;
    }
}

export function updateParticipantCount() {
    const text = elements.namesInput.value;
    const lines = text.split('\n');
    const validNames = lines
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('//'));

    // Remove duplicates
    state.participants = [...new Set(validNames)];

    elements.devCountLabel.textContent = `// ${state.participants.length} developers ready`;

    if (state.participants.length >= 2 && state.participants.length <= 50) {
        elements.btnRun.disabled = false;
    } else {
        elements.btnRun.disabled = true;
    }
}

export function renderLineNumbers(count, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    // Ensure minimum line count for visual appearance
    const finalCount = Math.max(count, 35);
    let html = '';
    for (let i = 1; i <= finalCount; i++) {
        html += `<div>${i}</div>`;
    }
    container.innerHTML = html;
}

export function updateRankingSidebar() {
    // Sort by progress desc
    const sorted = [...state.runners].sort((a, b) => b.progress - a.progress);

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
        elements.statusLeader.textContent = `Leader: ${sorted[0].shortName}`;
    }
}

export function showWinnerScreen() {
    const tabWinner = document.getElementById('tab-winner');
    if (tabWinner) tabWinner.style.display = 'flex';

    switchTab('winner');

    const viewWinner = document.getElementById('view-winner');
    if (viewWinner) viewWinner.scrollTop = 0;

    const announcement = document.getElementById('winner-announcement');
    const prizeText = state.prize || 'runs the daily standup!';
    announcement.innerHTML = `## 🏆 ${state.winner.name} ${prizeText}`;

    // Build podium
    const podiumHtml = buildPodiumHtml();
    document.getElementById('podium-container').innerHTML = podiumHtml;

    // Build table
    const tbody = document.querySelector('#final-ranking-table tbody');
    let trHtml = '';
    state.finishedRunners.forEach((r, i) => {
        const status = r.finished ? `${r.finishTime.toFixed(4)}s` : `DNF (${Math.floor(r.progress)}%)`;
        trHtml += `
        <tr>
            <td>${i + 1}</td>
            <td style="color: ${r.syntaxColor}; font-weight: bold;">${r.name}</td>
            <td>${status}</td>
        </tr>`;
    });
    tbody.innerHTML = trHtml;

    startConfetti();
}

function buildPodiumHtml() {
    const top3 = state.finishedRunners.slice(0, 3);
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
                ${getRunnerSvg(p.obj)}
            </div>
            <div class="podium-step">${p.rank}</div>
            <div class="podium-name">${rankIcon} ${p.obj.name}</div>
        </div>`;
    });

    return html;
}

export function resetToConfig() {
    stopConfetti();
    document.getElementById('tab-race').style.display = 'none';
    document.getElementById('tab-winner').style.display = 'none';
    switchTab('config');
}

export function saveConfig() {
    updateParticipantCount();
    updateDurationLabel();
    updatePrizeLabel();

    const config = {
        duration: state.raceDuration,
        prize: state.prize,
        participants: state.participants
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 4));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "race-config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    showToast('Configuration saved to Downloads!', 'success');
}

export function loadConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);

            if (config.duration) {
                elements.durationInput.value = config.duration;
                updateDurationLabel();
            }

            if (config.prize !== undefined) {
                elements.prizeInput.value = config.prize;
                updatePrizeLabel();
            }

            if (config.participants && Array.isArray(config.participants)) {
                elements.namesInput.value = config.participants.join('\n');
                updateParticipantCount();
            }

            showToast('Configuration loaded!', 'success');
        } catch (err) {
            showToast('Error parsing configuration file', 'error');
        }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be loaded again if needed
    event.target.value = '';
}

export function copyWinnerToClipboard() {
    if (!state.winner) return;
    const prizeText = state.prize || 'runs the daily standup!';
    const text = `🏆 Winner: *${state.winner.name}* ${prizeText}`;
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    });
}
