async function searchResultInit() {
  
  const BATCH = 6;
  const FALLBACK_COLOR = '#e8dcd5';

  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';
  document.getElementById('result-query').textContent = query;

  // --- Fuzzy helpers (same algo as root) ---
  function lev(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  function bestScore(query, target) {
    if (!query) return 0;
    const q = query.toLowerCase(), t = target.toLowerCase();
    if (t.includes(q)) return 0;
    let best = Infinity;
    for (let i = 0; i <= t.length - q.length; i++) {
      const d = lev(q, t.slice(i, i + q.length));
      if (d < best) best = d;
    }
    return Math.min(best, lev(q, t));
  }

  // --- Load & rank products (bottom to top) ---
  let allProducts = [];

  try {
    const res = await fetch('./database.json');
    const data = await res.json();
    const reversed = [...data].reverse();
    if (!query.trim()) {
      allProducts = reversed;
    } else {
      allProducts = reversed
        .map(p => ({ ...p, _score: bestScore(query, p.name + ' ' + p.cat) }))
        .filter(p => p._score <= 4)
        .sort((a, b) => a._score - b._score);
    }
  } catch(e) {
    console.error('DB load failed', e);
  }

  const grid = document.getElementById('result-grid');
  const loader = document.getElementById('result-loader');
  const noResults = document.getElementById('no-results');

  if (!allProducts.length) {
    loader.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }

  // --- Wishlist helpers ---
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem('gk_wishlist') || '[]'); }
    catch { return []; }
  }
  function toggleWish(id) {
    let wl = getWishlist();
    wl.includes(id) ? wl = wl.filter(x => x !== id) : wl.push(id);
    localStorage.setItem('gk_wishlist', JSON.stringify(wl));
    return wl.includes(id);
  }

  // --- Card builder ---
  function makeCard(p) {
    const wished = getWishlist().includes(p.id);
    const card = document.createElement('div');
    card.className = 'gk-card';
    card.innerHTML = `
      <div class="gk-card-img-wrap">
        <img
          src="${p.url || ''}"
          alt="${p.name}"
          onerror="this.style.display='none';this.parentElement.style.background='${FALLBACK_COLOR}'"
          loading="lazy"
        />
        <button class="gk-wish${wished ? ' wished' : ''}" data-id="${p.id}" aria-label="Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6435" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path class="heart-fill" d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6.5 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z"/>
          </svg>
        </button>
      </div>
      <div class="gk-card-info">
        <div class="gk-card-name">${p.name}</div>
        <div class="gk-card-price">${p.price}</div>
      </div>
    `;
    card.querySelector('.gk-wish').addEventListener('click', function(e) {
      e.stopPropagation();
      const nowWished = toggleWish(p.id);
      this.classList.toggle('wished', nowWished);
    });
    return card;
  }

  // --- Lazy batch loader ---
  let loaded = 0;

  function loadBatch() {
    const batch = allProducts.slice(loaded, loaded + BATCH);
    batch.forEach(p => grid.appendChild(makeCard(p)));
    loaded += batch.length;
    if (loaded >= allProducts.length) {
      loader.style.display = 'none';
      observer.disconnect();
    }
  }

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadBatch();
  }, { rootMargin: '200px' });

  observer.observe(loader);

}