/* ── OPL Shared Nav — edit NAV_LOGO_HEIGHT to resize the logo ── */
const NAV_LOGO_HEIGHT = '100px';

(function () {
  const inProject = window.location.pathname.includes('/projects/');
  const base = inProject ? '../' : '';

  const nav = document.createElement('nav');
  nav.innerHTML = `
    <div class="container">
      <div class="grid" style="align-items:center;">
        <a href="${base}index.html" class="col-6">
          <div class="nav-wordmark">Original<br>Practice<br>Lab<span class="nav-cursor"></span></div>
        </a>
        <div class="col-6 nav-links">
          <a href="${base}about.html" class="nav-link">About</a>
          <a href="${base}guestbook.html" class="nav-link">Guestbook</a>
          ${inProject ? `<a href="${base}index.html" class="nav-link">All Projects</a>` : ''}
        </div>
      </div>
    </div>
  `;
  document.body.prepend(nav);

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
