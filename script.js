const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    themeToggleBtn.textContent = '☀️';
}


if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.textContent = '☀️';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.textContent = '🌙';
        }
    });
}



const glitchScreen = document.getElementById('glitch-screen');

if (glitchScreen) {

    document.body.style.overflow = 'hidden';
    glitchScreen.addEventListener('click', () => {
        
        glitchScreen.classList.add('rebooting');
        document.body.style.overflow = '';
        setTimeout(() => {
            glitchScreen.remove();
        }, 800);
    });
}