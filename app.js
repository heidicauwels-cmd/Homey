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

const state = JSON.parse(localStorage.getItem("homey-v3") || '{"done":{}}');
function save(){localStorage.setItem("homey-v3", JSON.stringify(state))}

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
  window._homeyToast=setTimeout(()=>toast.classList.remove("show"),1600);
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
      <span class="task-label">${task}<span class="task-sub">1 bol • 1 munt</span></span>
    </button>`;
  }).join("");
  panel.hidden=false;
}

document.querySelectorAll(".room").forEach(btn=>{
  btn.addEventListener("click",()=>openRoom(btn.dataset.room));
});

list.addEventListener("click",e=>{
  const row=e.target.closest("[data-task]");
  if(!row)return;
  const key=row.dataset.task;
  state.done[key]=!state.done[key];
  save();
  const room=title.textContent;
  openRoom(room);
  showToast(state.done[key] ? "Taak voltooid! +1 bol 🪙" : "Taak weer geopend");
});

document.getElementById("closePanel").addEventListener("click",()=>panel.hidden=true);
panel.addEventListener("click",e=>{if(e.target===panel)panel.hidden=true});

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
      daily:"Hier komen je dagelijkse taken",
      bonus:"Je bonus wordt verdiend bij 15/15 bollen 🎁",
      coins:"Hier komen manieren om extra munten te verdienen"
    };
    showToast(messages[action] || action);
  });
});
