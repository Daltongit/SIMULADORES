import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// TUS CREDENCIALES
const supabaseUrl = 'https://vwfpjvfjmmwmrqqahooi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZnBqdmZqbW13bXJxcWFob29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzkyNTcsImV4cCI6MjA4MTA1NTI1N30.pTc8KM-GnxVRgrYpcqm8YUZ9zb6Co-QgKT0i7W41HEA';
const supabase = createClient(supabaseUrl, supabaseKey);
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('reporte-container');
    const spinner = document.getElementById('loading-spinner');
    const fCiudad = document.getElementById('filtro-ciudad');
    const fMateria = document.getElementById('filtro-materia');
    const fNombre = document.getElementById('filtro-nombre');

    function showError(msg) {
        document.getElementById('error-text').innerHTML = msg;
        document.getElementById('error-modal').style.display = 'flex';
        spinner.style.display = 'none';
        container.innerHTML = '<p style="text-align:center; color:red;">No se pudieron cargar los datos.</p>';
    }

    try {
        const { data: intentos, error } = await supabase.from('resultados').select('*');
        
        if(error) throw new Error(error.message);

        const resUsers = await fetch('DATA/usuarios.json');
        if(!resUsers.ok) throw new Error("No se encuentra DATA/usuarios.json");
        const usuariosLocal = await resUsers.json();

        // Poblar filtro
        if(intentos && intentos.length > 0) {
            const materiasUnicas = [...new Set(intentos.map(i => i.materia))].sort();
            materiasUnicas.forEach(m => {
                const opt = document.createElement('option');
                opt.value = opt.textContent = m;
                fMateria.appendChild(opt);
            });
        }

        const render = () => {
            container.innerHTML = '';
            if(!intentos || intentos.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No hay resultados registrados aún.</div>';
                return;
            }

            const usuarios = usuariosLocal.filter(u => u.rol === 'aspirante').filter(u => {
                const matchCiudad = fCiudad.value === 'Todas' || u.ciudad === fCiudad.value;
                const matchNombre = u.nombre.toLowerCase().includes(fNombre.value.toLowerCase());
                return matchCiudad && matchNombre;
            });

            usuarios.forEach(user => {
                const userIntentos = intentos.filter(i => 
                    i.usuario_id === user.usuario && 
                    (fMateria.value === 'Todas' || i.materia === fMateria.value)
                );

                if (fMateria.value !== 'Todas' && userIntentos.length === 0) return;

                const card = document.createElement('div');
                card.className = 'user-card';
                card.innerHTML = `
                    <div class="user-header">
                        <div>
                            <h3 style="margin:0; font-family:'Teko'; font-size:1.4rem;">${user.nombre}</h3>
                            <span style="font-size:0.9rem; color:#666;">${user.ciudad}</span>
                        </div>
                        <div style="text-align:right;">
                            <strong style="color:var(--primary); font-size:1.2rem;">${userIntentos.length}</strong> <small>Intentos</small>
                            <i class="fas fa-chevron-down" style="margin-left:10px;"></i>
                        </div>
                    </div>
                    <div class="user-attempts">
                        ${userIntentos.length === 0 ? '<p>Sin intentos.</p>' : `
                        <table class="table">
                            <thead><tr><th>Materia</th><th>Puntaje</th><th>Fecha</th></tr></thead>
                            <tbody>
                                ${userIntentos.map(i => `
                                    <tr>
                                        <td>${i.materia}</td>
                                        <td style="font-weight:bold; color:${i.puntaje >= 700 ? '#27ae60' : '#c0392b'}">${i.puntaje}</td>
                                        <td>${new Date(i.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`}
                    </div>
                `;
                card.querySelector('.user-header').onclick = () => card.classList.toggle('open');
                container.appendChild(card);
            });
        };

        fCiudad.onchange = render;
        fMateria.onchange = render;
        fNombre.oninput = render;
        
        spinner.style.display = 'none';
        render();

    } catch (e) {
        showError(e.message);
    }
});
