const H=document.getElementById('houseScreen'),O=document.getElementById('overviewScreen'),T=document.getElementById('taskScreen');

const roomData=[
 ['Woonkamer','room-living.jpg','6 taken',0],
 ['Keuken','room-kitchen.jpg','5 taken',0],
 ['Badkamer','room-bathroom.jpg','4 taken',0],
 ['Slaapkamer','room-bedroom.jpg','🔒 Vrijspelen op level 5',1],
 ['Wasruimte','room-laundry.jpg','🔒 Vrijspelen op level 5',1],
 ['Caravan','room-caravan.jpg','🔒 Vrijspelen op level 5',1]
];

const tasksByRoom={
 Woonkamer:[
  ['Stofzuig het tapijt','Elke 3 dagen','task-vacuum.jpg'],
  ['Klop de kussens op','Elke 5 dagen','task-cushions.jpg'],
  ['Geef de planten water','Elke 2 dagen','task-plants.jpg'],
  ['Maak de ramen schoon','Elke 7 dagen','task-windows.jpg'],
  ['Stof de salontafel af','Elke 3 dagen','task-table.jpg'],
  ['Ruim rommel op','Elke dag','task-tidy.jpg']
 ],
 Keuken:[
  ['Maak het aanrecht schoon','Elke dag','task-counter.jpg'],
  ['Ruim de tafel af','Elke dag','task-dishes.jpg'],
  ['Controleer de vaatwasser','Elke dag','task-dishes.jpg'],
  ['Maak de kookplaat schoon','Elke 2 dagen','task-cooktop.jpg'],
  ['Dweil de vloer','Elke 3 dagen','task-floor.jpg']
 ],
 Badkamer:[
  ['Maak de wastafel schoon','Elke 2 dagen','task-sink.jpg'],
  ['Hang handdoeken netjes','Elke dag','task-towels.jpg'],
  ['Neem de spiegel af','Elke 4 dagen','task-mirror.jpg'],
  ['Maak het bad schoon','Elke 5 dagen','task-bath.jpg']
 ]
};

const badges={Woonkamer:'🛋️',Keuken:'🍳',Badkamer:'🛁'};
let currentRoom='Woonkamer';
let state=JSON.parse(localStorage.getItem('homey-multiroom')||'null') || {
  points:65, coins:14, today:10,
  bonusAwarded:false,
  done:{Woonkamer:[],Keuken:[],Badkamer:[]}
};

// Oudere opgeslagen versies hadden bonusAwarded nog niet.
// Als 15/15 al bereikt was, wordt de +15 punten éénmalig alsnog toegekend.
if(typeof state.bonusAwarded!=='boolean'){
  state.bonusAwarded=false;
  if(state.today>=15){
    state.points+=15;
    state.bonusAwarded=true;
    localStorage.setItem('homey-multiroom',JSON.stringify(state));
  }
}

function save(){localStorage.setItem('homey-multiroom',JSON.stringify(state))}
function roomDone(room){return (state.done[room]||[]).filter(Boolean).length}
function totalDone(){return Object.values(state.done).reduce((a,b)=>a+b.filter(Boolean).length,0)}

function renderBalls(){
 document.querySelectorAll('.ballrow').forEach(r=>{
   r.innerHTML=Array.from({length:15},(_,i)=>`<span class="${i<state.today?'on':''}"></span>`).join('')
 });
 const hr=document.getElementById('homeBallRow');
 hr.innerHTML=Array.from({length:15},(_,i)=>`<span class="${i<state.today?'on':''}"></span>`).join('');
}

function renderCounters(){
 document.querySelectorAll('.points').forEach(x=>x.textContent=state.points);
 document.querySelectorAll('.coins').forEach(x=>x.textContent=state.coins);
 document.querySelectorAll('.today').forEach(x=>x.textContent=state.today);
 const left=Math.max(0,15-state.today);
 document.querySelectorAll('.bonusText').forEach(x=>x.textContent=left===0?'Dagbonus behaald!':`${left} bollen tot bonus!`);
 document.getElementById('homeLivingDone').textContent=roomDone('Woonkamer');
 document.getElementById('homeBonusCheck').classList.toggle('done',state.today>=15);
 renderBalls();
}

function renderOverview(){
 document.getElementById('roomCards').innerHTML=roomData.map(x=>{
   const done=roomDone(x[0]);
   const total=(tasksByRoom[x[0]]||[]).length;
   return `<button class="room-card ${x[3]?'locked':''}" data-room="${x[0]}" ${x[3]?'disabled':''}>
   <img src="${x[1]}"><span class="room-text"><b>${x[0]}</b><small>${x[3]?x[2]:`${done}/${total} taken`}</small>
   ${x[3]?'':`<span class="progress"><i class="green"></i><i class="green"></i><em style="margin-left:${Math.min(done,total)*2}px"></em><i class="orange"></i><i class="orange"></i><i class="red"></i><i class="red"></i></span>`}
   </span><span class="chev">${x[3]?'🔒':'›'}</span></button>`
 }).join('');
 renderCounters();
}

function renderTasks(){
 const data=tasksByRoom[currentRoom];
 document.getElementById('roomTitle').textContent=currentRoom;
 document.getElementById('roomBadge').textContent=badges[currentRoom]||'🏡';
 const box=document.getElementById('tasks');
 box.innerHTML=data.map((x,i)=>`<button class="task-card ${(state.done[currentRoom]||[])[i]?'done':''}" data-task="${i}">
   <img src="${x[2]}"><span class="task-info"><b>${x[0]}</b><small>${x[1]}</small></span>
   <span class="rewards">🪙 1<br>⭐ 5</span><span class="check">${(state.done[currentRoom]||[])[i]?'✓':''}</span>
 </button>`).join('');
 const d=roomDone(currentRoom);
 document.getElementById('doneText').textContent=`${d} van ${data.length} taken klaar`;
 document.getElementById('pct').textContent=Math.round(d/data.length*100)+'%';
 document.getElementById('taskFill').style.width=(d/data.length*100)+'%';
 renderCounters();
}

document.querySelectorAll('[data-overview]').forEach(b=>b.onclick=()=>{renderOverview();H.hidden=true;O.hidden=false});
document.getElementById('overviewBack').onclick=()=>{O.hidden=true;H.hidden=false;renderCounters()};

document.getElementById('roomCards').onclick=e=>{
 const b=e.target.closest('[data-room]');
 if(!b||b.disabled)return;
 currentRoom=b.dataset.room;
 O.hidden=true;T.hidden=false;renderTasks();
};

document.getElementById('taskBack').onclick=()=>{T.hidden=true;O.hidden=false;renderOverview()};

document.getElementById('tasks').onclick=e=>{
 const b=e.target.closest('[data-task]');if(!b)return;
 const i=+b.dataset.task;
 state.done[currentRoom]=state.done[currentRoom]||[];
 if(state.done[currentRoom][i]){
   state.done[currentRoom][i]=false;
   state.points=Math.max(0,state.points-5);
   state.coins=Math.max(0,state.coins-1);
   state.today=Math.max(0,state.today-1);
 }else{
   state.done[currentRoom][i]=true;
   state.points+=5;
   state.coins+=1;
   const wasBelowBonus=state.today<15;
   state.today=Math.min(15,state.today+1);

   // Dagbonus: precies één keer +15 punten wanneer 15/15 wordt bereikt.
   if(wasBelowBonus && state.today===15 && !state.bonusAwarded){
     state.points+=15;
     state.bonusAwarded=true;
   }
 }
 save();renderTasks();
};

function goHome(){T.hidden=true;O.hidden=true;H.hidden=false;renderCounters()}
const overviewHomeNav=document.getElementById('overviewHomeNav');
const taskHomeNav=document.getElementById('taskHomeNav');
if(overviewHomeNav)overviewHomeNav.addEventListener('click',goHome);
if(taskHomeNav)taskHomeNav.addEventListener('click',goHome);

renderOverview();renderCounters();