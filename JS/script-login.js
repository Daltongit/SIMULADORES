document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('usuario').value.trim();
    const pass = document.getElementById('contrasena').value.trim();
    const errorDiv = document.getElementById('error-msg');
    try {
        const res = await fetch('DATA/usuarios.json');
        if (!res.ok) throw new Error("Base de datos no encontrada");
        const usuarios = await res.json();
        const found = usuarios.find(u => u.usuario === user && u.contrasena === pass);
        if (found) {
            sessionStorage.setItem('sparta_user', JSON.stringify(found));
            window.location.href = 'index.html';
        } else {
            errorDiv.textContent = "Credenciales incorrectas";
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = "Error: " + err.message;
        errorDiv.style.display = 'block';
    }
});