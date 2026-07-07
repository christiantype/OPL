/* ── Idle word screensaver ─────────────────────────────────────────────
   After IDLE_MS of no activity the page fades to white and a loop of brand
   words flashes in the centre. Any pointer move / key / scroll / touch
   dismisses it and restarts the idle countdown. */
(function idleWords() {
  if (window.__idleWords) return;
  window.__idleWords = true;

  const IDLE_MS = 45000;   // go idle after 45s
  const FLASH_MS = 1050;   // hold each word ~1s
  const FADE_MS = 160;     // crossfade between words
  const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="154.5 212.9 1274.6 186.2" fill="currentColor"><path d="M1356.2,353.2h72.1v-13h-59.1v-100.6h-13v113.5ZM1077.3,313.7l13.5-61.1h10.6l13.3,61.1h-37.5ZM1055.3,353.2h13.3l5.8-26.5h43.3l5.8,26.5h13.3l-25.2-113.5h-30.6l-25.6,113.5ZM723.6,398.3h37.2l111.9-184.5h-37.2l-111.9,184.5ZM478.1,296.2v-43.6h28.1c5.9,0,8.3.9,13,4.7,5.2,4.3,5.9,6.1,5.9,10.6v13c0,4.5-.7,6.3-5.9,10.6-4.7,3.8-7,4.7-13,4.7h-28.1ZM465.1,353.2h13v-44h28.1c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-14.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-41.1v113.5ZM199.1,340.2h-11.9c-5.9,0-8.3-.9-13-4.7-5.2-4.3-5.9-6.1-5.9-10.6v-57c0-4.5.7-6.3,5.9-10.6,4.7-3.8,7-4.7,13-4.7h11.9c5.9,0,8.5.9,13.2,4.7,5,4.1,5.8,6.1,5.8,10.6v57c0,4.5-.7,6.5-5.8,10.6-4.7,3.8-7.2,4.7-13.2,4.7M187.2,353.2h11.9c9.4,0,14.2-2,22.5-9,8.3-7,9.4-10.3,9.4-18.6v-58.4c0-8.3-1.1-11.5-9.4-18.6-8.3-7-13.2-9-22.5-9h-11.9c-9.4,0-14.2,2-22.5,9-8.3,7-9.4,10.3-9.4,18.6v58.4c0,8.3,1.1,11.5,9.4,18.6,8.3,7,13.2,9,22.5,9"/></svg>`;

  const WORDS = [
    'opalescence', 'studious', 'provocative', 'human', 'poetic', 'rational',
    'emotive', 'curious', 'luminous', 'deliberate', 'tactile', 'resonant',
    'rigorous', 'playful', 'generous', 'precise', 'restless', 'tender',
    'radiant', 'honest', 'elemental', 'alive', 'present', 'intuitive',
    'crafted', 'essential', 'searching', 'iterative', 'expressive', 'grounded',
    'vivid', 'sincere', 'patient', 'incandescent', 'considered', 'kinetic',
    'soulful', 'lucid', 'boundless', 'earnest', 'meticulous', 'wondrous',
    'fluid', 'experimental', 'warm', 'quiet', 'bold', 'open', 'felt', 'original'
  ];

  const style = document.createElement('style');
  style.textContent = `
    #idle-saver {
      position: fixed; inset: 0; z-index: 9998;
      background: #fff; display: flex; align-items: center; justify-content: center;
      pointer-events: none; cursor: none;
      opacity: 0; visibility: hidden;
      transition: opacity .6s ease, visibility 0s linear .6s;
    }
    #idle-saver.on { opacity: 1; visibility: visible; transition: opacity .6s ease, visibility 0s; }
    #idle-saver .isw-inner {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: clamp(22px, 5vh, 48px); padding: 0 6vw;
    }
    #idle-saver .isw-logo { color: #000; line-height: 0; }
    #idle-saver .isw-logo svg { display: block; width: clamp(130px, 20vw, 260px); height: auto; }
    #idle-saver .isw {
      font-family: "Sidepiece-HoneyPie", sans-serif; color: #111;
      font-size: clamp(0.95rem, 2.6vw, 1.5rem); letter-spacing: .16em; line-height: 1;
      text-transform: uppercase; text-align: center;
      opacity: 0; transition: opacity ${FADE_MS}ms ease;
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
  const mount = () => document.body.appendChild(el);
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  // shuffle once so each visit loops in a different order
  const order = WORDS.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }

  let idx = 0, flashTimer = 0, idleTimer = 0, on = false;

  function nextWord() {
    word.style.opacity = '0';
    setTimeout(() => { word.textContent = order[idx]; idx = (idx + 1) % order.length; word.style.opacity = '1'; }, REDUCE ? 0 : FADE_MS);
  }
  function start() {
    if (on) return; on = true;
    el.classList.add('on');
    idx = 0; nextWord();
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
