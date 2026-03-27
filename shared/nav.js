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
          <div>Original<br>Practice<br>Lab<span class="nav-cursor"></span></div>
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
