(function () {
  // sha-256("murocks") — set 2026-05-26 (rotated from the original).
  const HASH = 'a15e05cdc0fec666ee9f4acd1547dc1dc5a52d99076a8ba6ca617f9dee364fef';
  // Bumped key — invalidates any session still unlocked under the old password.
  const KEY = 'opal-ai-unlocked-v2';

  if (sessionStorage.getItem(KEY) === '1') return;

  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Sidepiece-HoneyDrip';
      src: url('/shared/fonts/Sidepiece-HoneyDrip.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    html.zlmc-locked body > *:not(.zlmc-gate) { display: none !important; }
    .zlmc-gate {
      position: fixed; inset: 0; z-index: 200;
      background: #FFFFFF;
      display: flex; align-items: center; justify-content: center;
      padding: 0 10em;
      font-family: 'Sidepiece-HoneyDrip', sans-serif;
      color: #000000;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .zlmc-gate-card {
      width: 100%;
      max-width: 28em;
      display: flex; flex-direction: column;
    }
    .zlmc-gate-eyebrow {
      font-size: 11px;
      letter-spacing: 0.09375em;
      text-transform: uppercase;
      color: #868686;
      margin-bottom: 0.75em;
    }
    .zlmc-gate-title {
      font-size: 16px;
      font-weight: 400;
      line-height: 1.5;
      margin: 0;
      padding-bottom: 0.75em;
      border-bottom: 0.3px solid #868686;
    }
    .zlmc-gate-row {
      display: flex;
      align-items: center;
      gap: 0.5em;
      border-bottom: 0.3px solid #868686;
      padding: 0.75em 0;
    }
    .zlmc-gate-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font: inherit;
      font-size: 16px;
      color: inherit;
      padding: 0;
    }
    .zlmc-gate-input::placeholder { color: #868686; }
    .zlmc-gate-submit {
      background: transparent;
      border: none;
      cursor: pointer;
      font: inherit;
      font-size: 11px;
      letter-spacing: 0.09375em;
      text-transform: uppercase;
      color: #868686;
      transition: color 0.2s;
      padding: 0;
    }
    .zlmc-gate-submit:hover { color: #000000; }
    .zlmc-gate-err {
      margin-top: 0.75em;
      font-size: 11px;
      letter-spacing: 0.09375em;
      text-transform: uppercase;
      color: #ff94c9;
      min-height: 1em;
    }
    @media (max-width: 64em) { .zlmc-gate { padding: 0 4em; } }
    @media (max-width: 40em) { .zlmc-gate { padding: 0 1.25em; } }
  `;
  document.documentElement.classList.add('zlmc-locked');
  (document.head || document.documentElement).appendChild(style);

  async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function mount() {
    const wrap = document.createElement('div');
    wrap.className = 'zlmc-gate';
    wrap.innerHTML = `
      <form class="zlmc-gate-card" autocomplete="off">
        <div class="zlmc-gate-eyebrow">Private · OP/AL Tools</div>
        <h1 class="zlmc-gate-title">Enter password to continue.</h1>
        <div class="zlmc-gate-row">
          <input class="zlmc-gate-input" type="password" autocomplete="current-password" placeholder="Password" />
          <button class="zlmc-gate-submit" type="submit">Unlock →</button>
        </div>
        <div class="zlmc-gate-err" aria-live="polite"></div>
      </form>
    `;
    document.body.appendChild(wrap);

    const input = wrap.querySelector('input');
    const err = wrap.querySelector('.zlmc-gate-err');
    input.focus();

    wrap.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      const hashed = await sha256(input.value);
      if (hashed === HASH) {
        sessionStorage.setItem(KEY, '1');
        location.reload();
      } else {
        err.textContent = 'Incorrect password.';
        input.select();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
