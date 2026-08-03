/* reviews.js — CSP-safe: replaces the old inline document.write loop
   (which only works during parse) with DOM appends, then wires the
   lightbox. Loaded with defer so #proofGrid exists. */
(function () {
  'use strict';

  var grid = document.getElementById('proofGrid');
  if (!grid) return;

  function build(list) {
    grid.innerHTML = '';
    list.forEach(function (src, idx) {
      var item = document.createElement('div');
      item.className = 'proof-item';
      // keyboard / screen reader အတွက် — mouse မရှိသူတွေလည်း proof ပုံကို
      // ဖွင့်ကြည့်လို့ရအောင် (CSS မထိရအောင် role+tabindex ကို ဒီမှာပဲ ပေးသည်)
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', 'Customer Review ' + (idx + 1) + ' — ပုံအကြီး ကြည့်ရန်');
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = src;
      img.alt = 'Customer Review ' + (idx + 1);
      item.appendChild(img);
      grid.appendChild(item);
    });
  }

  // static fallback first (page never blank), then the panel-managed list
  var fallback = [];
  for (var i = 1; i <= 30; i++) fallback.push('images/review' + i + '.webp');
  build(fallback);

  fetch('/data/reviews.json')
    .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function (d) {
      if (d && Array.isArray(d.images) && d.images.length) build(d.images);
    })
    .catch(function () { /* fallback grid stays */ });

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var closeBtn = document.getElementById('closeLightbox');
  if (!lightbox || !lightboxImg || !closeBtn) return;

  // markup က static (reviews.html) — dialog semantics + close ခလုတ်ကို
  // keyboard နဲ့ ရောက်အောင် ဒီမှာ ဖြည့်ပေးသည်
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Customer review image');
  closeBtn.setAttribute('role', 'button');
  closeBtn.setAttribute('tabindex', '0');

  var lastProof = null;

  function openLightbox(img) {
    lastProof = img.closest('.proof-item') || img;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || 'Zoomed Review';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn.focus) { try { closeBtn.focus(); } catch (e) {} }
  }

  grid.addEventListener('click', function (e) {
    var img = e.target.closest('img');
    if (!img) return;
    openLightbox(img);
  });

  // Enter / Space — proof-item က div ဖြစ်လို့ browser က မလုပ်ပေးဘူး
  grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var item = e.target.closest ? e.target.closest('.proof-item') : null;
    var img = item && item.querySelector('img');
    if (!img) return;
    e.preventDefault();
    openLightbox(img);
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    document.body.style.overflow = '';
    // ဖွင့်ခဲ့တဲ့ thumbnail ဆီ focus ပြန်ပို့
    if (lastProof && lastProof.focus && document.contains(lastProof)) {
      try { lastProof.focus(); } catch (e) {}
    }
    lastProof = null;
  }

  closeBtn.addEventListener('click', closeLightbox);
  closeBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      closeLightbox();
    }
  });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
})();
