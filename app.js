const rooms=[
 {id:"woonkamer",name:"Woonkamer",icon:"🛋️",tasks:6,done:4,art:"living",unlock:1},
 {id:"keuken",name:"Keuken",icon:"🍲",tasks:5,done:5,art:"kitchen",unlock:1},
 {id:"badkamer",name:"Badkamer",icon:"🛁",tasks:4,done:4,art:"bath",unlock:1},
 {id:"slaapkamer",name:"Slaapkamer",icon:"🛏️",tasks:5,done:0,art:"bed",unlock:5},
 {id:"wasruimte",name:"Wasruimte",icon:"🧺",tasks:5,done:0,art:"laundry",unlock:10},
 {id:"caravan",name:"Caravan",icon:"🚐",tasks:5,done:0,art:"caravan",unlock:15}
];

const items=[
 {cat:"Zitmeubels",name:"Groene bank",icon:"🛋️",price:8},
 {cat:"Zitmeubels",name:"Boho fauteuil",icon:"🪑",price:6},
 {cat:"Zitmeubels",name:"Rotan loveseat",icon:"🛋️",price:9},
 {cat:"Tafels",name:"Ronde salontafel",icon:"🪵",price:7},
 {cat:"Tafels",name:"Lichte salontafel",icon:"🪵",price:6},
 {cat:"Tafels",name:"Rotan bijzettafel",icon:"🪴",price:4},
 {cat:"Kasten",name:"Houten dresser",icon:"🗄️",price:10},
 {cat:"Kasten",name:"Vintage kastje",icon:"🗄️",price:9},
 {cat:"Decoratie",name:"Grote kamerplant",icon:"🪴",price:12},
 {cat:"Decoratie",name:"Macramé wandhanger",icon:"🪢",price:8},
 {cat:"Decoratie",name:"Blad in kader",icon:"🖼️",price:5},
 {cat:"Verlichting",name:"Rieten hanglamp",icon:"🏮",price:11},
 {cat:"Verlichting",name:"Sfeerlamp",icon:"🪔",price:7},
 {cat:"Vloerkleden",name:"Boho vloerkleed",icon:"🧶",price:10}
];

let state=JSON.parse(localStorage.getItem("homey-v2")||'{"points":0,"coins":0,"balls":0,"bought":[],"category":"Zitmeubels"}');
function save(){localStorage.setItem("homey-v2",JSON.stringify(state))}
function level(){return Math.floor(state.points/25)+1}
function roomProgress(r){return Math.min(r.tasks,r.done + Math.floor(state.points/25)%2)}
function renderBalls(){
 const n=Math.min(15,state.balls); const row=document.querySelector("#ballRow");
 row.innerHTML=Array.from({length:15},(_,i)=>`<i class="ball-dot ${i<n?"on":""} ${i===14?"bonus":""}"></i>`).join("");
 document.querySelector("#balls").textContent=n;
 document.querySelector("#bonusText").textContent=n>=15?"Bonus verdiend! +15 punten 🎁":`${15-n} bollen tot bonus! +15 punten 🎁`;
 ["shopBalls"].forEach(id=>document.getElementById(id).textContent=n);
}
function renderStats(){
 document.querySelector("#points").textContent=state.points;
 document.querySelector("#coins").textContent=state.coins;
 document.querySelector("#shopPoints").textContent=state.points;
 document.querySelector("#shopCoins").textContent=state.coins;
}
function artFor(r){
 const extra=r.art==="living"?'<span class="plant">🪴</span><span class="sofa">🛋️</span><span class="frame">🖼️</span>':
 r.art==="kitchen"?'<span class="plant">🪴</span><span class="sofa">🍳</span><span class="frame">🏠</span>':
 r.art==="bath"?'<span class="plant">🌿</span><span class="sofa">🛁</span><span class="frame">🪞</span>':
 r.art==="bed"?'<span class="plant">🌿</span><span class="sofa">🛏️</span><span class="frame">🖼️</span>':
 r.art==="laundry"?'<span class="plant">🪴</span><span class="sofa">🧺</span><span class="frame">🧴</span>':
 '<span class="plant">🌿</span><span class="sofa">🚐</span><span class="frame">☀️</span>';
 return `<div class="room-art ${r.art}">${extra}</div>`;
}
function renderRooms(){
 const lv=level();
 document.querySelector("#rooms").innerHTML=rooms.map(r=>{
   const locked=lv<r.unlock;
   const d=locked?0:roomProgress(r);
   const bars=Array.from({length:r.tasks},(_,i)=>`<i class="${i<d?"done":""}"></i>`).join("");
   return `<div class="room ${locked?"locked":""}" onclick="${locked?`toast('Ontgrendelen op level ${r.unlock}')`:`toast('${r.name}: hier komen je taken')`}">
     ${artFor(r)}<div class="room-info"><div class="room-head"><span class="room-icon">${r.icon}</span><h3>${r.name}</h3></div>
     <p class="${locked?"lock-note":""}">${locked?"🔒 Vrijspelen op een "+r.unlock+"e levelmoment":d+" taken"}</p>
     <div class="mini-progress">${bars}</div></div><div class="arrow">${locked?"🔒":"›"}</div>
   </div>`;
 }).join("");
}
let activeCat=state.category||"Zitmeubels";
function renderCategories(){
 const cats=["Alles","Zitmeubels","Tafels","Stoelen","Kasten","Decoratie","Verlichting","Vloerkleden"];
 document.querySelector("#categories").innerHTML=cats.map(c=>`<button class="cat ${c===activeCat?"active":""}" onclick="setCat('${c}')">${c}</button>`).join("");
 document.querySelector("#invCategories").innerHTML=["Meubels","Decoratie","Verlichting","Huis","Caravan"].map((c,i)=>`<button class="cat ${i===0?"active":""}" onclick="toast('${c}')">${c}</button>`).join("");
}
function setCat(c){activeCat=c;state.category=c;save();renderShop()}
function renderShop(){
 renderCategories();
 const filtered=activeCat==="Alles"?items:items.filter(x=>x.cat===activeCat);
 const cats=[...new Set(filtered.map(x=>x.cat))];
 document.querySelector("#shopSections").innerHTML=cats.map(cat=>{
  const arr=filtered.filter(x=>x.cat===cat);
  return `<section class="shop-section"><h3>${cat} <span style="float:right;font:10px Arial;color:#8a8176">Bekijk collectie ›</span></h3><div class="shop-grid">
   ${arr.map(x=>{const i=items.indexOf(x),owned=state.bought.includes(i);return `<div class="item"><div class="item-art">${x.icon}</div><b>${x.name}</b><span class="price">🪙 ${x.price}</span><button class="buy" ${owned||state.coins<x.price?"disabled":""} onclick="buyItem(${i})">${owned?"Verzameld ✓":"Kopen"}</button></div>`}).join("")}
  </div></section>`;
 }).join("");
}
function buyItem(i){const x=items[i];if(state.bought.includes(i)||state.coins<x.price)return;state.coins-=x.price;state.bought.push(i);save();renderAll();toast(x.name+" toegevoegd aan je inventaris!")}
function renderInventory(){
 document.querySelector("#inventoryCount").textContent=`${state.bought.length} / ${10+level()}`;
 const owned=state.bought.map(i=>items[i]);
 document.querySelector("#inventoryGrid").innerHTML=owned.length?owned.map(x=>`<div class="owned"><div class="item-art">${x.icon}</div><b>${x.name}</b><small>${x.cat}</small></div>`).join(""):`<div style="grid-column:1/-1;text-align:center;color:#8a8176;padding:30px;font:12px Arial">Je inventaris is nog leeg. Ga iets leuks shoppen! 🪴</div>`;
}
function renderLevels(){
 const lv=level(), prev=(lv-1)*25, pct=Math.min(100,((state.points-prev)/25)*100);
 document.querySelector("#levelNumber").textContent=lv;
 document.querySelector("#levelTitle").textContent=lv;
 document.querySelector("#levelMessage").textContent=lv%5===0?"Je hebt een nieuwe vrijspeling verdiend! 🎁":"Nog even doorzetten voor je volgende vrijspeling.";
 document.querySelector("#levelBar").style.width=pct+"%";
 document.querySelector("#levelProgress").textContent=lv===1?`${25-state.points} punten tot level 2`:`${25-(state.points-prev)} punten tot level ${lv+1}`;
 const unlocks=[["🛋️","Woonkamer collectie","Level 1"],["🛏️","Slaapkamer","Level 5"],["🧺","Wasruimte","Level 10"],["🚐","Caravan","Level 15"],["🌿","Nieuwe boho collectie","Level 20"]];
 document.querySelector("#unlockList").innerHTML=unlocks.map(u=>`<div class="unlock ${lv>=parseInt(u[2].slice(6))?"":"locked"}"><span class="unlock-icon">${u[0]}</span><div><b>${u[1]}</b><small>${lv>=parseInt(u[2].slice(6))?"Vrijgespeeld ✓":"Vrijspelen op "+u[2]}</small></div></div>`).join("");
}
function showScreen(id){
 document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active-screen"));
 document.getElementById(id).classList.add("active-screen");
 document.querySelectorAll(".bottom button").forEach(b=>b.classList.toggle("selected",b.dataset.screen===id));
 if(id==="shop")renderShop();
 if(id==="inventory")renderInventory();
 if(id==="levels")renderLevels();
 window.scrollTo({top:0,behavior:"smooth"});
}
function renderAll(){renderStats();renderBalls();renderRooms();renderShop();renderInventory();renderLevels()}
function toast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove("show"),1800)}
renderAll();
