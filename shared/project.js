/* ── OPL Shared Project Template ── */
/* Edit structure here to update all project pages */

(function () {

  document.body.classList.add('project');

  // Speaker icon for the audio toggle — filled cone, waves (shown when on),
  // slash (shown when muted by default).
  const SPEAKER_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 9v6h3.5L13 19V5L7.5 9H4z" fill="currentColor" stroke="none"/>' +
    '<path class="spk-wave" d="M16.5 9.2a4 4 0 0 1 0 5.6"/>' +
    '<path class="spk-wave" d="M19 6.7a7.5 7.5 0 0 1 0 10.6"/>' +
    '<line class="spk-slash" x1="3.5" y1="3.5" x2="20.5" y2="20.5"/>' +
    '</svg>';

  /* ── SEO Meta Tags ── */
  const base     = 'https://more-than.design';
  const pagePath = window.location.pathname.replace(/^\/OPL/, '');
  const canonical = base + pagePath;
  const firstImg  = PROJECT.images && PROJECT.images.length
    ? PROJECT.images.find(i => !i.type || i.type === 'image')
    : null;
  const ogImage = firstImg
    ? base + '/images/' + firstImg.src.replace(/^.*\/images\//, '')
    : base + '/images/opal-open-graph.webp';

  document.title = `${PROJECT.title} — OP/AL`;

  [
    { name: 'description',       content: PROJECT.description },
    { property: 'og:type',       content: 'website' },
    { property: 'og:site_name',  content: 'OP/AL' },
    { property: 'og:title',      content: `${PROJECT.title} — OP/AL` },
    { property: 'og:description', content: PROJECT.description },
    { property: 'og:image',      content: ogImage },
    { property: 'og:url',        content: canonical },
    { name: 'twitter:card',      content: 'summary_large_image' },
    { name: 'twitter:title',     content: `${PROJECT.title} — OP/AL` },
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
    // Project default can be overridden per image (e.g. a cover is not a spread).
    const isSpread = (item) =>
      item.spread !== undefined ? item.spread : !!PROJECT.imageSpread;

    PROJECT.images.forEach(item => {
      // Two overlaid cards (e.g. a postcard front/back) that shift on scroll.
      if (item.stack) {
        if (gridGroup) { groups.push(gridGroup); gridGroup = null; }
        groups.push({ type: 'stack', item });
        return;
      }

      // A single spread/card laid flat on the surface (angled, soft shadow).
      if (item.flat) {
        if (gridGroup) { groups.push(gridGroup); gridGroup = null; }
        groups.push({ type: 'flat', item });
        return;
      }

      // A video flagged as a player: full-width black stage, video centred.
      if (item.player) {
        if (gridGroup) { groups.push(gridGroup); gridGroup = null; }
        groups.push({ type: 'player', item });
        return;
      }

      // A centred spotlight: its own contained grid row, offset to sit mid-page.
      if (item.spotlight && item.center) {
        if (gridGroup) { groups.push(gridGroup); gridGroup = null; }
        groups.push({ type: 'centered', item });
        return;
      }

      // Spreads are their own contained block (fold crease + drop shadow).
      if (isSpread(item)) {
        if (gridGroup) { groups.push(gridGroup); gridGroup = null; }
        groups.push({ type: 'spread', item });
        return;
      }

      const isFull = !item.cols || item.cols === 'full';

      if (isFull) {
        if (gridGroup) {
          groups.push(gridGroup);
          gridGroup = null;
        }
        groups.push({ type: 'full', item });
      } else {
        // Spotlight items grid together in their own block, separate from plain
        // images, so the two never share auto-placement (which would leave gaps
        // where a 6-col video meets 4-col stills).
        const kind = item.spotlight ? 'spotgrid' : 'grid';
        if (gridGroup && gridGroup.type !== kind) { groups.push(gridGroup); gridGroup = null; }
        if (!gridGroup) gridGroup = { type: kind, items: [] };
        gridGroup.items.push(item);
      }
    });

    if (gridGroup) groups.push(gridGroup);

    const renderMedia = (item) => {
      const mediaType = item.type || 'image';
      const isFull = !item.cols || item.cols === 'full';
      const framed = item.frame || PROJECT.imageFrame ? ' project-image--framed' : '';

      // Spotlight: a rounded video/image floated on the black page with a soft
      // glow hugging it. The glow lives inside the wrapper's own padding, so it
      // never clips against the page. Honours an optional poster + controls.
      if (item.spotlight) {
        let media;
        if (mediaType === 'video') {
          const poster = item.poster ? ` poster="${item.poster}"` : '';
          const controls = item.controls
            ? ' controls controlsList="nodownload nofullscreen noplaybackrate noremoteplayback" disablepictureinpicture'
            : '';
          media = `<video class="video-spot__media" autoplay muted loop playsinline${controls} preload="auto"${poster}><source src="${item.src}" type="video/mp4"></video>`;
        } else {
          media = `<img class="video-spot__media" src="${item.src}" alt="${item.alt || ''}">`;
        }
        // Audio-only toggle (a speaker) for muted autoplay videos that opt in.
        const inner = (item.sound && mediaType === 'video' && !item.controls)
          ? `<div class="video-spot__frame">${media}` +
              `<button class="video-spot__sound" type="button" aria-label="Toggle sound" aria-pressed="false">${SPEAKER_SVG}</button>` +
            `</div>`
          : media;
        // Centred: span `cols` but start mid-grid so it sits in the page centre.
        if (item.center && !isFull) {
          const start = Math.max(1, Math.round((12 - item.cols) / 2) + 1);
          return `<div class="video-spot" style="grid-column: ${start} / span ${item.cols};">${inner}</div>`;
        }
        const colClass = isFull ? 'video-spot video-spot--full' : `col-${item.cols} video-spot`;
        return `<div class="${colClass}">${inner}</div>`;
      }

      // Cameo: a clickable still that opens its preview clip in the overlay,
      // carrying its catalog caption (held inert until shown beneath the video).
      if (item.video && mediaType !== 'video') {
        const colClass = isFull ? 'cameo' : `col-${item.cols} cameo`;
        const cap = item.caption ? `<span class="cameo__caption" hidden>${item.caption}</span>` : '';
        return `<button class="${colClass}" type="button" data-cameo-video="${item.video}" aria-label="Play ${item.alt || 'preview'}">`
          + `<img class="cameo__img" src="${item.src}" alt="${item.alt || ''}">`
          + `<span class="cameo__play" aria-hidden="true">▶</span>`
          + cap
          + `</button>`;
      }

      // Full-width images can bleed to the viewport edge (natural height, no crop).
      const fullVariant = item.bleed ? 'project-image--bleed' : 'project-image--full';

      // When wrapped in a figure, the figure owns the col class
      const mediaClass = item.caption
        ? (isFull ? `project-image ${fullVariant}${framed}` : `project-image${framed}`)
        : (isFull ? `project-image ${fullVariant}${framed}` : `col-${item.cols} project-image${framed}`);

      const styleAttr = item.radius ? ` style="border-radius:${item.radius}"` : '';

      let media;
      if (mediaType === 'video') {
        media = `<video class="${mediaClass}" autoplay muted loop playsinline preload="auto"${styleAttr}><source src="${item.src}" type="video/mp4"></video>`;
      } else {
        media = `<img class="${mediaClass}" src="${item.src}" alt="${item.alt || ''}"${styleAttr}>`;
      }

      if (item.caption) {
        const figClass = isFull ? 'project-figure project-figure--full' : `col-${item.cols} project-figure`;
        return `<figure class="${figClass}">${media}<figcaption class="project-caption">${item.caption}</figcaption></figure>`;
      }

      return media;
    };

    images.innerHTML = groups.map(g => {
      if (g.type === 'stack') {
        const s = g.item.stack;
        const spread = s.spread ? ' postcard-stack--spread' : '';
        return `
          <div class="container">
            <div class="postcard-stack${spread}" data-stack>
              <img class="postcard-stack__card postcard-stack__card--back" src="${s.back}" alt="">
              <img class="postcard-stack__card postcard-stack__card--front" src="${s.front}" alt="${s.alt || ''}">
            </div>
          </div>
        `;
      } else if (g.type === 'flat') {
        const f = g.item.flat;
        return `
          <div class="container">
            <img class="spread-flat" src="${f.src}" alt="${f.alt || ''}">
          </div>
        `;
      } else if (g.type === 'player') {
        const it = g.item;
        const poster = it.poster ? ` poster="${it.poster}"` : '';
        return `
          <div class="project-video-player">
            <div class="project-video-player__frame">
              <video class="project-video-player__media"
                     autoplay muted loop playsinline
                     controls controlsList="nodownload nofullscreen noplaybackrate noremoteplayback"
                     disablepictureinpicture
                     preload="auto"${poster}>
                <source src="${it.src}" type="video/mp4">
              </video>
            </div>
          </div>
        `;
      } else if (g.type === 'spread') {
        const mediaType = g.item.type || 'image';
        const inner = mediaType === 'video'
          ? `<video class="project-spread__media" autoplay muted loop playsinline preload="auto"><source src="${g.item.src}" type="video/mp4"></video>`
          : `<img class="project-spread__media" src="${g.item.src}" alt="${g.item.alt || ''}">`;
        const caption = g.item.caption
          ? `<figcaption class="project-caption">${g.item.caption}</figcaption>` : '';
        return `
          <div class="container">
            <figure class="project-spread">${inner}</figure>
            ${caption}
          </div>
        `;
      } else if (g.type === 'centered') {
        return `
          <div class="container">
            <div class="grid">
              ${renderMedia(g.item)}
            </div>
          </div>
        `;
      } else if (g.type === 'full') {
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

  /* ── Cameo overlay: click a portrait to play its preview clip ── */
  (function initCameoOverlay() {
    if (!document.querySelector('[data-cameo-video]')) return;

    const overlay = document.createElement('div');
    overlay.className = 'cameo-overlay';
    const videoTag =
      '<video class="cameo-overlay__video" playsinline autoplay muted loop ' +
      'disablepictureinpicture controlsList="nodownload nofullscreen noplaybackrate noremoteplayback" ' +
      'preload="auto"></video>';
    overlay.innerHTML =
      '<button class="cameo-overlay__close" type="button" aria-label="Close">×</button>' +
      '<button class="cameo-overlay__sound" type="button" aria-pressed="false">Sound on</button>' +
      '<div class="cameo-overlay__stage">' +
        videoTag +
        '<div class="cameo-overlay__caption"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    const video    = overlay.querySelector('.cameo-overlay__video');
    const caption  = overlay.querySelector('.cameo-overlay__caption');
    const soundBtn = overlay.querySelector('.cameo-overlay__sound');
    let soundOn = false;

    function applySound() {
      video.muted = !soundOn;
      soundBtn.textContent = soundOn ? 'Mute' : 'Sound on';
      soundBtn.setAttribute('aria-pressed', String(soundOn));
    }

    function open(src, capHTML) {
      caption.innerHTML = capHTML || '';
      video.src = src;
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
      applySound();
    }
    function close() {
      overlay.classList.remove('is-open');
      video.pause();
      video.removeAttribute('src');
      video.load();
      document.body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-cameo-video]');
      if (trigger) {
        const capEl = trigger.querySelector('.cameo__caption');
        open(trigger.getAttribute('data-cameo-video'), capEl ? capEl.innerHTML : '');
        return;
      }
      if (!overlay.classList.contains('is-open')) return;
      // Toggle audio without dismissing.
      if (e.target.closest('.cameo-overlay__sound')) {
        soundOn = !soundOn;
        applySound();
        if (soundOn) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
        return;
      }
      // Click anywhere except the video/caption to dismiss.
      if (!e.target.closest('.cameo-overlay__video, .cameo-overlay__caption')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  })();

  /* ── Spotlight video audio: a speaker toggles sound (one clip at a time) ── */
  (function initVideoSound() {
    const buttons = document.querySelectorAll('.video-spot__sound');
    if (!buttons.length) return;
    buttons.forEach(btn => {
      const video = btn.closest('.video-spot__frame')?.querySelector('.video-spot__media');
      if (!video) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const turnOn = video.muted;
        if (turnOn) {
          // Solo: silence every other speaker-enabled clip first.
          buttons.forEach(b => {
            if (b === btn) return;
            const v = b.closest('.video-spot__frame')?.querySelector('.video-spot__media');
            if (v) v.muted = true;
            b.classList.remove('is-on');
            b.setAttribute('aria-pressed', 'false');
          });
          video.muted = false;
          video.volume = 1;
          const p = video.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          video.muted = true;
        }
        btn.classList.toggle('is-on', !video.muted);
        btn.setAttribute('aria-pressed', String(!video.muted));
      });
    });
  })();

  /* ── Postcard stacks: subtle scroll-linked shift of the two overlaid cards ── */
  (function initPostcardStacks() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    document.querySelectorAll('[data-stack]').forEach(stack => {
      const back  = stack.querySelector('.postcard-stack__card--back');
      const front = stack.querySelector('.postcard-stack__card--front');
      if (!back || !front) return;
      let ticking = false, active = false, hover = 0;
      function update() {
        const r  = stack.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const p  = (vh - r.top) / (vh + r.height);          // ~0 entering, ~1 leaving
        const s  = Math.max(-1, Math.min(1, (p - 0.5) * 2)); // -1 … 1
        // Hover nudges the cards a little further apart, on top of the scroll shift.
        back.style.transform  = `rotate(${(-6 - hover * 3).toFixed(1)}deg) translate(${(-s * 5 - hover * 4).toFixed(2)}%, ${(s * 3).toFixed(2)}%)`;
        front.style.transform = `rotate(${(5 + hover * 3).toFixed(1)}deg) translate(${(s * 6 + hover * 4).toFixed(2)}%, ${(-s * 3).toFixed(2)}%)`;
        ticking = false;
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
      stack.addEventListener('mouseenter', () => { hover = 1; update(); });
      stack.addEventListener('mouseleave', () => { hover = 0; update(); });
      new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting && !active) {
          active = true; window.addEventListener('scroll', onScroll, { passive: true }); update();
        } else if (!e.isIntersecting && active) {
          active = false; window.removeEventListener('scroll', onScroll);
        }
      }), { threshold: 0 }).observe(stack);
    });
  })();

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