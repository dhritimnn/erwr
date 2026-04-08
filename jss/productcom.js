async function productCompInit() {
  const FALLBACK = '#e8dcd5';
  const WA_NUMBER = ''; // add number here
  
  // helpers
  function getCart() {
    try { return JSON.parse(localStorage.getItem('gk_cart') || '[]'); } catch { return []; }
  }
  
  function saveCart(c) { localStorage.setItem('gk_cart', JSON.stringify(c)); }
  
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem('gk_wishlist') || '[]'); } catch { return []; }
  }
  
  function saveWishlist(w) { localStorage.setItem('gk_wishlist', JSON.stringify(w)); }
  
  // load DB
  let db = [];
  try {
    const res = await fetch('./database.json');
    db = await res.json();
  } catch (e) { console.error('DB load failed', e); return; }
  
  // get product
  const id = parseInt(new URLSearchParams(window.location.search).get('id'));
  const p = db.find(x => x.id === id);
  if (!p) { document.getElementById('pc-info').innerHTML = '<p style="padding:2rem;text-align:center;color:#aaa">Product not found.</p>'; return; }
  
  // collect images
  const imgs = [];
  for (let i = 1;; i++) {
    const key = i === 1 ? 'url' : `url${i}`;
    if (p[key]) imgs.push(p[key]);
    else break;
  }
  if (!imgs.length) imgs.push('');
  
  // ── SLIDER ──
  const slider = document.getElementById('pc-slider');
  const dotsWrap = document.getElementById('pc-dots');
  let cur = 0;
  
  imgs.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'pc-slide';
    slide.innerHTML = `<img src="${src}" alt="${p.name}" onerror="this.parentElement.style.background='${FALLBACK}';this.style.display='none'" loading="${i===0?'eager':'lazy'}">`;
    slide.addEventListener('click', () => openLightbox(i));
    slider.appendChild(slide);
    
    const dot = document.createElement('div');
    dot.className = 'pc-dot' + (i === 0 ? ' active' : '');
    dotsWrap.appendChild(dot);
  });
  
  if (imgs.length < 2) dotsWrap.style.display = 'none';
  
  function goTo(n) {
    cur = Math.max(0, Math.min(n, imgs.length - 1));
    slider.style.transform = `translateX(-${cur * 100}%)`;
    dotsWrap.querySelectorAll('.pc-dot').forEach((d, i) => d.classList.toggle('active', i === cur));
  }
  
  // touch swipe on slider
  let ts = 0,
    tx = 0;
  const sw = document.getElementById('pc-slider-wrap');
  sw.addEventListener('touchstart', e => { ts = e.touches[0].clientX; }, { passive: true });
  sw.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - ts;
    if (Math.abs(dx) > 40) goTo(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
  
  // ── LIGHTBOX ──
  const lb = document.getElementById('pc-lightbox');
  const lbImg = document.getElementById('pc-lb-img');
  let scale = 1,
    ox = 0,
    oy = 0,
    dragging = false,
    dragSx, dragSy, dragOx, dragOy;
  let pinchDist = 0;
  
  function openLightbox(i) {
    lbImg.src = imgs[i];
    scale = 1;
    ox = 0;
    oy = 0;
    applyTransform();
    lb.classList.add('open');
  }
  
  function applyTransform() {
    lbImg.style.transform = `translate(${ox}px,${oy}px) scale(${scale})`;
  }
  
  document.getElementById('pc-lb-close').addEventListener('click', () => lb.classList.remove('open'));
  
  // pinch zoom
  lb.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    } else if (e.touches.length === 1) {
      dragging = true;
      dragSx = e.touches[0].clientX;
      dragSy = e.touches[0].clientY;
      dragOx = ox;
      dragOy = oy;
    }
  }, { passive: true });
  
  lb.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      scale = Math.min(5, Math.max(1, scale * d / pinchDist));
      pinchDist = d;
      applyTransform();
    } else if (dragging && scale > 1) {
      ox = dragOx + e.touches[0].clientX - dragSx;
      oy = dragOy + e.touches[0].clientY - dragSy;
      applyTransform();
    }
  }, { passive: false });
  
  lb.addEventListener('touchend', () => {
    dragging = false;
    if (scale < 1.05) { scale = 1;
      ox = 0;
      oy = 0;
      applyTransform(); }
  }, { passive: true });
  
  // double tap to reset
  let lastTap = 0;
  lb.addEventListener('touchend', () => {
    const now = Date.now();
    if (now - lastTap < 300) { scale = 1;
      ox = 0;
      oy = 0;
      applyTransform(); }
    lastTap = now;
  }, { passive: true });
  
  // ── INFO ──
  document.getElementById('pc-name').textContent = p.name;
  document.getElementById('pc-price').textContent = p.price;
  const cats = (p.cat || '').split(' ').filter(c => c !== 'featured');
  document.getElementById('pc-cat').textContent = cats.join(' · ');
  if ((p.cat || '').includes('featured')) {
    document.getElementById('pc-featured-tag').style.display = 'inline-block';
  }
  
  // ── CART BUTTON ──
  const cartBtn = document.getElementById('pc-cart-btn');
  
  function syncCartBtn() {
    const inCart = getCart().some(x => x.id === p.id);
    cartBtn.classList.toggle('added', inCart);
    cartBtn.querySelector('span') ? null : null;
    cartBtn.childNodes[cartBtn.childNodes.length - 1].textContent = inCart ? ' In Cart ✓' : ' Add to Cart';
  }
  syncCartBtn();
  cartBtn.addEventListener('click', () => {
    let cart = getCart();
    if (cart.some(x => x.id === p.id)) {
      window.location.href = 'cart.html';
    } else {
      cart.push({ id: p.id, name: p.name, price: p.price, url: imgs[0], qty: 1 });
      saveCart(cart);
      syncCartBtn();
      window.dispatchEvent(new Event('storage'));
    }
  });
  
  // ── WHATSAPP ──
  document.getElementById('pc-wa-btn').addEventListener('click', () => {
    const msg = encodeURIComponent(`Hi! I'm interested in *${p.name}* (ID: ${p.id}) priced at ${p.price}. Can you tell me more?`);
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  });
  
  // ── SUGGESTIONS ──
  const tags = (p.cat || '').split(' ');
  const suggestions = db
    .filter(x => x.id !== p.id)
    .map(x => {
      const xt = (x.cat || '').split(' ');
      const score = tags.filter(t => xt.includes(t)).length;
      return { ...x, _score: score };
    })
    .filter(x => x._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 10);
  
  const grid = document.getElementById('pc-sug-grid');
  if (!suggestions.length) {
    document.getElementById('pc-suggestions').style.display = 'none';
  } else {
    suggestions.forEach(sp => {
      const wished = getWishlist().includes(sp.id);
      const card = document.createElement('div');
      card.className = 'gk-card';
      card.innerHTML = `
          <div class="gk-card-img-wrap">
            <img src="${sp.url||''}" alt="${sp.name}" onerror="this.style.display='none';this.parentElement.style.background='${FALLBACK}'" loading="lazy">
            <button class="gk-wish${wished?' wished':''}" data-id="${sp.id}" aria-label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5400" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6.5 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z"/>
              </svg>
            </button>
          </div>
          <div class="gk-card-info">
            <div class="gk-card-name">${sp.name}</div>
            <div class="gk-card-price">${sp.price}</div>
          </div>`;
      card.addEventListener('click', e => {
        if (!e.target.closest('.gk-wish')) window.location.href = `product.html?id=${sp.id}`;
      });
      card.querySelector('.gk-wish').addEventListener('click', function(e) {
        e.stopPropagation();
        let wl = getWishlist();
        wl.includes(sp.id) ? wl = wl.filter(x => x !== sp.id) : wl.push(sp.id);
        saveWishlist(wl);
        this.classList.toggle('wished', wl.includes(sp.id));
      });
      grid.appendChild(card);
    });
  }
  
}