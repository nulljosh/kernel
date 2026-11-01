// Footer band: Kernel's own things in a row (an open book, the read-aloud highlight, headphones, a bookmark, a chapter, the progress bar), cut like a line engraving in plain 2D canvas. Faint rules
// run across the band; inside the glyphs they thicken, and thicken again on the edge facing away from the light, so the
// glyphs look cut into the page. Drawn once per size and theme. Same engine as the Hermes landing; only the glyphs differ.
(function () {
  var band = document.querySelector('.word-band'), canvas = band && band.querySelector('canvas');
  if (!canvas) return;

  // Each glyph is drawn white on a 100 unit square.
  var GLYPHS = [
    function (c) { // an open book
      c.beginPath(); c.moveTo(50, 28); c.bezierCurveTo(36, 18, 20, 18, 10, 24); c.lineTo(10, 80); c.bezierCurveTo(22, 74, 38, 76, 50, 84);
      c.bezierCurveTo(62, 76, 78, 74, 90, 80); c.lineTo(90, 24); c.bezierCurveTo(80, 18, 64, 18, 50, 28); c.closePath(); c.fill();
      c.globalCompositeOperation = 'destination-out'; c.fillRect(48.5, 28, 3, 56);
    },
    function (c) { // the read-aloud highlight running over a line
      c.globalAlpha = .45; c.fillRect(10, 38, 56, 22); c.globalAlpha = 1;
      c.fillRect(14, 44, 72, 9); c.fillRect(14, 68, 60, 6); c.fillRect(14, 24, 50, 6);
    },
    function (c) { // listening
      c.lineWidth = 8; c.beginPath(); c.arc(50, 54, 30, Math.PI, 0); c.stroke();
      c.beginPath(); c.roundRect(14, 52, 16, 30, 6); c.fill(); c.beginPath(); c.roundRect(70, 52, 16, 30, 6); c.fill();
    },
    function (c) { // a bookmark
      c.beginPath(); c.moveTo(30, 12); c.lineTo(70, 12); c.lineTo(70, 88); c.lineTo(50, 70); c.lineTo(30, 88); c.closePath(); c.fill();
    },
    function (c) { // one chapter, summed up
      c.beginPath(); c.roundRect(20, 12, 60, 76, 4); c.fill(); c.globalCompositeOperation = 'destination-out';
      c.fillRect(30, 24, 26, 8); for (var y = 40; y <= 72; y += 10) c.fillRect(30, y, y === 72 ? 22 : 40, 4);
    },
    function (c) { // the progress bar under it
      c.lineWidth = 4; c.beginPath(); c.roundRect(10, 42, 80, 16, 8); c.stroke(); c.beginPath(); c.roundRect(10, 42, 52, 16, 8); c.fill();
      c.beginPath(); c.arc(62, 50, 11, 0, 7); c.fill();
    }
  ];
  // Lays the glyphs out evenly across a w by h 2D context, in the given colour: one row, or two on a narrow band.
  function grid(w, h) {
    var n = GLYPHS.length, rows = w < h * 3 ? 2 : 1, per = Math.ceil(n / rows);
    return { rows: rows, per: per, cell: Math.min(h / rows * 0.86, w / per) };
  }
  function paint(c, w, h, colour) {
    var g = grid(w, h), gap = (w - g.cell * g.per) / g.per, rowH = h / g.rows;
    GLYPHS.forEach(function (draw, i) {
      var col = i % g.per, row = Math.floor(i / g.per);
      c.save(); c.translate(gap / 2 + col * (g.cell + gap), row * rowH + (rowH - g.cell) / 2 + rowH * 0.04); c.scale(g.cell / 100, g.cell / 100);
      c.fillStyle = c.strokeStyle = colour; draw(c); c.restore();
    });
  }

  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  function layer(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // Horizontal rules `t` px thick, one every `pitch` px, kept only where `mask` is drawn (everywhere when null).
  function rules(w, h, pitch, t, colour, mask) {
    var c = layer(w, h), x = c.getContext('2d');
    x.fillStyle = colour;
    for (var y = 0; y < h; y += pitch) x.fillRect(0, Math.round(y + (pitch - t) / 2), w, Math.max(1, Math.round(t)));
    if (mask) { x.globalCompositeOperation = 'destination-in'; x.drawImage(mask, 0, 0); }
    return c;
  }
  var drawnW = 0;
  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    drawnW = w; canvas.width = w; canvas.height = h;
    var colour = getComputedStyle(band).color, pitch = Math.min(5 * dpr, Math.max(3 * dpr, grid(w, h).cell / 22)), s = Math.max(2, h * 0.014);
    var glyphs = layer(w, h); paint(glyphs.getContext('2d'), w, h, '#fff');
    // the shadow side: glyph pixels whose neighbour down and right is outside the glyph (light from the top left)
    var shade = layer(w, h), sc = shade.getContext('2d');
    sc.drawImage(glyphs, 0, 0); sc.globalCompositeOperation = 'destination-out'; sc.drawImage(glyphs, -s, -s);
    ctx.globalAlpha = 0.28; ctx.drawImage(rules(w, h, pitch, dpr * 0.75, colour, null), 0, 0);
    ctx.globalAlpha = 1; ctx.drawImage(rules(w, h, pitch, pitch * 0.32, colour, glyphs), 0, 0);
    ctx.drawImage(rules(w, h, pitch, pitch * 0.6, colour, shade), 0, 0);
    // fade out toward the legal line
    var g = ctx.createLinearGradient(0, h * 0.88, 0, h);
    g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  band.classList.add('live');
  draw();
  // iOS fires resize as the toolbar slides; only a width change needs a redraw
  window.addEventListener('resize', function () { if (Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)) !== drawnW) draw(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
})();
