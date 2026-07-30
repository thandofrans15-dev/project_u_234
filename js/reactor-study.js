/* reactor-study.js
   Reactor Study mode: realistic SMR thermal-hydraulics sim + Three.js
   visualization. Exports mount()/unmount() so the router in main.js can
   swap modes cleanly without leaking renderers or animation loops.
*/
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ModularReactorModel } from '../physics/smr-core-model.js';

const HUD_HTML = `
<div id="rs-hud">
  <div id="rs-topbar" class="rs-panel">
    <div class="rs-title">REACTOR STUDY <span>// SMR CORE THERMAL-HYDRAULIC MODEL</span></div>
    <div id="rs-statuspill">NOMINAL</div>
  </div>

  <div id="rs-controls" class="rs-panel">
    <div>
      <div class="rs-grp-label">CONTROL ROD WITHDRAWAL <b id="rs-rodPct">0%</b></div>
      <input id="rs-rodSlider" type="range" min="0" max="100" value="0" step="1">
      <div class="rs-subreadout">0% = fully inserted (shutdown) &nbsp;·&nbsp; 100% = full withdrawal</div>
    </div>

    <div>
      <div class="rs-grp-label">CORE THERMAL POWER</div>
      <div class="rs-readout" id="rs-powerReadout">0.0 MWth</div>
      <div class="rs-subreadout">design ceiling 160 MWth (NuScale-class iPWR)</div>
    </div>

    <div>
      <div class="rs-grp-label">PRIMARY COOLANT PUMP SPEED <b id="rs-flowPct">100%</b></div>
      <input id="rs-flowSlider" type="range" min="20" max="150" value="100" step="1">
      <div class="rs-subreadout" id="rs-flowRateLabel">ṁ = 600.0 kg/s</div>
    </div>

    <div>
      <div class="rs-grp-label">CAMERA</div>
      <div class="rs-subreadout">drag to orbit &nbsp;·&nbsp; scroll to zoom</div>
    </div>

    <div id="rs-scram">⚠ SCRAM — EMERGENCY SHUTDOWN</div>
  </div>

  <div id="rs-telemetry" class="rs-panel">
    <div class="rs-tele-row">
      <div class="rs-label">COOLANT INLET TEMP (T_in)</div>
      <div class="rs-value" id="rs-tIn">250.0 °C</div>
    </div>
    <div class="rs-tele-row">
      <div class="rs-label">COOLANT OUTLET TEMP (T_out)</div>
      <div class="rs-value" id="rs-tOut">250.0 °C</div>
    </div>
    <div class="rs-tele-row">
      <div class="rs-label">TEMPERATURE RISE (ΔT)</div>
      <div class="rs-value" id="rs-tRise">0.0 °C</div>
    </div>
    <div class="rs-tele-row" id="rs-marginRow">
      <div class="rs-label">THERMAL MARGIN TO LIMIT (330 °C)</div>
      <div class="rs-value" id="rs-marginVal">80.0 °C</div>
      <div id="rs-margin-bar-wrap"><div id="rs-margin-bar"></div></div>
    </div>
    <div class="rs-tele-row">
      <div class="rs-label">MASS FLOW RATE (ṁ)</div>
      <div class="rs-value" id="rs-mDot">600.0 kg/s</div>
    </div>
    <div class="rs-tele-row">
      <div class="rs-label">SAFETY VALIDATION</div>
      <div class="rs-value" id="rs-safeVal">SAFE</div>
    </div>
  </div>

  <div id="rs-eqbar" class="rs-panel">
    <div>Q &nbsp;=&nbsp; <b id="rs-eqQ">0</b> W</div>
    <div class="rs-eq-sep">=</div>
    <div>ṁ&nbsp;<b id="rs-eqM">600.0</b></div>
    <div class="rs-eq-sep">×</div>
    <div>C<sub>p</sub>&nbsp;<b>4184</b></div>
    <div class="rs-eq-sep">×</div>
    <div>(T<sub>out</sub>&nbsp;<b id="rs-eqTo">250.0</b>&nbsp;−&nbsp;T<sub>in</sub>&nbsp;<b id="rs-eqTi">250.0</b>)</div>
  </div>
</div>
<div id="rs-scene"></div>
`;

export function mount(container) {
  container.innerHTML = HUD_HTML;
  const el = id => container.querySelector('#' + id);

  const reactor = new ModularReactorModel();
  const state = { rodWithdrawal: 0, pumpSpeedPct: 100, displayPower: 0 };
  let scramFlashTimer = 0;

  function stepPhysics() {
    reactor.massFlowRate = 600.0 * (state.pumpSpeedPct / 100);
    const targetPowerMW = reactor.designPowerMW * state.rodWithdrawal;
    state.displayPower += (targetPowerMW - state.displayPower) * 0.06;
    if (Math.abs(state.displayPower) < 0.05) state.displayPower = 0;
    return reactor.calculateCoreThermalHydraulics(state.displayPower);
  }

  const rodSlider = el('rs-rodSlider');
  const flowSlider = el('rs-flowSlider');

  function onRod() {
    state.rodWithdrawal = rodSlider.value / 100;
    el('rs-rodPct').textContent = rodSlider.value + '%';
  }
  function onFlow() {
    state.pumpSpeedPct = Number(flowSlider.value);
    el('rs-flowPct').textContent = flowSlider.value + '%';
    el('rs-flowRateLabel').textContent = `ṁ = ${(600 * flowSlider.value / 100).toFixed(1)} kg/s`;
  }
  function onScram() {
    state.rodWithdrawal = 0;
    rodSlider.value = 0;
    el('rs-rodPct').textContent = '0%';
    scramFlashTimer = 1.0;
  }
  rodSlider.addEventListener('input', onRod);
  flowSlider.addEventListener('input', onFlow);
  el('rs-scram').addEventListener('click', onScram);

  function updateHUD(result) {
    el('rs-powerReadout').textContent = result.powerMW.toFixed(1) + ' MWth';
    el('rs-tIn').textContent = result.inletTemp.toFixed(1) + ' °C';
    el('rs-tOut').textContent = result.outletTemp.toFixed(1) + ' °C';
    el('rs-tRise').textContent = result.tempRise.toFixed(1) + ' °C';
    el('rs-mDot').textContent = reactor.massFlowRate.toFixed(1) + ' kg/s';
    el('rs-marginVal').textContent = result.margin.toFixed(1) + ' °C';

    el('rs-eqQ').textContent = Math.round(result.powerWatts).toLocaleString();
    el('rs-eqM').textContent = reactor.massFlowRate.toFixed(1);
    el('rs-eqTo').textContent = result.outletTemp.toFixed(1);
    el('rs-eqTi').textContent = result.inletTemp.toFixed(1);

    const marginRow = el('rs-marginRow');
    const bar = el('rs-margin-bar');
    const barPct = Math.max(0, Math.min(100, (result.margin / 80) * 100));
    bar.style.width = barPct + '%';

    const safeVal = el('rs-safeVal');
    const pill = el('rs-statuspill');
    marginRow.classList.remove('warn', 'danger');
    if (!result.isSafe) {
      safeVal.textContent = 'CRITICAL — LIMIT EXCEEDED';
      marginRow.classList.add('danger');
      bar.style.background = 'var(--rs-red)';
      pill.textContent = 'CRITICAL';
      pill.classList.add('critical');
    } else if (result.margin < 15) {
      safeVal.textContent = 'CAUTION — LOW MARGIN';
      marginRow.classList.add('warn');
      bar.style.background = 'var(--rs-amber)';
      pill.textContent = 'CAUTION';
      pill.classList.remove('critical');
    } else {
      safeVal.textContent = 'SAFE';
      bar.style.background = 'var(--rs-cyan)';
      pill.textContent = 'NOMINAL';
      pill.classList.remove('critical');
    }
  }

  // ---------------- THREE.JS SCENE ----------------
  const sceneEl = el('rs-scene');
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050810, 0.012);

  const camera = new THREE.PerspectiveCamera(45, sceneEl.clientWidth / sceneEl.clientHeight, 0.1, 500);
  camera.position.set(26, 16, 30);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
  renderer.setClearColor(0x050810, 1);
  sceneEl.appendChild(renderer.domElement);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.minDistance = 14;
  orbit.maxDistance = 60;
  orbit.target.set(0, 4, 0);
  orbit.autoRotate = true;
  orbit.autoRotateSpeed = 0.5;
  orbit.addEventListener('start', () => orbit.autoRotate = false);

  scene.add(new THREE.AmbientLight(0x14304a, 1.1));
  const key = new THREE.PointLight(0x2fd9e8, 1.4, 60);
  key.position.set(12, 20, 14);
  scene.add(key);
  const rim = new THREE.PointLight(0x4444ff, 0.6, 60);
  rim.position.set(-14, 6, -10);
  scene.add(rim);
  const coreLight = new THREE.PointLight(0xff5533, 0, 22);
  coreLight.position.set(0, 1.5, 0);
  scene.add(coreLight);

  const grid = new THREE.GridHelper(60, 40, 0x123044, 0x0c1a26);
  grid.position.y = -8;
  scene.add(grid);

  const vesselGroup = new THREE.Group();
  scene.add(vesselGroup);

  const vesselRadius = 6.2, vesselHeight = 20;
  const vesselMat = new THREE.MeshPhysicalMaterial({
    color: 0x224459, metalness: 0.1, roughness: 0.08,
    transmission: 0.92, thickness: 1.2, transparent: true, opacity: 0.35,
    ior: 1.4, side: THREE.DoubleSide
  });
  const vesselBody = new THREE.Mesh(
    new THREE.CylinderGeometry(vesselRadius, vesselRadius, vesselHeight, 48, 1, true),
    vesselMat
  );
  vesselGroup.add(vesselBody);
  const domeTop = new THREE.Mesh(new THREE.SphereGeometry(vesselRadius, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), vesselMat);
  domeTop.position.y = vesselHeight / 2;
  vesselGroup.add(domeTop);
  const domeBottom = new THREE.Mesh(new THREE.SphereGeometry(vesselRadius, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), vesselMat);
  domeBottom.position.y = -vesselHeight / 2;
  vesselGroup.add(domeBottom);

  const ringGeo = new THREE.TorusGeometry(vesselRadius, 0.04, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x2fd9e8, transparent: true, opacity: 0.6 });
  const rings = [-vesselHeight / 2, vesselHeight / 2].map(y => {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    vesselGroup.add(ring);
    return ring;
  });

  vesselGroup.position.y = -2;

  const GRID_N = 17, PITCH = 0.34, rodRadius = 0.11, rodHeight = 6.5;
  const corePositions = [];
  for (let i = 0; i < GRID_N; i++) {
    for (let j = 0; j < GRID_N; j++) {
      const x = (i - (GRID_N - 1) / 2) * PITCH;
      const z = (j - (GRID_N - 1) / 2) * PITCH;
      if (Math.sqrt(x * x + z * z) > 2.85) continue;
      corePositions.push([x, z]);
    }
  }

  const fuelGeo = new THREE.CylinderGeometry(rodRadius, rodRadius, rodHeight, 8);
  const fuelMat = new THREE.MeshStandardMaterial({
    color: 0x552018, emissive: 0x220000, emissiveIntensity: 0.1,
    metalness: 0.3, roughness: 0.6
  });
  const fuelMesh = new THREE.InstancedMesh(fuelGeo, fuelMat, corePositions.length);
  const CORE_Y = -vesselHeight / 2 + rodHeight / 2 + 1.2;
  const dummy = new THREE.Object3D();
  corePositions.forEach(([x, z], idx) => {
    dummy.position.set(x, CORE_Y, z);
    dummy.updateMatrix();
    fuelMesh.setMatrixAt(idx, dummy.matrix);
  });
  vesselGroup.add(fuelMesh);

  const controlRodPositions = corePositions.filter((_, idx) => idx % 11 === 0);
  const rodGeo = new THREE.CylinderGeometry(0.09, 0.09, rodHeight + 4, 8);
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x9aa7b0, metalness: 0.85, roughness: 0.25 });
  const controlRodMesh = new THREE.InstancedMesh(rodGeo, rodMat, controlRodPositions.length);
  vesselGroup.add(controlRodMesh);

  const helixPoints = [];
  const coilTurns = 14, coilRadius = 3.6, coilHeight = 8, coilY0 = 1.5;
  for (let t = 0; t <= 1; t += 1 / (coilTurns * 20)) {
    const angle = t * coilTurns * Math.PI * 2;
    helixPoints.push(new THREE.Vector3(
      Math.cos(angle) * coilRadius,
      coilY0 + t * coilHeight,
      Math.sin(angle) * coilRadius
    ));
  }
  const helixCurve = new THREE.CatmullRomCurve3(helixPoints);
  const coilGeo = new THREE.TubeGeometry(helixCurve, 800, 0.09, 8, false);
  const coilMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.3 });
  const coilMesh = new THREE.Mesh(coilGeo, coilMat);
  vesselGroup.add(coilMesh);

  const PARTICLE_COUNT = 220;
  const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
  const particleSeeds = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 2.6;
    particlePositions[i * 3 + 0] = Math.cos(a) * r;
    particlePositions[i * 3 + 1] = -8 + Math.random() * 16;
    particlePositions[i * 3 + 2] = Math.sin(a) * r;
    particleSeeds[i] = Math.random() * 10;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('seed', new THREE.BufferAttribute(particleSeeds, 1));
  const particleMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSpeed: { value: 0.2 }, uColor: { value: new THREE.Color(0x2fd9e8) } },
    vertexShader: `
      attribute float seed;
      uniform float uTime;
      uniform float uSpeed;
      varying float vAlpha;
      void main(){
        vec3 p = position;
        float travel = mod(seed*3.0 + uTime * uSpeed, 16.0);
        p.y = -8.0 + travel;
        vAlpha = smoothstep(0.0, 1.5, travel) * (1.0 - smoothstep(13.0, 16.0, travel));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 3.5 * (18.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        gl_FragColor = vec4(uColor, vAlpha * 0.85);
      }
    `,
    transparent: true, depthWrite: false
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  vesselGroup.add(particles);

  function applyVisualState(result) {
    const powerFrac = result.powerMW / reactor.designPowerMW;
    const glowColor = new THREE.Color().lerpColors(
      new THREE.Color(0x220000), new THREE.Color(0xfff2c0), Math.min(1, powerFrac * 1.15)
    );
    fuelMat.emissive = glowColor;
    fuelMat.emissiveIntensity = 0.15 + powerFrac * 2.2;

    coreLight.intensity = powerFrac * 3.2;
    coreLight.color.set(powerFrac > 0.7 ? 0xfff2c0 : 0xff5533);

    const insertedY = CORE_Y;
    const withdrawnY = vesselHeight / 2 + 4;
    const rodY = THREE.MathUtils.lerp(insertedY, withdrawnY, state.rodWithdrawal);
    controlRodPositions.forEach(([x, z], idx) => {
      dummy.position.set(x, rodY, z);
      dummy.updateMatrix();
      controlRodMesh.setMatrixAt(idx, dummy.matrix);
    });
    controlRodMesh.instanceMatrix.needsUpdate = true;

    particleMat.uniforms.uSpeed.value = 0.15 + (state.pumpSpeedPct / 100) * 0.6;
    particleMat.uniforms.uColor.value.set(!result.isSafe ? 0xff3b4e : (powerFrac > 0.7 ? 0xfff2c0 : 0x2fd9e8));

    rings.forEach(r => r.material.color.set((!result.isSafe || scramFlashTimer > 0) ? 0xff3b4e : 0x2fd9e8));
    if (scramFlashTimer > 0) scramFlashTimer -= 0.02;
  }

  let lastPhysicsTime = 0;
  const PHYSICS_INTERVAL = 100;
  let clockStart = performance.now();
  let isVisible = true;
  let rafId = null;
  let disposed = false;

  function onVisibility() { isVisible = !document.hidden; }
  document.addEventListener('visibilitychange', onVisibility);

  function onResize() {
    camera.aspect = sceneEl.clientWidth / sceneEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
  }
  window.addEventListener('resize', onResize);

  function animate(now) {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);
    if (!isVisible) return;

    particleMat.uniforms.uTime.value = (now - clockStart) / 1000;

    if (now - lastPhysicsTime > PHYSICS_INTERVAL) {
      lastPhysicsTime = now;
      const result = stepPhysics();
      updateHUD(result);
      applyVisualState(result);
    }

    vesselGroup.rotation.y += 0.0009;
    orbit.update();
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(animate);

  // cleanup, called by the router before mounting the next mode
  return function unmount() {
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    rodSlider.removeEventListener('input', onRod);
    flowSlider.removeEventListener('input', onFlow);
    orbit.dispose();
    renderer.dispose();
    fuelGeo.dispose(); fuelMat.dispose();
    rodGeo.dispose(); rodMat.dispose();
    coilGeo.dispose(); coilMat.dispose();
    particleGeo.dispose(); particleMat.dispose();
    vesselMat.dispose(); ringGeo.dispose(); ringMat.dispose();
    container.innerHTML = '';
  };
}
