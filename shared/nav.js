/* ── OPL Shared Nav — edit NAV_LOGO_HEIGHT to resize the logo ── */
const NAV_LOGO_HEIGHT = '100px';

(function () {
  const inProject = window.location.pathname.includes('/projects/');
  const base = inProject ? '../' : '';

  // Eye icon SVG
  const menuSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="28" height="28" fill="currentColor"><ellipse cx="500" cy="500" rx="161.97" ry="134.98"/><path d="M500,254.29c-225.72,0-408.7,110-408.7,245.71s182.98,245.71,408.7,245.71,408.7-110,408.7-245.71-182.99-245.71-408.7-245.71ZM843.09,572.07c-17.28,24.56-42.58,46.96-75.19,66.57-34.1,20.51-74.11,36.68-118.9,48.07-47.09,11.97-97.22,18.04-148.99,18.04s-101.9-6.07-148.99-18.04c-44.79-11.39-84.79-27.56-118.9-48.07-32.61-19.61-57.91-42.01-75.19-66.57-16.36-23.26-24.66-47.5-24.66-72.07s8.3-48.82,24.66-72.07c17.28-24.56,42.58-46.96,75.19-66.57,34.1-20.51,74.11-36.68,118.9-48.07,47.09-11.97,97.22-18.04,148.99-18.04s101.9,6.07,148.99,18.04c44.79,11.39,84.79,27.56,118.91,48.07,32.61,19.61,57.91,42.01,75.19,66.57,16.36,23.26,24.66,47.5,24.66,72.07s-8.3,48.82-24.66,72.07h0Z"/></svg>`;

  const nav = document.createElement('nav');
  nav.innerHTML = `
    <div class="container">
      <div class="grid" style="align-items:center;">
        <a href="${base}index.html" class="col-6">
          <div class="nav-wordmark">Original<br>Practice<br>Lab<span class="nav-cursor"></span></div>
        </a>
        <div class="col-6" style="display:flex;justify-content:flex-end;">
          <div class="nav-menu-wrap">
            <button class="nav-menu-btn" id="nav-menu-btn" aria-label="Toggle menu">${menuSVG}</button>
            <div class="nav-links" id="nav-links">
              <a href="${base}about.html" class="nav-link">About</a>
              <a href="${base}guestbook.html" class="nav-link">Guestbook</a>
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
