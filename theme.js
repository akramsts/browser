function applyRootTheme() {
    let theme = 'system';
    try {
        theme = localStorage.getItem('theme') || 'system';
    } catch (e) { }

    if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        if (document.body) document.body.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
        if (document.body) document.body.classList.remove('dark-mode');
    }
}
applyRootTheme();
document.addEventListener('DOMContentLoaded', applyRootTheme);

window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
        applyRootTheme();
    }
});

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const handleThemeChange = (e) => {
    let currentTheme = 'system';
    try { currentTheme = localStorage.getItem('theme') || 'system'; } catch (err) { }

    if (currentTheme === 'system') {
        document.documentElement.classList.add('theme-transition');
        setTimeout(() => document.documentElement.classList.remove('theme-transition'), 300);
        applyRootTheme();
    }
};

if (darkQuery.addEventListener) {
    darkQuery.addEventListener('change', handleThemeChange);
} else {
    darkQuery.addListener(handleThemeChange);
}

window.addEventListener('pageshow', () => {
    applyRootTheme();
    if (document.body) {
        document.body.classList.remove('page-enter');
        void document.body.offsetWidth;
        document.body.classList.add('page-enter');
    }
});