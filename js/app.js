/**
 * SILICON — Minimalist Interactive LaTeX Research Monograph
 * Author: Thomas Koetting (tkoetting03)
 * Full Interactive Engine: OpAmp Verilog, Game Theory Solver, PID Response, Ring Buffer, TeX Compiler
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeAndLayout();
  initKaTeXAutoRender();
  initOpAmpSimulator();
  initGameTheorySimulator();
  initPIDSimulator();
  initRingBufferSimulator();
  initCircuitTabs();
  initCitationTooltips();
  initCatalogFilters();
  initBibTeXModal();
  initTerminalRecompile();
});

/* ==========================================================================
   1. Theme & Layout Switcher
   ========================================================================== */
function initThemeAndLayout() {
  const root = document.documentElement;
  
  // Theme buttons
  const themeBtns = document.querySelectorAll('[data-set-theme]');
  const savedTheme = localStorage.getItem('silicon_theme') || 'paper';
  root.setAttribute('data-theme', savedTheme);
  updateActiveBtn(themeBtns, savedTheme, 'data-set-theme');

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-set-theme');
      root.setAttribute('data-theme', theme);
      localStorage.setItem('silicon_theme', theme);
      updateActiveBtn(themeBtns, theme, 'data-set-theme');
      // Re-render canvases to match theme colors
      window.dispatchEvent(new Event('themechange'));
    });
  });

  // Layout buttons
  const layoutBtns = document.querySelectorAll('[data-set-layout]');
  const savedLayout = localStorage.getItem('silicon_layout') || 'twocolumn';
  root.setAttribute('data-layout', savedLayout);
  updateActiveBtn(layoutBtns, savedLayout, 'data-set-layout');

  layoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const layout = btn.getAttribute('data-set-layout');
      root.setAttribute('data-layout', layout);
      localStorage.setItem('silicon_layout', layout);
      updateActiveBtn(layoutBtns, layout, 'data-set-layout');
      window.dispatchEvent(new Event('resize'));
    });
  });
}

function updateActiveBtn(buttons, value, attr) {
  buttons.forEach(b => {
    if (b.getAttribute(attr) === value) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
}

/* ==========================================================================
   2. KaTeX Auto-Render Initializer
   ========================================================================== */
function initKaTeXAutoRender() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  } else {
    // If KaTeX hasn't loaded yet, poll briefly
    setTimeout(initKaTeXAutoRender, 150);
  }
}

/* ==========================================================================
   3. Interactive Figure 1: Verilog OpAmp Logic & Oscilloscope Simulator
   ========================================================================== */
function initOpAmpSimulator() {
  const vinSlider = document.getElementById('opamp-vin-slider');
  const vinBadge = document.getElementById('opamp-vin-val');
  const gainSlider = document.getElementById('opamp-gain-slider');
  const gainBadge = document.getElementById('opamp-gain-val');
  const stepBtn = document.getElementById('opamp-step-btn');
  const runBtn = document.getElementById('opamp-run-btn');
  const resetBtn = document.getElementById('opamp-reset-btn');
  const canvas = document.getElementById('opamp-canvas');
  const stepsContainer = document.getElementById('opamp-steps-grid');
  const voutReadout = document.getElementById('opamp-vout-readout');
  const statusReadout = document.getElementById('opamp-status-readout');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let Vin = parseFloat(vinSlider ? vinSlider.value : 1.2);
  let Gain = parseInt(gainSlider ? gainSlider.value : 4, 10);
  const MAX_GAIN = 8;
  let currentStep = 0;
  let Vout = 0;
  let isRunning = false;
  let runInterval = null;
  let phase = 0;

  // Render initial grid of 8 iteration steps
  function renderStepCells() {
    if (!stepsContainer) return;
    stepsContainer.innerHTML = '';
    for (let i = 0; i < MAX_GAIN; i++) {
      const cell = document.createElement('div');
      cell.className = 'logic-step-cell';
      cell.id = `opamp-step-${i}`;
      cell.innerHTML = `<div>i=${i}</div><div style="font-size:0.6rem; opacity:0.8;">${i < Gain ? '+' + Vin.toFixed(1) + 'V' : '+0.0V'}</div>`;
      if (i < currentStep) {
        if (i < Gain) cell.classList.add('accumulated');
      } else if (i === currentStep && isRunning) {
        cell.classList.add('active-step');
      }
      stepsContainer.appendChild(cell);
    }
  }

  function updateReadouts() {
    if (vinBadge) vinBadge.textContent = Vin.toFixed(1) + ' V';
    if (gainBadge) gainBadge.textContent = Gain;
    if (voutReadout) voutReadout.textContent = `Vout = ${Vout.toFixed(2)} V`;
    if (statusReadout) {
      if (currentStep >= MAX_GAIN) {
        statusReadout.textContent = `Cycle Complete (Total Gain: ${Gain}x)`;
      } else {
        const condition = currentStep < Gain ? `TRUE: +${Vin.toFixed(1)}V` : `FALSE: +0V`;
        statusReadout.textContent = `Step i=${currentStep}: (i < Gain) is ${condition}`;
      }
    }
  }

  function drawOscilloscope() {
    // High DPI scaling
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    const w = canvas.width;
    const h = canvas.height;

    // Background & CRT Graticule
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (classic oscilloscope reticle)
    ctx.strokeStyle = 'rgba(40, 70, 60, 0.35)';
    ctx.lineWidth = 1;
    const divX = 8;
    const divY = 6;
    for (let x = 0; x <= w; x += w / divX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += h / divY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center crosshairs with subdivision tick marks
    ctx.strokeStyle = 'rgba(50, 100, 80, 0.6)';
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // 1. Draw Input Signal Waveform Vin (Phosphor Green)
    ctx.strokeStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const midY = h / 2;
    const scaleY = h / 14;
    for (let x = 0; x < w; x++) {
      const t = (x / w) * 4 * Math.PI + phase;
      const y = midY - Math.sin(t) * (Vin * scaleY);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Draw Output Waveform Vout (Amber / Gold Beam)
    ctx.strokeStyle = '#ffb300';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const t = (x / w) * 4 * Math.PI + phase;
      const y = midY - Math.sin(t) * (Vout * scaleY);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset blur

    // Legend on Canvas
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff66';
    ctx.fillText(`CH1 (Vin): ${Vin.toFixed(1)}V`, 12, 18);
    ctx.fillStyle = '#ffb300';
    ctx.fillText(`CH2 (Vout): ${Vout.toFixed(2)}V (${(Vout / (Vin || 1)).toFixed(1)}x)`, 12, 32);

    phase += 0.04;
    requestAnimationFrame(drawOscilloscope);
  }

  function stepClock() {
    if (currentStep < MAX_GAIN) {
      if (currentStep < Gain) {
        Vout += Vin;
      }
      currentStep++;
    } else {
      // Loop complete
      currentStep = 0;
      Vout = 0;
    }
    renderStepCells();
    updateReadouts();
  }

  function startAutoRun() {
    if (isRunning) {
      clearInterval(runInterval);
      isRunning = false;
      if (runBtn) runBtn.textContent = '▶ Auto Clock';
      renderStepCells();
      return;
    }
    isRunning = true;
    if (runBtn) runBtn.textContent = '⏸ Pause';
    runInterval = setInterval(() => {
      stepClock();
      if (currentStep >= MAX_GAIN) {
        // Pause briefly at end of cycle
        clearInterval(runInterval);
        setTimeout(() => {
          if (isRunning) {
            currentStep = 0;
            Vout = 0;
            renderStepCells();
            updateReadouts();
            runInterval = setInterval(stepClock, 220);
          }
        }, 800);
      }
    }, 220);
  }

  function resetOpAmp() {
    clearInterval(runInterval);
    isRunning = false;
    currentStep = 0;
    Vout = 0;
    if (runBtn) runBtn.textContent = '▶ Auto Clock';
    renderStepCells();
    updateReadouts();
  }

  if (vinSlider) {
    vinSlider.addEventListener('input', (e) => {
      Vin = parseFloat(e.target.value);
      // Recalculate Vout according to current accumulated steps
      let count = Math.min(currentStep, Gain);
      Vout = count * Vin;
      renderStepCells();
      updateReadouts();
    });
  }

  if (gainSlider) {
    gainSlider.addEventListener('input', (e) => {
      Gain = parseInt(e.target.value, 10);
      let count = Math.min(currentStep, Gain);
      Vout = count * Vin;
      renderStepCells();
      updateReadouts();
    });
  }

  if (stepBtn) stepBtn.addEventListener('click', stepClock);
  if (runBtn) runBtn.addEventListener('click', startAutoRun);
  if (resetBtn) resetBtn.addEventListener('click', resetOpAmp);

  renderStepCells();
  updateReadouts();
  drawOscilloscope();
}

/* ==========================================================================
   4. Interactive Figure 2: Game-Theoretic Security Payoff Simulator (Eq. 1-4)
   ========================================================================== */
function initGameTheorySimulator() {
  const vSlider = document.getElementById('gt-v-slider');
  const vBadge = document.getElementById('gt-v-val');
  const mSlider = document.getElementById('gt-m-slider');
  const mBadge = document.getElementById('gt-m-val');
  const ycSlider = document.getElementById('gt-yc-slider');
  const ycBadge = document.getElementById('gt-yc-val');
  const xcSlider = document.getElementById('gt-xc-slider');
  const xcBadge = document.getElementById('gt-xc-val');

  const canvas = document.getElementById('gametheory-canvas');
  const payoffReadout = document.getElementById('gt-payoff-readout');
  const riskReadout = document.getElementById('gt-risk-readout');
  const eqReadout = document.getElementById('gt-eq-readout');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function renderGT() {
    const V = parseFloat(vSlider ? vSlider.value : 4.0);
    const M = parseFloat(mSlider ? mSlider.value : 10.0);
    const yc = parseFloat(ycSlider ? ycSlider.value : 6.0);
    const xc = parseFloat(xcSlider ? xcSlider.value : 4.5);

    if (vBadge) vBadge.textContent = V.toFixed(1);
    if (mBadge) mBadge.textContent = M.toFixed(1);
    if (ycBadge) ycBadge.textContent = yc.toFixed(1);
    if (xcBadge) xcBadge.textContent = xc.toFixed(1);

    // High DPI scaling
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    const w = canvas.width;
    const h = canvas.height;

    // LaTeX Monograph styling for graph
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDark ? '#15181e' : '#fafafa';
    const axisColor = isDark ? '#7a828e' : '#222222';
    const gridColor = isDark ? '#232832' : '#e6e6e6';
    const textColor = isDark ? '#e6e8eb' : '#111111';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Padding for axes
    const padL = 48;
    const padR = 24;
    const padT = 24;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Grid lines & Axis ticks
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (plotH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      const x = padL + (plotW / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Y-Axis
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    // X-Axis
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Calculate Game-Theoretic Functions:
    // Eq (2): Q'' = 2/(5M) * ((V+M) + sqrt((V+M)^2 - 5VM))
    const disc = Math.max(0, Math.pow(V + M, 2) - 5 * V * M);
    const Q_base = (2 / (5 * M)) * ((V + M) + Math.sqrt(disc));

    // Eq (1): pP|R = fP / (1 + NL * [yc - xc]+)
    const NL = 1.2;
    const fP = 0.95;
    const breachRisk = fP / (1.0 + NL * Math.max(0, yc - xc));

    // Eq (3): Payoff pi'' as function of defense xc
    // pi(xc) = (2M - 8V)/(25M) * ((V+M) + sqrt(disc)) - V/5 + securityGain(xc) - cost(xc)
    function calcPayoff(x) {
      const basePayoff = ((2 * M - 8 * V) / (25 * M)) * ((V + M) + Math.sqrt(disc)) - V / 5;
      const defenseEffect = 3.8 * (1 - Math.exp(-0.45 * x));
      const costRate = 0.22 * x;
      return basePayoff + defenseEffect - costRate;
    }

    // Optimal Nash Equilibrium xc*
    // Derivative: 3.8 * 0.45 * exp(-0.45 * x*) = 0.22 => exp(-0.45 x*) = 0.22 / 1.71 = 0.1286
    const xStar = Math.max(0, -Math.log(0.22 / 1.71) / 0.45);
    const piStar = calcPayoff(xStar);
    const currentPayoff = calcPayoff(xc);

    if (payoffReadout) payoffReadout.textContent = `Payoff π'' = ${currentPayoff.toFixed(3)}`;
    if (riskReadout) riskReadout.textContent = `Breach Risk p_{P|R} = ${(breachRisk * 100).toFixed(1)}%`;
    if (eqReadout) eqReadout.textContent = `Nash Equilibrium: x* = ${xStar.toFixed(2)} hrs (π* = ${piStar.toFixed(2)})`;

    // Determine scale for plotting xc in [0, 15]
    const maxX = 15;
    const minY = -1.5;
    const maxY = 4.5;

    function toScreenX(valX) {
      return padL + (valX / maxX) * plotW;
    }
    function toScreenY(valY) {
      return padT + plotH - ((valY - minY) / (maxY - minY)) * plotH;
    }

    // Draw Breach Probability Curve (dashed red)
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let px = 0; px <= plotW; px += 3) {
      const valX = (px / plotW) * maxX;
      const risk = fP / (1.0 + NL * Math.max(0, yc - valX));
      // Map risk [0, 1] to plot scale
      const py = toScreenY(risk * 3.5);
      if (px === 0) ctx.moveTo(padL + px, py);
      else ctx.lineTo(padL + px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Payoff Curve π''(xc) (solid royal blue)
    ctx.strokeStyle = isDark ? '#64b5f6' : '#003366';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let px = 0; px <= plotW; px += 2) {
      const valX = (px / plotW) * maxX;
      const valY = calcPayoff(valX);
      const py = toScreenY(valY);
      if (px === 0) ctx.moveTo(padL + px, py);
      else ctx.lineTo(padL + px, py);
    }
    ctx.stroke();

    // Mark Nash Equilibrium (x*, pi*)
    const eqScreenX = toScreenX(xStar);
    const eqScreenY = toScreenY(piStar);
    ctx.strokeStyle = '#2e7d32';
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(eqScreenX, eqScreenY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Dashed lines to axis for Nash equilibrium
    ctx.strokeStyle = '#2e7d32';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(eqScreenX, eqScreenY);
    ctx.lineTo(eqScreenX, padT + plotH);
    ctx.moveTo(eqScreenX, eqScreenY);
    ctx.lineTo(padL, eqScreenY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Mark Current Selected xc point (Amber ring)
    const curScreenX = toScreenX(xc);
    const curScreenY = toScreenY(currentPayoff);
    ctx.fillStyle = '#f57c00';
    ctx.beginPath();
    ctx.arc(curScreenX, curScreenY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Labels & TeX Typography on Canvas
    ctx.font = '11px "Computer Modern Serif", "Times New Roman", serif';
    ctx.fillStyle = textColor;
    ctx.fillText('Defense Allocation xc (dev-hours)', padL + plotW / 2 - 80, h - 10);

    ctx.save();
    ctx.translate(16, padT + plotH / 2 + 25);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Defender Payoff π / Breach Risk', 0, 0);
    ctx.restore();

    // Legend
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = isDark ? '#64b5f6' : '#003366';
    ctx.fillText("— Payoff π''(xc)", padL + 12, padT + 16);
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('-- Risk pP|R', padL + 120, padT + 16);
    ctx.fillStyle = '#2e7d32';
    ctx.fillText('● Nash Eq. (x*)', padL + 210, padT + 16);
  }

  [vSlider, mSlider, ycSlider, xcSlider].forEach(slider => {
    if (slider) slider.addEventListener('input', renderGT);
  });

  window.addEventListener('themechange', renderGT);
  window.addEventListener('resize', renderGT);
  renderGT();
}

/* ==========================================================================
   5. Interactive Figure 3: Closed-Loop PID Step Response Simulator (Eq. 8)
   ========================================================================== */
function initPIDSimulator() {
  const kpSlider = document.getElementById('pid-kp-slider');
  const kpBadge = document.getElementById('pid-kp-val');
  const kiSlider = document.getElementById('pid-ki-slider');
  const kiBadge = document.getElementById('pid-ki-val');
  const kdSlider = document.getElementById('pid-kd-slider');
  const kdBadge = document.getElementById('pid-kd-val');
  const stepBtn = document.getElementById('pid-pulse-btn');

  const canvas = document.getElementById('pid-canvas');
  const metricsReadout = document.getElementById('pid-metrics-readout');

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function simulatePID() {
    const Kp = parseFloat(kpSlider ? kpSlider.value : 3.2);
    const Ki = parseFloat(kiSlider ? kiSlider.value : 0.8);
    const Kd = parseFloat(kdSlider ? kdSlider.value : 1.2);

    if (kpBadge) kpBadge.textContent = Kp.toFixed(1);
    if (kiBadge) kiBadge.textContent = Ki.toFixed(1);
    if (kdBadge) kdBadge.textContent = Kd.toFixed(1);

    // High DPI scaling
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    const w = canvas.width;
    const h = canvas.height;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDark ? '#15181e' : '#fafafa';
    const axisColor = isDark ? '#7a828e' : '#222222';
    const gridColor = isDark ? '#232832' : '#e6e6e6';
    const textColor = isDark ? '#e6e8eb' : '#111111';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    const padL = 44;
    const padR = 24;
    const padT = 24;
    const padB = 38;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (plotH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      const x = padL + (plotW / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Numerical integration of 2nd order plant:
    // Plant: m * y'' + c * y' + k * y = u(t)
    // where m=1, c=0.8, k=1.0
    const dt = 0.02;
    const totalTime = 10.0;
    const steps = Math.floor(totalTime / dt);
    const setpoint = 1.0;

    let y = 0;
    let y_dot = 0;
    let integral = 0;
    let prev_error = setpoint - y;

    const trajectory = [];
    let peakY = 0;
    let riseTime = null;
    let settlingTime = null;

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      const error = setpoint - y;
      integral += error * dt;
      // Clamp integral windup
      integral = Math.max(-5, Math.min(5, integral));
      const derivative = (error - prev_error) / dt;
      prev_error = error;

      // PID Control law Eq (8)
      const u = Kp * error + Ki * integral + Kd * derivative;

      // Plant acceleration: y'' = (u - c*y' - k*y) / m
      const y_ddot = u - 0.8 * y_dot - 1.0 * y;
      y_dot += y_ddot * dt;
      y += y_dot * dt;

      trajectory.push({ t, y });

      if (y > peakY) peakY = y;
      if (riseTime === null && y >= 0.9 * setpoint) riseTime = t;
      if (Math.abs(y - setpoint) > 0.05 * setpoint) settlingTime = t;
    }

    const overshootPercent = Math.max(0, ((peakY - setpoint) / setpoint) * 100);
    const steadyStateError = Math.abs(setpoint - trajectory[trajectory.length - 1].y);

    if (metricsReadout) {
      metricsReadout.textContent = `Overshoot Mp: ${overshootPercent.toFixed(1)}% | Rise Time tr: ${riseTime ? riseTime.toFixed(2) + 's' : '>10s'} | Settling ts: ${settlingTime ? settlingTime.toFixed(2) + 's' : 'stable'} | ess: ${steadyStateError.toFixed(3)}`;
    }

    const maxY = 2.0;
    function toScreenX(t) { return padL + (t / totalTime) * plotW; }
    function toScreenY(val) { return padT + plotH - (val / maxY) * plotH; }

    // Target Setpoint Reference line (dashed grey)
    ctx.strokeStyle = isDark ? '#888' : '#666';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, toScreenY(setpoint));
    ctx.lineTo(padL + plotW, toScreenY(setpoint));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Response curve y(t)
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    trajectory.forEach((pt, idx) => {
      const sx = toScreenX(pt.t);
      const sy = toScreenY(pt.y);
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();

    // Labels
    ctx.font = '11px "Computer Modern Serif", "Times New Roman", serif';
    ctx.fillStyle = textColor;
    ctx.fillText('Time t (seconds)', padL + plotW / 2 - 45, h - 8);

    ctx.save();
    ctx.translate(14, padT + plotH / 2 + 25);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Output Response y(t)', 0, 0);
    ctx.restore();

    // Legend
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('-- Setpoint r(t)=1.0', padL + 10, padT + 14);
    ctx.fillStyle = '#0066cc';
    ctx.fillText('— Closed-Loop Response y(t)', padL + 160, padT + 14);
  }

  [kpSlider, kiSlider, kdSlider].forEach(slider => {
    if (slider) slider.addEventListener('input', simulatePID);
  });

  if (stepBtn) {
    stepBtn.addEventListener('click', () => {
      // Small pulse animation
      simulatePID();
    });
  }

  window.addEventListener('themechange', simulatePID);
  window.addEventListener('resize', simulatePID);
  simulatePID();
}

/* ==========================================================================
   6. Interactive Figure 4: Lock-Free Circular Ring Buffer Machine
   ========================================================================== */
function initRingBufferSimulator() {
  const container = document.getElementById('ring-slots-container');
  const pushBtn = document.getElementById('rb-push-btn');
  const popBtn = document.getElementById('rb-pop-btn');
  const resetBtn = document.getElementById('rb-reset-btn');
  const inputElem = document.getElementById('rb-input-val');
  const statusElem = document.getElementById('rb-status');
  const codeElem = document.getElementById('rb-code-snippet');

  if (!container) return;

  const CAPACITY = 8;
  const buffer = new Array(CAPACITY).fill(null);
  let head = 0; // write index
  let tail = 0; // read index
  let count = 0;

  // Initialize with some starter data
  buffer[0] = '0x53'; // 'S'
  buffer[1] = '0x49'; // 'I'
  buffer[2] = '0x4C'; // 'L'
  head = 3;
  tail = 0;
  count = 3;

  function renderRing() {
    container.innerHTML = '';
    for (let i = 0; i < CAPACITY; i++) {
      const slot = document.createElement('div');
      slot.className = 'ring-slot';
      if (buffer[i] !== null) slot.classList.add('has-data');
      if (i === head) slot.classList.add('is-head');
      if (i === tail) slot.classList.add('is-tail');

      slot.innerHTML = `
        <span class="ring-slot-idx">[0x0${i}]</span>
        <span class="ring-slot-val">${buffer[i] !== null ? buffer[i] : '—'}</span>
      `;
      container.appendChild(slot);
    }

    if (statusElem) {
      statusElem.textContent = `Head: 0x0${head} | Tail: 0x0${tail} | Count: ${count}/${CAPACITY} (${count === CAPACITY ? 'FULL' : count === 0 ? 'EMPTY' : 'ACTIVE'})`;
    }
  }

  function pushData() {
    if (count >= CAPACITY) {
      if (codeElem) codeElem.textContent = `// BUFFER OVERFLOW: Dropping frame. Buffer is full (count == ${CAPACITY})`;
      return;
    }
    const val = inputElem && inputElem.value ? inputElem.value.trim() : '0x' + Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0');
    buffer[head] = val;
    head = (head + 1) % CAPACITY;
    count++;
    if (codeElem) {
      codeElem.textContent = `ring_buffer[${(head - 1 + CAPACITY) % CAPACITY}] = ${val}; head = (head + 1) % ${CAPACITY}; // count = ${count}`;
    }
    renderRing();
  }

  function popData() {
    if (count <= 0) {
      if (codeElem) codeElem.textContent = `// BUFFER UNDERFLOW: Empty. (head == tail)`;
      return;
    }
    const popped = buffer[tail];
    buffer[tail] = null;
    tail = (tail + 1) % CAPACITY;
    count--;
    if (codeElem) {
      codeElem.textContent = `uint8_t val = ring_buffer[${(tail - 1 + CAPACITY) % CAPACITY}]; // read ${popped}, tail = (tail + 1) % ${CAPACITY};`;
    }
    renderRing();
  }

  function resetBuffer() {
    for (let i = 0; i < CAPACITY; i++) buffer[i] = null;
    head = 0;
    tail = 0;
    count = 0;
    if (codeElem) codeElem.textContent = `ring_buffer_init(&rb, 8); // cleared pointers`;
    renderRing();
  }

  if (pushBtn) pushBtn.addEventListener('click', pushData);
  if (popBtn) popBtn.addEventListener('click', popData);
  if (resetBtn) resetBtn.addEventListener('click', resetBuffer);

  renderRing();
}

/* ==========================================================================
   7. Circuit Tabs (Figure 5)
   ========================================================================== */
function initCircuitTabs() {
  const tabBtns = document.querySelectorAll('.circuit-tab-btn');
  const panes = document.querySelectorAll('.circuit-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      tabBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

/* ==========================================================================
   8. Citation & Footnote Tooltips
   ========================================================================== */
const BIBLIOGRAPHY_DATA = {
  "1": { title: "Game Theory for Network Security", authors: "X. Liang and Y. Xiao", journal: "IEEE Communications Surveys & Tutorials, vol. 15, no. 1", year: "2013" },
  "2": { title: "Game theory and open source contribution: Rationale behind corporate participation", authors: "J. E. Kendall, K. E. Kendall & M. Germonprez", journal: "J. Organ. Comput. Electron. Com.", year: "2016" },
  "3": { title: "Cyber-physical correlations for infrastructure resilience: A game-theoretic approach", authors: "N. S. V. Rao, C. Y. T. Ma, F. He, J. Zhuang, D. K. Y. Yau", journal: "Proc. 17th Int. Conf. Information Fusion", year: "2014" },
  "4": { title: "Software Functionality: A Game Theoretic Analysis", authors: "K. L. Hui, K. Y. Tam", journal: "Journal of Management Information Systems, 19:1, 151-184", year: "2002" },
  "5": { title: "Applying game theory to the incremental funding method in software projects", authors: "E. Mattos, M. Vieira, E. A. Schmitz, A. J. Alencar", journal: "Journal of Software, 9(6), 14-35", year: "2014" },
  "6": { title: "A model for evaluating IT security investments", authors: "H. Cavusoglu, B. Mishra, S. Raghunathan", journal: "Communications of the ACM, 47(7), 87-92", year: "2004" },
  "7": { title: "The uses of game theory in management science", authors: "M. Shubik", journal: "Management Science, 2(1), 40-54", year: "1955" },
  "8": { title: "A grounded theory analysis of modern web applications: knowledge, skills, and abilities for DevOps", authors: "S. K. Bang, S. Chung, Y. Choh, M. Dupuis", journal: "Proc. 2nd Annual Conf. on Research in IT", year: "2013" },
  "9": { title: "Moving target defense techniques: A survey", authors: "C. Lei, H. Q. Zhang, J. L. Tan, et al.", journal: "Security and Communication Networks", year: "2018" },
  "10": { title: "A Game Theoretic Approach to Strategy Generation for Moving Target Defense in Web Applications", authors: "S. Sengupta, S. G. Vadlamudi, S. Kambhampati, et al.", journal: "AAMAS, Vol. 1, pp. 178-186", year: "2017" },
  "11": { title: "A review of dynamic Stackelberg game models", authors: "T. Li and S. P. Sethi", journal: "Discrete & Continuous Dynamical Systems-B, 22(1), 125", year: "2017" },
  "12": { title: "A survey of game theory as applied to network security", authors: "S. Roy, C. Ellis, S. Shiva, D. Dasgupta, et al.", journal: "43rd Hawaii Int. Conf. System Sciences", year: "2010" },
  "13": { title: "The role of game theory in information warfare", authors: "S. N. Hamilton, W. L. Miller, A. Ott, O. S. Saydjari", journal: "Proc. 4th Info. Survivability Workshop", year: "2002" },
  "14": { title: "Game Theory for Applied Economists", authors: "R. Gibbons", journal: "Princeton University Press", year: "1992" },
  "15": { title: "Symbolic security analysis of Ruby-on-Rails web applications", authors: "A. Chaudhuri and J. S. Foster", journal: "Proc. 17th ACM CCS, pp. 585-594", year: "2010" },
  "16": { title: "A survey on the combined use of optimization methods and game theory", authors: "M. K. Sohrabi and H. Azgomi", journal: "Arch. Comput. Methods Eng., 27(1), 59-80", year: "2020" },
  "17": { title: "A systematic review of software development cost estimation studies", authors: "M. Jorgensen and M. Shepperd", journal: "IEEE Trans. Softw. Eng., 33(1), 33-53", year: "2006" },
  "18": { title: "The relationship between software development team size and software development cost", authors: "P. C. Pendharkar and J. A. Rodger", journal: "Communications of the ACM, 52(1), 141-144", year: "2009" },
  "19": { title: "Modeling diminishing returns in project resource planning", authors: "R. F. Deckro and J. E. Hebert", journal: "Computers & Industrial Engineering, 44(1), 19-33", year: "2003" },
  "20": { title: "Game-theory-based active defense for intrusion detection in cyber-physical embedded systems", authors: "K. Wang, M. Du, D. Yang, C. Zhu, et al.", journal: "IEEE Systems Journal", year: "2016" }
};

function initCitationTooltips() {
  let tooltip = document.getElementById('tex-citation-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'tex-citation-tooltip';
    tooltip.className = 'tex-tooltip';
    document.body.appendChild(tooltip);
  }

  const links = document.querySelectorAll('.citation-link');

  links.forEach(link => {
    link.addEventListener('mouseenter', (e) => {
      const refId = link.getAttribute('data-ref');
      const data = BIBLIOGRAPHY_DATA[refId];
      if (data) {
        tooltip.innerHTML = `
          <div class="tex-tooltip-title">[${refId}] ${data.title}</div>
          <div class="tex-tooltip-body">${data.authors} &mdash; <em>${data.journal}</em> (${data.year})</div>
        `;
        const rect = link.getBoundingClientRect();
        tooltip.style.left = `${Math.min(window.innerWidth - 340, Math.max(10, rect.left - 100))}px`;
        tooltip.style.top = `${rect.bottom + 8}px`;
        tooltip.classList.add('visible');
      }
    });

    link.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
}

/* ==========================================================================
   9. Curated Academic Catalog Filtering (Section 7)
   ========================================================================== */
function initCatalogFilters() {
  const pills = document.querySelectorAll('.catalog-pill');
  const items = document.querySelectorAll('.catalog-item');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const category = pill.getAttribute('data-cat');
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      items.forEach(item => {
        if (category === 'all' || item.getAttribute('data-cat') === category) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   10. BibTeX Modal & Copy Action
   ========================================================================== */
function initBibTeXModal() {
  const modal = document.getElementById('bibtex-modal');
  const openBtns = document.querySelectorAll('[data-open-bibtex]');
  const closeBtn = document.getElementById('bibtex-close-btn');
  const copyBtn = document.getElementById('bibtex-copy-btn');
  const codeElem = document.getElementById('bibtex-code');

  if (!modal) return;

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('open');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  if (copyBtn && codeElem) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeElem.textContent).then(() => {
        const origText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied to Clipboard';
        setTimeout(() => { copyBtn.textContent = origText; }, 2000);
      });
    });
  }
}

/* ==========================================================================
   11. TeX Terminal Compilation Simulator ("Recompile")
   ========================================================================== */
function initTerminalRecompile() {
  const recompileBtns = document.querySelectorAll('[data-recompile-tex]');
  const modal = document.getElementById('recompile-modal');
  const logElem = document.getElementById('recompile-log');
  const closeBtn = document.getElementById('recompile-close-btn');

  if (!modal || !logElem) return;

  const LOG_LINES = [
    "This is pdfTeX, Version 3.141592653-2.6-1.40.24 (TeX Live 2026/Mac)",
    "entering extended mode",
    "(./silicon_monograph.tex",
    "LaTeX2e <2026-06-01> patch level 2",
    "L3 programming layer <2026-05-18>",
    "(/usr/local/texlive/2026/texmf-dist/tex/latex/base/article.cls",
    "Document Class: article 2024/02/08 v1.4n Standard LaTeX document class",
    "Loading font Computer Modern Roman 10pt [cmr10] ... done",
    "Loading KaTeX mathematical engine v0.16.9 ... done",
    ")",
    "(§1. Introduction & Silicon Paradigm ... ok)",
    "(§2. Verilog Op-Amp Logic Synthesis ... ok)",
    "(§3. Non-Cooperative Game Theoretic Models ... ok)",
    "(§4. Applied Systems: RISC-V, PID & Ring-Buffer ... ok)",
    "(§5. Critical AI & Human Labor Theory ... ok)",
    "(§6. Scholarly Epigraphs ... ok)",
    "(§7. Aesthetic Reference Compendium ... ok)",
    "[1] [2] [3] [4] [5] [6] [7] [8]",
    "Output written on silicon.pdf (8 pages, 482120 bytes).",
    "Transcript written on silicon.log.",
    "Typeset finished in 28ms with 0 errors, 0 warnings."
  ];

  recompileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('open');
      logElem.innerHTML = '';
      let lineIdx = 0;

      function printNextLine() {
        if (lineIdx < LOG_LINES.length) {
          const div = document.createElement('div');
          div.textContent = LOG_LINES[lineIdx];
          logElem.appendChild(div);
          logElem.scrollTop = logElem.scrollHeight;
          lineIdx++;
          setTimeout(printNextLine, lineIdx > 16 ? 40 : 25);
        } else {
          const finished = document.createElement('div');
          finished.style.color = '#58a6ff';
          finished.style.marginTop = '0.5rem';
          finished.innerHTML = '<strong>[OK] Document reloaded successfully.</strong>';
          logElem.appendChild(finished);

          // Subtle document re-render flash
          const sheet = document.querySelector('.paper-sheet');
          if (sheet) {
            sheet.style.opacity = '0.3';
            setTimeout(() => { sheet.style.opacity = '1'; }, 200);
          }
        }
      }
      printNextLine();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
}
