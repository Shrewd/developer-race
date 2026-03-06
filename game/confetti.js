import { state } from './state.js';

export const confettiState = {
    particles: [],
    ctx: null,
    width: 0,
    height: 0,
    animationRef: null
};

export function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    confettiState.ctx = canvas.getContext('2d');
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);

    confettiState.particles = Array.from({ length: 150 }).map(() => createConfettiParticle());

    renderConfetti();

    // Stop adding new after 3s, let them fall
    setTimeout(() => {
        confettiState.particles = [];
    }, 4000);
}

export function stopConfetti() {
    cancelAnimationFrame(confettiState.animationRef);
    const canvas = document.getElementById('confetti-canvas');
    if (confettiState.ctx) {
        confettiState.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

export function resizeConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    confettiState.width = canvas.width;
    confettiState.height = canvas.height;
}

function createConfettiParticle() {
    const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#00e5ff'];
    return {
        x: Math.random() * confettiState.width,
        y: Math.random() * -confettiState.height, // start off-screen
        r: Math.random() * 6 + 4, // radius
        dx: Math.random() * 2 - 1, // drift
        dy: Math.random() * 3 + 2, // speed down
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10,
        tiltAngle: 0,
        tiltAngleInc: (Math.random() * 0.07) + 0.05
    };
}

function renderConfetti() {
    if (state.tab !== 'winner') return;

    const ctx = confettiState.ctx;
    ctx.clearRect(0, 0, confettiState.width, confettiState.height);

    let activeParticles = 0;

    confettiState.particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleInc;
        p.y += (Math.cos(p.tiltAngle) + p.dy);
        p.x += Math.sin(p.tiltAngle) * 2;

        if (p.y <= confettiState.height) activeParticles++;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
    });

    if (activeParticles > 0) {
        confettiState.animationRef = requestAnimationFrame(() => renderConfetti());
    }
}
