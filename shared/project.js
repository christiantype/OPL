/* ── OPL Shared Project Template ── */
/* Edit structure here to update all project pages */

(function () {

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
        <h2 class="col-6">${PROJECT.description}</h2>
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
        <div class="col-2">
          <span class="label">Client</span>
          <p>${PROJECT.client || '—'}</p>
        </div>
        <div class="col-2">
          <span class="label">Medium</span>
          <p>${PROJECT.medium || '—'}</p>
        </div>
        <div class="col-2">
          <span class="label">Year</span>
          <p>${PROJECT.year || '—'}</p>
        </div>
        <div class="col-2">
          <span class="label">Credits</span>
          <p>${PROJECT.credits || '—'}</p>
        </div>
        <div class="col-2">
          <span class="label">Role</span>
          <p>${PROJECT.role || '—'}</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(credits);

  /* ── Images ── */
  const images = document.createElement('section');
  images.id = 'images';

  if (PROJECT.images && PROJECT.images.length) {
    images.innerHTML = `<div class="container"><div class="grid project-images">` +
      PROJECT.images.map(img =>
        `<img class="col-${img.cols || 12} project-image" src="${img.src}" alt="${img.alt || ''}">`
      ).join('') +
      `</div></div>`;
  } else {
    images.innerHTML = `
      <div class="project-image img-placeholder ratio-16-9"></div>
      <div class="img-placeholder-row">
        <div class="img-placeholder ratio-4-3"></div>
        <div class="img-placeholder ratio-4-3"></div>
      </div>
    `;
  }
  document.body.appendChild(images);

  /* ── Footer stripe ── */
  const stripe = document.createElement('div');
  stripe.id = 'footer-stripe';
  stripe.innerHTML = `<div class="s-dark"></div><div class="s-accent"></div>`;
  document.body.appendChild(stripe);

  /* ── Next project ── */
  const next = document.createElement('a');
  next.id = 'next';
  next.href = PROJECT.next.url;
  next.innerHTML = `
    <div>
      <span class="label">Next Project</span>
      <div class="next-title">${PROJECT.next.title}</div>
    </div>
    <div>→</div>
  `;
  document.body.appendChild(next);

  /* ── Shared scripts ── */
  ['../shared/footer.js', '../shared/grid.js', '../shared/cursor.js'].forEach(src => {
    const s = document.createElement('script');
    s.src = src;
    document.body.appendChild(s);
  });

})();
