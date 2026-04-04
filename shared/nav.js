/* ── OPL Shared Nav — edit NAV_LOGO_HEIGHT to resize the logo ── */
const NAV_LOGO_HEIGHT = '100px';

(function () {
  const inProject = window.location.pathname.includes('/projects/');
  const base = inProject ? '../' : '';

  const menuSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112.7 424.58" width="36" height="72" fill="currentColor"><path d="M45.76,72h22.02c16.09,0,28.38-13.13,28.38-28.8v-14.4c0-15.67-12.28-28.8-28.38-28.8h-22.02c-16.09,0-29.22,13.13-29.22,28.8v14.4c0,15.67,13.13,28.8,29.22,28.8Z"/><polygon points="92.18 272.55 0 424.58 20.51 424.58 112.7 272.55 92.18 272.55"/></svg>`;

  const nav = document.createElement('nav');
  nav.innerHTML = `
    <div class="container">
      <div class="grid" style="align-items:center;">
        <a href="${base}index.html" class="col-6">
          <div class="nav-wordmark">O<br>P<br>/<br>A<br>L</div>
        </a>
        <div class="col-6" style="display:flex;justify-content:flex-end;">
          <div class="nav-menu-wrap">
            <button class="nav-menu-btn" id="nav-menu-btn" aria-label="Toggle menu">${menuSVG}</button>
            <div class="nav-links" id="nav-links">
              <a href="${base}about.html" class="nav-link">About</a>
              ${inProject ? `<a href="${base}index.html" class="nav-link">All Projects</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.prepend(nav);

  /* ── Mobile menu toggle ── */
  const menuBtn  = nav.querySelector('#nav-menu-btn');
  const navLinks = nav.querySelector('#nav-links');

  menuBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('nav-links--open');
    menuBtn.classList.toggle('nav-menu-btn--open', isOpen);
  });

  // Close menu when a link is clicked or clicking outside
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('nav-links--open');
      menuBtn.classList.remove('nav-menu-btn--open');
    });
  });

  document.addEventListener('click', e => {
    if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('nav-links--open');
      menuBtn.classList.remove('nav-menu-btn--open');
    }
  });

  /* ── Letter alternation ── */
  const wordmark = nav.querySelector('.nav-wordmark');
  const text     = 'O\nP\n/\nA\nL';
  const colors   = ['var(--color-accent)', 'var(--color-accent2)', 'var(--color-blue)', 'var(--color-red)', 'var(--color-lime)'];

  // Wrap each letter in a span, preserve line breaks
  // Mark the first letter of each line (O, P, A, L) with data-opal

  wordmark.innerHTML = '';
  let newLine = true;
  text.split('').forEach(ch => {
    if (ch === '\n') {
      wordmark.appendChild(document.createElement('br'));
      newLine = true;
    } else {
      const s = document.createElement('span');
      s.textContent = ch;
      s.dataset.base = 'true';
      if (newLine && ch !== '/') { s.dataset.opal = 'true'; newLine = false; }
      else { newLine = false; }
      wordmark.appendChild(s);
    }
  });

  // Only O, P, A, L flicker
  const opalLetters = [...wordmark.querySelectorAll('span[data-opal]')];

  function flicker() {
    // Pick 1–4 of the OPAL letters, flash a color then reset
    const count = 1 + Math.floor(Math.random() * opalLetters.length);
    const picks = [...opalLetters].sort(() => Math.random() - 0.5).slice(0, count);

    picks.forEach(s => {
      s.style.color = colors[Math.floor(Math.random() * colors.length)];
    });

    setTimeout(() => {
      picks.forEach(s => s.style.color = '');
    }, 150 + Math.random() * 250);

    // Schedule next flicker around every 2 seconds
    setTimeout(flicker, 1200 + Math.random() * 1600);
  }

  setTimeout(flicker, 1200);

  /* ── / weight cycle every 2 seconds ── */
  const slashWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  let slashIndex = 0;
  const slashSpan = [...wordmark.querySelectorAll('span[data-base]')].find(s => s.textContent === '/');
  if (slashSpan) {
    slashSpan.style.fontFamily = 'Sidepiece-HoneyNugget, sans-serif';
    slashSpan.style.fontSize = 'var(--h1)';
    setInterval(() => {
      slashIndex = (slashIndex + 1) % slashWeights.length;
      slashSpan.style.fontWeight = slashWeights[slashIndex];
    }, 2000);
  }

  /* ── Page transitions ── */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    // Skip external links, hash-only links, and new-tab links
    if (!href || href.startsWith('http') || href.startsWith('#') || a.target === '_blank') return;
    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { window.location.href = href; }, 260);
  });
})();
