const CHALLENGES_URL = 'challenges.json';
let CHALLENGES = [];
let state = JSON.parse(localStorage.getItem('osint_state')||'{}');

function saveState(){ localStorage.setItem('osint_state', JSON.stringify(state)); }

async function load() {
  const res = await fetch(CHALLENGES_URL);
  CHALLENGES = await res.json();
  renderGrid(CHALLENGES);
  setupControls();
  document.getElementById('reset').addEventListener('click', ()=>{
    if(confirm('Resetar progresso?')){ state={}; saveState(); renderGrid(CHALLENGES); alert('Progresso resetado'); }
  });
}

function renderGrid(list){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  list.forEach(c=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.level = c.level;
    card.innerHTML = `
      <img loading="lazy" src="${c.image}" alt="${c.title}">
      <div class="meta">
        <div>
          <div class="title">${c.title}</div>
          <div class="brief">${c.brief}</div>
        </div>
        <div>
          <div class="level ${c.color}">${c.level}</div>
        </div>
      </div>
      <div class="btn-row">
        <button class="button open" onclick="openChallenge(${c.id})">Abrir</button>
        <button class="button copy" onclick="copyBrief(${c.id})">Copiar</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function setupControls(){
  document.getElementById('filter-level').addEventListener('change', (e)=>{
    const v = e.target.value;
    const filtered = v==='all' ? CHALLENGES : CHALLENGES.filter(c=>c.level===v);
    renderGrid(filtered);
  });
  document.getElementById('search').addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase().trim();
    const filtered = CHALLENGES.filter(c=> (c.title+c.brief+c.challenge).toLowerCase().includes(q));
    renderGrid(filtered);
  });
}

function copyBrief(id){
  const c = CHALLENGES.find(x=>x.id===id);
  navigator.clipboard.writeText(c.brief+'\n\n'+c.challenge).then(()=>alert('Copiado para área de transferência'));
}

function openChallenge(id){
  const c = CHALLENGES.find(x=>x.id===id);
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div class="challenge-body">
      <div class="challenge-main">
        <h2>${c.title}</h2>
        <p class="small">Nível: <strong>${c.level}</strong></p>
        <div class="hint"><strong>Descrição:</strong><br>${c.challenge}</div>
        <div class="answer" id="answer-area">
          <label>Enviar resposta (flag):</label>
          <input id="answer-input" placeholder="FLAG{...}" style="width:100%;padding:8px;margin-top:8px;border-radius:6px;background:#031018;border:1px solid rgba(255,255,255,0.03);color:#e6eef8">
          <button class="button open" style="margin-top:8px" onclick="submitAnswer(${c.id})">Enviar</button>
          <div id="submit-msg" class="small" style="margin-top:8px"></div>
        </div>
      </div>
      <aside class="challenge-side">
        <img src="${c.image}" style="width:100%;border-radius:6px;margin-bottom:8px">
        <div class="small">Dicas rápidas:</div>
        <ul class="small" style="margin-top:6px">
          <li>Verifique metadados e headers</li>
          <li>Procure texturas, placas, nomes e padrões</li>
          <li>Use Wayback, WHOIS, e pesquisa reversa de imagem</li>
        </ul>
        <div style="margin-top:8px" class="small">Pontuação: <strong>${getPointsForLevel(c.level)}</strong></div>
      </aside>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
}

function getPointsForLevel(level){
  switch(level){
    case 'fácil': return 10;
    case 'médio': return 25;
    case 'difícil': return 50;
    case 'insano': return 120;
    case 'impossível': return 300;
    default: return 0;
  }
}

function submitAnswer(id){
  const input = document.getElementById('answer-input');
  const msg = document.getElementById('submit-msg');
  const provided = input.value.trim();
  const c = CHALLENGES.find(x=>x.id===id);
  if(!provided){ msg.textContent='Insira uma resposta.'; return; }
  if(provided === c.answer){
    msg.textContent = '✓ Correto! Pontos concedidos.';
    state.score = (state.score||0) + getPointsForLevel(c.level);
    state.solved = state.solved || {};
    if(!state.solved[id]) state.solved[id]=true;
    saveState();
  } else {
    msg.textContent = '✗ Incorreto. Continue investigando.';
  }
}

document.getElementById('close-modal').addEventListener('click', ()=>{
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
});

load();