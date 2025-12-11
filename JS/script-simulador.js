import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// TUS CREDENCIALES (CONFIRMADAS)
const supabaseUrl = 'https://vwfpjvfjmmwmrqqahooi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZnBqdmZqbW13bXJxcWFob29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzkyNTcsImV4cCI6MjA4MTA1NTI1N30.pTc8KM-GnxVRgrYpcqm8YUZ9zb6Co-QgKT0i7W41HEA';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    // Params
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    const modeParam = urlParams.get('mode');
    const titleParam = decodeURIComponent(urlParams.get('title') || 'Simulador');

    // UI
    document.getElementById('header-title').textContent = titleParam.toUpperCase();
    document.getElementById('lobby-title').textContent = titleParam;
    const btnStart = document.getElementById('btn-start');

    let questions = [];
    let userAnswers = [];
    let currentIdx = 0;
    let timerInterval;
    let timeLeft = 3600;

    // --- FUNCIÓN DE ERROR (ACTIVA EL MODAL) ---
    function showError(msg) {
        console.error(msg);
        document.getElementById('error-text').innerHTML = msg;
        document.getElementById('error-modal').style.display = 'flex';
        btnStart.textContent = "Error de Carga";
        btnStart.style.backgroundColor = "#d32f2f";
    }

    async function loadData() {
        try {
            if (!fileParam && !modeParam) throw new Error("No se ha seleccionado ningún simulador.");

            // Lógica General
            if (modeParam && modeParam.includes('general')) {
                timeLeft = 3 * 3600;
                const folder = modeParam === 'general_policia' ? 'POLICIA/GENERAL_POLICIA' : 'FFAA/ESMIL';
                const suffix = modeParam === 'general_esmil' ? '_esmil.json' : '.json';
                const files = ['sociales', 'matematicas', 'lengua', 'ingles'];
                
                let filesLoaded = 0;
                for(let base of files) {
                    const path = `DATA/${folder}/${base}${suffix}`;
                    try {
                        const res = await fetch(path);
                        if(res.ok) {
                            const data = await res.json();
                            questions = questions.concat(data.sort(() => 0.5 - Math.random()).slice(0, 50));
                            filesLoaded++;
                        }
                    } catch (err) {
                        console.warn(`Saltando archivo: ${path}`);
                    }
                }
                if (filesLoaded === 0) throw new Error(`No se encontraron archivos en la carpeta DATA/${folder}/`);

            } else {
                // Lógica Normal
                if(fileParam.includes('matematicas')) timeLeft = 90 * 60;
                
                const res = await fetch(`DATA/${fileParam}`);
                if(!res.ok) throw new Error(`No se encontró el archivo: <b>DATA/${fileParam}</b>.<br>Verifica que exista en la carpeta.`);
                
                const data = await res.json();
                
                if (modeParam === 'ppnn') {
                    questions = data.sort(() => 0.5 - Math.random());
                    document.getElementById('instructions').innerHTML = "<p><strong>¡Atención!</strong> Responda rápido y con eficacia.</p>";
                } else {
                    questions = data.sort(() => 0.5 - Math.random()).slice(0, 50);
                    document.getElementById('instructions').innerHTML = "<p><strong>Instrucciones:</strong> Lea atentamente cada pregunta.</p>";
                }
            }

            if(questions.length === 0) throw new Error("El archivo de preguntas está vacío.");

            // Update UI
            document.getElementById('total-questions').textContent = questions.length;
            document.getElementById('time-limit').textContent = Math.floor(timeLeft / 60);
            
            btnStart.disabled = false;
            btnStart.innerHTML = `COMENZAR INTENTO <i class="fas fa-play"></i>`;
            btnStart.onclick = startQuiz;

        } catch (e) {
            showError(e.message);
        }
    }

    function startQuiz() {
        document.getElementById('lobby').style.display = 'none';
        document.getElementById('quiz').style.display = 'grid';
        userAnswers = new Array(questions.length).fill(null);
        renderNav();
        showQuestion(0);
        startTimer();
    }

    function showQuestion(idx) {
        currentIdx = idx;
        const q = questions[idx];
        document.getElementById('q-current').textContent = idx + 1;
        document.getElementById('q-text').textContent = q.pregunta;
        
        // Manejo seguro de imágenes
        const imgCont = document.getElementById('q-image-container');
        if (q.imagen) {
            // Intenta cargar, si falla la oculta
            imgCont.innerHTML = `<img src="${q.imagen}" onerror="this.style.display='none'" style="max-width:100%; border-radius:8px; margin-top:15px; border:1px solid #ddd;">`;
        } else {
            imgCont.innerHTML = '';
        }

        const optsCont = document.getElementById('options-list');
        optsCont.innerHTML = '';
        q.opciones.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `option-btn ${userAnswers[idx] === opt ? 'selected' : ''}`;
            btn.textContent = opt;
            btn.onclick = () => selectAnswer(opt);
            optsCont.appendChild(btn);
        });

        document.querySelectorAll('.nav-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    }

    function selectAnswer(opt) {
        userAnswers[currentIdx] = opt;
        document.querySelector(`.nav-dot[data-idx="${currentIdx}"]`).classList.add('answered');
        showQuestion(currentIdx);
    }

    function renderNav() {
        const grid = document.getElementById('nav-grid');
        grid.innerHTML = '';
        for(let i=0; i<questions.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'nav-dot';
            btn.textContent = i + 1;
            btn.dataset.idx = i;
            btn.onclick = () => showQuestion(i);
            grid.appendChild(btn);
        }
    }

    document.getElementById('btn-next').onclick = () => { if(currentIdx < questions.length - 1) showQuestion(currentIdx + 1); };
    document.getElementById('btn-prev').onclick = () => { if(currentIdx > 0) showQuestion(currentIdx - 1); };
    document.getElementById('btn-finish').onclick = finishQuiz;

    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft--;
            const m = Math.floor(timeLeft / 60).toString().padStart(2,'0');
            const s = (timeLeft % 60).toString().padStart(2,'0');
            document.getElementById('timer').textContent = `${m}:${s}`;
            if(timeLeft <= 0) { clearInterval(timerInterval); finishQuiz(); }
        }, 1000);
    }

    async function finishQuiz() {
        clearInterval(timerInterval);
        document.getElementById('quiz').style.display = 'none';
        
        let correct = 0;
        questions.forEach((q, i) => { if(userAnswers[i] === q.respuesta) correct++; });
        
        const score = Math.round((correct * 1000) / questions.length);

        document.getElementById('results').style.display = 'block';
        document.getElementById('final-score').textContent = score;
        document.getElementById('res-correct').textContent = correct;
        document.getElementById('res-incorrect').textContent = questions.length - correct;

        // GUARDAR SUPABASE
        const user = JSON.parse(sessionStorage.getItem('sparta_user'));
        if(user) {
            try {
                const { error } = await supabase.from('resultados').insert([{
                    usuario_id: user.usuario,
                    usuario_nombre: user.nombre,
                    materia: titleParam,
                    puntaje: score,
                    total_preguntas: questions.length,
                    ciudad: user.ciudad,
                    institucion: modeParam && modeParam.includes('esmil') ? 'FFAA' : 'Policía'
                }]);
                
                if(error) throw error;
                console.log("Guardado exitoso");
            } catch (err) {
                showError("No se pudo guardar el resultado en la nube.<br>Error: " + err.message);
            }
        }
    }

    loadData();
});
