/* ── OPL Shared Nav — edit NAV_LOGO_HEIGHT to resize the logo ── */
const NAV_LOGO_HEIGHT = '100px';

(function () {
  const inProject = window.location.pathname.includes('/projects/');
  const base = inProject ? '../' : '';

  // Eye/menu icon SVG
  const menuSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1050" width="24" height="24" fill="currentColor"><path d="M345.01,182.95c0,53.12,107.54,32.39,107.54,111.42,0,46.64-36.28,76.44-79.03,76.44-47.94,0-89.4-34.98-89.4-102.35,0-103.65,98.47-203.42,255.24-203.42,147.7,0,256.54,85.51,256.54,217.67,0,229.33-327.8,217.67-327.8,344.64,0,41.46,29.8,66.07,76.44,66.07,36.28,0,80.33-14.25,120.49-46.64l5.18,9.07c-37.57,32.39-84.22,53.12-137.34,53.12-73.85,0-146.41-41.46-146.41-129.57,0-185.28,331.68-147.7,331.68-351.12,0-95.88-75.15-150.29-185.28-150.29s-187.87,59.6-187.87,104.95ZM523.8,815.22c47.94,0,85.51,37.57,85.51,85.51s-37.57,84.22-85.51,84.22-84.22-37.57-84.22-84.22,37.57-85.51,84.22-85.51Z"/></svg>`;

  const nav = document.createElement('nav');
  nav.innerHTML = `
    <div class="container">
      <div class="grid" style="align-items:center;">
        <a href="${base}index.html" class="col-6">
          <div class="nav-wordmark">Original<br>Practice<br>Lab<span class="nav-cursor"></span></div>
        </a>
        <div class="col-6 nav-links" id="nav-links">
          <a href="${base}about.html" class="nav-link">About</a>
          <a href="${base}guestbook.html" class="nav-link">Guestbook</a>
          ${inProject ? `<a href="${base}index.html" class="nav-link">All Projects</a>` : ''}
        </div>
      </div>
    </div>
    <button class="nav-menu-btn" id="nav-menu-btn" aria-label="Toggle menu">${menuSVG}</button>
  `;
  document.body.prepend(nav);

  /* ── Mobile menu toggle ── */
  const menuBtn  = nav.querySelector('#nav-menu-btn');
  const navLinks = nav.querySelector('#nav-links');

  menuBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('nav-links--open');
    menuBtn.classList.toggle('nav-menu-btn--open', isOpen);
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('nav-links--open');
      menuBtn.classList.remove('nav-menu-btn--open');
    });
  });

  /* ── Letter alternation ── */
  const wordmark = nav.querySelector('.nav-wordmark');
  const text     = 'Original\nPractice\nLab';
  const colors   = ['var(--color-accent)', 'var(--color-accent2)', 'var(--color-blue)', 'var(--color-red)', 'var(--color-lime)'];

  // Wrap each letter in a span, preserve line breaks
  const cursor = wordmark.querySelector('.nav-cursor');
  wordmark.innerHTML = '';
  text.split('').forEach(ch => {
    if (ch === '\n') {
      wordmark.appendChild(document.createElement('br'));
    } else {
      const s = document.createElement('span');
      s.textContent = ch;
      s.dataset.base = 'true';
      wordmark.appendChild(s);
    }
  });
  wordmark.appendChild(cursor);

  const letters = [...wordmark.querySelectorAll('span[data-base]')];

  function flicker() {
    // Pick 3–6 random letters, flash colors then reset
    const count = 3 + Math.floor(Math.random() * 4);
    const picks = [...letters].sort(() => Math.random() - 0.5).slice(0, count);

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
})();
