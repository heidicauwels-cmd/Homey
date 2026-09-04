const H=document.getElementById('houseScreen'),O=document.getElementById('overviewScreen'),T=document.getElementById('taskScreen');

const roomData=[
 ['Woonkamer','room-living.jpg','6 taken',0],
 ['Keuken','room-kitchen.jpg','5 taken',0],
 ['Badkamer','room-bathroom.jpg','4 taken',0],
 ['Slaapkamer','room-bedroom.jpg','🔒 Vrijspelen op level 5',1],
 ['Wasruimte','room-laundry.jpg','🔒 Vrijspelen op level 5',1],
 ['Caravan','room-caravan.jpg','🔒 Vrijspelen op level 5',1]
];

const taskData=[
 ['Stofzuig het tapijt','Elke 3 dagen','task-vacuum.jpg'],
 ['Klop de kussens op','Elke 5 dagen','task-cushions.jpg'],
 ['Geef de planten water','Elke 2 dagen','task-plants.jpg'],
 ['Maak de ramen schoon','Elke 7 dagen','task-windows.jpg'],
 ['Stof de salontafel af','Elke 3 dagen','task-table.jpg'],
 ['Ruim rommel op','Elke dag','task-tidy.jpg']
];

let state=JSON.parse(localStorage.getItem('homey-tasks')||'{"points":65,"coins":14,"today":10,"done":[]}');

function save(){localStorage.setItem('homey-tasks',JSON.stringify(state))}
function doneCount(){return state.done.filter(Boolean).length}

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

 document.getElementById('homeLivingDone').textContent=doneCount();
 document.getElementById('homeBonusCheck').classList.toggle('done',state.today>=15);
 renderBalls();
}

function renderOverview(){
 document.getElementById('roomCards').innerHTML=roomData.map(x=>{
   const done=x[0]==='Woonkamer'?doneCount():0;
   return `<button class="room-card ${x[3]?'locked':''}" data-room="${x[0]}" ${x[3]?'disabled':''}>
   <img src="${x[1]}"><span class="room-text"><b>${x[0]}</b><small>${x[2]}</small>
   ${x[3]?'':`<span class="progress"><i class="green"></i><i class="green"></i><em style="margin-left:${Math.min(done,6)*2}px"></em><i class="orange"></i><i class="orange"></i><i class="red"></i><i class="red"></i></span>`}
   </span><span class="chev">${x[3]?'🔒':'›'}</span></button>`
 }).join('');
 renderCounters();
}

function renderTasks(){
 const box=document.getElementById('tasks');
 box.innerHTML=taskData.map((x,i)=>`<button class="task-card ${state.done[i]?'done':''}" data-task="${i}">
   <img src="${x[2]}"><span class="task-info"><b>${x[0]}</b><small>${x[1]}</small></span>
   <span class="rewards">🪙 1<br>⭐ 5</span><span class="check">${state.done[i]?'✓':''}</span>
 </button>`).join('');
 const d=doneCount();
 document.getElementById('doneText').textContent=`${d} van 6 taken klaar`;
 document.getElementById('pct').textContent=Math.round(d/6*100)+'%';
 document.getElementById('taskFill').style.width=(d/6*100)+'%';
 renderCounters();
}

document.querySelectorAll('[data-overview]').forEach(b=>b.onclick=()=>{renderOverview();H.hidden=true;O.hidden=false});
document.getElementById('overviewBack').onclick=()=>{O.hidden=true;H.hidden=false;renderCounters()};
document.getElementById('roomCards').onclick=e=>{
 const b=e.target.closest('[data-room]');
 if(b&&b.dataset.room==='Woonkamer'){O.hidden=true;T.hidden=false;renderTasks()}
};
document.getElementById('taskBack').onclick=()=>{T.hidden=true;O.hidden=false;renderOverview()};

document.getElementById('tasks').onclick=e=>{
 const b=e.target.closest('[data-task]'); if(!b)return;
 const i=+b.dataset.task;
 if(state.done[i]){
   state.done[i]=false;
   state.points=Math.max(0,state.points-5);
   state.coins=Math.max(0,state.coins-1);
   state.today=Math.max(0,state.today-1);
 }else{
   state.done[i]=true;
   state.points+=5;
   state.coins+=1;
   state.today=Math.min(15,state.today+1);
 }
 save();
 renderTasks();
};

renderOverview();
renderCounters();
