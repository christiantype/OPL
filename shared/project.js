/* ── OPL Shared Project Template ── */
/* Edit structure here to update all project pages */

(function () {

  document.body.classList.add('project');

  /* ── SEO Meta Tags ── */
  const base     = 'https://more-than.design';
  const pagePath = window.location.pathname.replace(/^\/OPL/, '');
  const canonical = base + pagePath;
  const firstImg  = PROJECT.images && PROJECT.images.length
    ? PROJECT.images.find(i => !i.type || i.type === 'image')
    : null;
  const ogImage = firstImg
    ? base + '/images/' + firstImg.src.replace(/^.*\/images\//, '')
    : base + '/images/Faculty-01.webp';

  document.title = `${PROJECT.title} — O.P/A.L`;

  [
    { name: 'description',       content: PROJECT.description },
    { property: 'og:type',       content: 'website' },
    { property: 'og:site_name',  content: 'O.P/A.L' },
    { property: 'og:title',      content: `${PROJECT.title} — O.P/A.L` },
    { property: 'og:description', content: PROJECT.description },
    { property: 'og:image',      content: ogImage },
    { property: 'og:url',        content: canonical },
    { name: 'twitter:card',      content: 'summary_large_image' },
    { name: 'twitter:title',     content: `${PROJECT.title} — O.P/A.L` },
    { name: 'twitter:description', content: PROJECT.description },
    { name: 'twitter:image',     content: ogImage },
  ].forEach(attrs => {
    const m = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => m.setAttribute(k, v));
    document.head.appendChild(m);
  });

  const canonicalLink = document.createElement('link');
  canonicalLink.rel  = 'canonical';
  canonicalLink.href = canonical;
  document.head.appendChild(canonicalLink);

  const jsonLd = document.createElement('script');
  jsonLd.type = 'application/ld+json';
  jsonLd.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: PROJECT.title,
    description: PROJECT.description,
    image: ogImage,
    url: canonical,
    author: { '@type': 'Person', name: 'Christian Solorzano' },
    ...(PROJECT.client ? { client: PROJECT.client } : {}),
    ...(PROJECT.year   ? { dateCreated: PROJECT.year } : {}),
  });
  document.head.appendChild(jsonLd);

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
      ${PROJECT.body ? `<div class="grid"><p class="col-9">${PROJECT.body}</p></div>` : ''}
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
          <span class="label">Acknowledgements</span>
          ${Array.isArray(PROJECT.credits)
            ? PROJECT.credits.map(c => `<p>${c.name}<br><span class="text-mid">${c.title}</span></p>`).join('')
            : `<p>${PROJECT.credits || '—'}</p>`}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(credits);

  /* ── Media (Images + Videos) ── */
  const images = document.createElement('section');
  images.id = 'images';

  if (PROJECT.images && PROJECT.images.length) {

    const groups = [];
    let gridGroup = null;

    PROJECT.images.forEach(item => {
      const isFull = !item.cols || item.cols === 'full';

      if (isFull) {
        if (gridGroup) {
          groups.push(gridGroup);
          gridGroup = null;
        }
        groups.push({ type: 'full', item });
      } else {
        if (!gridGroup) gridGroup = { type: 'grid', items: [] };
        gridGroup.items.push(item);
      }
    });

    if (gridGroup) groups.push(gridGroup);

    const renderMedia = (item) => {
      const mediaType = item.type || 'image';
      const isFull = !item.cols || item.cols === 'full';
      const framed = item.frame || PROJECT.imageFrame ? ' project-image--framed' : '';

      // When wrapped in a figure, the figure owns the col class
      const mediaClass = item.caption
        ? (isFull ? `project-image project-image--full${framed}` : `project-image${framed}`)
        : (isFull ? `project-image project-image--full${framed}` : `col-${item.cols} project-image${framed}`);

      let media;
      if (mediaType === 'video') {
        media = `<video class="${mediaClass}" autoplay muted loop playsinline preload="auto"><source src="${item.src}" type="video/mp4"></video>`;
      } else {
        media = `<img class="${mediaClass}" src="${item.src}" alt="${item.alt || ''}">`;
      }

      if (item.caption) {
        const figClass = isFull ? 'project-figure project-figure--full' : `col-${item.cols} project-figure`;
        return `<figure class="${figClass}">${media}<figcaption class="project-caption">${item.caption}</figcaption></figure>`;
      }

      return media;
    };

    images.innerHTML = groups.map(g => {
      if (g.type === 'full') {
        return renderMedia(g.item);
      } else {
        return `
          <div class="container">
            <div class="grid project-images">
              ${g.items.map(item => renderMedia(item)).join('')}
            </div>
          </div>
        `;
      }
    }).join('');
  }

  document.body.appendChild(images);

  /* ── Shared scripts ── */
  [
    '../shared/footer.js',
    '../shared/grid.js',
    '../shared/cursor.js',
    '../shared/animate.js'
  ].forEach(src => {
    const s = document.createElement('script');
    s.src = src;
    document.body.appendChild(s);
  });

})();