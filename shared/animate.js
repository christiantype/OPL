/* ── OPL Animate — fade in from above on scroll ── */
(function () {
  const sel = [
    'h1', 'h2', 'h3',
    'p', '.label', '.section-name', '.member-name',
    '.nav-wordmark',
    '.project-image', '.project-image--full',
    '.gallery-grid .gb-entry',
    '.next-title',
    '.apply-link',
    '.canvas-wrap', '.canvas-controls',
    '.word-input', '.gb-btn'
  ].join(', ');

  const els = [...document.querySelectorAll(sel)].filter(
    el => !el.closest('nav') && !el.closest('.project-row')
  );

  els.forEach(el => {
    el.style.opacity  = '0';
    el.style.transform = 'translateY(-10px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  });

  const observer = new IntersectionObserver(entries => {
    entries
      .filter(e => e.isIntersecting)
      .forEach((entry, i) => {
        setTimeout(() => {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 65);
        observer.unobserve(entry.target);
      });
  }, { threshold: 0.05 });

  els.forEach(el => observer.observe(el));
})();
