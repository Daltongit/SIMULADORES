import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vwfpjvfjmmwmrqqahooi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZnBqdmZqbW13bXJxcWFob29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzkyNTcsImV4cCI6MjA4MTA1NTI1N30.pTc8KM-GnxVRgrYpcqm8YUZ9zb6Co-QgKT0i7W41HEA';
const supabase = createClient(supabaseUrl, supabaseKey);
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('reporte-container');
    const spinner = document.getElementById('loading-spinner');

    // Filtros
    const fCiudad = document.getElementById('filtro-ciudad');
    const fMateria = document.getElementById('filtro-materia');
    const fNombre = document.getElementById('filtro-nombre');

    try {
        const { data: intentos } = await supabase.from('resultados').select('*');
        const { data: usuariosLocal } = await fetch('DATA/usuarios.json').then(r => r.json());

        // Poblar filtro materias
        const materiasUnicas = [...new Set(intentos.map(i => i.materia))].sort();
        materiasUnicas.forEach(m => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = m;
            fMateria.appendChild(opt);
        });

        const render = () => {
            container.innerHTML = '';
            // Combinar datos
            const usuariosFiltrados = usuariosLocal.filter(u => u.rol === 'aspirante').filter(u => {
                const matchCiudad = fCiudad.value === 'Todas' || u.ciudad === fCiudad.value;
                const matchNombre = u.nombre.toLowerCase().includes(fNombre.value.toLowerCase());
                return matchCiudad && matchNombre;
            });

            usuariosFiltrados.forEach(user => {
                const userIntentos = intentos.filter(i =>
                    i.usuario_id === user.usuario &&
                    (fMateria.value === 'Todas' || i.materia === fMateria.value)
                );

                if (fMateria.value !== 'Todas' && userIntentos.length === 0) return;

                const card = document.createElement('div');
                card.className = 'user-card';
                card.innerHTML = `
                    <div class="user-header">
                        <div><h3>${user.nombre}</h3><span>${user.ciudad}</span></div>
                        <strong>${userIntentos.length} Intentos</strong>
                    </div>
                    <div class="user-attempts">
                        <table class="table">
                            <thead><tr><th>Materia</th><th>Puntaje</th><th>Fecha</th></tr></thead>
                            <tbody>
                                ${userIntentos.map(i => `
                                    <tr>
                                        <td>${i.materia}</td>
                                        <td style="color:${i.puntaje >= 700 ? 'green' : 'red'}">${i.puntaje}</td>
                                        <td>${new Date(i.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                card.querySelector('.user-header').onclick = () => card.classList.toggle('open');
                container.appendChild(card);
            });
        };

        // Listeners
        fCiudad.onchange = render;
        fMateria.onchange = render;
        fNombre.oninput = render;
        render(); // Initial render
        spinner.style.display = 'none';

    } catch (e) {
        container.innerHTML = `<p style="color:red">Error: ${e.message}</p>`;
    }
});