const roomTasks = {
  "Slaapkamer": ["Bed opmaken","Nachtkastje opruimen","Kleding wegleggen"],
  "Badkamer": ["Wastafel schoonmaken","Handdoeken netjes","Spiegel afnemen"],
  "Woonkamer": ["Kussens netjes leggen","Salontafel opruimen","5 minuten opruimen"],
  "Keuken": ["Aanrecht opruimen","Tafel afnemen","Vaatwasser controleren"],
  "Hal": ["Schoenen opruimen","Jassen netjes hangen","Vloer vrijmaken"],
  "Wasruimte": ["Was sorteren","Machine leegmaken","Wasmand opruimen"],
  "Terras": ["Tafel netjes","Kussens goedleggen","Planten controleren"]
};

const icons = {
  "Slaapkamer":"🛏️","Badkamer":"🛁","Woonkamer":"🛋️","Keuken":"🍳",
  "Hal":"🚪","Wasruimte":"🧺","Terras":"🌿"
};

const todayKey = new Date().toISOString().slice(0,10);
let state = JSON.parse(localStorage.getItem("homey-v4") || "null");

if (!state) state = { points:0, coins:0, day:todayKey, done:{}, bonusAwarded:false };
if (state.day !== todayKey) {
  state.day = todayKey;
  state.done = {};
  state.bonusAwarded = false;
}

function save(){ localStorage.setItem("homey-v4", JSON.stringify(state)); }
function completedCount(){ return Object.values(state.done).filter(Boolean).length; }
function visibleBalls(){ return Math.min(15, completedCount()); }

function renderStats(animate=false){
  const balls = visibleBalls();
  document.getElementById("livePoints").textContent = state.points;
  document.getElementById("liveCoins").textContent = state.coins;
  document.getElementById("liveBalls").textContent = balls;
  document.getElementById("liveBallRow").innerHTML =
    Array.from({length:15}, (_,i) =>
      `<i class="live-ball-dot ${i < balls ? "on" : ""} ${i === 14 ? "bonus" : ""}"></i>`
    ).join("");

  if (animate) {
    document.querySelectorAll(".live-stat").forEach(el => {
      el.classList.remove("reward-pop");
      void el.offsetWidth;
      el.classList.add("reward-pop");
    });
  }
}

const panel = document.getElementById("panel");
const title = document.getElementById("panelTitle");
const text = document.getElementById("panelText");
const icon = document.getElementById("panelIcon");
const list = document.getElementById("taskList");
const toast = document.getElementById("toast");

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._homeyToast);
  window._homeyToast=setTimeout(()=>toast.classList.remove("show"),1800);
}

function openRoom(name){
  title.textContent=name;
  icon.textContent=icons[name] || "🏡";
  text.textContent="Tik een taak aan wanneer je ze hebt voltooid.";
  const tasks=roomTasks[name] || [];
  list.innerHTML=tasks.map((task,i)=>{
    const key=name+"-"+i, done=!!state.done[key];
    return `<button class="task-row ${done?"done":""}" data-task="${key}">
      <span class="task-check">${done?"✓":"○"}</span>
      <span class="task-label">${task}<span class="task-sub">1 bol • 1 munt • 1 punt</span></span>
    </button>`;
  }).join("");
  panel.hidden=false;
}

document.querySelectorAll(".room").forEach(btn=>{
  btn.addEventListener("click",()=>openRoom(btn.dataset.room));
});

list.addEventListener("click",e=>{
  const row=e.target.closest("[data-task]");
  if(!row) return;

  const key=row.dataset.task;
  const wasDone=!!state.done[key];
  const beforeBalls=visibleBalls();

  if (!wasDone) {
    state.done[key]=true;
    state.coins += 1;
    state.points += 1;

    const afterBalls=visibleBalls();
    let bonusText = "";

    if (beforeBalls < 15 && afterBalls >= 15 && !state.bonusAwarded) {
      state.points += 15;
      state.bonusAwarded = true;
      bonusText = " Bonus! +15 punten 🎁";
    }

    save();
    renderStats(true);
    openRoom(title.textContent);
    showToast("+1 bol • +1 munt • +1 punt." + bonusText);
  } else {
    state.done[key]=false;
    state.coins=Math.max(0,state.coins-1);
    state.points=Math.max(0,state.points-1);

    if (state.bonusAwarded && visibleBalls() < 15) {
      state.points=Math.max(0,state.points-15);
      state.bonusAwarded=false;
    }

    save();
    renderStats(true);
    openRoom(title.textContent);
    showToast("Taak weer geopend");
  }
});

document.getElementById("closePanel").addEventListener("click",()=>panel.hidden=true);
panel.addEventListener("click",e=>{ if(e.target===panel) panel.hidden=true; });

document.querySelectorAll("[data-action]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const action=btn.dataset.action;
    const messages={
      home:"Je bent al in Mijn huis 🏡",
      shop:"Winkeltje wordt het volgende volledige scherm 🛍️",
      inventory:"Inventaris wordt daarna gekoppeld 🎒",
      levels:"Levels wordt daarna gekoppeld ⭐",
      more:"Meer opties komen hier",
      tasks:"Hier komt je takenoverzicht",
      photos:"Hier komen je Homey-foto's",
      daily:`Vandaag: ${visibleBalls()} van 15 bollen`,
      bonus: state.bonusAwarded ? "Dagbonus verdiend! 🎁" : `Nog ${15-visibleBalls()} bollen tot de dagbonus`,
      coins:`Je hebt ${state.coins} munten`
    };
    showToast(messages[action] || action);
  });
});

renderStats();
save();
