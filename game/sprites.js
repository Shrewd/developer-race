export function getRunnerSvg(runner) {
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
