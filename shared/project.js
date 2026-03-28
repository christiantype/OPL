/* ── OPL Shared Project Template ── */
/* Edit structure here to update all project pages */

(function () {

  document.body.classList.add('project');

  /* ── Nav ── */
  const navScript = document.createElement('script');
  navScript.src = '../shared/nav.js';
  document.head.appendChild(navScript);

  /* ── Hero ── */
  const hero = document.createElement('section');
  hero.id = 'hero';
  hero.innerHTML = `
    <div class="container">
      <div class="grid">
        <h1 class="col-12">${PROJECT.title}</h1>
      </div>
      <div class="grid">
        <h2 class="col-9">${PROJECT.description}</h2>
      </div>
    </div>
  `;
  document.body.appendChild(hero);

  /* ── Credits ── */
  const credits = document.createElement('section');
  credits.id = 'credits';
  credits.innerHTML = `
    <div class="container">
      <div class="grid">
        <div class="col-3">
          <span class="label">Client</span>
          <p>${PROJECT.client || '—'}</p>
        </div>
        <div class="col-3">
          <span class="label">Medium</span>
          <p>${PROJECT.medium || '—'}</p>
        </div>
        <div class="col-3">
          <span class="label">Year</span>
          <p>${PROJECT.year || '—'}</p>
        </div>
        <div class="col-3">
          <span class="label">Credits</span>
          <p>${PROJECT.credits || '—'}</p>
        </div>
        <div class="col-3">
          <span class="label">Role</span>
          <p>${PROJECT.role || '—'}</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(credits);

  /* ── Images ──
     Each image in PROJECT.images can have:
       cols: 'full'  → full viewport width (default)
       cols: 6       → 6 columns within the grid
       cols: 12      → 12 columns within the grid (container width)
  ── */
  const images = document.createElement('section');
  images.id = 'images';

  if (PROJECT.images && PROJECT.images.length) {
    // Group consecutive grid images so they share a .grid row
    const groups = [];
    let gridGroup = null;
    PROJECT.images.forEach(img => {
      const isFull = !img.cols || img.cols === 'full';
      if (isFull) {
        if (gridGroup) { groups.push(gridGroup); gridGroup = null; }
        groups.push({ type: 'full', img });
      } else {
        if (!gridGroup) { gridGroup = { type: 'grid', imgs: [] }; }
        gridGroup.imgs.push(img);
      }
    });
    if (gridGroup) groups.push(gridGroup);

    images.innerHTML = groups.map(g => {
      if (g.type === 'full') {
        return `<img class="project-image project-image--full" src="${g.img.src}" alt="${g.img.alt || ''}">`;
      } else {
        return `<div class="container"><div class="grid project-images">` +
          g.imgs.map(img =>
            `<img class="col-${img.cols} project-image" src="${img.src}" alt="${img.alt || ''}">`
          ).join('') +
          `</div></div>`;
      }
    }).join('');
  }
  document.body.appendChild(images);

  /* ── Shared scripts ── */
  ['../shared/footer.js', '../shared/grid.js', '../shared/cursor.js'].forEach(src => {
    const s = document.createElement('script');
    s.src = src;
    document.body.appendChild(s);
  });

})();
