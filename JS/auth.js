function checkAuth() {
    const session = sessionStorage.getItem('sparta_user');
    if (!session) window.location.href = 'login.html';
}
function getUser() { return JSON.parse(sessionStorage.getItem('sparta_user')); }
function logout() { sessionStorage.removeItem('sparta_user'); window.location.href = 'login.html'; }
function setupHeader() {
    const user = getUser();
    if (user) {
        document.getElementById('user-name').textContent = user.nombre;
        if (user.rol === 'admin') document.getElementById('admin-link').style.display = 'block';
        const btn = document.getElementById('user-btn');
        const menu = document.getElementById('user-dropdown');
        btn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('show'); });
        window.addEventListener('click', () => menu.classList.remove('show'));
    }
}