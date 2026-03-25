import { FEMALE_NAMES } from './constants.js';

export function getGender(name) {
    const first = name.split(' ')[0]
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return FEMALE_NAMES.has(first) ? 'female' : 'male';
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Remove after 3s
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 300);
    }, 3000);
}
