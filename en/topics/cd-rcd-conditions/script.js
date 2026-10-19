// Exact Gaussian transport and a local dual-norm energy test; no dependencies.
(function () {
  'use strict';
  function init() {
    const root = document.querySelector('.cd-page[data-lab-language]');
    if (!root || !root.querySelector('#cd-time')) return;
    const en = root.dataset.labLanguage === 'en';
    const $ = id => root.querySelector('#' + id);
    const say = (ja, english) => en ? english : ja;
    const ns = 'http://www.w3.org/2000/svg';
    const fmt = (n, places = 3) => (Math.abs(n) < 0.5 * 10 ** -places ? 0 : n).toFixed(places).replace('-', '−');
    function node(tag, attrs = {}, text) {
      const el = document.createElementNS(ns, tag);
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
      if (text !== undefined) el.textContent = text;
      return el;
    }
    function line(svg, x1, y1, x2, y2, cls) {
      svg.append(node('line', { x1, y1, x2, y2, class: cls }));
    }
    function label(svg, x, y, text, anchor = 'start') {
      svg.append(node('text', { x, y, class: 'lab-svg-label', 'text-anchor': anchor }, text));
    }
    function path(points) {
      return points.map((point, i) => (i ? 'L' : 'M') + point.map(x => x.toFixed(2)).join(',')).join(' ');
    }
    function frame(svg, titleId, title, description) {
      svg.replaceChildren(node('title', { id: titleId }, title));
      if (description) {
        const id = titleId + '-description';
        svg.append(node('desc', { id }, description));
        svg.setAttribute('aria-labelledby', titleId + ' ' + id);
      } else svg.setAttribute('aria-labelledby', titleId);
    }
    function values(kind, data) {
      for (const [name, value] of Object.entries(data)) {
        root.querySelectorAll('[data-' + kind + '-value="' + name + '"]').forEach(el => { el.textContent = value; });
      }
    }
    const inputs = {
      time: $('cd-time'), curvature: $('cd-curvature'), distance: $('cd-distance'),
      'width-start': $('cd-width-start'), 'width-end': $('cd-width-end')
    };
    function drawGaussian() {
      const t = +inputs.time.value, K = +inputs.curvature.value, distance = +inputs.distance.value;
      const s0 = +inputs['width-start'].value, s1 = +inputs['width-end'].value;
      const a0 = -distance / 2, a1 = distance / 2, at = a0 + t * distance;
      const st = (1 - t) * s0 + t * s1, w2 = distance ** 2 + (s1 - s0) ** 2;
      const entropy = u => {
        const a = a0 + u * distance, s = (1 - u) * s0 + u * s1;
        return -Math.log(s) - Math.log(2 * Math.PI * Math.E) / 2 + K * (a * a + s * s) / 2;
      };
      const e0 = entropy(0), e1 = entropy(1), chord = u => (1 - u) * e0 + u * e1;
      const bound = u => chord(u) - K * u * (1 - u) * w2 / 2;
      // Evaluate the gap analytically rather than subtracting large entropy terms.
      const gap = Math.log(st) - (1 - t) * Math.log(s0) - t * Math.log(s1);
      for (const [name, input] of Object.entries(inputs)) {
        const display = fmt(+input.value, 2);
        $('cd-' + name + '-out').textContent = display;
        input.setAttribute('aria-valuetext', display);
      }
      values('cd', { time: fmt(t, 2), mean: fmt(at, 2), width: fmt(st, 2),
        entropy: fmt(entropy(t)), bound: fmt(bound(t)), gap: fmt(gap) });
      const cloud = $('cd-cloud');
      frame(cloud, 'cd-cloud-title', say('Gaussian分布の最適輸送', 'Optimal transport of Gaussian distributions'),
        say('時刻', 'Time ') + fmt(t, 2) + say('。平均', '. Mean ') + fmt(at, 2) +
        say('、標準偏差', ', standard deviation ') + fmt(st, 2) +
        say('。上はdxに対する密度、下は同じ分位点を結ぶ粒子の道。', '. Density relative to dx above; matching-quantile particle paths below.'));
      const limit = distance / 2 + 4 * Math.max(s0, s1), x = v => 45 + (v + limit) / (2 * limit) * 410;
      const density = (v, a, s) => Math.exp(-(((v - a) / s) ** 2) / 2) / (s * Math.sqrt(2 * Math.PI));
      const peak = 1 / (Math.min(s0, s1) * Math.sqrt(2 * Math.PI)), y = v => 142 - v / peak * 103;
      line(cloud, 45, 142, 455, 142, 'lab-axis');
      line(cloud, 45, 35, 45, 142, 'lab-axis');
      label(cloud, 45, 23, 'dμ/dx');
      label(cloud, 39, 43, fmt(peak, 2), 'end');
      label(cloud, 39, 146, '0', 'end');
      for (const v of [-limit, 0, limit]) {
        line(cloud, x(v), 142, x(v), 147, 'lab-axis');
        label(cloud, x(v), 162, fmt(v, 1), 'middle');
      }
      label(cloud, 465, 145, 'x');
      const curve = (a, s) => Array.from({ length: 241 }, (_, i) => {
        const v = -limit + 2 * limit * i / 240;
        return [x(v), y(density(v, a, s))];
      });
      const current = curve(at, st);
      cloud.append(node('path', { d: path([[45, 142], ...current, [455, 142]]) + 'Z', class: 'lab-cloud-fill' }));
      for (const [a, s, cls] of [[a0, s0, 'lab-initial'], [a1, s1, 'lab-final'], [at, st, 'lab-current']]) {
        cloud.append(node('path', { d: path(curve(a, s)), class: cls }));
      }
      label(cloud, 45, 184, say('同じ分位点を追う（線は粒子の対応）', 'Matching quantiles (lines show particle pairing)'));
      const rows = [207, 247, 287];
      for (const z of [-1.8, -1.2, -.6, 0, .6, 1.2, 1.8]) {
        const positions = [x(a0 + s0 * z), x(at + st * z), x(a1 + s1 * z)];
        cloud.append(node('path', { d: path(positions.map((v, i) => [v, rows[i]])), class: 'lab-transport' }));
        positions.forEach((v, i) => cloud.append(node('circle', {
          cx: v, cy: rows[i], r: i === 1 ? 4.6 : 2.7,
          class: i === 1 ? 'lab-particle' : 'lab-end-particle'
        })));
      }
      ['μ₀', 'μₜ', 'μ₁'].forEach((text, i) => label(cloud, 16, rows[i] + 4, text));
      label(cloud, 45, 320, say('灰：出発 / 青：現在 / 金：到着（密度）', 'Density: gray start / blue now / gold end'));
      const graph = $('cd-entropy');
      frame(graph, 'cd-entropy-title', say('エントロピーとCD上界', 'Entropy and the CD bound'),
        say('実際のエントロピー', 'Actual entropy ') + fmt(entropy(t)) +
        say('、CD上界', ', CD bound ') + fmt(bound(t)) + say('、差', ', gap ') + fmt(gap) + '.');
      const samples = Array.from({ length: 161 }, (_, i) => i / 160);
      const all = samples.flatMap(u => [entropy(u), chord(u), bound(u)]);
      const low = Math.min(...all), high = Math.max(...all), pad = Math.max((high - low) * .12, .15);
      const ymin = low - pad, ymax = high + pad, gx = u => 57 + 397 * u, gy = v => 282 - (v - ymin) / (ymax - ymin) * 245;
      line(graph, 57, 37, 57, 282, 'lab-axis');
      line(graph, 57, 282, 454, 282, 'lab-axis');
      for (let i = 0; i <= 3; i++) {
        const v = ymin + (ymax - ymin) * i / 3;
        line(graph, 57, gy(v), 454, gy(v), 'lab-grid');
        label(graph, 49, gy(v) + 4, fmt(v, 2), 'end');
      }
      for (const u of [0, .5, 1]) label(graph, gx(u), 302, String(u), 'middle');
      label(graph, 57, 23, 'Ent');
      label(graph, 468, 299, 't');
      for (const [fn, cls] of [[chord, 'lab-chord'], [bound, 'lab-bound'], [entropy, 'lab-current']]) {
        graph.append(node('path', { d: path(samples.map(u => [gx(u), gy(fn(u))])), class: cls }));
      }
      line(graph, gx(t), 37, gx(t), 282, 'lab-grid');
      line(graph, gx(t), gy(entropy(t)), gx(t), gy(bound(t)), 'lab-bound');
      graph.append(node('circle', { cx: gx(t), cy: gy(bound(t)), r: 5, class: 'lab-bound-point' }));
      graph.append(node('circle', { cx: gx(t), cy: gy(entropy(t)), r: 4, class: 'lab-particle' }));
      label(graph, 255, 324, say('各図の縦軸・横軸は設定に合わせて変わる', 'Axes rescale when the parameters change'), 'middle');
    }
    const power = $('rcd-power');
    const exponents = [1, 1.5, 2, 3, Infinity];
    const powerText = n => n === Infinity ? '∞' : n === 1.5 ? '3/2' : String(n);
    function norm(v1, v2, exponent) {
      return exponent === Infinity ? Math.max(Math.abs(v1), Math.abs(v2)) :
        (Math.abs(v1) ** exponent + Math.abs(v2) ** exponent) ** (1 / exponent);
    }
    function ball(exponent) {
      return Array.from({ length: 257 }, (_, i) => {
        const angle = 2 * Math.PI * i / 256, c = Math.cos(angle), s = Math.sin(angle);
        const radius = 112 / norm(c, s, exponent);
        return [180 + radius * c, 150 - radius * s];
      });
    }
    function drawNorm() {
      const p = exponents[+power.value], q = p === 1 ? Infinity : p === Infinity ? 1 : p / (p - 1);
      const lhs = 2 ** (q === Infinity ? 0 : 2 / q), defect = lhs - 2;
      const pText = powerText(p), qText = powerText(q);
      $('rcd-power-out').textContent = 'p = ' + pText + ' / q = ' + qText;
      power.setAttribute('aria-valuetext', 'p = ' + pText + ', q = ' + qText);
      const verdict = p === 2 ? say('p=2：このエネルギーは平行四辺形則を満たす。', 'p=2: this energy satisfies the parallelogram identity.') :
        say('p≠2：この一組だけでも平行四辺形則が破れる。', 'p≠2: this single pair already violates the parallelogram identity.');
      values('rcd', { p: pText, q: qText, lhs: fmt(lhs), defect: fmt(defect), verdict });
      $('rcd-energy-bar').style.width = (lhs / 4 * 100) + '%';
      for (const [id, exponent, dual] of [['rcd-tangent', p, false], ['rcd-dual', q, true]]) {
        const svg = $(id);
        frame(svg, id + '-title', (dual ? say('双対単位球：q=', 'Dual unit ball: q=') : say('接空間の単位球：p=', 'Tangent unit ball: p=')) + powerText(exponent),
          say('破線の円はEuclid基準。', 'The dashed circle is the Euclidean reference.') +
          (dual ? say('線と点は共変ベクトルuとv。', ' Segments and points mark covectors u and v.') : ''));
        line(svg, 35, 150, 325, 150, 'lab-axis');
        line(svg, 180, 15, 180, 285, 'lab-axis');
        svg.append(node('circle', { cx: 180, cy: 150, r: 112, class: 'lab-euclid' }));
        svg.append(node('path', { d: path(ball(exponent)) + 'Z', class: dual ? 'lab-dual-ball' : 'lab-norm-ball' }));
        label(svg, 316, 169, dual ? 'ξ₁' : 'v₁');
        label(svg, 190, 25, dual ? 'ξ₂' : 'v₂');
        label(svg, 180, 298, (dual ? 'q = ' : 'p = ') + powerText(exponent), 'middle');
        if (dual) {
          for (const [x, y, name] of [[292, 150, 'u'], [180, 38, 'v']]) {
            line(svg, 180, 150, x, y, 'lab-covector');
            svg.append(node('circle', { cx: x, cy: y, r: 3, class: 'lab-bound-point' }));
            label(svg, x + 8, y + 13, name);
          }
        }
      }
    }
    for (const input of Object.values(inputs)) input.addEventListener('input', drawGaussian);
    const presets = { translation: [.5, 1, 3, 1, 1], spread: [.5, 0, 0, .4, 1.6], negative: [.5, -1, 3, .6, 1.2] };
    root.querySelectorAll('[data-cd-preset]').forEach(button => button.addEventListener('click', () => {
      const preset = presets[button.dataset.cdPreset];
      Object.values(inputs).forEach((input, i) => { input.value = preset[i]; });
      drawGaussian();
    }));
    power.addEventListener('input', drawNorm);
    drawGaussian();
    drawNorm();
    root.querySelectorAll('[data-lab-controls]').forEach(el => { el.hidden = false; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
