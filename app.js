const house=document.getElementById('houseScreen');
const overview=document.getElementById('overviewScreen');

document.querySelectorAll('[data-overview]').forEach(button=>{
  button.addEventListener('click',()=>{
    house.hidden=true;
    overview.hidden=false;
  });
});

document.getElementById('overviewBack').addEventListener('click',()=>{
  overview.hidden=true;
  house.hidden=false;
});

document.querySelectorAll('.room-card[data-room]').forEach(card=>{
  card.addEventListener('click',()=>{
    alert(card.dataset.room+' — de takenlijst koppelen we hierna.');
  });
});
