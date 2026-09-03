
const KEY = 'homey-v16';

function loadState() {
  const existing =
    JSON.parse(localStorage.getItem(KEY) || 'null') ||
    JSON.parse(localStorage.getItem('homey-v15') || 'null') ||
    JSON.parse(localStorage.getItem('homey-v5') || 'null');

  return {
    coins: Number(existing?.coins ?? 256),
    points: Number(existing?.points ?? 0),
    balls: Number(existing?.balls ?? 0),
    bought: Array.isArray(existing?.bought) ? existing.bought.map((x, i) =>
      typeof x === 'string'
        ? { id: `${Date.now()}-${i}`, name: x, boughtAt: Date.now() }
        : x
    ) : []
  };
}

let state = loadState();
const toast = document.getElementById('toast');

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function say(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function refreshCoinDisplay() {
  document.querySelectorAll('[data-live-coins]').forEach(el => {
    el.textContent = state.coins;
  });
}

function addInventoryItem(name, price) {
  state.bought.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    price,
    boughtAt: Date.now()
  });
}

document.querySelectorAll('.buy').forEach(button => {
  button.addEventListener('click', () => {
    const name = button.dataset.item;
    const price = Number(button.dataset.price);

    if (state.coins < price) {
      say(`Niet genoeg munten voor ${name}`);
      return;
    }

    const ok = window.confirm(`${name} kopen voor ${price} munten?`);
    if (!ok) return;

    state.coins -= price;
    addInventoryItem(name, price);
    save();
    refreshCoinDisplay();

    say(`${name} staat nu in je inventaris ❤️`);
  });
});

document.querySelectorAll('[data-nav]').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.dataset.nav;
    if (target === 'shop') return;

    if (target === 'inventory') {
      const count = state.bought.length;
      say(count === 1 ? '1 item in je inventaris' : `${count} items in je inventaris`);
      return;
    }

    const names = {home:'Mijn huis', levels:'Levels', more:'Meer'};
    say(`${names[target]} bouwen we hierna`);
  });
});

save();
refreshCoinDisplay();
