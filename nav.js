/* ── OPL Shared Nav — edit NAV_LOGO_HEIGHT to resize the logo ── */
const NAV_LOGO_HEIGHT = '20px';

(function () {
  const inProject = window.location.pathname.includes('/projects/');
  const base = inProject ? '../' : '';

  const nav = document.createElement('nav');
  nav.innerHTML = `
    <div class="container">
      <div class="grid" style="align-items:center;">
        <a href="${base}index.html" class="col-6" style="display:flex;align-items:center;">
          <img src="${base}opal-menu.svg" alt="OPL" style="height:${NAV_LOGO_HEIGHT};width:auto;display:block;">
        </a>
        <div class="col-6 nav-links">
          <a href="${base}about.html" class="nav-link">About</a>
          ${inProject ? `<a href="${base}index.html" class="nav-link">← All Projects</a>` : ''}
        </div>
      </div>
    </div>
  `;
  document.body.prepend(nav);
})();
