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

/* ── Colored periods ── */
(function () {
  const colors = ['#ff94c9', '#FFED00', '#79c7f1', '#fcc1b8', '#bbff34'];
  const skip = new Set(['SCRIPT', 'STYLE', 'svg', 'path']);

  function colorPeriods(node) {
    if (skip.has(node.nodeName)) return;
    const punctRe = /([.,\-–—:;!?()[\]{}"'\/\\&@#])/;
    if (node.nodeType === Node.TEXT_NODE && punctRe.test(node.textContent)) {
      const frag = document.createDocumentFragment();
      node.textContent.split(punctRe).forEach(part => {
        if (punctRe.test(part) && part.length === 1) {
          const s = document.createElement('span');
          s.textContent = part;
          s.style.color = colors[Math.floor(Math.random() * colors.length)];
          frag.appendChild(s);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
      return;
    }
    node.childNodes.forEach(colorPeriods);
  }

  colorPeriods(document.body);
})();
