/* ── OPL Shared Footer ── */
/* Edit contact info, address, and social links here */

const FOOTER_COL1 = `Original Practice Lab<br>Since 2026`;
const FOOTER_COL2 = `hi@opl.design<br>224.443.6415`;
const FOOTER_COL3 = `1029 Lake St. Oak Park IL 60301<br><a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>`;

/* Path to the footer wordmark SVG — drop opl-footer.svg at the project root */
const FOOTER_SVG = 'opl-footer.svg';

(function () {
  const inProject = window.location.pathname.includes('/projects/');
  const base = inProject ? '../' : '';

  /* ── Gradient bar ── */
  const bar = document.createElement('div');
  bar.style.cssText = 'position:relative;z-index:10;height:1px;background:linear-gradient(90deg,var(--color-dark),var(--color-accent),var(--color-light),var(--color-dark),var(--color-accent),var(--color-light),var(--color-dark));background-size:300% 100%;animation:footer-gradient 8s linear infinite;';
  document.body.appendChild(bar);

  /* Inject keyframe once */
  if (!document.getElementById('footer-gradient-style')) {
    const s = document.createElement('style');
    s.id = 'footer-gradient-style';
    s.textContent = '@keyframes footer-gradient{0%{background-position:0% 0}100%{background-position:100% 0}}';
    document.head.appendChild(s);
  }

  /* ── 3-column footer ── */
  const footer = document.createElement('footer');
  footer.style.cssText = 'position:relative;z-index:10;padding-top:var(--space-8);padding-bottom:var(--space-8);';
  footer.innerHTML = `
    <div class="container">
      <div class="grid" style="align-items:start;">
        <div class="col-4" style="font-size:var(--body);line-height:var(--leading-loose);color:${inProject ? 'var(--color-light)' : 'var(--color-dark)'};">${FOOTER_COL1}</div>
        <div class="col-4" style="font-size:var(--body);line-height:var(--leading-loose);color:${inProject ? 'var(--color-light)' : 'var(--color-dark)'};">${FOOTER_COL2}</div>
        <div class="col-4" style="font-size:var(--body);line-height:var(--leading-loose);color:${inProject ? 'var(--color-light)' : 'var(--color-dark)'};">${FOOTER_COL3}</div>
      </div>
    </div>
  `;
  document.body.appendChild(footer);

  /* ── Wordmark SVG — spans full viewport width ── */
  const wm = document.createElement('div');
  wm.style.cssText = 'position:relative;z-index:10;line-height:0;padding:0;margin:0;opacity:0.08;pointer-events:none;user-select:none;';
  wm.innerHTML = `<img src="${base}${FOOTER_SVG}" alt="Original Practice Lab" style="display:block;width:100%;height:auto;">`;
  document.body.appendChild(wm);
})();
