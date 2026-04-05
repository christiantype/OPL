/* ── OPL Shared Nav ── */
(function () {
  const inProject = window.location.pathname.includes('/projects/');
  const base = inProject ? '../' : '';

  const menuSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112.7 72" width="25" height="25" fill="currentColor"><path d="M45.8,72h22c16.1,0,28.4-13.1,28.4-28.8v-14.4c0-15.7-12.3-28.8-28.4-28.8h-22c-16.1,0-29.3,13.1-29.3,28.8v14.4c0,15.7,13.1,28.8,29.2,28.8h0Z"/></svg>`;

  const logoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="154.5 212.9 1274.6 186.2" fill="currentColor" class="nav-wordmark"><path d="M1356.2,353.2h72.1v-13h-59.1v-100.6h-13v113.5ZM1077.3,313.7l13.5-61.1h10.6l13.3,61.1h-37.5ZM1055.3,353.2h13.3l5.8-26.5h43.3l5.8,26.5h13.3l-25.2-113.5h-30.6l-25.6,113.5ZM723.6,398.3h37.2l111.9-184.5h-37.2l-111.9,184.5ZM478.1,296.2v-43.6h28.1c5.9,0,8.3.9,13,4.7,5.2,4.3,5.9,6.1,5.9,10.6v13c0,4.5-.7,6.3-5.9,10.6-4.7,3.8-7,4.7-13,4.7h-28.1ZM465.1,353.2h13v-44h28.1c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-14.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-41.1v113.5ZM199.1,340.2h-11.9c-5.9,0-8.3-.9-13-4.7-5.2-4.3-5.9-6.1-5.9-10.6v-57c0-4.5.7-6.3,5.9-10.6,4.7-3.8,7-4.7,13-4.7h11.9c5.9,0,8.5.9,13.2,4.7,5,4.1,5.8,6.1,5.8,10.6v57c0,4.5-.7,6.5-5.8,10.6-4.7,3.8-7.2,4.7-13.2,4.7M187.2,353.2h11.9c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-58.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-11.9c-9.4,0-14.2,2-22.5,9-8.3,7-9.4,10.3-9.4,18.6v58.4c0,8.3,1.1,11.5,9.4,18.6,8.3,7,13.2,9,22.5,9"/></svg>`;

  const nav = document.createElement('nav');
  nav.innerHTML = `
    <div class="container">
      <div class="grid" style="align-items:center;">
        <a href="${base}index.html" class="col-2">
          ${logoSVG}
        </a>
        <div class="col-10" style="display:flex;justify-content:flex-end;">
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

  /* ── Page transitions ── */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || a.target === '_blank') return;
    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { window.location.href = href; }, 260);
  });
})();
