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
    #idle-saver .isw {
      font-family: "Sidepiece-HoneyPie", sans-serif; color: #111;
      font-size: clamp(2rem, 8vw, 5rem); letter-spacing: .01em; line-height: 1;
      text-align: center; padding: 0 6vw;
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
  const word = document.createElement('div');
  word.className = 'isw';
  el.appendChild(word);
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
