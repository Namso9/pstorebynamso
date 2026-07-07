/* reviews.js — CSP-safe: replaces the old inline document.write loop
   (which only works during parse) with DOM appends, then wires the
   lightbox. Loaded with defer so #proofGrid exists. */
(function () {
  'use strict';

  var grid = document.getElementById('proofGrid');
  if (!grid) return;

  for (var i = 1; i <= 30; i++) {
    var item = document.createElement('div');
    item.className = 'proof-item';
    var img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = 'images/review' + i + '.webp';
    img.alt = 'Customer Review ' + i;
    item.appendChild(img);
    grid.appendChild(item);
  }

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var closeBtn = document.getElementById('closeLightbox');
  if (!lightbox || !lightboxImg || !closeBtn) return;

  grid.addEventListener('click', function (e) {
    var img = e.target.closest('img');
    if (!img) return;
    lightboxImg.src = img.src;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
})();
