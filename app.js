const roomTasks = {
  "Slaapkamer":["Bed opmaken","Nachtkastje opruimen","Kleding wegleggen"],
  "Badkamer":["Wastafel schoonmaken","Handdoeken netjes","Spiegel afnemen"],
  "Woonkamer":["Kussens netjes leggen","Salontafel opruimen","5 minuten opruimen"],
  "Keuken":["Aanrecht opruimen","Tafel afnemen","Vaatwasser controleren"],
  "Hal":["Schoenen opruimen","Jassen netjes hangen","Vloer vrijmaken"],
  "Wasruimte":["Was sorteren","Machine leegmaken","Wasmand opruimen"],
  "Terras":["Tafel netjes","Kussens goedleggen","Planten controleren"]
};
const icons={"Slaapkamer":"🛏️","Badkamer":"🛁","Woonkamer":"🛋️","Keuken":"🍳","Hal":"🚪","Wasruimte":"🧺","Terras":"🌿"};

const items=[
 {id:"green-sofa",cat:"Zitmeubels",name:"Groene bank",price:8,img:"assets/groene-bank.jpg",unlock:1},
 {id:"boho-chair",cat:"Zitmeubels",name:"Boho fauteuil",price:6,img:"assets/boho-fauteuil.jpg",unlock:1},
 {id:"rattan-love",cat:"Zitmeubels",name:"Rotan loveseat",price:9,img:"assets/rotan-loveseat.jpg",unlock:1},
 {id:"round-table",cat:"Tafels",name:"Ronde salontafel",price:7,img:"assets/ronde-salontafel.jpg",unlock:1},
 {id:"light-table",cat:"Tafels",name:"Lichte salontafel",price:6,img:"assets/lichte-salontafel.jpg",unlock:1},
 {id:"rattan-side",cat:"Tafels",name:"Rotan bijzettafel",price:4,img:"assets/rotan-bijzettafel.jpg",unlock:1},
 {id:"dresser",cat:"Kasten",name:"Houten dresser",price:10,img:"assets/houten-dresser.jpg",unlock:1},
 {id:"vintage-cab",cat:"Kasten",name:"Vintage kastje",price:9,img:"assets/vintage-kastje.jpg",unlock:1},
 {id:"locked-sofa",cat:"Zitmeubels",name:"Nieuwe zetel",price:12,img:"assets/groene-bank.jpg",unlock:5},
 {id:"locked-table",cat:"Tafels",name:"Nieuwe tafel",price:11,img:"assets/ronde-salontafel.jpg",unlock:5}
];

const cats=[
 ["Alles","🏠"],["Zitmeubels","🛋️"],["Tafels","🪵"],["Stoelen","🪑"],["Kasten","🗄️"],
 ["Decoratie","🪴"],["Verlichting","🪔"],["Vloerkleden","🧶"]
];

const todayKey=new Date().toISOString().slice(0,10);
let old=JSON.parse(localStorage.getItem("homey-v4")||"null");
let state=JSON.parse(localStorage.getItem("homey-v5")||"null");
if(!state){
 state=old?{...old,bought:[]}:{points:0,coins:0,day:todayKey,done:{},bonusAwarded:false,bought:[]};
}
state.bought=state.bought||[];
if(state.day!==todayKey){state.day=todayKey;state.done={};state.bonusAwarded=false}
function save(){localStorage.setItem("homey-v5",JSON.stringify(state))}
function completedCount(){return Object.values(state.done).filter(Boolean).length}
function visibleBalls(){return Math.min(15,completedCount())}
function level(){return Math.floor(state.points/25)+1}

const toast=document.getElementById("toast");
function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(window._t);window._t=setTimeout(()=>toast.classList.remove("show"),1900)}

function renderStats(){
 const balls=visibleBalls();
 ["livePoints","shopPoints"].forEach(id=>document.getElementById(id).textContent=state.points);
 ["liveCoins","shopCoins"].forEach(id=>document.getElementById(id).textContent=state.coins);
 ["liveBalls","shopBalls"].forEach(id=>document.getElementById(id).textContent=balls);
 document.getElementById("liveBallRow").innerHTML=Array.from({length:15},(_,i)=>`<i class="live-ball-dot ${i<balls?"on":""}"></i>`).join("");
}

const panel=document.getElementById("panel"), title=document.getElementById("panelTitle"), text=document.getElementById("panelText"), icon=document.getElementById("panelIcon"), list=document.getElementById("taskList");
function openRoom(name){
 title.textContent=name;icon.textContent=icons[name]||"🏡";text.textContent="Tik een taak aan wanneer je ze hebt voltooid.";
 list.innerHTML=(roomTasks[name]||[]).map((task,i)=>{
  const key=name+"-"+i,done=!!state.done[key];
  return `<button class="task-row ${done?"done":""}" data-task="${key}"><span class="task-check">${done?"✓":"○"}</span><span class="task-label">${task}<span class="task-sub">1 bol • 1 munt • 1 punt</span></span></button>`;
 }).join("");
 panel.hidden=false;
}
document.querySelectorAll(".room").forEach(b=>b.addEventListener("click",()=>openRoom(b.dataset.room)));
list.addEventListener("click",e=>{
 const row=e.target.closest("[data-task]");if(!row)return;
 const key=row.dataset.task,was=!!state.done[key],before=visibleBalls();
 if(!was){
  state.done[key]=true;state.coins++;state.points++;
  if(before<15&&visibleBalls()>=15&&!state.bonusAwarded){state.points+=15;state.bonusAwarded=true;showToast("Bonus! +15 punten 🎁")}
  else showToast("+1 bol • +1 munt • +1 punt");
 }else{
  state.done[key]=false;state.coins=Math.max(0,state.coins-1);state.points=Math.max(0,state.points-1);
  if(state.bonusAwarded&&visibleBalls()<15){state.points=Math.max(0,state.points-15);state.bonusAwarded=false}
  showToast("Taak weer geopend");
 }
 save();renderStats();openRoom(title.textContent);renderShop();
});
document.getElementById("closePanel").onclick=()=>panel.hidden=true;
panel.addEventListener("click",e=>{if(e.target===panel)panel.hidden=true});

let activeCat="Alles";
function renderCategories(){
 document.getElementById("categoryStrip").innerHTML=cats.map(([name,ico])=>`<button class="cat-btn ${name===activeCat?"active":""}" data-cat="${name}"><span class="cat-ico">${ico}</span>${name}</button>`).join("");
 document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{activeCat=b.dataset.cat;renderShop()});
}
function renderShop(){
 renderCategories();
 const lv=level();
 const filtered=activeCat==="Alles"?items:items.filter(x=>x.cat===activeCat);
 const groups=[...new Set(filtered.map(x=>x.cat))];
 document.getElementById("shopSections").innerHTML=groups.length?groups.map(cat=>{
   const arr=filtered.filter(x=>x.cat===cat);
   return `<section class="collection"><div class="collection-head"><h2>${cat}<small>${arr.filter(x=>lv>=x.unlock).length} / ${arr.length} vrijgespeeld</small></h2><button>Bekijk collectie ›</button></div><div class="items-grid">
   ${arr.map(x=>{
    const locked=lv<x.unlock,owned=state.bought.includes(x.id),can=state.coins>=x.price;
    return `<article class="shop-item ${locked?"locked-card":""}">
      <div class="item-pic"><img src="${x.img}" alt="${x.name}"></div>
      ${locked?`<div class="lock-badge">🔒</div>`:""}
      <b>${x.name}</b><div class="item-price"><span class="dot">●</span> ${x.price}</div>
      <button class="buy-btn" data-buy="${x.id}" ${locked||owned||!can?"disabled":""}>${locked?"Level "+x.unlock:owned?"Gekocht ✓":"Kopen"}</button>
    </article>`;
   }).join("")}</div></section>`;
 }).join(""):`<section class="collection"><div style="padding:28px;text-align:center;color:#83776b">Deze collectie vullen we hierna verder aan. 🌿</div></section>`;
 document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>buyItem(b.dataset.buy));
}
function buyItem(id){
 const x=items.find(i=>i.id===id);if(!x||state.bought.includes(id)||state.coins<x.price||level()<x.unlock)return;
 state.coins-=x.price;state.bought.push(id);save();renderStats();renderShop();showToast(`${x.name} staat nu in je inventaris 🎒`);
}

function showScreen(name){
 document.getElementById("homeScreen").classList.toggle("active",name==="home");
 document.getElementById("shopScreen").classList.toggle("active",name==="shop");
 const simple=document.getElementById("simpleScreen");
 simple.hidden=!["inventory","levels","more"].includes(name);
 if(name==="inventory"){document.getElementById("simpleIcon").textContent="🎒";document.getElementById("simpleTitle").textContent="Inventaris";document.getElementById("simpleText").textContent=`Je hebt ${state.bought.length} item(s) gekocht. Dit scherm bouwen we hierna volledig uit.`}
 if(name==="levels"){document.getElementById("simpleIcon").textContent="⭐";document.getElementById("simpleTitle").textContent=`Level ${level()}`;document.getElementById("simpleText").textContent="Elke 5 levels spelen nieuwe collecties en delen van Homey vrij."}
 if(name==="more"){document.getElementById("simpleIcon").textContent="🌿";document.getElementById("simpleTitle").textContent="Meer";document.getElementById("simpleText").textContent="Hier komen later instellingen en extra opties."}
 if(name==="shop"){renderShop();window.scrollTo(0,0)}
}
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>showScreen(b.dataset.nav)));
document.getElementById("filterBtn").onclick=()=>showToast("Filteren op prijs en vrijgespeeld voegen we later toe.");

renderStats();renderShop();save();
