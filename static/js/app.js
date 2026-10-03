/* CMIYGL extras: signature styling, extra card colours, result actions.
   Loaded after the React bundle; the bundle calls the window.__* hooks below. */
(function () {
  var FONTS = ['Rock Salt', 'Caveat', 'Dancing Script', 'Homemade Apple', 'Nanum Pen Script'];
  var INKS = ['#000000', '#1b2a6b', '#1f5fbf', '#b3261e', '#1e6b3a', '#6b2fa0'];
  var TINTS = ['#c9b8e8', '#f4a08c', '#9ad0f0', '#cfe39a', '#f5b971', '#b8bfc7', '#cdaa8a'];
  var cfg = { font: 'Rock Salt', ink: '#000000', size: 1 };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem('cmiygl-sig') || '{}')); } catch (e) {}
  window.__sig = cfg;

  /* ---------- hooks used by the patched bundle ---------- */
  window.__sigFont = function (ctx, text) {
    var px = 60 * cfg.size, f;
    do { f = px + 'px "' + cfg.font + '"'; ctx.font = f; px -= 2; }
    while (ctx.measureText(text).width > 800 && px > 20);
    return f;
  };
  window.__tintImg = function (img) {
    if (cfg.ink === '#000000') return img;
    var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = cfg.ink; x.fillRect(0, 0, c.width, c.height);
    return c;
  };
  window.__drawBg = function (h, s, o, i, b, u) {
    var base = { yellow: o, mint: i, pink: b, blue: u }[s];
    if (base || !/^#/.test(s)) return h.drawImage(base || o, 0, 0);
    var c = document.createElement('canvas'); c.width = o.width; c.height = o.height;
    var x = c.getContext('2d'); x.drawImage(o, 0, 0);
    x.globalCompositeOperation = 'color'; x.fillStyle = s; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(o, 0, 0);
    h.drawImage(c, 0, 0);
  };
  window.__bgStyle = function (url, color) {
    var u = 'url(' + url + ')';
    if (!/^#/.test(color)) return { backgroundImage: u };
    return {
      backgroundImage: 'linear-gradient(' + color + ',' + color + '),' + u,
      backgroundBlendMode: 'color, normal',
      WebkitMaskImage: u, maskImage: u, WebkitMaskSize: 'cover', maskSize: 'cover'
    };
  };
  window.__sw = function (C, setColor) {
    var out = TINTS.map(function (hex) {
      return C.jsx('button', { key: hex, title: hex, className: 'btn btn-light border btn-color-pick',
        style: { background: hex }, onClick: function () { setColor(hex); } });
    });
    out.push(C.jsx('label', { key: 'custom', title: 'Custom colour', className: 'btn btn-light border btn-color-pick x-custom',
      children: C.jsx('input', { type: 'color', onChange: function (e) { setColor(e.target.value); } }) }));
    return out;
  };

  /* ---------- dock UI ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var dock = document.createElement('div');
  dock.id = 'x-dock';
  dock.innerHTML =
    '<div id="x-panel" hidden>' +
      '<div class="x-title">Signature style</div>' +
      '<div class="x-row" id="x-fonts"></div>' +
      '<div class="x-row" id="x-inks"></div>' +
      '<label class="x-size">Size <input id="x-size" type="range" min="0.7" max="1.3" step="0.05"></label>' +
    '</div>' +
    '<div class="x-bar">' +
      '<button id="x-toggle" data-m="form">&#9998; Signature</button>' +
      '<button data-m="result" data-a="copy">Copy</button>' +
      '<button data-m="result" data-a="share">Share</button>' +
      '<button data-m="result" data-a="jpg">Save JPG</button>' +
    '</div><div id="x-toast"></div>';
  document.body.appendChild(dock);

  function apply(save) {
    var r = document.documentElement.style;
    r.setProperty('--sig-font', '"' + cfg.font + '"');
    r.setProperty('--sig-ink', cfg.ink);
    r.setProperty('--sig-scale', cfg.size);
    if (document.fonts) document.fonts.load('40px "' + cfg.font + '"');
    $('#x-fonts').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === cfg.font); });
    $('#x-inks').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === cfg.ink); });
    $('#x-size').value = cfg.size;
    if (save) try { localStorage.setItem('cmiygl-sig', JSON.stringify(cfg)); } catch (e) {}
  }
  $('#x-fonts').innerHTML = FONTS.map(function (f) {
    return '<button data-v="' + f + '" style="font-family:\'' + f + '\',cursive">Aa</button>';
  }).join('');
  $('#x-inks').innerHTML = INKS.map(function (c) {
    return '<button data-v="' + c + '" style="background:' + c + '" aria-label="Ink ' + c + '"></button>';
  }).join('');
  $('#x-fonts').onclick = function (e) { if (e.target.dataset.v) { cfg.font = e.target.dataset.v; apply(true); } };
  $('#x-inks').onclick = function (e) { if (e.target.dataset.v) { cfg.ink = e.target.dataset.v; apply(true); } };
  $('#x-size').oninput = function (e) { cfg.size = parseFloat(e.target.value); apply(true); };
  $('#x-toggle').onclick = function () { var p = $('#x-panel'); p.hidden = !p.hidden; };

  function toast(msg) {
    var t = $('#x-toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function idBlob(type) {
    var src = $('.idcontainer img').src;
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        var x = c.getContext('2d');
        if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
        x.drawImage(im, 0, 0); c.toBlob(res, type, 0.95);
      };
      im.src = src;
    });
  }
  dock.onclick = function (e) {
    var a = e.target.dataset && e.target.dataset.a;
    if (!a) return;
    if (a === 'jpg') idBlob('image/jpeg').then(function (b) {
      var l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'callmeifyougetlostid.jpg'; l.click();
    });
    if (a === 'copy') idBlob('image/png').then(function (b) {
      return navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
    }).then(function () { toast('Copied to clipboard'); }, function () { toast('Copy not supported here'); });
    if (a === 'share') idBlob('image/png').then(function (b) {
      var f = new File([b], 'callmeifyougetlostid.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: 'My ID' });
      toast('Sharing not supported here');
    }).catch(function () {});
  };

  /* show the right controls for the current screen */
  var queued = false;
  function sync() {
    queued = false;
    var intro = $('#tylerid.open'), modal = $('#top-layer');
    var mode = $('.idcontainer img') ? 'result' : ($('#form-control-full-name') ? 'form' : '');
    dock.style.display = (intro || modal || !mode) ? 'none' : 'block';
    dock.dataset.mode = mode;
    if (mode !== 'form') $('#x-panel').hidden = true;
  }
  new MutationObserver(function () { if (!queued) { queued = true; requestAnimationFrame(sync); } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var m = $('#top-layer'); if (m) m.click(); }
  });
  apply(false); sync();
})();
