
const $=id=>document.getElementById(id);

const roomTasks={
  Woonkamer:[
    ['Stof de salontafel af','Elke 3 dagen'],
    ['Stofzuig het tapijt','Elke 3 dagen'],
    ['Klop de kussens op','Elke 5 dagen'],
    ['Geef de planten water','Elke 2 dagen'],
    ['Maak de ramen schoon','Elke 7 dagen'],
    ['Ruim rondslingerend spul op','Elke dag']
  ],
  Keuken:[
    ['Maak het aanrecht schoon','Elke dag'],
    ['Ruim de tafel af','Elke dag'],
    ['Controleer de vaatwasser','Elke dag'],
    ['Maak de kookplaat schoon','Elke 3 dagen'],
    ['Dweil de vloer','Elke 3 dagen']
  ],
  Badkamer:[
    ['Maak de wastafel schoon','Elke 3 dagen'],
    ['Hang handdoeken netjes','Elke 2 dagen'],
    ['Neem de spiegel af','Elke 7 dagen'],
    ['Maak het bad schoon','Elke 7 dagen']
  ],
  Slaapkamer:[
    ['Maak het bed op','Elke dag'],
    ['Ruim het nachtkastje op','Elke 3 dagen'],
    ['Leg kleding weg','Elke dag']
  ],
  Hal:[
    ['Ruim schoenen op','Elke dag'],
    ['Hang jassen netjes','Elke dag'],
    ['Maak de vloer vrij','Elke dag']
  ],
  Wasruimte:[
    ['Sorteer de was','Elke dag'],
    ['Maak de machine leeg','Elke dag'],
    ['Ruim de wasmand op','Elke dag']
  ],
  Terras:[
    ['Maak de tafel netjes','Elke 3 dagen'],
    ['Leg kussens goed','Elke 2 dagen'],
    ['Controleer de planten','Elke 2 dagen']
  ]
};

const roomImgs={
  Woonkamer:'task-3.png',Keuken:'task-1.png',Badkamer:'task-4.png',
  Slaapkamer:'task-5.png',Hal:'task-6.png',Wasruimte:'task-2.png',Terras:'task-4.png'
};
const roomOrder=['Woonkamer','Keuken','Badkamer','Slaapkamer','Wasruimte','Terras'];
const STORE='homey-clean-v1';

function localDay(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
let state={points:0,coins:0,day:localDay(),done:{},bonusAwarded:false};
try{
  const saved=JSON.parse(localStorage.getItem(STORE)||'null');
  if(saved) state={...state,...saved,done:saved.done||{}};
}catch(e){}
if(state.day!==localDay()){
  state.day=localDay(); state.done={}; state.bonusAwarded=false;
}
let currentRoom='Woonkamer';

function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function totalDone(){return Object.values(state.done).filter(Boolean).length}
function roomDone(room){
  return roomTasks[room].reduce((n,_,i)=>n+(state.done[room+'-'+i]?1:0),0)
}
function showToast(t){
  const el=$('toast'); el.textContent=t; el.classList.add('show');
  clearTimeout(window.__tt); window.__tt=setTimeout(()=>el.classList.remove('show'),1500);
}
function renderHome(){
  $('homeCoins').textContent=state.coins||0;
  $('homePoints').textContent=state.points||0;
  const balls=Math.min(15,totalDone());
  $('homeBalls').textContent=balls;
  $('homeBonusCount').textContent=balls;
  $('bonusCheck').classList.toggle('show',balls>=15);
  $('homeBallRow').innerHTML=Array.from({length:15},(_,i)=>`<span class="ball ${i<balls?'filled':''}"></span>`).join('');
  document.querySelectorAll('[data-home-room]').forEach(el=>{
    const r=el.dataset.homeRoom;
    el.textContent=`${roomDone(r)}/${roomTasks[r].length}`;
  });
}
function renderShared(){
  renderHome();
  ['ovPoints','taskPoints'].forEach(id=>{if($(id))$(id).textContent=state.points||0});
  ['ovCoins','taskCoins'].forEach(id=>{if($(id))$(id).textContent=state.coins||0});
  const b=Math.min(15,totalDone());
  ['ovBalls','taskBalls'].forEach(id=>{if($(id))$(id).textContent=b});
}
function progressParts(done,total){
  const ratio=total?done/total:0;
  const pos=Math.min(12,Math.round(ratio*12));
  let html='';
  for(let i=0;i<13;i++){
    const cls=i<4?'red':i<8?'orange':'green';
    if(i===pos) html+=`<span class="marker ${cls}"></span>`;
    else html+=`<span class="seg ${cls}"></span>`;
  }
  return html;
}
function renderOverview(){
  $('roomCards').innerHTML=roomOrder.map((r,idx)=>{
    const total=roomTasks[r].length, done=roomDone(r), locked=idx>=3;
    return `<article class="room-card ${locked?'locked':''}" data-open-room="${r}">
      <img src="${roomImgs[r]}">
      <div><div class="room-name">${r}</div>
      <div class="room-sub">${locked?'🔒 Vrijspelen op level 5':`${done} van ${total} taken klaar`}</div>
      ${locked?'':`<div class="small-traffic">${progressParts(done,total)}</div>`}</div>
      <div class="arrow">${locked?'🔒':'›'}</div>
    </article>`;
  }).join('');
  renderShared();
}
function renderRoom(){
  const items=roomTasks[currentRoom], done=roomDone(currentRoom), total=items.length;
  $('roomTitle').textContent=`🌿 ${currentRoom} 🌿`;
  $('taskProgressText').textContent=`${done} van ${total} taken klaar`;
  $('taskPct').textContent=`${Math.round(done/total*100)}%`;
  $('trafficBar').innerHTML=progressParts(done,total);
  $('tasks').innerHTML=items.map((a,i)=>{
    const key=currentRoom+'-'+i, isDone=!!state.done[key];
    return `<button class="task ${isDone?'done':''}" data-task="${key}">
      <img src="task-${(i%6)+1}.png">
      <span class="task-copy"><strong>${a[0]}</strong><small>${a[1]}</small></span>
      <span class="rewards">🪙 1<br>⭐ 5</span>
      <span class="check">${isDone?'✓':''}</span>
    </button>`;
  }).join('');
  renderShared();
}
function hideAll(){
  ['home','overview','roomScreen','shop','placeholder'].forEach(id=>{
    const e=$(id); if(!e)return; e.hidden=true; e.classList.remove('active');
  });
}
function go(where){
  hideAll();
  if(where==='home'){ $('home').hidden=false; $('home').classList.add('active'); renderHome(); }
  else if(where==='shop'){ $('shop').hidden=false; }
  else{
    $('placeholder').hidden=false;
    $('placeholderTitle').textContent=where==='inventory'?'Inventaris':where==='levels'?'Levels':'Meer';
  }
}
function openOverview(room){
  currentRoom=room||currentRoom;
  hideAll(); $('overview').hidden=false; renderOverview();
}
function openRoom(room){
  currentRoom=room;
  hideAll(); $('roomScreen').hidden=false; renderRoom();
}

document.querySelectorAll('[data-overview]').forEach(b=>b.onclick=()=>openOverview(b.dataset.overview));
$('roomCards').onclick=e=>{
  const c=e.target.closest('[data-open-room]');
  if(!c||c.classList.contains('locked'))return;
  openRoom(c.dataset.openRoom);
};
$('roomBack').onclick=()=>openOverview(currentRoom);
$('tasks').onclick=e=>{
  const b=e.target.closest('[data-task]'); if(!b)return;
  const key=b.dataset.task;
  if(state.done[key]){
    state.done[key]=false;
    state.points=Math.max(0,(state.points||0)-5);
    state.coins=Math.max(0,(state.coins||0)-1);
    if(state.bonusAwarded && totalDone()<15){
      state.points=Math.max(0,state.points-15);
      state.bonusAwarded=false;
    }
  }else{
    state.done[key]=true;
    state.points=(state.points||0)+5;
    state.coins=(state.coins||0)+1;
    if(totalDone()>=15 && !state.bonusAwarded){
      state.points+=15; state.bonusAwarded=true;
      showToast('Dagbonus! +15 punten 🎁');
    }
  }
  save(); renderRoom();
};
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
renderShared(); save();
