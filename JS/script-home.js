const MENU = {
    root: [
        { id: 'policia', type: 'folder', title: 'POLICÍA NACIONAL', icon: 'fas fa-shield-alt', desc: 'Procesos de selección' },
        { id: 'ffaa', type: 'folder', title: 'FUERZAS ARMADAS', icon: 'fas fa-jet', desc: 'Procesos Militares' },
        { id: 'general', type: 'folder', title: 'GENERAL', icon: 'fas fa-globe', desc: 'Pruebas Psicométricas' }
    ],
    policia: [
        { id: 'pol_academicas', type: 'folder', title: 'Simuladores Pruebas Académicas', icon: 'fas fa-book' },
        { id: 'pol_ppnn', type: 'folder', title: 'Pruebas PPNN 2025', icon: 'fas fa-file-contract' }
    ],
    pol_academicas: [
        { type: 'test', title: 'Ciencias Sociales', file: 'POLICIA/GENERAL_POLICIA/sociales.json', mode: 'normal' },
        { type: 'test', title: 'Matemáticas y Física', file: 'POLICIA/GENERAL_POLICIA/matematicas.json', mode: 'normal' },
        { type: 'test', title: 'Lengua y Literatura', file: 'POLICIA/GENERAL_POLICIA/lengua.json', mode: 'normal' },
        { type: 'test', title: 'Inglés', file: 'POLICIA/GENERAL_POLICIA/ingles.json', mode: 'normal' },
        { type: 'test', title: 'General (Todas)', file: 'POLICIA/GENERAL_POLICIA/general', mode: 'general_policia' }
    ],
    pol_ppnn: [
        { type: 'test', title: 'Cuestionario 1 PPNN', file: 'POLICIA/PPNN/ppnn1.json', mode: 'ppnn' },
        { type: 'test', title: 'Cuestionario 2 PPNN', file: 'POLICIA/PPNN/ppnn2.json', mode: 'ppnn' },
        { type: 'test', title: 'Cuestionario 3 PPNN', file: 'POLICIA/PPNN/ppnn3.json', mode: 'ppnn' },
        { type: 'test', title: 'Cuestionario 4 PPNN', file: 'POLICIA/PPNN/ppnn4.json', mode: 'ppnn' }
    ],
    ffaa: [
        { id: 'ffaa_esmil', type: 'folder', title: 'Simuladores Pruebas Académicas ESMIL', icon: 'fas fa-university' }
    ],
    ffaa_esmil: [
        { type: 'test', title: 'Ciencias Sociales', file: 'FFAA/ESMIL/sociales_esmil.json', mode: 'normal' },
        { type: 'test', title: 'Matemáticas', file: 'FFAA/ESMIL/matematicas_esmil.json', mode: 'normal' },
        { type: 'test', title: 'Lengua', file: 'FFAA/ESMIL/lengua_esmil.json', mode: 'normal' },
        { type: 'test', title: 'Inglés', file: 'FFAA/ESMIL/ingles_esmil.json', mode: 'normal' },
        { type: 'test', title: 'General ESMIL', file: 'FFAA/ESMIL/general', mode: 'general_esmil' }
    ],
    general: [
        { id: 'gen_psico', type: 'folder', title: 'Simuladores Psicosométricos', icon: 'fas fa-brain' }
    ],
    gen_psico: [
        { type: 'test', title: 'Inteligencia', file: 'GENERAL/PSICO/inteligencia.json', mode: 'normal' },
        { type: 'test', title: 'Personalidad', file: 'GENERAL/PSICO/personalidad.json', mode: 'normal' }
    ]
};

let historyStack = ['root'];

function render(menuId) {
    const container = document.getElementById('grid-container');
    const crumbs = document.getElementById('breadcrumbs');
    container.innerHTML = '';
    crumbs.innerHTML = '';

    historyStack.forEach((id, idx) => {
        let title = (id === 'root') ? 'Inicio' : findTitle(id);
        const span = document.createElement('span');
        span.textContent = title;
        span.onclick = () => {
            historyStack = historyStack.slice(0, idx + 1);
            render(historyStack[historyStack.length - 1]);
        };
        crumbs.appendChild(span);
        if (idx < historyStack.length - 1) crumbs.innerHTML += ' <i class="fas fa-chevron-right"></i> ';
    });

    const items = MENU[menuId] || [];
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = item.type === 'folder' ? 'card card-folder' : 'card card-test';
        div.innerHTML = `<i class="${item.icon}"></i><h3>${item.title}</h3>${item.desc ? `<p>${item.desc}</p>` : ''}`;
        div.onclick = () => {
            if (item.type === 'folder') {
                historyStack.push(item.id);
                render(item.id);
            } else {
                window.location.href = `simulador.html?file=${item.file}&mode=${item.mode}&title=${encodeURIComponent(item.title)}`;
            }
        };
        container.appendChild(div);
    });
}

function findTitle(id) {
    for (const key in MENU) {
        const found = MENU[key].find(i => i.id === id);
        if (found) return found.title;
    }
    return id;
}

document.addEventListener('DOMContentLoaded', () => render('root'));