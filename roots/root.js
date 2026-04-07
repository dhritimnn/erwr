async function addcomp(id, path) {
  let html = sessionStorage.getItem(path);
  
  if (!html) {
    const res = await fetch(path);
    html = await res.text();
    sessionStorage.setItem(path, html);
  }

  const template = document.createElement('template');
  template.innerHTML = html;
  
  document.getElementById(id).replaceWith(template.content);
}


async function searchjsfunc() {
  const products = [
      "Red Floral Dress",
      "Blue Cotton Kurti",
      "Silk Saree",
      "Gold Necklace",
      "Silver Ring",
      "Cotton Kurta",
      "Lehenga Set",
      "Pearl Earrings",
      "Mekhela Sador",
      "Red Dupatta",
    ];

    const arrowSVG = `<svg width="25px" height="25px" viewBox="0 0 40 40">
      <path d="M 10 30 L 30 10 M 18 10 H 30 V 22" stroke="lightgrey" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

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

    function bestSubstringScore(query, target) {
      if (!query) return Infinity;
      const q = query.toLowerCase(), t = target.toLowerCase();
      if (t.includes(q)) return 0;
      let best = Infinity;
      for (let i = 0; i <= t.length - q.length; i++) {
        const d = lev(q, t.slice(i, i + q.length));
        if (d < best) best = d;
      }
      return Math.min(best, lev(q, t));
    }

    function getSuggestions(query, limit = 5) {
      if (!query.trim()) return [];
      return products
        .map(name => ({ name, score: bestSubstringScore(query, name) }))
        .filter(r => r.score <= 3)
        .sort((a, b) => a.score - b.score)
        .slice(0, limit);
    }

    function navigate(query) {
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }

    const input = document.getElementById('searchinput');
    const bar   = document.getElementById('suggestionbar');
    const btn   = document.getElementById('searchbtn');

    function renderSuggestions(query) {
      bar.innerHTML = getSuggestions(query).map(r => `
        <a href="search.html?q=${encodeURIComponent(r.name)}">
          <p>${r.name}</p>${arrowSVG}
        </a>`).join('');
    }

    input.addEventListener('input', () => renderSuggestions(input.value));
    input.addEventListener('focus', () => renderSuggestions(input.value));
    document.addEventListener('click', e => {
      if (!document.getElementById('searchbar').contains(e.target))
        bar.innerHTML = '';
    });
    btn.addEventListener('click', () => navigate(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(input.value); });
 
}
