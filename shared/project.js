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
      <div class="grid" style="margin-bottom: var(--space-8);">
        <div class="col-2 col-meta">
          <span class="label">Category</span>
          <p>${PROJECT.category}</p>
        </div>
        <div class="col-2 col-meta">
          <span class="label">Year</span>
          <p>${PROJECT.year}</p>
        </div>
        <div class="col-2 col-meta">
          <span class="label">Role</span>
          <p>${PROJECT.role}</p>
        </div>
      </div>
      <div class="grid">
        <h1 class="col-12">${PROJECT.title}</h1>
        <div class="hero-rule"></div>
      </div>
    </div>
  `;
  document.body.appendChild(hero);

  /* ── Body ── */
  const body = document.createElement('section');
  body.id = 'body';
  body.innerHTML = `
    <div class="container">
      <div class="grid" style="margin-bottom: var(--space-10);">
        <p class="lead col-7 col-lead">${PROJECT.lead}</p>
      </div>
      ${PROJECT.body ? `
      <div class="grid" style="margin-bottom: var(--space-16);">
        <p class="col-5 col-body-copy">${PROJECT.body}</p>
      </div>` : ''}
    </div>
  `;
  document.body.appendChild(body);

  /* ── Images ── */
  const images = document.createElement('section');
  images.id = 'images';

  if (PROJECT.images && PROJECT.images.length) {
    images.innerHTML = `
      <div class="container">
        <div class="grid">
          ${PROJECT.images.map(img => `<img src="${img.src}" alt="${img.alt || ''}" class="${img.class || 'col-12'}">`).join('')}
        </div>
      </div>
    `;
  } else {
    images.innerHTML = `
      <div class="container">
        <div class="grid">
          <div class="col-12 img-placeholder ratio-16-9"></div>
          <div class="col-6 col-img-half img-placeholder ratio-4-3"></div>
          <div class="col-6 col-img-half img-placeholder ratio-4-3"></div>
          <div class="col-4 col-img-third img-placeholder ratio-3-4"></div>
          <div class="col-4 col-img-third img-placeholder ratio-3-4"></div>
          <div class="col-4 col-img-third img-placeholder ratio-3-4"></div>
        </div>
      </div>
    `;
  }
  document.body.appendChild(images);

  /* ── Credits ── */
  const creditCols = ['col-credit-1', 'col-credit-2', 'col-credit-3'];
  const creditsHTML = PROJECT.credits.map((c, i) => `
    <div class="col-3 ${creditCols[i] || ''}">
      <span class="label">${c.label}</span>
      <p>${c.value}</p>
    </div>`).join('');

  const credits = document.createElement('section');
  credits.id = 'credits';
  credits.innerHTML = `
    <div class="container">
      <div class="grid">
        <div class="col-4 col-credit-info">
          <span class="label">Project</span>
          <p style="margin-top: var(--space-4);">${PROJECT.description || ''}</p>
        </div>
        ${creditsHTML}
      </div>
    </div>
  `;
  document.body.appendChild(credits);

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
