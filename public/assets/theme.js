/* ==========================================================
   PREMIUM STORE — theme switcher (System / Light / Dark)
   Loaded in <head> WITHOUT defer so the theme class lands on
   <html> before first paint (no flash of wrong theme).
   Dark = default (site's original look, zero override).
   Mode is stored in localStorage 'ps-theme':
     absent  -> follow the OS (System)
     'light' -> force light
     'dark'  -> force dark
   The header button (injected by app.js) cycles the 3 modes;
   clicks are handled here via a delegated listener, so app.js
   behavior/functions stay untouched.
   ========================================================== */
(function () {
  'use strict';

  var KEY = 'ps-theme';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function mode() {
    var m = null;
    try { m = localStorage.getItem(KEY); } catch (e) { /* private mode etc. */ }
    return (m === 'light' || m === 'dark') ? m : 'system';
  }

  function apply() {
    var m = mode();
    var light = m === 'light' || (m === 'system' && mq && mq.matches);
    document.documentElement.classList.toggle('theme-light', light);
    updateButton();
  }

  function updateButton() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var m = mode();
    var icon = m === 'system' ? 'fa-circle-half-stroke' : (m === 'light' ? 'fa-sun' : 'fa-moon');
    var label = m === 'system' ? 'Theme: System default' : (m === 'light' ? 'Theme: Light' : 'Theme: Dark');
    btn.innerHTML = '<i class="fa-solid ' + icon + '"></i>';
    btn.title = label + ' (နှိပ်ပြီး ပြောင်းရန်)';
    btn.setAttribute('aria-label', label);
  }

  // follow OS changes live while in System mode
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply); // old Safari
  }

  // cycle: system -> light -> dark -> system
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-action="theme-cycle"]') : null;
    if (!el) return;
    var m = mode();
    var next = m === 'system' ? 'light' : (m === 'light' ? 'dark' : 'system');
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch (e2) { /* storage unavailable -> still applies for this page */ }
    apply();
  });

  apply(); // pre-paint (script runs before <body> parses)

  // set the button icon AFTER app.js injects the header
  // (setTimeout 0 runs after all DOMContentLoaded handlers finish)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(updateButton, 0); });
  } else {
    setTimeout(updateButton, 0);
  }
})();
