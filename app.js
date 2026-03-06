/**
 * Developer Race - Main Entry Point
 */
import { state, elements, initElements } from './game/state.js';
import { initAudio } from './game/audio.js';
import { startRace, endRace, triggerRandomEvent, setRunnerState } from './game/race.js';
import {
    switchTab,
    updateDurationLabel,
    updatePrizeLabel,
    updateParticipantCount,
    renderLineNumbers,
    resetToConfig,
    saveConfig,
    loadConfig,
    loadFromLocalStorage,
    initUIListeners,
    resetAppToDefault,
    copyWinnerToClipboard
} from './game/ui.js';

// Expose necessary functions and state to the window object
// so that inline HTML event handlers (e.g., onclick="app.startRace()") keep working.
window.app = {
    state,
    elements,
    init() {
        initElements();

        // Initial setup for UI
        if (!loadFromLocalStorage()) {
            // Only use defaults if nothing was loaded
            updateParticipantCount();
            updateDurationLabel();
            updatePrizeLabel();
        }

        // Setup initial line numbers
        renderLineNumbers(50, 'config-lines');

        // Watch for config changes
        initUIListeners();

        // Allow initializing audio context on first interaction
        document.body.addEventListener('click', () => {
            initAudio();
        }, { once: true });
    },
    switchTab,
    startRace,
    endRace, // Exposed for debugging or manual aborts if necessary
    resetToConfig,
    resetAppToDefault,
    saveConfig,
    loadConfig,
    copyWinnerToClipboard,

    // Internal functions exposed to window.app just in case, but generally handled by modules
    triggerRandomEvent,
    setRunnerState
};

// Intercept tab changes from UI
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
