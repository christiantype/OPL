/* ── Idle word screensaver ─────────────────────────────────────────────
   After IDLE_MS of no activity the page fades to white and a loop of brand
   words flashes in the centre. Any pointer move / key / scroll / touch
   dismisses it and restarts the idle countdown. */
(function idleWords() {
  if (window.__idleWords) return;
  window.__idleWords = true;

  const IDLE_MS = 45000;   // go idle after 45s
  const FLASH_MS = 4200;   // hold each prompt long enough to read
  const FADE_MS = 160;     // crossfade between words
  const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="154.5 212.9 1274.6 186.2" fill="currentColor"><path d="M1356.2,353.2h72.1v-13h-59.1v-100.6h-13v113.5ZM1077.3,313.7l13.5-61.1h10.6l13.3,61.1h-37.5ZM1055.3,353.2h13.3l5.8-26.5h43.3l5.8,26.5h13.3l-25.2-113.5h-30.6l-25.6,113.5ZM723.6,398.3h37.2l111.9-184.5h-37.2l-111.9,184.5ZM478.1,296.2v-43.6h28.1c5.9,0,8.3.9,13,4.7,5.2,4.3,5.9,6.1,5.9,10.6v13c0,4.5-.7,6.3-5.9,10.6-4.7,3.8-7,4.7-13,4.7h-28.1ZM465.1,353.2h13v-44h28.1c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-14.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-41.1v113.5ZM199.1,340.2h-11.9c-5.9,0-8.3-.9-13-4.7-5.2-4.3-5.9-6.1-5.9-10.6v-57c0-4.5.7-6.3,5.9-10.6,4.7-3.8,7-4.7,13-4.7h11.9c5.9,0,8.5.9,13.2,4.7,5,4.1,5.8,6.1,5.8,10.6v57c0,4.5-.7,6.5-5.8,10.6-4.7,3.8-7.2,4.7-13.2,4.7M187.2,353.2h11.9c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-58.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-11.9c-9.4,0-14.2,2-22.5,9-8.3,7-9.4,10.3-9.4,18.6v58.4c0,8.3,1.1,11.5,9.4,18.6,8.3,7,13.2,9,22.5,9"/></svg>`;

  const WORDS = [
    'What would you make if no one would see it?',
    'Subtract.',
    'The mistake is the material.',
    'Slow down until it gets interesting.',
    'Trust the first draft.',
    'Ask what the material wants.',
    'Leave one thing unresolved.',
    'Name it wrong on purpose.',
    'Whose voice is this, really?',
    'Let it stay ugly a little longer.',
    'Start from the ending.',
    'Keep the hand visible.',
    'Do the opposite.',
    'Make room for the accident.',
    'What are you not saying?',
    'Let the edges breathe.',
    'Return to the first question.',
    'Begin before you are ready.'
  ];

  // [background, foreground] — harmonious/complementary pairs (Sanzo Wada palette)
  const PALETTES = [
    ['#1e3a34', '#e8846b'], ['#14315b', '#e6b422'], ['#0e5c5b', '#d96e3f'],
    ['#5c1a1b', '#a9c7d9'], ['#e6b422', '#14315b'], ['#4a2c4d', '#9cb48f'],
    ['#c05b25', '#16514e'], ['#1f3a2e', '#f0b49e'], ['#46618e', '#d9a441'],
    ['#6e1e2a', '#a8d8c0'], ['#2b2c6b', '#f2a81d'], ['#5e6033', '#c9a7d4'],
    ['#a8442a', '#9fc9cc'], ['#2e2e2e', '#ebe45b'], ['#3e2140', '#b7c74a'],
    ['#14395e', '#e8917b'], ['#8c3a2b', '#f0e5d0'], ['#234b3f', '#e8a268'],
    ['#24409a', '#e3b23c'], ['#5b1f33', '#afc9b0'], ['#0f4c5c', '#f4a261'],
    ['#d9773f', '#2a3d45'], ['#e5ddc8', '#7a3b2e'], ['#3d405b', '#e07a5f']
  ];

  const style = document.createElement('style');
  style.textContent = `
    #idle-saver {
      position: fixed; inset: 0; z-index: 9998;
      background: #fff; display: flex; align-items: center; justify-content: center;
      pointer-events: none; cursor: none;
      opacity: 0; visibility: hidden;
      transition: opacity .6s ease, visibility 0s linear .6s, background-color ${FADE_MS}ms ease;
    }
    #idle-saver.on { opacity: 1; visibility: visible; transition: opacity .6s ease, visibility 0s, background-color ${FADE_MS}ms ease; }
    #idle-saver .isw-inner {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: clamp(22px, 5vh, 48px); padding: 0 6vw;
    }
    #idle-saver .isw-logo { color: #000; line-height: 0; transition: color ${FADE_MS}ms ease; }
    #idle-saver .isw-logo svg { display: block; width: clamp(130px, 20vw, 260px); height: auto; }
    #idle-saver .isw {
      font-family: "Sidepiece-HoneyPie", sans-serif; color: #111;
      font-size: clamp(1.05rem, 3vw, 2.1rem); letter-spacing: .005em; line-height: 1.3;
      text-align: center; width: min(90vw, 22em); height: 2.6em;   /* fixed 2-line box → logo never jumps */
      display: flex; align-items: center; justify-content: center; text-wrap: balance;
      opacity: 0; transition: opacity ${FADE_MS}ms ease, color ${FADE_MS}ms ease;
    }
    @media (prefers-reduced-motion: reduce) {
      #idle-saver, #idle-saver .isw { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'idle-saver';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="isw-inner"><div class="isw-logo">${LOGO}</div><div class="isw"></div></div>`;
  const word = el.querySelector('.isw');
  const logoEl = el.querySelector('.isw-logo');
  const mount = () => document.body.appendChild(el);
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  // shuffle once so each visit loops words + palettes in a different order
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  const order = shuffle(WORDS.slice(0, -1)).concat(WORDS[WORDS.length - 1]);   // shuffle all, but always close on the last prompt
  const pals = shuffle(PALETTES.slice());

  let idx = 0, pidx = 0, flashTimer = 0, idleTimer = 0, on = false;

  function nextWord() {
    word.style.opacity = '0';
    setTimeout(() => {
      const pal = pals[pidx % pals.length];
      el.style.background = pal[0];
      word.style.color = pal[1];
      logoEl.style.color = pal[1];
      word.textContent = order[idx];
      word.style.opacity = '1';
      idx = (idx + 1) % order.length;
      pidx = (pidx + 1) % pals.length;
    }, REDUCE ? 0 : FADE_MS);
  }
  function start() {
    if (on) return; on = true;
    idx = 0; pidx = 0;
    el.style.background = pals[0][0];   // first colour set before the fade-in
    el.classList.add('on');
    nextWord();
    flashTimer = setInterval(nextWord, FLASH_MS);
  }
  function stop() {
    if (!on) return; on = false;
    el.classList.remove('on');
    clearInterval(flashTimer); flashTimer = 0;
  }
  function reset() {
    if (on) stop();
    clearTimeout(idleTimer);
    if (!document.hidden) idleTimer = setTimeout(start, IDLE_MS);
  }

  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(
    (ev) => window.addEventListener(ev, reset, { passive: true })
  );
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); clearTimeout(idleTimer); } else reset(); });

  reset();
})();
