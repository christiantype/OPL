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
    ? PROJECT.images.find(i => i.src && (!i.type || i.type === 'image'))
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

      // A tilted, scroll-animated spread (matches the cover overlay's spread size).
      if (item.tilt) {
        if (gridGroup) { groups.push(gridGroup); gridGroup = null; }
        groups.push({ type: 'tilt', item });
        return;
      }

      // A short text caption introducing the media that follows.
      if (item.heading) {
        if (gridGroup) { groups.push(gridGroup); gridGroup = null; }
        groups.push({ type: 'heading', item });
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
          return `<div class="video-spot video-spot--center" style="grid-column: ${start} / span ${item.cols};">${inner}</div>`;
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
      const hasAnnot = Array.isArray(item.annotations) && item.annotations.length > 0;

      // When wrapped in a figure OR the annotations layer, the wrapper owns
      // the col-N class so the inner <img> stretches to 100% inside it.
      const mediaClass = item.caption || hasAnnot
        ? `project-image${isFull ? ' ' + fullVariant : ''}${framed}`
        : (isFull ? `project-image ${fullVariant}${framed}` : `col-${item.cols} project-image${framed}`);

      const styleAttr = item.radius ? ` style="border-radius:${item.radius}"` : '';

      let media;
      if (item.mockup) {
        // Inline HTML mockup that replaces a static screenshot. The file is
        // fetched at runtime (see initMockups below) and injected here.
        const escSrc = String(item.mockup).replace(/"/g, '&quot;');
        const escAlt = (item.alt || '').replace(/"/g, '&quot;');
        media = `<div class="${mediaClass} project-mockup" data-mockup-src="${escSrc}" role="img" aria-label="${escAlt}"></div>`;
      } else if (mediaType === 'video') {
        media = `<video class="${mediaClass}" autoplay muted loop playsinline preload="auto"${styleAttr}><source src="${item.src}" type="video/mp4"></video>`;
      } else {
        media = `<img class="${mediaClass}" src="${item.src}" alt="${item.alt || ''}"${styleAttr}>`;
      }

      // Annotations: numbered hotspots overlaid on the image. Desktop floats
      // a card next to the marker; mobile shows a numbered list under the
      // image so the story still reads in scroll.
      if (hasAnnot) {
        const list = item.annotations;
        const markers = list.map((a, i) => {
          const x = (+a.x * 100).toFixed(2);
          const y = (+a.y * 100).toFixed(2);
          const side = (+a.x > 0.55) ? 'left' : 'right';
          const vert = (+a.y > 0.70) ? 'above' : 'below';
          const n = i + 1;
          const t = a.title ? `<h4 class="annot-card__title">${a.title}</h4>` : '';
          const b = a.body  ? `<div class="annot-card__body">${a.body}</div>` : '';
          const aria = (a.title || '').replace(/"/g, '&quot;');
          return `<div class="annot-anchor" style="left:${x}%;top:${y}%" data-side="${side}" data-vertical="${vert}">`
              +    `<button type="button" class="annot-marker" aria-expanded="false" aria-label="Annotation ${n}: ${aria}">`
              +      `<span class="annot-marker__num">${n}</span>`
              +    `</button>`
              +    `<aside class="annot-card" role="region">`
              +      `<span class="annot-card__num">${String(n).padStart(2,'0')}</span>${t}${b}`
              +    `</aside>`
              +  `</div>`;
        }).join('');
        const listItems = list.map((a, i) => {
          const n = i + 1;
          const t = a.title ? `<h4 class="annot-list__title">${a.title}</h4>` : '';
          const b = a.body  ? `<div class="annot-list__body">${a.body}</div>` : '';
          return `<li class="annot-list__item">`
              +    `<span class="annot-list__num">${String(n).padStart(2,'0')}</span>`
              +    `<div class="annot-list__copy">${t}${b}</div>`
              +  `</li>`;
        }).join('');
        // Inner col-N goes on the OUTER wrapper. If a window frame is on,
        // the window owns the grid placement; otherwise annot-wrap does.
        const outerHasGrid = item.caption || item.windowTitle;
        const wrapCols = outerHasGrid ? '' : (isFull ? ' annot-wrap--full' : ` col-${item.cols}`);
        const safeSrc  = (item.src || '').replace(/"/g, '&quot;');
        const annotated = `<div class="annot-wrap${wrapCols}" data-img="${safeSrc}">`
                       +    `<div class="annot-stage">${media}${markers}</div>`
                       +    `<ol class="annot-list">${listItems}</ol>`
                       +  `</div>`;
        if (item.windowTitle) return wrapInWindow(annotated, item, isFull);
        if (item.caption) {
          const figClass = isFull ? 'project-figure project-figure--full' : `col-${item.cols} project-figure`;
          return `<figure class="${figClass}">${annotated}<figcaption class="project-caption">${item.caption}</figcaption></figure>`;
        }
        return annotated;
      }

      if (item.windowTitle) return wrapInWindow(media, item, isFull);
      if (item.caption) {
        const figClass = isFull ? 'project-figure project-figure--full' : `col-${item.cols} project-figure`;
        return `<figure class="${figClass}">${media}<figcaption class="project-caption">${item.caption}</figcaption></figure>`;
      }

      return media;
    };

    function wrapInWindow(inner, item, isFull) {
      const winCols = isFull ? 'proj-window proj-window--full' : `col-${item.cols} proj-window`;
      const status = item.windowStatus || 'Proof of Concept';
      const title = item.windowTitle;
      return `<div class="${winCols}">`
           +   `<header class="proj-window__bar">`
           +     `<span class="proj-window__mark" aria-hidden="true">/</span>`
           +     `<span class="proj-window__title">${title}</span>`
           +     `<span class="proj-window__status">${status}</span>`
           +   `</header>`
           +   `<div class="proj-window__body">${inner}</div>`
           + `</div>`;
    }

    let tiltN = 0;
    images.innerHTML = groups.map(g => {
      if (g.type === 'stack') {
        const s = g.item.stack;
        const spread = s.overlay ? ' postcard-stack--overlay'
                     : s.spread  ? ' postcard-stack--spread' : '';
        // Optional fold line: front card becomes a wrapper holding image + crease.
        const front = s.crease
          ? `<div class="postcard-stack__card postcard-stack__card--front">`
              + `<img class="postcard-stack__face" src="${s.front}" alt="${s.alt || ''}">`
              + `<span class="postcard-stack__crease" aria-hidden="true"></span>`
            + `</div>`
          : `<img class="postcard-stack__card postcard-stack__card--front" src="${s.front}" alt="${s.alt || ''}">`;
        return `
          <div class="container">
            <div class="postcard-stack${spread}" data-stack>
              <img class="postcard-stack__card postcard-stack__card--back" src="${s.back}" alt="">
              ${front}
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
      } else if (g.type === 'heading') {
        return `
          <div class="container">
            <p class="spread-heading">${g.item.heading}</p>
          </div>
        `;
      } else if (g.type === 'tilt') {
        const t = g.item;
        const deg = (tiltN++ % 2 === 0) ? '-2.5deg' : '2.8deg';   // alternate the lean
        return `
          <div class="container">
            <div class="spread-tilt" style="--tilt:${deg}">
              <img class="spread-tilt__face" src="${t.src}" alt="${t.alt || ''}">
              <span class="spread-tilt__crease" aria-hidden="true"></span>
            </div>
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

  /* ── Tilted spreads: a gentle scroll-linked vertical drift (--shift) ── */
  (function initTiltSpreads() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    document.querySelectorAll('.spread-tilt').forEach(el => {
      let ticking = false, active = false;
      function update() {
        const r  = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const p  = (vh - r.top) / (vh + r.height);          // ~0 entering, ~1 leaving
        const s  = Math.max(-1, Math.min(1, (p - 0.5) * 2)); // -1 … 1
        el.style.setProperty('--dx', (s * 18).toFixed(1) + 'px');
        el.style.setProperty('--dy', (s * 32).toFixed(1) + 'px');
        ticking = false;
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
      new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting && !active) {
          active = true; window.addEventListener('scroll', onScroll, { passive: true }); update();
        } else if (!e.isIntersecting && active) {
          active = false; window.removeEventListener('scroll', onScroll);
        }
      }), { threshold: 0 }).observe(el);
    });
  })();

  /* ── Inline mockups: fetch HTML for each `mockup:` image entry and inject
       it into the placeholder div rendered by renderMedia(). The mockup is
       a self-contained chunk of HTML (+ scoped <style> + optional <script>)
       living under /projects/<mock-dir>/ — fetched relative to this page. ── */
  (function initMockups() {
    document.querySelectorAll('.project-mockup[data-mockup-src]').forEach(async el => {
      const src = el.getAttribute('data-mockup-src');
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        el.innerHTML = html;
        el.removeAttribute('data-mockup-src');
        // Run any <script> tags inside the loaded mockup (innerHTML doesn't
        // execute them on its own). Inline only — no external src.
        el.querySelectorAll('script').forEach(orig => {
          const s = document.createElement('script');
          if (orig.textContent) s.textContent = orig.textContent;
          orig.replaceWith(s);
        });
        // After the mockup is in the DOM, rehoist any annotation anchors
        // that were placed beside it (on .annot-stage) INTO the mockup's
        // scroll container. Y% maps onto the full scrollHeight so each
        // marker sticks to the UI element it labels even when the mockup
        // scrolls internally.
        rehoistAnnotationsInto(el);
      } catch (e) {
        el.innerHTML = '<div class="project-mockup__err">Mockup failed to load: ' + src + '</div>';
        console.warn('Mockup load failed:', src, e);
      }
    });
  })();

  // Move .annot-anchor elements from the .annot-stage into the mockup's
  // .m1759 scroll container, converting top% (which was relative to the
  // visible stage) to absolute pixels of the mockup's full scrollHeight.
  function rehoistAnnotationsInto(mockupEl) {
    const stage = mockupEl.closest('.annot-stage');
    if (!stage) return;
    const m = mockupEl.querySelector('.m1759');
    if (!m) return;
    // Wait two frames so the mockup's own layout (custom @font-face,
    // sticky chat, etc.) settles and scrollHeight is final.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const fullH = m.scrollHeight;
      stage.querySelectorAll(':scope > .annot-anchor').forEach(a => {
        const yPct = parseFloat(a.style.top || '0');
        const px   = (yPct / 100) * fullH;
        a.style.top = px.toFixed(1) + 'px';
        // left stays as % — horizontal mapping is consistent.
        m.appendChild(a);
      });
    }));
  }

  /* ── Annotations: numbered hotspots with click-to-reveal cards ── */
  (function initAnnotations() {
    const wraps = document.querySelectorAll('.annot-wrap');
    if (!wraps.length) return;
    const anchors = document.querySelectorAll('.annot-anchor');

    function closeAll(except) {
      anchors.forEach(a => {
        if (a === except || !a.classList.contains('is-open')) return;
        a.classList.remove('is-open');
        const m = a.querySelector('.annot-marker');
        if (m) m.setAttribute('aria-expanded', 'false');
      });
    }

    document.querySelectorAll('.annot-marker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const anchor = btn.closest('.annot-anchor');
        if (!anchor) return;
        const open = anchor.classList.contains('is-open');
        closeAll(open ? null : anchor);
        anchor.classList.toggle('is-open', !open);
        btn.setAttribute('aria-expanded', String(!open));
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.annot-anchor')) closeAll(null);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll(null);
    });
  })();

  /* ── Author mode (?annotate): click an image to place a numbered marker
       and emit a JSON snippet you paste into the PROJECT.images[i].annotations
       array. Keyboard: U undo, C copy. ── */
  (function initAnnotateAuthor() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('annotate')) return;
    document.body.classList.add('annotate-mode');

    const panel = document.createElement('aside');
    panel.id = 'annot-author';
    panel.innerHTML =
      '<header>' +
        '<strong>Annotate</strong>' +
        '<span class="annot-author__hint">Click image · U undo · C copy</span>' +
        '<button type="button" data-action="copy">Copy</button>' +
        '<button type="button" data-action="clear">Clear</button>' +
        '<button type="button" data-action="close">×</button>' +
      '</header>' +
      '<div class="annot-author__body"></div>';
    document.body.appendChild(panel);

    const groups = new Map(); // src → [{x,y}]

    function snippet() {
      let out = '';
      for (const [src, pts] of groups.entries()) {
        const lines = pts.map(p => '  { x: ' + p.x.toFixed(3) + ', y: ' + p.y.toFixed(3) + ', title: "", body: "" }').join(',\n');
        out += '// ' + src + '\nannotations: [\n' + lines + '\n],\n\n';
      }
      return out.trim();
    }
    function refresh() {
      const body = panel.querySelector('.annot-author__body');
      let html = '';
      for (const [src, pts] of groups.entries()) {
        const lines = pts.map(p => '  { x: ' + p.x.toFixed(3) + ', y: ' + p.y.toFixed(3) + ', title: "", body: "" }').join(',\n');
        html += '<div class="annot-author__group"><div class="annot-author__src">' + src + '</div>' +
                '<pre>annotations: [\n' + lines + '\n]</pre></div>';
      }
      body.innerHTML = html || '<div class="annot-author__empty">No markers yet — click an image.</div>';
    }

    document.body.addEventListener('click', (e) => {
      if (e.target.closest('#annot-author')) return;     // panel clicks pass through
      const media = e.target.closest('img.project-image, video.project-image');
      if (!media) return;
      e.preventDefault();
      e.stopPropagation();
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top)  / r.height;
      if (x < 0 || y < 0 || x > 1 || y > 1) return;
      const src = media.getAttribute('src');
      if (!groups.has(src)) groups.set(src, []);
      groups.get(src).push({ x, y });
      let layer = media.parentElement.querySelector('.annot-author__dots');
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'annot-author__dots';
        media.parentElement.style.position = 'relative';
        media.parentElement.appendChild(layer);
      }
      const n = groups.get(src).length;
      const dot = document.createElement('span');
      dot.className = 'annot-author__dot';
      dot.style.left = (x * 100) + '%';
      dot.style.top  = (y * 100) + '%';
      dot.textContent = n;
      layer.appendChild(dot);
      refresh();
    }, true);

    panel.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      e.stopPropagation();
      if (a.dataset.action === 'copy') {
        navigator.clipboard.writeText(snippet()).then(() => {
          a.textContent = 'Copied'; setTimeout(() => { a.textContent = 'Copy'; }, 1200);
        });
      } else if (a.dataset.action === 'clear') {
        groups.clear();
        document.querySelectorAll('.annot-author__dots').forEach(el => el.remove());
        refresh();
      } else if (a.dataset.action === 'close') {
        panel.remove();
        document.body.classList.remove('annotate-mode');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'u' || e.key === 'U') {
        let lastSrc = null;
        for (const [src, pts] of groups.entries()) if (pts.length) lastSrc = src;
        if (lastSrc) {
          groups.get(lastSrc).pop();
          if (groups.get(lastSrc).length === 0) groups.delete(lastSrc);
          const dots = document.querySelectorAll('.annot-author__dots .annot-author__dot');
          if (dots.length) dots[dots.length - 1].remove();
          refresh();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        navigator.clipboard.writeText(snippet());
      }
    });

    refresh();
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