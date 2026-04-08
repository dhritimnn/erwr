function wishlistInit() {
  const FALLBACK = '#e8dcd5';
  
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem('gk_wishlist') || '[]'); } catch { return []; }
  }
  
  function saveWishlist(w) { localStorage.setItem('gk_wishlist', JSON.stringify(w)); }
  
  // we need product names+prices from DB
  // load DB then render
  fetch('./database.json')
    .then(r => r.json())
    .then(db => render(db))
    .catch(() => render([]));
  
  function render(db) {
    const grid = document.getElementById('wl-grid');
    const empty = document.getElementById('wl-empty');
    const clearBtn = document.getElementById('wl-clear-btn');
    grid.innerHTML = '';
    
    const wl = getWishlist();
    
    if (!wl.length) {
      empty.style.display = 'flex';
      clearBtn.style.display = 'none';
      return;
    }
    
    empty.style.display = 'none';
    clearBtn.style.display = '';
    
    wl.forEach(id => {
      const p = db.find(x => x.id === id);
      if (!p) return;
      
      const card = document.createElement('div');
      card.className = 'wl-card';
      card.innerHTML = `
          <div class="wl-card-img-wrap">
            <img src="${p.url||''}" alt="${p.name}"
              onerror="this.style.display='none';this.parentElement.style.background='${FALLBACK}'"
              loading="lazy">
          </div>
          <button class="wl-remove" aria-label="Remove">✕</button>
          <div class="wl-card-info">
            <div class="wl-card-name">${p.name}</div>
            <div class="wl-card-price">${p.price}</div>
          </div>`;
      
      card.addEventListener('click', e => {
        if (!e.target.closest('.wl-remove'))
          window.location.href = `product.html?id=${p.id}`;
      });
      
      card.querySelector('.wl-remove').addEventListener('click', e => {
        e.stopPropagation();
        let wl2 = getWishlist().filter(x => x !== id);
        saveWishlist(wl2);
        render(db);
      });
      
      grid.appendChild(card);
    });
  }
  
  // confirm sheet
  const confirm = document.getElementById('wl-confirm');
  document.getElementById('wl-clear-btn').addEventListener('click', () => {
    confirm.classList.add('open');
  });
  document.getElementById('wl-confirm-no').addEventListener('click', () => {
    confirm.classList.remove('open');
  });
  confirm.addEventListener('click', e => {
    if (e.target === confirm) confirm.classList.remove('open');
  });
  document.getElementById('wl-confirm-yes').addEventListener('click', () => {
    saveWishlist([]);
    confirm.classList.remove('open');
    fetch('./database.json').then(r => r.json()).then(db => render(db)).catch(() => render([]));
  });
}