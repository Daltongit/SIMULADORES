import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vwfpjvfjmmwmrqqahooi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZnBqdmZqbW13bXJxcWFob29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzkyNTcsImV4cCI6MjA4MTA1NTI1N30.pTc8KM-GnxVRgrYpcqm8YUZ9zb6Co-QgKT0i7W41HEA';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    const modeParam = urlParams.get('mode');
    const titleParam = decodeURIComponent(urlParams.get('title'));

    document.getElementById('header-title').textContent = titleParam.toUpperCase();
    document.getElementById('lobby-title').textContent = titleParam;

    let questions = [];
    let userAnswers = [];
    let currentIdx = 0;
    let timerInterval;
    let timeLeft = 3600;

    async function loadData() {
        try {
            if (modeParam.includes('general')) {
                timeLeft = 3 * 3600;
                const folder = modeParam === 'general_policia' ? 'POLICIA/GENERAL_POLICIA' : 'FFAA/ESMIL';
                const files = ['sociales', 'matematicas', 'lengua', 'ingles'];
                const suffix = modeParam === 'general_esmil' ? '_esmil.json' : '.json';
                
                for(let base of files) {
                    const path = `DATA/${folder}/${base}${suffix}`;
                    const res = await fetch(path);
                    if(res.ok) {
                        const data = await res.json();
                        questions = questions.concat(data.sort(() => 0.5 - Math.random()).slice(0, 50));
                    } else {
                        console.warn("Faltó cargar: " + path);
                    }
                }
            } else {
                if(fileParam.includes('matematicas')) timeLeft = 90 * 60;
                
                const res = await fetch(`DATA/${fileParam}`);
                if(!res.ok) throw new Error(`Archivo no encontrado: DATA/${fileParam}`);
                const data = await res.json();
                
                if (modeParam === 'ppnn') {
                    questions = data.sort(() => 0.5 - Math.random());
                } else {
                    questions = data.sort(() => 0.5 - Math.random()).slice(0, 50);
                }
            }

            if(questions.length === 0) throw new Error("No hay preguntas cargadas. Revisa los archivos JSON en la carpeta DATA.");

            document.getElementById('total-questions').textContent = questions.length;
            document.getElementById('time-limit').textContent = Math.floor(timeLeft / 60);
            
            const btn = document.getElementById('btn-start');
            btn.disabled = false;
            btn.textContent = "COMENZAR INTENTO";
            btn.onclick = startQuiz;

        } catch (e) {
            document.getElementById('lobby').innerHTML += `<div class="error-box">ERROR: ${e.message}</div>`;
            document.getElementById('btn-start').textContent = "Error de Carga";
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
        
        const imgCont = document.getElementById('q-image-container');
        imgCont.innerHTML = q.imagen ? `<img src="${q.imagen}">` : '';

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
            if(timeLeft <= 0) finishQuiz();
        }, 1000);
    }

    async function finishQuiz() {
        clearInterval(timerInterval);
        document.getElementById('quiz').style.display = 'none';
        document.getElementById('results').style.display = 'block';

        let correct = 0;
        questions.forEach((q, i) => { if(userAnswers[i] === q.respuesta) correct++; });

        const score = Math.round((correct / questions.length) * 1000);
        document.getElementById('final-score').textContent = score;
        document.getElementById('res-correct').textContent = correct;
        document.getElementById('res-incorrect').textContent = questions.length - correct;

        // GUARDAR EN SUPABASE
        const user = JSON.parse(sessionStorage.getItem('sparta_user'));
        if(user) {
            const { error } = await supabase.from('resultados').insert([{
                usuario_id: user.usuario,
                usuario_nombre: user.nombre,
                materia: titleParam,
                puntaje: score,
                total_preguntas: questions.length,
                ciudad: user.ciudad
            }]);
            
            if(error) {
                alert("Error al guardar en base de datos: " + error.message);
            }
        }
    }

    loadData();
});
