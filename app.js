const house=document.getElementById("house");
const overview=document.getElementById("overview");
const cards=document.getElementById("roomCards");

const rooms=[
  ["Woonkamer","🛋️",3,3],
  ["Keuken","🍳",3,3],
  ["Badkamer","🛁",3,3],
  ["Slaapkamer","🛏️",3,3],
  ["Hal","🚪",3,3],
  ["Wasruimte","🧺",3,3],
  ["Terras","🌿",3,3]
];

function showOverview(){
  cards.innerHTML=rooms.map(([name,icon,done,total])=>`
    <button class="room-card" data-open="${name}">
      <span class="room-icon">${icon}</span>
      <span class="room-main">
        <span class="room-name">${name}</span>
        <span class="progress"><span style="width:${done/total*100}%"></span></span>
        <span class="room-count">${done}/${total} taken</span>
      </span>
      <span class="arrow">›</span>
    </button>`).join("");
  house.hidden=true;
  overview.hidden=false;
}
document.querySelectorAll("[data-room]").forEach(b=>b.onclick=showOverview);
document.getElementById("back").onclick=()=>{overview.hidden=true;house.hidden=false};
cards.onclick=e=>{
  const card=e.target.closest("[data-open]");
  if(card) alert(card.dataset.open+" — takenlijst bouwen we als volgende stap.");
};