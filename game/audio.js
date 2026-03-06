// Very basic sound synthesis
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

let audioCtx = null;

export function initAudio() {
    if (!audioCtx) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        } catch (e) {
            console.warn('Audio Context not supported.');
        }
    }
}

export function playSound(type) {
    if (!audioCtx) return;

    // Resume if suspended (browser auto-play policies)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    try {
        switch (type) {
            case 'start':
                beepSequence(audioCtx, [
                    { f: 440, t: 0, d: 0.1 },
                    { f: 440, t: 0.4, d: 0.1 },
                    { f: 440, t: 0.8, d: 0.1 },
                    { f: 880, t: 1.2, d: 0.3 }
                ]);
                break;
            case 'boost':
                playTone(audioCtx, 400, 'sine', 0, 0.1, 800);
                break;
            case 'error':
                playTone(audioCtx, 200, 'sawtooth', 0, 0.3, 100);
                break;
            case 'winner':
                beepSequence(audioCtx, [
                    { f: 523.25, t: 0, d: 0.1 },
                    { f: 659.25, t: 0.15, d: 0.1 },
                    { f: 783.99, t: 0.3, d: 0.1 },
                    { f: 1046.50, t: 0.45, d: 0.4 }
                ]);
                break;
        }
    } catch (e) { /* ignore if audio fails */ }
}
