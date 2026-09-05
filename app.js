const H=document.getElementById('houseScreen'),O=document.getElementById('overviewScreen'),T=document.getElementById('taskScreen'),L=document.getElementById('levelScreen'),S=document.getElementById('shopScreen');

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
 ],

  Slaapkamer:[
    {title:'Maak het bed op',freq:'Elke dag',img:'room-bedroom.jpg'},
    {title:'Ruim kleding op',freq:'Elke 2 dagen',img:'room-bedroom.jpg'},
    {title:'Stof oppervlakken af',freq:'Elke 4 dagen',img:'room-bedroom.jpg'},
    {title:'Stofzuig de vloer',freq:'Elke 5 dagen',img:'room-bedroom.jpg'}
  ],
  Wasruimte:[
    {title:'Sorteer de was',freq:'Elke dag',img:'room-laundry.jpg'},
    {title:'Zet een wasmachine aan',freq:'Elke 2 dagen',img:'room-laundry.jpg'},
    {title:'Vouw droge was op',freq:'Elke 2 dagen',img:'room-laundry.jpg'},
    {title:'Maak de wasruimte netjes',freq:'Elke 5 dagen',img:'room-laundry.jpg'}
  ],
  Caravan:[
    {title:'Ruim de caravan op',freq:'Elke 3 dagen',img:'room-caravan.jpg'},
    {title:'Maak het keukenblok schoon',freq:'Elke 3 dagen',img:'room-caravan.jpg'},
    {title:'Controleer voorraad',freq:'Elke 7 dagen',img:'room-caravan.jpg'},
    {title:'Stofzuig de vloer',freq:'Elke 5 dagen',img:'room-caravan.jpg'}
  ],
};

const badges={Woonkamer:'🛋️',Keuken:'🍳',Badkamer:'🛁'};
let currentRoom='Woonkamer';
function localDateKey(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function daysBetween(fromKey,toKey){
  const [fy,fm,fd]=fromKey.split('-').map(Number);
  const [ty,tm,td]=toKey.split('-').map(Number);
  return Math.floor((Date.UTC(ty,tm-1,td)-Date.UTC(fy,fm-1,fd))/86400000);
}

function frequencyDays(label){
  if(label==='Elke dag') return 1;
  const m=label.match(/Elke (\d+) dagen/);
  return m ? Number(m[1]) : 1;
}

let state=JSON.parse(localStorage.getItem('homey-multiroom')||'null') || {
  points:65, coins:14, today:10,
  bonusAwarded:false,
  lastDate:localDateKey(),
  completed:{Woonkamer:[],Keuken:[],Badkamer:[]}
};

const todayKey=localDateKey();

// Migratie van oudere versies met true/false naar voltooiingsdatums.
if(!state.completed){
  state.completed={Woonkamer:[],Keuken:[],Badkamer:[]};
  if(state.done){
    for(const room of ['Woonkamer','Keuken','Badkamer']){
      const old=state.done[room]||[];
      state.completed[room]=old.map(v=>v ? todayKey : null);
    }
  }
}
for(const room of ['Woonkamer','Keuken','Badkamer']){
  if(!Array.isArray(state.completed[room])) state.completed[room]=[];
}

delete state.done;

// Levels/beloningskeuzes (migratie voor bestaande installaties).
if(!state.levelRewards || typeof state.levelRewards!=='object') state.levelRewards={};
if(!Array.isArray(state.unlockedRooms)) state.unlockedRooms=[];
if(!Array.isArray(state.unlockedItemTypes)) state.unlockedItemTypes=[];

if(!Array.isArray(state.inventoryItems)) state.inventoryItems=[];


if(!state.completed) state.completed={};
['Woonkamer','Keuken','Badkamer','Slaapkamer','Wasruimte','Caravan'].forEach(r=>{
  if(!Array.isArray(state.completed[r])) state.completed[r]=[];
});


// Oudere opgeslagen versies hadden bonusAwarded/lastDate nog niet.
if(typeof state.bonusAwarded!=='boolean'){
  state.bonusAwarded=false;
  if(state.today>=15){
    state.points+=15;
    state.bonusAwarded=true;
  }
}

if(!state.lastDate){
  state.lastDate=todayKey;
}else if(state.lastDate!==todayKey){
  // Nieuwe kalenderdag: dagteller en dagbonus opnieuw beschikbaar.
  // Taken worden NIET allemaal gereset; dat gebeurt hieronder per frequentie.
  state.today=0;
  state.bonusAwarded=false;
  state.lastDate=todayKey;
}
localStorage.setItem('homey-multiroom',JSON.stringify(state));

function taskIsDone(room,index){
  const completedOn=state.completed[room]?.[index];
  if(!completedOn) return false;
  const interval=frequencyDays(tasksByRoom[room][index][1]);
  return daysBetween(completedOn,todayKey) < interval;
}

function taskCompletedToday(room,index){
  return state.completed[room]?.[index]===todayKey;
}

function save(){localStorage.setItem('homey-multiroom',JSON.stringify(state))}
function roomDone(room){
  return (tasksByRoom[room]||[]).reduce((n,_,i)=>n+(taskIsDone(room,i)?1:0),0);
}
function totalDone(){
  return Object.keys(tasksByRoom).reduce((n,room)=>n+roomDone(room),0);
}

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



const starterItemTypes=['Zetels','Tafels','Stoelen','Kasten'];

const shopItems=[
  {id:'sofa-green',type:'Zetels',name:'Groene bank',price:80,img:'shop-sofa-green.jpg'},
  {id:'chair-boho',type:'Zetels',name:'Boho fauteuil',price:60,img:'shop-chair-boho.jpg'},
  {id:'sofa-rattan',type:'Zetels',name:'Rieten loveseat',price:90,img:'shop-sofa-rattan.jpg'},

  {id:'table-round',type:'Tafels',name:'Ronde salontafel',price:45,img:'shop-table-round.jpg'},
  {id:'table-light',type:'Tafels',name:'Lichte salontafel',price:55,img:'shop-table-light.jpg'},
  {id:'table-rattan',type:'Tafels',name:'Rotan bijzettafel',price:35,img:'shop-table-rattan.jpg'},

  {id:'chair-natural',type:'Stoelen',name:'Naturel stoel',price:40,img:'shop-chair-boho.jpg'},
  {id:'chair-rattan',type:'Stoelen',name:'Rotan stoel',price:55,img:'shop-sofa-rattan.jpg'},

  {id:'cabinet-wood',type:'Kasten',name:'Houten dressoir',price:110,img:'shop-cabinet-wood.jpg'},
  {id:'cabinet-green',type:'Kasten',name:'Vintage kastje',price:95,img:'shop-cabinet-green.jpg'},

  {id:'plant-hang',type:'Planten',name:'Hangplant',price:30,img:'shop-plant.jpg'},
  {id:'plant-large',type:'Planten',name:'Grote kamerplant',price:45,img:'shop-plant.jpg'},
  {id:'plant-palm',type:'Planten',name:'Boho palm',price:55,img:'shop-plant.jpg'},

  {id:'rug-boho',type:'Tapijten',name:'Boho vloerkleed',price:70,img:'shop-rug.jpg'},
  {id:'rug-round',type:'Tapijten',name:'Rond tapijt',price:55,img:'shop-rug.jpg'},

  {id:'light-table',type:'Verlichting',name:'Tafellamp',price:35,img:'shop-light.jpg'},
  {id:'light-rattan',type:'Verlichting',name:'Rotan hanglamp',price:50,img:'shop-light.jpg'},

  {id:'decor-vase',type:'Decoratie',name:'Vaas met droogbloemen',price:25,img:'shop-decor.jpg'},
  {id:'decor-wall',type:'Decoratie',name:'Boho wanddecoratie',price:30,img:'shop-decor.jpg'},

  {id:'floor-light',type:'Vloeren',name:'Lichte houten vloer',price:250,img:'shop-floor.jpg'},
  {id:'floor-warm',type:'Vloeren',name:'Warme houten vloer',price:300,img:'shop-floor.jpg'},

  {id:'wall-beige',type:'Behang & verf',name:'Zandbeige muur',price:180,img:'shop-wall.jpg'},
  {id:'wall-green',type:'Behang & verf',name:'Zachtgroene muur',price:180,img:'shop-wall.jpg'},

  {id:'bed-double',type:'Bedden',name:'Boho dubbel bed',price:450,img:'shop-bed.jpg'},
  {id:'bed-single',type:'Bedden',name:'Gezellig enkel bed',price:300,img:'shop-bed.jpg'},

  {id:'night-rattan',type:'Nachtkastjes',name:'Rotan nachtkastje',price:80,img:'shop-nightstand.jpg'},
  {id:'night-wood',type:'Nachtkastjes',name:'Houten nachtkastje',price:70,img:'shop-nightstand.jpg'},

  {id:'bath-free',type:'Badkamer',name:'Vrijstaand bad',price:500,img:'shop-bath.jpg'},
  {id:'bath-shower',type:'Badkamer',name:'Inloopdouche',price:550,img:'shop-bath.jpg'},

  {id:'kitchen-block',type:'Keuken',name:'Boho keukenblok',price:500,img:'shop-kitchen.jpg'},
  {id:'kitchen-island',type:'Keuken',name:'Keukeneiland',price:350,img:'shop-kitchen.jpg'}
];

const shopTypeOrder=['Zetels','Tafels','Stoelen','Kasten','Planten','Tapijten','Verlichting','Decoratie','Vloeren','Behang & verf','Bedden','Nachtkastjes','Badkamer','Keuken'];
let shopCategory='Alles';
let shopAffordableOnly=false;

function itemTypeUnlocked(type){
  return starterItemTypes.includes(type) || state.unlockedItemTypes.includes(type);
}
function ownedCount(id){
  return state.inventoryItems.filter(x=>x===id).length;
}
function shopTypeCount(type){
  return shopItems.filter(x=>x.type===type).length;
}
function renderShopCategories(){
  const cats=['Alles',...shopTypeOrder];
  document.getElementById('shopCategories').innerHTML=cats.map(type=>{
    const locked=type!=='Alles' && !itemTypeUnlocked(type);
    return `<button class="shop-cat ${shopCategory===type?'active':''} ${locked?'locked':''}" data-shop-cat="${type}">
      ${locked?'🔒 ':''}${type}
    </button>`;
  }).join('');
}
function renderShop(){
  renderCounters();
  renderShopCategories();

  const content=document.getElementById('shopContent');
  const message=document.getElementById('shopMessage');
  message.hidden=true;

  let types;
  if(shopCategory==='Alles'){
    types=shopTypeOrder.filter(itemTypeUnlocked);
  }else if(!itemTypeUnlocked(shopCategory)){
    content.innerHTML=`<div class="shop-empty">🔒 <b>${shopCategory}</b> is nog niet vrijgespeeld.<br>Bij elk 5e level kun je een itemtype kiezen.</div>`;
    message.hidden=false;
    message.textContent='Ga naar Levels om een nieuw itemtype vrij te spelen. 🎁';
    return;
  }else{
    types=[shopCategory];
  }

  content.innerHTML=types.map(type=>{
    let items=shopItems.filter(x=>x.type===type);
    if(shopAffordableOnly) items=items.filter(x=>x.price<=state.coins);

    const itemHtml=items.length ? items.map(item=>{
      const owned=ownedCount(item.id);
      const canBuy=state.coins>=item.price;
      return `<article class="shop-item">
        <img src="${item.img}" alt="">
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-meta">
          <span class="shop-price">🪙 ${item.price}</span>
          <span class="shop-owned">${owned?`x${owned} in inventaris`:''}</span>
        </div>
        <button class="shop-buy" data-buy="${item.id}" ${canBuy?'':'disabled'}>${canBuy?'Kopen':'Te weinig munten'}</button>
      </article>`;
    }).join('') : `<div class="shop-empty">Geen betaalbare items in deze categorie.</div>`;

    return `<section class="shop-section">
      <div class="shop-section-head">
        <div><b>${type}</b><small>${shopTypeCount(type)} items</small></div>
        <button data-shop-cat="${type}">Bekijk collectie ›</button>
      </div>
      <div class="shop-items">${itemHtml}</div>
    </section>`;
  }).join('');
}
function showShop(){
  H.hidden=true;O.hidden=true;T.hidden=true;L.hidden=true;S.hidden=false;
  renderShop();
}
function shopToast(text){
  const old=document.querySelector('.shop-toast');
  if(old) old.remove();
  const t=document.createElement('div');
  t.className='shop-toast';
  t.textContent=text;
  document.getElementById('shopScreen').appendChild(t);
  setTimeout(()=>t.remove(),1400);
}
function buyShopItem(id){
  const item=shopItems.find(x=>x.id===id);
  if(!item || !itemTypeUnlocked(item.type) || state.coins<item.price) return;
  state.coins-=item.price;
  state.inventoryItems.push(item.id);
  save();
  renderShop();
  shopToast(`${item.name} staat in je inventaris ♡`);
}


const rewardRooms=['Slaapkamer','Wasruimte','Caravan','Hobbykamer'];
const rewardItemTypes=['Planten','Tapijten','Verlichting','Decoratie','Vloeren','Behang & verf','Zetels','Bedden','Nachtkastjes','Badkamer','Keuken'];

function currentLevel(){
  // Je begint op level 1. Elke volle 100 punten brengt je één level hoger.
  return Math.floor(state.points/100)+1;
}
function levelProgressPoints(){
  return state.points%100;
}
function reachedRewardLevels(){
  const lv=currentLevel();
  const arr=[];
  for(let m=5;m<=lv;m+=5) arr.push(m);
  return arr;
}
function pendingRewardLevel(){
  return reachedRewardLevels().find(m=>!state.levelRewards[String(m)]) || null;
}

function renderLevels(){
  const lv=currentLevel();
  const p=levelProgressPoints();
  document.getElementById('levelNumber').textContent=lv;
  document.getElementById('levelPointsText').textContent=`${p} / 100 punten`;
  document.getElementById('levelNextText').textContent=`${100-p} punten tot level ${lv+1}`;
  document.getElementById('levelFill').style.width=`${p}%`;

  // Toon een venster van vijf levels rond de huidige voortgang.
  const groupStart=Math.floor((lv-1)/5)*5+1;
  const nodes=[];
  for(let n=groupStart;n<groupStart+5;n++){
    const isReward=n%5===0;
    const reached=n<=lv;
    nodes.push(`<div class="level-node ${isReward?'reward':''} ${reached?'reached':''}">
      <b>${n}</b><small>${isReward?'🎁':(reached?'✓':'•')}</small>
    </div>`);
  }
  document.getElementById('levelRoadmap').innerHTML=nodes.join('');

  const pending=pendingRewardLevel();
  const box=document.getElementById('pendingReward');
  if(pending){
    box.hidden=false;
    document.getElementById('pendingTitle').textContent=`Level ${pending} bereikt!`;
  }else{
    box.hidden=true;
  }

  const unlocked=[];
  Object.keys(state.levelRewards)
    .map(Number)
    .sort((a,b)=>a-b)
    .forEach(level=>{
      const r=state.levelRewards[String(level)];
      if(!r) return;
      const icon=r.type==='room'?'🏡':'🛍️';
      const label=r.type==='room'?'Kamer':'Itemtype';
      unlocked.push(`<div class="unlock-row"><span>${icon}</span><div><b>${r.name}</b><small>${label}</small></div><span class="unlock-level">level ${level}</span></div>`);
    });

  document.getElementById('unlockedList').innerHTML=unlocked.length
    ? unlocked.join('')
    : `<div class="unlocked-empty">Je eerste keuze komt vrij op level 5. 🎁</div>`;
}

function showLevels(){
  H.hidden=true;O.hidden=true;T.hidden=true;S.hidden=true;L.hidden=false;
  renderLevels();renderCounters();
}

let rewardType=null;
function openRewardModal(){
  const pending=pendingRewardLevel();
  if(!pending) return;
  rewardType=null;
  document.getElementById('rewardLevelTitle').textContent=`Level ${pending}!`;
  document.getElementById('rewardStepType').hidden=false;
  document.getElementById('rewardStepChoice').hidden=true;
  document.getElementById('rewardModal').hidden=false;
}
function closeRewardModal(){
  document.getElementById('rewardModal').hidden=true;
}
function showRewardChoices(type){
  rewardType=type;
  const choices=type==='room'?rewardRooms:rewardItemTypes;
  const already=type==='room'?state.unlockedRooms:state.unlockedItemTypes;
  document.getElementById('choiceTitle').textContent=type==='room'?'Kies een kamer':'Kies een itemtype';
  document.getElementById('choiceHelp').textContent='Deze keuze wordt meteen bewaard.';
  document.getElementById('rewardChoices').innerHTML=choices.map(name=>{
    const used=already.includes(name);
    return `<button class="reward-choice" data-reward-name="${name.replace(/"/g,'&quot;')}" ${used?'disabled':''}>
      <span>${type==='room'?'🏡':'🛍️'}</span><b>${name}${used?' ✓':''}</b>
    </button>`;
  }).join('');
  document.getElementById('rewardStepType').hidden=true;
  document.getElementById('rewardStepChoice').hidden=false;
}
function chooseReward(name){
  const pending=pendingRewardLevel();
  if(!pending || !rewardType) return;

  const collection=rewardType==='room'?state.unlockedRooms:state.unlockedItemTypes;
  if(collection.includes(name)) return;

  collection.push(name);
  state.levelRewards[String(pending)]={type:rewardType,name};
  save();
  closeRewardModal();
  renderLevels();
  renderOverview();
}


function roomIsUnlocked(room){
  return ['Woonkamer','Keuken','Badkamer'].includes(room) || state.unlockedRooms.includes(room);
}

function applyRoomUnlocks(){
  document.querySelectorAll('.room-card[data-room]').forEach(card=>{
    const room=card.dataset.room;
    const unlocked=roomIsUnlocked(room);
    card.dataset.unlocked=unlocked?'true':'false';

    if(unlocked){
      // Remove obvious lock text/icons when this room was chosen as a level reward.
      card.querySelectorAll('.room-lock,.lock,[data-lock],.unlock-at-level,.locked-copy').forEach(el=>el.style.display='none');
      card.classList.remove('locked');
      card.setAttribute('aria-disabled','false');
    }
  });
}

function renderOverview(){
 document.getElementById('roomCards').innerHTML=roomData.map(x=>{
   const done=roomDone(x[0]);
   const total=(tasksByRoom[x[0]]||[]).length;
   return `<button class="room-card ${x[3]?'locked':''}" data-room="${x[0]}" ${x[3]?'disabled':''}>
   <img src="${x[1]}"><span class="room-text"><b>${x[0]}</b><small>${x[3]?x[2]:`${done}/${total} taken`}</small>
   ${x[3]?'':`<span class="progress" style="--progress:${total ? Math.round((done/total)*100) : 0}%"><i class="red"></i><i class="red"></i><i class="orange"></i><i class="orange"></i><i class="green"></i><i class="green"></i><em></em></span>`}
   </span><span class="chev">${x[3]?'🔒':'›'}</span></button>`
 }).join('');
 renderCounters();
  applyRoomUnlocks();
}

function renderTasks(){
 const data=tasksByRoom[currentRoom];
 document.getElementById('roomTitle').textContent=currentRoom;
 document.getElementById('roomBadge').textContent=badges[currentRoom]||'🏡';
 const box=document.getElementById('tasks');
 box.innerHTML=data.map((x,i)=>{
   const done=taskIsDone(currentRoom,i);
   return `<button class="task-card ${done?'done':''}" data-task="${i}">
   <img src="${x[2]}"><span class="task-info"><b>${x[0]}</b><small>${x[1]}</small></span>
   <span class="rewards">🪙 1<br>⭐ 5</span><span class="check">${done?'✓':''}</span>
 </button>`;
 }).join('');
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
 state.completed[currentRoom]=state.completed[currentRoom]||[];

 if(taskIsDone(currentRoom,i)){
   // Alleen een taak die VANDAAG werd afgevinkt kan nog ongedaan gemaakt worden.
   // Zo trekken we geen oude punten/munten af van een taak die gisteren werd voltooid.
   if(taskCompletedToday(currentRoom,i)){
     state.completed[currentRoom][i]=null;
     state.points=Math.max(0,state.points-5);
     state.coins=Math.max(0,state.coins-1);
     state.today=Math.max(0,state.today-1);
   }
 }else{
   // De taak is opnieuw aan de beurt volgens haar frequentie.
   state.completed[currentRoom][i]=todayKey;
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

function goHome(){T.hidden=true;O.hidden=true;L.hidden=true;S.hidden=true;H.hidden=false;renderCounters()}
const overviewHomeNav=document.getElementById('overviewHomeNav');
const taskHomeNav=document.getElementById('taskHomeNav');
if(overviewHomeNav)overviewHomeNav.addEventListener('click',goHome);
if(taskHomeNav)taskHomeNav.addEventListener('click',goHome);



function openRoomTasks(room){
  if(!roomIsUnlocked(room)) return;
  currentRoom=room;
  T.hidden=false; O.hidden=true; H.hidden=true; L.hidden=true;
  renderTasks(room);
}


document.querySelectorAll('.room-card[data-room]').forEach(card=>{
  card.addEventListener('click',e=>{
    const room=card.dataset.room;
    if(!roomIsUnlocked(room)) return;
    openRoomTasks(room);
  });
});

document.querySelectorAll('[data-go-levels]').forEach(b=>b.addEventListener('click',showLevels));
const levelHomeNav=document.getElementById('levelHomeNav');
if(levelHomeNav) levelHomeNav.addEventListener('click',goHome);

const openReward=document.getElementById('openReward');
const closeReward=document.getElementById('closeReward');
const rewardBack=document.getElementById('rewardBack');
if(openReward) openReward.addEventListener('click',openRewardModal);
if(closeReward) closeReward.addEventListener('click',closeRewardModal);
if(rewardBack) rewardBack.addEventListener('click',()=>{
  document.getElementById('rewardStepChoice').hidden=true;
  document.getElementById('rewardStepType').hidden=false;
});
document.querySelectorAll('.reward-type').forEach(b=>b.addEventListener('click',()=>showRewardChoices(b.dataset.rewardType)));
const rewardChoices=document.getElementById('rewardChoices');
if(rewardChoices) rewardChoices.addEventListener('click',e=>{
  const b=e.target.closest('[data-reward-name]');
  if(!b || b.disabled) return;
  chooseReward(b.dataset.rewardName);
});
const rewardModal=document.getElementById('rewardModal');
if(rewardModal) rewardModal.addEventListener('click',e=>{
  if(e.target===rewardModal) closeRewardModal();
});


document.querySelectorAll('[data-go-shop]').forEach(b=>b.addEventListener('click',showShop));
const shopHomeNav=document.getElementById('shopHomeNav');
const shopBack=document.getElementById('shopBack');
if(shopHomeNav) shopHomeNav.addEventListener('click',goHome);
if(shopBack) shopBack.addEventListener('click',goHome);

const shopCategories=document.getElementById('shopCategories');
if(shopCategories) shopCategories.addEventListener('click',e=>{
  const b=e.target.closest('[data-shop-cat]');
  if(!b) return;
  shopCategory=b.dataset.shopCat;
  renderShop();
});
const shopContent=document.getElementById('shopContent');
if(shopContent) shopContent.addEventListener('click',e=>{
  const cat=e.target.closest('[data-shop-cat]');
  if(cat){
    shopCategory=cat.dataset.shopCat;
    renderShop();
    document.querySelector('.shop-middle').scrollTop=0;
    return;
  }
  const buy=e.target.closest('[data-buy]');
  if(buy) buyShopItem(buy.dataset.buy);
});
const shopFilter=document.getElementById('shopFilter');
if(shopFilter) shopFilter.addEventListener('click',()=>{
  shopAffordableOnly=!shopAffordableOnly;
  shopFilter.textContent=shopAffordableOnly?'✓ Betaalbaar':'☷ Filter';
  renderShop();
});


renderOverview();renderCounters();
