/* ── OPL Shared Footer ── */
/* Edit contact info, address, and social links here */

const FOOTER_COL1 = `Original Practice Lab<br>Since 2026`;
const FOOTER_COL2 = `hi@opl.design<br>224.443.6415`;
const FOOTER_COL3 = `1029 Lake St. Oak Park IL 60301<br><a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>`;

(function () {
  const inProject = window.location.pathname.includes('/projects/');

  /* ── Gradient bar ── */
  const bar = document.createElement('div');
  bar.style.cssText = 'position:relative;z-index:10;height:1px;background:linear-gradient(90deg,#000,#FF69B4,#fff,#000,#FF69B4,#fff,#000);background-size:300% 100%;animation:footer-gradient 8s linear infinite;';
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
        <div class="col-4" style="font-size:var(--body);line-height:var(--leading-loose);color:var(--color-ink);">${FOOTER_COL1}</div>
        <div class="col-4" style="font-size:var(--body);line-height:var(--leading-loose);color:var(--color-ink);">${FOOTER_COL2}</div>
        <div class="col-4" style="font-size:var(--body);line-height:var(--leading-loose);color:var(--color-ink);">${FOOTER_COL3}</div>
      </div>
    </div>
  `;
  document.body.appendChild(footer);

  /* ── Wordmark ── */
  const wm = document.createElement('div');
  wm.id = 'footer-wordmark';
  wm.style.cssText = 'position:relative;z-index:10;overflow:hidden;pointer-events:none;user-select:none;line-height:1;padding:0;margin:0;';
  wm.innerHTML = `<span id="footer-wm-text" style="display:block;font-weight:400;letter-spacing:-0.02em;text-transform:uppercase;color:#1A1917;white-space:nowrap;line-height:1;opacity:0.08;">Original Practice Lab</span>`;
  document.body.appendChild(wm);

  /* Scale wordmark to full width after fonts load */
  document.fonts.ready.then(function () {
    function fit() {
      const el = document.getElementById('footer-wm-text');
      el.style.fontSize   = '100px';
      el.style.visibility = 'hidden';
      requestAnimationFrame(function () {
        el.style.fontSize   = (100 * wm.offsetWidth / el.scrollWidth) + 'px';
        el.style.visibility = 'visible';
      });
    }
    fit();
    window.addEventListener('resize', fit);
  });
})();
