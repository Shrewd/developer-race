export const state = {
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
};

export const elements = {
    // These will be initialized by the main app.js or ui.js
    namesInput: null,
    durationInput: null,
    durationLabel: null,
    btnRun: null,
    devCountLabel: null,
    statusTime: null,
    statusLeader: null,
    breadcrumb: null,
    prizeInput: null
};

export function initElements() {
    elements.namesInput = document.getElementById('names-input');
    elements.durationInput = document.getElementById('race-duration');
    elements.durationLabel = document.getElementById('duration-label');
    elements.btnRun = document.getElementById('btn-run');
    elements.devCountLabel = document.getElementById('dev-count-label');
    elements.statusTime = document.getElementById('status-time');
    elements.statusLeader = document.getElementById('status-leader');
    elements.breadcrumb = document.getElementById('breadcrumb-current');
    elements.prizeInput = document.getElementById('race-prize');
}
