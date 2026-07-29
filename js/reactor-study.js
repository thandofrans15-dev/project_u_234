// reactor-study.js
// This mode shows a 3d model of the reactor and lets you adjust,idk if anyone gonna read these comments and code

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ModularReactorModel } from '../smr-core-model.js';

var HUD_HTML =
  '<div id="rs-hud">' +
  '  <div id="rs-top">' +
  '    <h2>Reactor Study</h2>' +
  '    <div id="rs-status">Normal</div>' +
  '  </div>' +
  '  <div id="rs-left">' +
  '    <p>Control Rod Position: <span id="rs-rodPct">0%</span></p>' +
  '    <input id="rs-rodSlider" type="range" min="0" max="100" value="0">' +
  '    <p style="font-size:12px;">0% = rods all the way in (off). 100% = rods all the way out (full power).</p>' +
  '    <p>Power: <span id="rs-power">0 MW</span></p>' +
  '    <p>Pump Speed: <span id="rs-flowPct">100%</span></p>' +
  '    <input id="rs-flowSlider" type="range" min="20" max="150" value="100">' +
  '    <button id="rs-scram">SCRAM (shut down)</button>' +
  '  </div>' +
  '  <div id="rs-right">' +
  '    <p>Inlet Temp: <span id="rs-tIn">250 C</span></p>' +
  '    <p>Outlet Temp: <span id="rs-tOut">250 C</span></p>' +
  '    <p>Temp Rise: <span id="rs-tRise">0 C</span></p>' +
  '    <p>Safety Margin: <span id="rs-margin">80 C</span></p>' +
  '    <p>Is it Safe? <span id="rs-safe">Yes</span></p>' +
  '  </div>' +
  '</div>' +
  '<div id="rs-scene"></div>';

function mount(container) {
  container.innerHTML = HUD_HTML;

  var reactor = new ModularReactorModel();
  var rodPercent = 0;   // 0 to 100
  var pumpPercent = 100; // 20 to 150

  var rodSlider = container.querySelector('#rs-rodSlider');
  var flowSlider = container.querySelector('#rs-flowSlider');
  var scramBtn = container.querySelector('#rs-scram');

  rodSlider.addEventListener('input', function () {
    rodPercent = Number(rodSlider.value);
    container.querySelector('#rs-rodPct').textContent = rodPercent + '%';
  });

  flowSlider.addEventListener('input', function () {
    pumpPercent = Number(flowSlider.value);
    container.querySelector('#rs-flowPct').textContent = pumpPercent + '%';
  });

  scramBtn.addEventListener('click', function () {
    rodPercent = 0;
    rodSlider.value = 0;
    container.querySelector('#rs-rodPct').textContent = '0%';
  });

  // updates the text on screen based on the physics result
  function updateHUD(result) {
    container.querySelector('#rs-power').textContent = result.powerMW.toFixed(1) + ' MW';
    container.querySelector('#rs-tIn').textContent = result.inletTemp.toFixed(1) + ' C';
    container.querySelector('#rs-tOut').textContent = result.outletTemp.toFixed(1) + ' C';
    container.querySelector('#rs-tRise').textContent = result.tempRise.toFixed(1) + ' C';
    container.querySelector('#rs-margin').textContent = result.margin.toFixed(1) + ' C';

    var safeText = container.querySelector('#rs-safe');
    var statusText = container.querySelector('#rs-status');
    if (result.safe) {
      safeText.textContent = 'Yes';
      safeText.style.color = 'lime';
      statusText.textContent = 'Normal';
      statusText.style.color = 'lime';
    } else {
      safeText.textContent = 'NO - TOO HOT';
      safeText.style.color = 'red';
      statusText.textContent = 'WARNING';
      statusText.style.color = 'red';
    }
  }

  // ----------------- 3D SCENE -----------------
  var sceneBox = container.querySelector('#rs-scene');

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  var camera = new THREE.PerspectiveCamera(50, sceneBox.clientWidth / sceneBox.clientHeight, 0.1, 1000);
  camera.position.set(15, 12, 20);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(sceneBox.clientWidth, sceneBox.clientHeight);
  sceneBox.appendChild(renderer.domElement);

  var orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 2, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  var lamp = new THREE.PointLight(0xffffff, 1, 50);
  lamp.position.set(10, 15, 10);
  scene.add(lamp);

  var group = new THREE.Group();
  scene.add(group);

  // the outer tank (pressure vessel), just a see-through cylinder
  var vesselGeo = new THREE.CylinderGeometry(4, 4, 14, 24);
  var vesselMat = new THREE.MeshPhongMaterial({ color: 0x3366cc, transparent: true, opacity: 0.25 });
  var vessel = new THREE.Mesh(vesselGeo, vesselMat);
  group.add(vessel);

  // fuel rods at the bottom, made with a simple loop, 7x7 grid,took me sooo long
  var fuelRods = [];
  var rodSpacing = 0.5;
  var gridSize = 7;
  var fuelGeo = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
  var fuelMat = new THREE.MeshPhongMaterial({ color: 0x552222 });

  for (var i = 0; i < gridSize; i++) {
    for (var j = 0; j < gridSize; j++) {
      var x = (i - (gridSize - 1) / 2) * rodSpacing;
      var z = (j - (gridSize - 1) / 2) * rodSpacing;
      var rod = new THREE.Mesh(fuelGeo, fuelMat.clone());
      rod.position.set(x, -4, z);
      group.add(rod);
      fuelRods.push(rod);
    }
  }

  // control rods - just a few of them, they move up and down
  var controlRods = [];
  var controlPositions = [[0, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  var controlGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
  var controlMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
  for (var c = 0; c < controlPositions.length; c++) {
    var cx = controlPositions[c][0] * rodSpacing;
    var cz = controlPositions[c][1] * rodSpacing;
    var crod = new THREE.Mesh(controlGeo, controlMat);
    crod.position.set(cx, -4, cz);
    group.add(crod);
    controlRods.push(crod);
  }

  // steam generator coil - just a few stacked rings, keeps it simple
  var coilRings = [];
  for (var r = 0; r < 8; r++) {
    var ringGeo = new THREE.TorusGeometry(2.5, 0.08, 8, 24);
    var ringMat = new THREE.MeshPhongMaterial({ color: 0xcc8833 });
    var ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = r * 0.6;
    group.add(ringMesh);
    coilRings.push(ringMesh);
  }

  // little dots to show water moving up through the core, simple version
  var waterDrops = [];
  var dropGeo = new THREE.SphereGeometry(0.1, 6, 6);
  var dropMat = new THREE.MeshBasicMaterial({ color: 0x33aaff });
  for (var d = 0; d < 25; d++) {
    var drop = new THREE.Mesh(dropGeo, dropMat);
    drop.position.set(
      (Math.random() - 0.5) * 6,
      -6 + Math.random() * 12,
      (Math.random() - 0.5) * 6
    );
    group.add(drop);
    waterDrops.push(drop);
  }

  // grid on the floor just so it looks less empty
  var floorGrid = new THREE.GridHelper(30, 20, 0x444444, 0x222222);
  floorGrid.position.y = -8;
  scene.add(floorGrid);

  var lastUpdate = 0;
  var running = true;

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
  });

  function onResize() {
    camera.aspect = sceneBox.clientWidth / sceneBox.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sceneBox.clientWidth, sceneBox.clientHeight);
  }
  window.addEventListener('resize', onResize);

  var frameId;
  var stopped = false;

  function animate(time) {
    if (stopped) return;
    frameId = requestAnimationFrame(animate);
    if (!running) return;

    // only recalc the physics a few times a second, no need to do it every frame
    if (time - lastUpdate > 150) {
      lastUpdate = time;
      reactor.massFlowRate = 600 * (pumpPercent / 100);
      var targetPower = reactor.maxPower * (rodPercent / 100);
      var result = reactor.getResults(targetPower);
      updateHUD(result);

      // move the control rods based on the slider (0% = down in the core, 100% = up and out)
      var downY = -4;
      var upY = 6;
      var rodY = downY + (upY - downY) * (rodPercent / 100);
      for (var k = 0; k < controlRods.length; k++) {
        controlRods[k].position.y = rodY;
      }

      // make the fuel rods glow more red/orange the more power there is
      var powerFraction = result.powerMW / reactor.maxPower;
      for (var m = 0; m < fuelRods.length; m++) {
        var glow = new THREE.Color(0x552222).lerp(new THREE.Color(0xffaa00), powerFraction);
        fuelRods[m].material.color = glow;
      }
    }

    // move the water dots up slowly, loop back to the bottom when they reach the top
    for (var w = 0; w < waterDrops.length; w++) {
      waterDrops[w].position.y += 0.02 + (pumpPercent / 100) * 0.03;
      if (waterDrops[w].position.y > 6) {
        waterDrops[w].position.y = -6;
      }
    }

    group.rotation.y += 0.002;
    orbit.update();
    renderer.render(scene, camera);
  }
  frameId = requestAnimationFrame(animate);

  // called when we leave this mode, cleans everything up
  function unmount() {
    stopped = true;
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    container.innerHTML = '';
  }

  return unmount;
}

export { mount };
