/* Lemma 4.1 / Theorem 1.2 of arXiv:2407.08122v1, computed live for a finite uniform measure.
   Points x_1..x_n on the line carry mass 1/n each. */
(function () {
  'use strict';

  var EPS = 1e-9;
  var DOMAIN = 12; // atoms live on [0, DOMAIN]

  /* ---------- mathematics ---------- */

  function sortedCopy(values) {
    return values.slice().sort(function (a, b) { return a - b; });
  }

  // smallest k with k/n >= alpha
  function atomsNeeded(n, alpha) {
    return Math.max(1, Math.ceil(alpha * n - EPS));
  }

  // PartDiam(mu; alpha) for the uniform measure on the given values
  function partDiam(values, alpha) {
    var s = sortedCopy(values);
    var n = s.length;
    var k = atomsNeeded(n, alpha);
    if (k <= 1) return 0;
    var best = Infinity;
    for (var i = 0; i + k - 1 < n; i++) best = Math.min(best, s[i + k - 1] - s[i]);
    return best;
  }

  // Boundaries x_1 < ... < x_N = x_inf of Lemma 4.1 (for the measure in original units).
  function boundaries(values, alpha) {
    var s = sortedCopy(values);
    var n = s.length;
    var k = atomsNeeded(n, alpha);
    var xInf = s[n - k];
    var result = [];
    var x = -Infinity;
    for (var guard = 0; guard <= n + 1; guard++) {
      var beyond = s.filter(function (v) { return v > x + EPS; });
      var candidate = beyond.length >= k ? beyond[k - 1] : Infinity;
      var next = Math.min(xInf, candidate);
      result.push(next);
      if (next >= xInf - EPS) break;
      x = next;
    }
    return result;
  }

  function mergeIntervals(list) {
    var sorted = list.slice().sort(function (p, q) { return p[0] - q[0]; });
    var merged = [];
    sorted.forEach(function (iv) {
      var last = merged[merged.length - 1];
      if (last && iv[0] <= last[1] + EPS) last[1] = Math.max(last[1], iv[1]);
      else merged.push([iv[0], iv[1]]);
    });
    return merged;
  }

  // Everything the picture needs for atoms xs, mass alpha and cap R.
  function construct(xs, alpha, R) {
    var r = partDiam(xs, alpha);
    var n = xs.length;
    var out = { r: r, n: n, alpha: alpha, R: R, t: Math.min(R, r) };
    if (r < EPS) {
      out.degenerate = true;
      out.bounds = [];
      out.N = 0;
      out.intervals = [];
      out.f = function () { return 0; };
      out.images = xs.map(function () { return 0; });
      out.pdImages = 0;
      return out;
    }
    var b = boundaries(xs, alpha);
    var intervals = mergeIntervals(b.map(function (x) { return [x - r, x + r]; }));
    var N = b.length;
    var t = out.t;
    out.bounds = b;
    out.N = N;
    out.intervals = intervals;
    out.f = function (x) {
      var covered = 0;
      for (var i = 0; i < intervals.length; i++) {
        var lo = intervals[i][0], hi = intervals[i][1];
        if (x > lo) covered += Math.min(x, hi) - lo;
      }
      return t * (-N + covered / r);
    };
    out.images = xs.map(out.f);
    out.pdImages = partDiam(out.images, alpha);
    return out;
  }

  // Comparison: shrink everything uniformly so that the atoms fit into [-R, R].
  function uniformShrink(xs, alpha, R) {
    var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
    var spread = hi - lo;
    var lambda = spread > 0 ? Math.min(1, (2 * R) / spread) : 1;
    var mid = (lo + hi) / 2;
    var images = xs.map(function (x) { return lambda * (x - mid); });
    return { lambda: lambda, images: images, pd: partDiam(images, alpha) };
  }

  /* ---------- text ---------- */

  var TEXT = {
    ja: {
      alpha: '残す質量 α', cap: '上限 R', count: '点の数',
      presets: '例', four: '四点の例', cluster: '集まりと孤立', random: 'ランダム',
      play: 'α を動かす', stop: '止める', compare: '一様に縮めた場合を重ねる',
      stage: '入力の数直線',
      r: '元の部分直径 r', N: '境界の数 N', Nbound: '上限 1/α', range: '値域', target: '像の部分直径',
      targetNote: '目標 min{R, r}', uniform: '一様縮小の像の部分直径', bounded: '値域は [−R/α, R/α] の内側',
      okEq: '像の部分直径は目標と一致する', degenerate: 'r = 0 なので、f は定数写像になる',
      slopeNote: '保護した区間の傾き', atom: function (i, x) { return '点 ' + (i + 1) + '、位置 ' + x.toFixed(2); },
      svgLabel: '点を動かすと、境界、傾きを保つ区間、写像、像の部分直径が更新される図',
      controls: '操作',
      screenEdge: '画面の端 ±R/α', screen: '像', input: '入力'
    },
    en: {
      alpha: 'Mass to keep α', cap: 'Cap R', count: 'Number of points',
      presets: 'Examples', four: 'Four points', cluster: 'Cluster and outliers', random: 'Random',
      play: 'Sweep α', stop: 'Stop', compare: 'Overlay uniform shrinking',
      stage: 'Input line',
      r: 'Partial diameter r', N: 'Number of boundaries N', Nbound: 'Bound 1/α', range: 'Range', target: 'Partial diameter of the image',
      targetNote: 'target min{R, r}', uniform: 'Partial diameter after uniform shrinking', bounded: 'range lies inside [−R/α, R/α]',
      okEq: 'the image partial diameter equals the target', degenerate: 'r = 0, so f is constant',
      slopeNote: 'slope on protected intervals', atom: function (i, x) { return 'Point ' + (i + 1) + ', position ' + x.toFixed(2); },
      svgLabel: 'Moving the points updates the boundaries, the slope-preserving intervals, the map and the image partial diameter',
      controls: 'Controls',
      screenEdge: 'screen edge ±R/α', screen: 'image', input: 'input'
    }
  };

  /* ---------- drawing ---------- */

  var NS = 'http://www.w3.org/2000/svg';
  var W, H, LEFT, PLOT_W, TOP, BOTTOM, AXIS_Y, SCREEN_X;
  function setLayout(compact) {
    if (compact) { W = 420; H = 560; LEFT = 28; PLOT_W = 330; TOP = 26; BOTTOM = 420; AXIS_Y = 468; SCREEN_X = 392; }
    else { W = 680; H = 410; LEFT = 56; PLOT_W = 520; TOP = 16; BOTTOM = 330; AXIS_Y = 366; SCREEN_X = 618; }
  }
  setLayout(false);
  var counter = 0;

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  function html(name, attrs, parent, text) {
    var node = document.createElement(name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  function mount(figure) {
    var lang = figure.getAttribute('data-lang') === 'en' ? 'en' : 'ja';
    var T = TEXT[lang];
    var stage = figure.querySelector('.widget-stage');
    if (!stage) return;
    var id = 'obs' + (++counter);

    var state = { xs: [1, 2, 3, 4], alpha: 0.5, R: 1, compare: false, timer: null };

    stage.textContent = '';
    stage.classList.add('is-live');

    var controls = html('div', { 'class': 'w-controls', role: 'group', 'aria-label': T.controls }, stage);
    function slider(label, min, max, step, key, fmt) {
      var wrap = html('label', { 'class': 'w-control', 'for': id + key }, controls);
      var caption = html('span', {}, wrap);
      var input = html('input', { type: 'range', id: id + key, min: min, max: max, step: step }, wrap);
      input.value = state[key];
      function show() {
        caption.textContent = label + ' = ' + fmt(state[key]);
        input.setAttribute('aria-valuetext', fmt(state[key]));
      }
      input.addEventListener('input', function () {
        state[key] = parseFloat(input.value);
        show();
        redraw();
      });
      show();
      return { input: input, show: show };
    }
    var alphaCtl = slider(T.alpha, 0.2, 0.9, 0.05, 'alpha', function (v) { return v.toFixed(2); });
    var capCtl = slider(T.cap, 0.5, 4, 0.25, 'R', function (v) { return v.toFixed(2); });

    var row = html('div', { 'class': 'w-row' }, controls);
    var countLabel = html('label', { 'class': 'w-control inline', 'for': id + 'n' }, row);
    html('span', {}, countLabel, T.count);
    var countSel = html('select', { id: id + 'n' }, countLabel);
    for (var c = 3; c <= 8; c++) html('option', { value: c }, countSel, String(c));
    countSel.value = String(state.xs.length);

    var presetBox = html('span', { 'class': 'w-presets', role: 'group', 'aria-label': T.presets }, row);
    function preset(label, fn) {
      var b = html('button', { type: 'button' }, presetBox, label);
      b.addEventListener('click', function () { stopPlay(); fn(); syncControls(); redraw(); });
    }
    preset(T.four, function () { state.xs = [1, 2, 3, 4]; state.alpha = 0.5; state.R = 1; });
    preset(T.cluster, function () { state.xs = [1, 1.3, 1.6, 6, 6.4, 10.5]; state.alpha = 0.5; state.R = 1; });
    preset(T.random, function () {
      var m = state.xs.length;
      state.xs = [];
      for (var i = 0; i < m; i++) state.xs.push(Math.round(Math.random() * DOMAIN * 20) / 20);
    });
    var playBtn = html('button', { type: 'button', 'class': 'w-play' }, row, T.play);
    var compareLabel = html('label', { 'class': 'w-check' }, row);
    var compareBox = html('input', { type: 'checkbox' }, compareLabel);
    html('span', {}, compareLabel, T.compare);

    function syncControls() {
      alphaCtl.input.value = state.alpha; alphaCtl.show();
      capCtl.input.value = state.R; capCtl.show();
      countSel.value = String(state.xs.length);
    }

    countSel.addEventListener('change', function () {
      var m = parseInt(countSel.value, 10);
      while (state.xs.length > m) state.xs.pop();
      while (state.xs.length < m) state.xs.push(Math.round(Math.random() * DOMAIN * 20) / 20);
      redraw();
    });
    compareBox.addEventListener('change', function () { state.compare = compareBox.checked; redraw(); });

    function stopPlay() {
      if (state.timer) { cancelAnimationFrame(state.timer); state.timer = null; }
      playBtn.textContent = T.play;
    }
    playBtn.addEventListener('click', function () {
      if (state.timer) { stopPlay(); return; }
      playBtn.textContent = T.stop;
      var direction = 1;
      (function step() {
        state.alpha += direction * 0.0035;
        if (state.alpha >= 0.9) { state.alpha = 0.9; direction = -1; }
        if (state.alpha <= 0.2) { state.alpha = 0.2; direction = 1; }
        alphaCtl.input.value = state.alpha; alphaCtl.show();
        redraw();
        state.timer = requestAnimationFrame(step);
      })();
    });

    /* svg */
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H, role: 'group', 'aria-label': T.svgLabel, 'class': 'w-svg', focusable: 'false'
    }, null);
    var compactNow = false;
    function applyLayout() {
      var compact = stage.clientWidth > 0 && stage.clientWidth < 520;
      if (compact === compactNow && svg.getAttribute('viewBox')) { return false; }
      compactNow = compact;
      setLayout(compact);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.classList.toggle('compact', compact);
      return true;
    }
    stage.appendChild(svg);
    var bandLayer = el('g', {}, svg);
    var axisLayer = el('g', {}, svg);
    var guideLayer = el('g', {}, svg);
    var curveLayer = el('g', {}, svg);
    var markLayer = el('g', {}, svg);
    var atomLayer = el('g', {}, svg);

    var atomNodes = [];
    function ensureAtoms() {
      while (atomNodes.length < state.xs.length) {
        var index = atomNodes.length;
        var node = el('circle', { r: 8, 'class': 'w-atom', tabindex: 0, role: 'slider', 'aria-valuemin': 0, 'aria-valuemax': DOMAIN }, atomLayer);
        bindAtom(node, index);
        atomNodes.push(node);
      }
      while (atomNodes.length > state.xs.length) atomLayer.removeChild(atomNodes.pop());
    }
    function px(x) { return LEFT + (x / DOMAIN) * PLOT_W; }
    function bindAtom(node, index) {
      function setX(x) {
        state.xs[index] = Math.min(DOMAIN, Math.max(0, Math.round(x * 100) / 100));
        redraw();
      }
      node.addEventListener('pointerdown', function (event) {
        stopPlay();
        node.setPointerCapture(event.pointerId);
        node.classList.add('dragging');
        event.preventDefault();
      });
      node.addEventListener('pointermove', function (event) {
        if (!node.hasPointerCapture(event.pointerId)) return;
        var rect = svg.getBoundingClientRect();
        var scale = W / rect.width;
        setX(((event.clientX - rect.left) * scale - LEFT) / PLOT_W * DOMAIN);
      });
      function release(event) {
        if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
        node.classList.remove('dragging');
      }
      node.addEventListener('pointerup', release);
      node.addEventListener('pointercancel', release);
      node.addEventListener('keydown', function (event) {
        var step = event.shiftKey ? 0.5 : 0.1;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { setX(state.xs[index] - step); event.preventDefault(); }
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { setX(state.xs[index] + step); event.preventDefault(); }
      });
    }

    /* readout */
    var readout = html('ul', { 'class': 'w-readout', 'aria-live': 'polite' }, stage);

    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    function redraw() {
      compactNow = !(stage.clientWidth > 0 && stage.clientWidth < 520);
      applyLayout();
      var m = construct(state.xs, state.alpha, state.R);
      var shrink = uniformShrink(state.xs, state.alpha, state.R);
      var half = state.R / state.alpha;
      var domainY = half * 1.08;
      var cy = (TOP + BOTTOM) / 2, hh = (BOTTOM - TOP) / 2;
      function py(v) { return cy - (v / domainY) * hh; }

      ensureAtoms();
      [bandLayer, axisLayer, guideLayer, curveLayer, markLayer].forEach(clear);

      // protected intervals
      m.intervals.forEach(function (iv) {
        var a = Math.max(0, iv[0]), b = Math.min(DOMAIN, iv[1]);
        if (b > a) el('rect', { x: px(a), y: TOP, width: px(b) - px(a), height: BOTTOM - TOP, 'class': 'w-band' }, bandLayer);
      });

      // axes
      el('line', { x1: LEFT, x2: LEFT + PLOT_W, y1: AXIS_Y, y2: AXIS_Y, 'class': 'w-axis' }, axisLayer);
      el('line', { x1: SCREEN_X, x2: SCREEN_X, y1: TOP, y2: BOTTOM, 'class': 'w-axis' }, axisLayer);
      [half, -half].forEach(function (v) {
        el('line', { x1: LEFT, x2: SCREEN_X + 12, y1: py(v), y2: py(v), 'class': 'w-edge' }, axisLayer);
      });
      var edge = el('text', { x: LEFT + 4, y: py(half) - 5, 'class': 'w-label' }, axisLayer);
      edge.textContent = T.screenEdge;
      var zero = el('line', { x1: SCREEN_X - 6, x2: SCREEN_X + 6, y1: py(0), y2: py(0), 'class': 'w-axis' }, axisLayer);
      zero.setAttribute('aria-hidden', 'true');
      var inLabel = el('text', { x: LEFT, y: AXIS_Y + 34, 'class': 'w-label' }, axisLayer);
      inLabel.textContent = T.stage;
      var outLabel = el('text', { x: SCREEN_X, y: TOP - 4, 'class': 'w-label', 'text-anchor': 'middle' }, axisLayer);
      outLabel.textContent = T.screen;
      for (var tick = 0; tick <= DOMAIN; tick += 2) {
        el('line', { x1: px(tick), x2: px(tick), y1: AXIS_Y, y2: AXIS_Y + 5, 'class': 'w-axis' }, axisLayer);
        var tl = el('text', { x: px(tick), y: AXIS_Y + 18, 'class': 'w-label', 'text-anchor': 'middle' }, axisLayer);
        tl.textContent = String(tick);
      }

      // curve
      var cuts = [0, DOMAIN];
      m.intervals.forEach(function (iv) {
        if (iv[0] > 0 && iv[0] < DOMAIN) cuts.push(iv[0]);
        if (iv[1] > 0 && iv[1] < DOMAIN) cuts.push(iv[1]);
      });
      cuts.sort(function (a, b) { return a - b; });
      for (var i = 0; i + 1 < cuts.length; i++) {
        var x0 = cuts[i], x1 = cuts[i + 1];
        if (x1 - x0 < 1e-12) continue;
        var mid = (x0 + x1) / 2;
        var protectedPiece = m.intervals.some(function (iv) { return mid > iv[0] && mid < iv[1]; });
        el('line', {
          x1: px(x0), y1: py(m.f(x0)), x2: px(x1), y2: py(m.f(x1)),
          'class': protectedPiece ? 'w-curve kept' : 'w-curve flat'
        }, curveLayer);
      }

      // boundaries
      m.bounds.forEach(function (b, idx) {
        el('path', { d: 'M' + px(b) + ',' + (AXIS_Y - 2) + ' l-6,-11 l12,0 z', 'class': 'w-boundary' }, markLayer);
        var bl = el('text', { x: px(b), y: AXIS_Y - 17, 'class': 'w-label', 'text-anchor': 'middle' }, markLayer);
        bl.textContent = 'x' + String(idx + 1).replace(/[0-9]/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; });
      });

      // guides, images
      state.xs.forEach(function (x, idx) {
        var fx = m.f(x);
        el('line', { x1: px(x), y1: AXIS_Y, x2: px(x), y2: py(fx), 'class': 'w-guide' }, guideLayer);
        el('line', { x1: px(x), y1: py(fx), x2: SCREEN_X, y2: py(fx), 'class': 'w-guide' }, guideLayer);
        el('circle', { cx: SCREEN_X, cy: py(fx), r: 4, 'class': 'w-image' }, markLayer);
        if (state.compare) {
          var gy = py(shrink.images[idx]);
          el('circle', { cx: SCREEN_X + 22, cy: gy, r: 3.5, 'class': 'w-shrunk' }, markLayer);
        }
        var node = atomNodes[idx];
        node.setAttribute('cx', px(x));
        node.setAttribute('cy', AXIS_Y);
        node.setAttribute('aria-valuenow', x.toFixed(2));
        node.setAttribute('aria-label', T.atom(idx, x));
      });

      // readout
      clear(readout);
      function line(label, value, note) {
        var li = html('li', {}, readout);
        html('span', { 'class': 'k' }, li, label);
        html('span', { 'class': 'v' }, li, value);
        if (note) html('span', { 'class': 'note' }, li, note);
      }
      var lo = Math.min.apply(null, m.images), hi = Math.max.apply(null, m.images);
      line(T.r, m.r.toFixed(3));
      if (m.degenerate) {
        line(T.target, '0', T.degenerate);
      } else {
        line(T.N, String(m.N), T.Nbound + ' = ' + (1 / state.alpha).toFixed(2));
        line(T.range, '[' + lo.toFixed(2) + ', ' + hi.toFixed(2) + ']', T.bounded + ' = [' + (-half).toFixed(2) + ', ' + half.toFixed(2) + ']');
        var ok = Math.abs(m.pdImages - m.t) < 1e-7;
        line(T.target, m.pdImages.toFixed(3), T.targetNote + ' = ' + m.t.toFixed(3) + (ok ? ' — ' + T.okEq : ''));
        line(T.slopeNote, (m.t / m.r).toFixed(3));
      }
      if (state.compare) line(T.uniform, shrink.pd.toFixed(3));
    }

    redraw();
    if (typeof ResizeObserver !== 'undefined') {
      var lastCompact = compactNow;
      new ResizeObserver(function () {
        var compact = stage.clientWidth > 0 && stage.clientWidth < 520;
        if (compact !== lastCompact) { lastCompact = compact; redraw(); }
      }).observe(stage);
    }
  }

  function init() {
    var nodes = document.querySelectorAll('figure.widget[data-widget="obs-bounded-screen"]');
    Array.prototype.forEach.call(nodes, mount);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { partDiam: partDiam, boundaries: boundaries, construct: construct, uniformShrink: uniformShrink };
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
