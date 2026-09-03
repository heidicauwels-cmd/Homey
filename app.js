const KEY='homey-v15';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{coins:256,bought:[]};
const toast=document.getElementById('toast');
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function say(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1500);}
document.querySelectorAll('.buy').forEach(b=>b.addEventListener('click',()=>{
  const item=b.dataset.item, price=Number(b.dataset.price);
  if(state.coins<price){say('Niet genoeg munten');return;}
  state.coins-=price; state.bought.push(item); save();
  say(item+' gekocht! 🪙 '+price);
}));
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{
  const n=b.dataset.nav;
  if(n==='shop') return;
  const names={home:'Mijn huis',inventory:'Inventaris',levels:'Levels',more:'Meer'};
  say(names[n]+' bouwen we hierna');
}));
