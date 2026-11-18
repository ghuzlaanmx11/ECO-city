import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#city-canvas");
const experience = document.querySelector("#experience");
const intro = document.querySelector("#intro");
const ui = {
  topbar: document.querySelector("#topbar"),
  dashboard: document.querySelector("#dashboard"),
  dashboardToggle: document.querySelector("#dashboard-toggle"),
  sceneLabel: document.querySelector("#scene-label"),
  cameraHint: document.querySelector("#camera-hint"),
  resetCamera: document.querySelector("#reset-camera"),
  credits: document.querySelector("#credits"),
  infoCard: document.querySelector("#info-card"),
  toast: document.querySelector("#toast"),
  guideModal: document.querySelector("#guide-modal"),
  clockLabel: document.querySelector("#clock-label"),
  energy: document.querySelector("#clean-energy"),
  energyBar: document.querySelector("#energy-bar"),
  emissions: document.querySelector("#emissions"),
  green: document.querySelector("#green-cover"),
  greenBar: document.querySelector("#green-bar"),
  air: document.querySelector("#air-quality"),
};

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
} catch (error) {
  experience.innerHTML = `<div class="webgl-error"><h2>تعذّر تشغيل التجربة ثلاثية الأبعاد</h2><p>يبدو أن WebGL غير متاح في هذا المتصفح أو أن تسريع الرسوميات معطّل. جرّب متصفحًا حديثًا مع تفعيل تسريع الأجهزة.</p></div>`;
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#b5d1d1");
scene.fog = new THREE.FogExp2("#a9c8c3", 0.0031);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(100, 88, 116);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 13;
controls.maxDistance = 220;
controls.maxPolarAngle = Math.PI * 0.485;
controls.target.set(0, 3, 0);

const city = new THREE.Group();
city.visible = true;
scene.add(city);
const introGroup = new THREE.Group();
scene.add(introGroup);
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pickables = [];
const animated = [];
const treeGroups = [];
const turbineGroups = [];
const material = (color, roughness = 0.8, metalness = 0.04) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const mats = {
  ground: material("#526a5b"),
  road: material("#263338", 0.92),
  sidewalk: material("#8f9b88"),
  concrete: material("#c8c8b7"),
  glass: new THREE.MeshPhysicalMaterial({ color: "#5e8a8b", roughness: 0.22, metalness: 0.25, transparent: true, opacity: 0.91 }),
  darkGlass: new THREE.MeshPhysicalMaterial({ color: "#24494c", roughness: 0.25, metalness: 0.4 }),
  green: material("#78a67d"),
  leaf: new THREE.MeshStandardMaterial({ color: "#6da775", roughness: 0.92 }),
  leafLight: new THREE.MeshStandardMaterial({ color: "#a1c989", roughness: 0.95 }),
  trunk: material("#735744"),
  solar: new THREE.MeshStandardMaterial({ color: "#244b65", roughness: 0.34, metalness: 0.52 }),
  roadMark: material("#c7c69d"),
};

const sun = new THREE.DirectionalLight("#fff1d2", 2.2);
sun.position.set(-35, 58, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.bias = -0.0002;
scene.add(sun);
const hemisphere = new THREE.HemisphereLight("#d9eee8", "#51635a", 1.15);
scene.add(hemisphere);
const fillLight = new THREE.DirectionalLight("#9ecbc3", 0.7);
fillLight.position.set(28, 22, -40);
scene.add(fillLight);

function box(parent, name, position, size, mat, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  mesh.name = name;
  parent.add(mesh);
  if (options.info) {
    mesh.userData.info = options.info;
    pickables.push(mesh);
  }
  return mesh;
}

function register(mesh, info) {
  mesh.userData.info = info;
  pickables.push(mesh);
  return mesh;
}

function addGround() {
  const ground = box(city, "أرض المدينة", [0, -0.42, 0], [144, 0.8, 120], mats.ground, { castShadow: false });
  register(ground, infoData.ground);
  const base = new THREE.Mesh(new THREE.BoxGeometry(147, 2, 123), material("#354c43"));
  base.position.y = -1.35;
  base.receiveShadow = true;
  city.add(base);
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 0.35, 80), material("#b6bca5"));
  plaza.position.set(0, 0.08, 0);
  plaza.receiveShadow = true;
  city.add(plaza);
  const plazaInner = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 0.4, 80), material("#738b70"));
  plazaInner.position.set(0, 0.25, 0);
  plazaInner.receiveShadow = true;
  city.add(plazaInner);
}

function addRoads() {
  for (let x = -54; x <= 54; x += 18) {
    box(city, "شارع رئيسي", [x, 0.015, 0], [5.2, 0.08, 104], mats.road, { castShadow: false });
    box(city, "رصيف", [x - 3.2, 0.03, 0], [1.1, 0.12, 104], mats.sidewalk, { castShadow: false });
    box(city, "رصيف", [x + 3.2, 0.03, 0], [1.1, 0.12, 104], mats.sidewalk, { castShadow: false });
    for (let z = -48; z <= 48; z += 8) {
      box(city, "خط طريق", [x, 0.07, z], [0.12, 0.025, 3], mats.roadMark, { castShadow: false });
    }
  }
  for (let z = -45; z <= 45; z += 18) {
    box(city, "شارع رئيسي", [0, 0.02, z], [108, 0.08, 5.2], mats.road, { castShadow: false });
    box(city, "رصيف", [0, 0.04, z - 3.2], [108, 0.12, 1.1], mats.sidewalk, { castShadow: false });
    box(city, "رصيف", [0, 0.04, z + 3.2], [108, 0.12, 1.1], mats.sidewalk, { castShadow: false });
    for (let x = -48; x <= 48; x += 8) {
      box(city, "خط طريق", [x, 0.075, z], [3, 0.025, 0.12], mats.roadMark, { castShadow: false });
    }
  }
  for (let i = 0; i < 9; i++) {
    const bridge = box(city, "جسر مشاة", [-31 + i * 18, 2.4, 0], [0.7, 0.14, 6.1], material("#c8d2bc", 0.4, 0.22), { castShadow: false });
    bridge.position.z = 9;
    for (let rail = -1; rail <= 1; rail += 2) {
      box(city, "حاجز جسر", [-31 + i * 18, 2.9, 9 + rail * 2.8], [0.16, 0.72, 0.12], mats.concrete, { castShadow: false });
    }
  }
}

function addTree(parent, x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 1.7, 7), mats.trunk);
  trunk.position.y = 0.85;
  trunk.castShadow = true;
  group.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), Math.random() > 0.5 ? mats.leaf : mats.leafLight);
  crown.position.y = 2.1;
  crown.scale.set(1, 1.18, 1);
  crown.castShadow = true;
  group.add(crown);
  crown.userData.info = infoData.tree;
  register(crown, infoData.tree);
  parent.add(group);
  treeGroups.push(group);
  return group;
}

function addPark(x, z, width = 12, depth = 11) {
  const park = new THREE.Group();
  park.position.set(x, 0, z);
  const grass = box(park, "حديقة حضرية", [0, 0.12, 0], [width, 0.25, depth], mats.green, { castShadow: false, info: infoData.park });
  grass.userData.info = infoData.park;
  for (let i = 0; i < 10; i++) {
    const tx = (Math.random() - 0.5) * (width - 2);
    const tz = (Math.random() - 0.5) * (depth - 2);
    addTree(park, tx, tz, 0.78 + Math.random() * 0.25);
  }
  for (let i = -1; i <= 1; i++) {
    box(park, "ممر الحديقة", [i * 3, 0.27, 0], [0.9, 0.035, depth - 1], mats.sidewalk, { castShadow: false });
  }
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.18, 28), new THREE.MeshStandardMaterial({ color: "#80bab3", metalness: 0.4, roughness: 0.18 }));
  water.position.set(0, 0.31, 0);
  park.add(water);
  city.add(park);
  return park;
}

function addBuilding(x, z, width, depth, height, style, info = infoData.residential) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const palette = ["#d0d1bf", "#b8c5b7", "#c5cabb", "#9eb5b0", "#d4cbb7"];
  const facade = material(palette[Math.floor(Math.random() * palette.length)], 0.65, 0.08);
  let base;
  if (style === "cylinder") {
    base = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.48, width * 0.56, height, 12), facade);
    base.position.y = height / 2;
  } else {
    base = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), facade);
    base.position.y = height / 2;
  }
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);
  register(base, info);

  const floors = Math.max(3, Math.floor(height / 2.7));
  if (style === "stepped") {
    for (let tier = 0; tier < 3; tier++) {
      const tierHeight = height * (0.34 - tier * 0.055);
      const tierWidth = width * (1 - tier * 0.22);
      const tierMesh = new THREE.Mesh(new THREE.BoxGeometry(tierWidth, tierHeight, depth * (1 - tier * 0.2)), facade);
      tierMesh.position.set(0, height * (0.52 + tier * 0.22), 0);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      group.add(tierMesh);
      register(tierMesh, info);
    }
  }

  const windows = new THREE.MeshStandardMaterial({ color: "#6f9c99", roughness: 0.24, metalness: 0.28, emissive: "#c8a86c", emissiveIntensity: 0.03 });
  const windowRows = Math.min(floors, 14);
  for (let floor = 0; floor < windowRows; floor++) {
    const y = 1.2 + floor * (height / (windowRows + 1));
    if (y > height - 0.7) break;
    const count = Math.max(2, Math.floor(width / 1.25));
    for (let j = 0; j < count; j++) {
      const wx = -width / 2 + (j + 0.5) * (width / count);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.06), windows);
      win.position.set(wx, y, depth / 2 + 0.035);
      group.add(win);
      const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.38), windows);
      sideWin.position.set(width / 2 + 0.035, y, -depth / 2 + (j + 0.5) * depth / count);
      group.add(sideWin);
    }
  }
  if (height > 18) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.64, 0.7, depth * 0.64), material("#596e67", 0.6, 0.1));
    roof.position.y = height + 0.35;
    roof.castShadow = true;
    group.add(roof);
    for (let i = 0; i < 3; i++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), mats.concrete);
      vent.position.set(-width * 0.18 + i * 0.7, height + 1, 0);
      group.add(vent);
    }
  }
  city.add(group);
  return group;
}

function addLandmark(x, z, name, height, width, info, color) {
  const group = addBuilding(x, z, width, width * 0.82, height, height > 40 ? "stepped" : "box", info);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.18, 0.08), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.32 }));
  sign.position.set(0, height * 0.66, width * 0.43 + 0.08);
  group.add(sign);
  const rooftop = new THREE.Mesh(new THREE.BoxGeometry(width * 0.3, 0.5, width * 0.3), material("#96b49a", 0.4, 0.3));
  rooftop.position.y = height + 0.4;
  group.add(rooftop);
  return group;
}

function addSolarPanel(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0.5, z);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2 * scale, 0.11, 2.2 * scale), material("#9aa995", 0.5, 0.4));
  group.add(frame);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.05 * scale, 0.12, 2.05 * scale), mats.solar);
  panel.position.y = 0.1;
  panel.rotation.x = -0.2;
  group.add(panel);
  for (let i = -1; i <= 1; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, 2 * scale), material("#83a6a8", 0.25, 0.5));
    line.position.set(i * 0.76 * scale, 0.17, 0);
    group.add(line);
  }
  group.userData.info = infoData.solar;
  register(panel, infoData.solar);
  city.add(group);
  return group;
}

function addTurbine(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * scale, 0.27 * scale, 9 * scale, 9), material("#e0e6d9", 0.3, 0.35));
  tower.position.y = 4.5 * scale;
  tower.castShadow = true;
  group.add(tower);
  const hub = new THREE.Group();
  hub.position.set(0, 9 * scale, 0);
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.34 * scale, 12, 12), material("#e1e9dc", 0.3, 0.5));
  hub.add(center);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 4.2 * scale, 0.11 * scale), material("#d4e0d4", 0.35, 0.3));
    blade.position.y = 2.1 * scale;
    blade.rotation.z = -0.13;
    blade.castShadow = true;
    const bladeGroup = new THREE.Group();
    bladeGroup.rotation.z = i * Math.PI * 2 / 3;
    bladeGroup.add(blade);
    hub.add(bladeGroup);
  }
  group.add(hub);
  register(tower, infoData.turbine);
  turbineGroups.push(hub);
  city.add(group);
  return group;
}

function addTransport() {
  for (let i = 0; i < 4; i++) {
    const bus = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.3, 1.65), material(i === 0 ? "#9dcdb1" : "#b9d1c5", 0.32, 0.15));
    body.position.y = 0.8;
    body.castShadow = true;
    bus.add(body);
    const windows = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.48, 1.69), mats.darkGlass);
    windows.position.y = 1.15;
    bus.add(windows);
    for (let wheel = -1; wheel <= 1; wheel += 2) {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12), material("#222b2a"));
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wheel * 1.5, 0.38, 0.82);
      bus.add(tire);
    }
    bus.userData.info = infoData.transport;
    register(body, infoData.transport);
    bus.position.set(-50 + i * 22, 0.1, -45);
    bus.userData.routeOffset = i * 0.25;
    city.add(bus);
    animated.push(bus);
  }
  const station = addLandmark(3, -18, "محطة النقل", 13, 8, infoData.station, "#a8d7b4");
  station.position.x = 2;
  for (let i = 0; i < 4; i++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4, 7), material("#d9e3d7"));
    pole.position.set(-3 + i * 2, 2, -11);
    city.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: "#d4edbb", emissive: "#c5edaa", emissiveIntensity: 0.6 }));
    lamp.position.set(-3 + i * 2, 4, -11);
    city.add(lamp);
  }
}

function addCity() {
  addGround();
  addRoads();

  const parkSpecs = [[-43, -27, 13, 13], [42, 27, 14, 13], [-42, 32, 12, 12], [43, -29, 13, 12], [0, 35, 15, 10]];
  parkSpecs.forEach(([x, z, w, d]) => addPark(x, z, w, d));

  for (let x = -45; x <= 45; x += 18) {
    for (let z = -36; z <= 36; z += 18) {
      if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
      if (parkSpecs.some(([px, pz]) => Math.abs(x - px) < 9 && Math.abs(z - pz) < 9)) continue;
      const distance = Math.sqrt(x * x + z * z);
      const height = Math.max(9, 13 + Math.random() * 17 + (distance < 34 ? 11 : 0));
      const width = 7 + Math.random() * 4;
      const style = Math.random() > 0.78 ? "cylinder" : Math.random() > 0.65 ? "stepped" : "box";
      addBuilding(x + (Math.random() - 0.5) * 2.6, z + (Math.random() - 0.5) * 2.6, width, width * (0.7 + Math.random() * 0.35), height, style);
    }
  }

  addLandmark(-10, -5, "برج الابتكار", 54, 11, infoData.tower, "#b8e4bd");
  addLandmark(11, 8, "مركز المدينة", 43, 12, infoData.tower, "#a9d8bd");
  addLandmark(37, 3, "مستشفى المدينة", 24, 11, infoData.hospital, "#e1c4aa");
  addLandmark(-37, 8, "مدرسة المستقبل", 15, 12, infoData.school, "#d0bd8e");
  addLandmark(30, -35, "مركز الأبحاث", 25, 10, infoData.research, "#a9d8bd");

  addTransport();
  for (let i = 0; i < 13; i++) addSolarPanel(-54 + i * 8.6, 49, 0.75);
  for (let i = 0; i < 6; i++) addTurbine(-51 + i * 20, -52 + (i % 2) * 3, 0.9 + Math.random() * 0.2);
  addFountain();
  addStreetFurniture();
  addClouds();
  addRain();
}

function addFountain() {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.2, 0.7, 40), material("#b7c3ad", 0.4, 0.1));
  base.position.set(0, 0.48, 0);
  base.receiveShadow = true;
  city.add(base);
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.18, 40), new THREE.MeshStandardMaterial({ color: "#75b5b3", metalness: 0.5, roughness: 0.18, transparent: true, opacity: 0.92 }));
  pool.position.set(0, 0.88, 0);
  city.add(pool);
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.27, 3.7, 10), new THREE.MeshStandardMaterial({ color: "#c1e5d7", transparent: true, opacity: 0.6 }));
  jet.position.set(0, 2.8, 0);
  city.add(jet);
  register(pool, infoData.fountain);
}

function addStreetFurniture() {
  for (let x = -45; x <= 45; x += 18) {
    for (let z = -36; z <= 36; z += 18) {
      for (let side = -1; side <= 1; side += 2) {
        const lampX = x + side * 4.3;
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 3.4, 8), material("#c6d1c4", 0.4, 0.4));
        lamp.position.set(lampX, 1.7, z + 4);
        city.add(lamp);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.32), new THREE.MeshStandardMaterial({ color: "#d9edc9", emissive: "#c2dfa7", emissiveIntensity: 0.3 }));
        head.position.set(lampX, 3.38, z + 4);
        city.add(head);
      }
    }
  }
}

function addClouds() {
  const cloudMaterial = new THREE.MeshStandardMaterial({ color: "#f0f3e8", transparent: true, opacity: 0.34, roughness: 1, depthWrite: false });
  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group();
    const x = (Math.random() - 0.5) * 130;
    const z = (Math.random() - 0.5) * 110;
    for (let j = 0; j < 5; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 2.5, 12, 10), cloudMaterial);
      puff.position.set(j * 3.2 - 6, Math.random() * 1.4, Math.random() * 2 - 1);
      puff.scale.y = 0.55;
      cloud.add(puff);
    }
    cloud.position.set(x, 36 + Math.random() * 10, z);
    cloud.userData.startX = x;
    cloud.userData.drift = 0.18 + Math.random() * 0.28;
    cloud.userData.isCloud = true;
    city.add(cloud);
    animated.push(cloud);
  }
}

function addRain() {
  const count = 1400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 125;
    positions[i * 3 + 1] = Math.random() * 55;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 110;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.Points(geometry, new THREE.PointsMaterial({ color: "#c7e0e2", size: 0.16, transparent: true, opacity: 0.7 }));
  rain.visible = false;
  rain.userData.isRain = true;
  city.add(rain);
  animated.push(rain);
}

function addStarsAndEarth() {
  const stars = new THREE.BufferGeometry();
  const starPositions = new Float32Array(2100);
  for (let i = 0; i < starPositions.length; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 500;
    starPositions[i + 1] = (Math.random() - 0.5) * 400;
    starPositions[i + 2] = -60 - Math.random() * 260;
  }
  stars.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMesh = new THREE.Points(stars, new THREE.PointsMaterial({ color: "#d9f3ea", size: 0.75, transparent: true, opacity: 0.8 }));
  introGroup.add(starMesh);
  const earthMat = new THREE.MeshStandardMaterial({ color: "#286d79", roughness: 0.8, metalness: 0.08, emissive: "#052632", emissiveIntensity: 0.3 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(8, 64, 48), earthMat);
  earth.position.set(0, 0, -32);
  earth.castShadow = true;
  introGroup.add(earth);
  const landMat = new THREE.MeshStandardMaterial({ color: "#82a975", roughness: 1 });
  const continents = [
    { p: [-0.5, 0.62, 0.48], s: [2.4, 3.3, 0.5] }, { p: [-0.22, 0.05, 0.69], s: [1.6, 3.4, 0.45] },
    { p: [0.53, 0.51, 0.38], s: [3.1, 2, 0.5] }, { p: [0.57, -0.05, 0.52], s: [2.8, 2.3, 0.55] },
    { p: [0.1, -0.63, 0.63], s: [1.3, 2.3, 0.45] }, { p: [-0.75, 0.12, 0.15], s: [1.1, 1.2, 0.45] },
  ];
  continents.forEach(({ p, s }) => {
    const normal = new THREE.Vector3(...p).normalize();
    const patch = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), landMat);
    patch.position.copy(normal.multiplyScalar(7.98));
    patch.scale.set(...s);
    patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...p).normalize());
    earth.add(patch);
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(8.13, 48, 32), new THREE.MeshStandardMaterial({ color: "#e5f3ed", transparent: true, opacity: 0.17, roughness: 1 }));
  earth.add(clouds);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(8.6, 48, 32), new THREE.MeshBasicMaterial({ color: "#76c6dc", transparent: true, opacity: 0.13, side: THREE.BackSide }));
  earth.add(atmosphere);
  const halo = new THREE.PointLight("#76cce0", 70, 80);
  halo.position.set(3, 6, -23);
  introGroup.add(halo);
  introGroup.userData.earth = earth;
}

const infoData = {
  ground: { category: "التخطيط الحضري", title: "مدينة مصممة للإنسان", description: "تجمع وادي النور بين الأحياء السكنية والمساحات الخضراء والخدمات، ضمن شبكة شوارع تقلل مسافات التنقل.", fact: "التخطيط المدمج يساعد على خفض الاعتماد على السيارة." },
  residential: { category: "المباني السكنية", title: "مبانٍ تتنفس", description: "واجهات موفرة للطاقة ونوافذ واسعة تستفيد من ضوء النهار، مع أسطح قابلة لاحتضان الطاقة الشمسية والحدائق.", fact: "المباني عالية الكفاءة تقلل استهلاك الطاقة والانبعاثات." },
  tower: { category: "العمارة الذكية", title: "أبراج الابتكار", description: "أبراج متعددة الاستخدامات تجمع العمل والسكن والخدمات في مكان واحد، وتستفيد من أنظمة إدارة ذكية للطاقة والمياه.", fact: "التصميم الذكي يجعل المساحة الحضرية أكثر كفاءة." },
  hospital: { category: "الصحة وجودة الحياة", title: "مستشفى المدينة", description: "مرفق صحي قريب من الأحياء السكنية، محاط بمسارات مشاة وحدائق تساعد على بناء بيئة حضرية صحية.", fact: "الوصول السهل إلى الرعاية جزء من الاستدامة الاجتماعية." },
  school: { category: "التعليم", title: "مدرسة المستقبل", description: "مدرسة تستخدم الإضاءة الطبيعية والمساحات الخارجية للتعلم، وتعرّف الطلاب على الطاقة النظيفة والبيئة.", fact: "الوعي البيئي يبدأ بالتعلم والتجربة." },
  station: { category: "تنقل مستدام", title: "محطة النقل الكهربائي", description: "مركز اتصال للحافلات الكهربائية ومسارات المشاة، يربط أحياء المدينة ويقلل الانبعاثات الناتجة عن التنقل.", fact: "النقل العام النظيف يقلل الازدحام والتلوث." },
  transport: { category: "نقل منخفض الانبعاثات", title: "حافلة كهربائية", description: "تعمل الحافلات الكهربائية دون انبعاثات عادم أثناء القيادة، وتدعم تنقلاً جماعياً هادئاً داخل المدينة.", fact: "ارفع نسبة النقل الكهربائي ولاحظ أثرها في لوحة المؤشرات." },
  solar: { category: "طاقة متجددة", title: "ألواح الطاقة الشمسية", description: "تحول الخلايا الشمسية ضوء الشمس إلى كهرباء نظيفة، ويمكن تركيبها فوق المباني ومواقف السيارات.", fact: "السعودية غنية بمورد شمسي وفير طوال العام." },
  turbine: { category: "طاقة متجددة", title: "توربين الرياح", description: "تدير الرياح شفرات التوربين لتوليد الكهرباء. تتغير سرعة الدوران مع حالة الطقس في المحاكاة.", fact: "مزيج الشمس والرياح يعزز موثوقية الطاقة النظيفة." },
  park: { category: "مساحات خضراء", title: "حديقة حضرية", description: "تمنح الحدائق موئلاً للطبيعة ومكاناً للراحة، وتساعد الأشجار على تلطيف الجو وتحسين جودة الحياة.", fact: "أضف الأشجار لمشاهدة تحسن الغطاء الأخضر." },
  tree: { category: "طبيعة المدينة", title: "شجرة حضرية", description: "توفر الأشجار الظل وتدعم التنوع الحيوي وتساعد على تنقية الهواء وامتصاص الكربون.", fact: "كل شجرة جديدة ترفع مؤشر الغطاء الأخضر." },
  research: { category: "الابتكار", title: "مركز الأبحاث الخضراء", description: "تعمل فرق البحث على حلول عملية للمياه والطاقة والمواد المستدامة التي تجعل المدن أكثر مرونة.", fact: "التقنية والبحث العلمي محركان لمستقبل مستدام." },
  fountain: { category: "المياه", title: "نافورة تدوير المياه", description: "توضح النافورة كيف يمكن إعادة استخدام المياه في المشهد الحضري مع أنظمة تدوير وترشيد ذكية.", fact: "المياه مورد ثمين؛ إعادة الاستخدام تقلل الهدر." },
};

let currentTime = "day";
let currentWeather = "sunny";
let windStrength = 1;
let cityEntered = false;
addStarsAndEarth();
addCity();
setWeather("sunny");
setTimeOfDay("day");

let transitionStart = 0;
let transitionFrom = new THREE.Vector3();
let transitionTarget = new THREE.Vector3(100, 88, 116);
let transitionLook = new THREE.Vector3(0, 3, 0);
let toastTimer;
let selectedPlacement = null;
let transportLevel = 68;
let extraTrees = 0;
let solarCount = 13;
let turbineCount = 6;

function enterCity() {
  if (cityEntered) return;
  cityEntered = true;
  transitionStart = clock.elapsedTime;
  transitionFrom.copy(camera.position);
  introGroup.visible = false;
  intro.classList.add("leaving");
  ui.topbar.hidden = false;
  setDashboardVisibility(true);
  ui.sceneLabel.hidden = false;
  ui.cameraHint.hidden = false;
  ui.resetCamera.hidden = false;
  ui.credits.hidden = false;
  setTimeout(() => {
    intro.hidden = true;
    showToast("مرحبًا بك في وادي النور");
  }, 900);
}

function setDashboardVisibility(visible) {
  ui.dashboard.hidden = !visible;
  const label = visible ? "إخفاء لوحة التحكم" : "إظهار لوحة التحكم";
  ui.dashboardToggle.setAttribute("aria-expanded", String(visible));
  ui.dashboardToggle.setAttribute("aria-label", label);
  ui.dashboardToggle.title = label;
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("visible"), 2500);
}

function showInfo(info) {
  if (!info) return;
  document.querySelector("#info-category").textContent = info.category;
  document.querySelector("#info-title").textContent = info.title;
  document.querySelector("#info-description").textContent = info.description;
  document.querySelector("#info-fact").textContent = info.fact;
  ui.infoCard.hidden = false;
}

function setTimeOfDay(time) {
  const settings = {
    dawn: { sky: "#d59b82", fog: "#bc9a83", sun: "#ffd1a0", intensity: 1.75, hemi: 1.45, exposure: 1.08, label: "شروق" },
    day: { sky: "#b5d1d1", fog: "#a9c8c3", sun: "#fff1d2", intensity: 2.2, hemi: 1.15, exposure: 1.05, label: "نهار" },
    sunset: { sky: "#b57965", fog: "#ae8171", sun: "#ffb27b", intensity: 2.1, hemi: 1.2, exposure: 1.08, label: "غروب" },
    night: { sky: "#101f32", fog: "#263746", sun: "#8cb6d5", intensity: 0.55, hemi: 0.6, exposure: 0.9, label: "ليل" },
  };
  const current = settings[time] || settings.day;
  scene.background.set(current.sky);
  scene.fog.color.set(current.fog);
  sun.color.set(current.sun);
  sun.intensity = current.intensity;
  hemisphere.intensity = current.hemi;
  renderer.toneMappingExposure = current.exposure;
  sun.position.set(time === "sunset" ? 45 : -35, time === "night" ? 22 : 58, time === "dawn" ? -34 : 24);
  ui.clockLabel.textContent = `الآن · ${current.label}`;
  document.querySelectorAll("[data-time]").forEach((button) => button.classList.toggle("selected", button.dataset.time === time));
  city.traverse((object) => {
    if (object.isMesh && object.geometry.type === "BoxGeometry" && object.material === mats.darkGlass) return;
    if (object.isMesh && object.material && object.material.emissive) object.material.emissiveIntensity = time === "night" ? 1.1 : 0.25;
  });
  currentTime = time;
}

function setWeather(weather) {
  currentWeather = weather;
  const rain = city.children.find((child) => child.userData.isRain);
  const weatherSettings = {
    sunny: { fog: 0.0031, clouds: 0.34, rain: false, wind: 1, label: "مشمس" },
    cloudy: { fog: 0.0042, clouds: 0.68, rain: false, wind: 1.15, label: "غائم" },
    rainy: { fog: 0.006, clouds: 0.7, rain: true, wind: 1.3, label: "ممطر" },
    foggy: { fog: 0.014, clouds: 0.55, rain: false, wind: 0.7, label: "ضباب" },
    stormy: { fog: 0.009, clouds: 0.76, rain: true, wind: 2.6, label: "عاصف" },
  };
  const state = weatherSettings[weather] || weatherSettings.sunny;
  scene.fog.density = state.fog;
  if (rain) rain.visible = state.rain;
  city.traverse((object) => {
    if (object.userData.isCloud) {
      object.traverse((child) => {
        if (child.isMesh) child.material.opacity = state.clouds;
      });
    }
  });
  windStrength = state.wind;
  document.querySelectorAll("[data-weather]").forEach((button) => button.classList.toggle("selected", button.dataset.weather === weather));
  if (weather === "stormy") sun.intensity = currentTime === "night" ? 0.4 : 1.45;
  else setTimeOfDay(currentTime);
  if (cityEntered) showToast(`تم تغيير الطقس إلى: ${state.label}`);
}

function updateMetrics() {
  const energy = Math.min(98, 58 + solarCount + turbineCount);
  const green = Math.min(78, 42 + extraTrees);
  const emissions = Math.max(0.5, 4.2 - transportLevel * 0.022 - (energy - 63) * 0.08);
  ui.energy.innerHTML = `${energy}<span>%</span>`;
  ui.energyBar.style.width = `${energy}%`;
  ui.green.innerHTML = `${green}<span>%</span>`;
  ui.greenBar.style.width = `${green}%`;
  ui.emissions.innerHTML = `${emissions.toFixed(1)}<span> طن</span>`;
  ui.air.textContent = emissions < 1.4 ? "ممتاز" : emissions < 2.2 ? "جيد جدًا" : "جيد";
}

function getPlacementPoint() {
  const point = new THREE.Vector3();
  const origin = new THREE.Vector3();
  camera.getWorldDirection(origin);
  raycaster.set(camera.position, origin);
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  if (raycaster.ray.intersectPlane(ground, point)) {
    point.x = THREE.MathUtils.clamp(Math.round(point.x / 3) * 3, -58, 58);
    point.z = THREE.MathUtils.clamp(Math.round(point.z / 3) * 3, -49, 49);
    return point;
  }
  return new THREE.Vector3(18, 0, 18);
}

function placeSelected(point) {
  if (!selectedPlacement) return;
  if (selectedPlacement === "tree") {
    addTree(city, point.x, point.z, 1);
    extraTrees++;
    showToast("أُضيفت شجرة جديدة إلى المدينة");
  } else if (selectedPlacement === "solar") {
    addSolarPanel(point.x, point.z, 1);
    solarCount++;
    showToast("تم تركيب لوح طاقة شمسية");
  } else if (selectedPlacement === "turbine") {
    addTurbine(point.x, point.z, 1);
    turbineCount++;
    showToast("تمت إضافة توربين رياح");
  }
  selectedPlacement = null;
  canvas.style.cursor = "grab";
  updateMetrics();
}

function selectPlacement(type, message) {
  selectedPlacement = type;
  canvas.style.cursor = "crosshair";
  showToast(message);
}

function enterPlacementOnClick(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  if (selectedPlacement) {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const position = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(plane, position)) position.copy(controls.target);
    position.x = THREE.MathUtils.clamp(Math.round(position.x / 3) * 3, -58, 58);
    position.z = THREE.MathUtils.clamp(Math.round(position.z / 3) * 3, -49, 49);
    placeSelected(position);
    return;
  }
  const hits = raycaster.intersectObjects(pickables, false);
  if (hits.length) showInfo(hits[0].object.userData.info);
  else ui.infoCard.hidden = true;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  if (!cityEntered) {
    const earth = introGroup.userData.earth;
    if (earth) earth.rotation.y += delta * 0.055;
    camera.position.x = Math.sin(elapsed * 0.08) * 1.4;
    camera.position.y = Math.sin(elapsed * 0.12) * 0.45;
    camera.lookAt(0, 0, -32);
  } else {
    if (elapsed - transitionStart < 2.5) {
      const progress = THREE.MathUtils.clamp((elapsed - transitionStart) / 2.5, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(transitionFrom, transitionTarget, eased);
      controls.target.lerp(transitionLook, 0.035);
    }
    controls.update();
    animated.forEach((object) => {
      if (object.userData.isRain) {
        if (!object.visible) return;
        const positions = object.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          let y = positions.getY(i) - delta * (currentWeather === "stormy" ? 38 : 25);
          if (y < 0) y = 48 + Math.random() * 8;
          positions.setY(i, y);
          positions.setX(i, positions.getX(i) + delta * (currentWeather === "stormy" ? 7 : 1.5));
        }
        positions.needsUpdate = true;
      } else if (object.userData.routeOffset !== undefined) {
        const route = ((elapsed * (0.035 + transportLevel * 0.00045) + object.userData.routeOffset) % 1);
        object.position.x = -52 + route * 104;
      } else if (object.userData.startX !== undefined) {
        object.position.x += delta * object.userData.drift * windStrength;
        if (object.position.x > 75) object.position.x = -75;
      }
    });
    turbineGroups.forEach((hub) => { hub.rotation.z += delta * (0.7 * windStrength); });
    if (currentWeather === "stormy" && Math.random() < 0.002) {
      sun.intensity = 4;
      setTimeout(() => { sun.intensity = currentTime === "night" ? 0.4 : 1.45; }, 90);
    }
  }
  renderer.render(scene, camera);
}

document.querySelector("#enter-city").addEventListener("click", enterCity);
ui.dashboardToggle.addEventListener("click", () => setDashboardVisibility(ui.dashboard.hidden));
document.querySelector("#help-button").addEventListener("click", () => { ui.guideModal.hidden = false; });
document.querySelector("#close-guide").addEventListener("click", () => { ui.guideModal.hidden = true; });
document.querySelector("#guide-done").addEventListener("click", () => { ui.guideModal.hidden = true; });
document.querySelector("#close-info").addEventListener("click", () => { ui.infoCard.hidden = true; });
document.querySelector("#reset-camera").addEventListener("click", () => {
  controls.target.set(0, 3, 0);
  camera.position.set(100, 88, 116);
  showToast("عادت الكاميرا إلى المشهد الكامل");
});
document.querySelectorAll("[data-time]").forEach((button) => button.addEventListener("click", () => setTimeOfDay(button.dataset.time)));
document.querySelectorAll("[data-weather]").forEach((button) => button.addEventListener("click", () => setWeather(button.dataset.weather)));
document.querySelector("#add-tree").addEventListener("click", () => selectPlacement("tree", "انقر على أرض المدينة لاختيار موضع الشجرة"));
document.querySelector("#add-solar").addEventListener("click", () => selectPlacement("solar", "انقر على أرض المدينة لتركيب الألواح الشمسية"));
document.querySelector("#add-turbine").addEventListener("click", () => selectPlacement("turbine", "انقر على أرض المدينة لوضع توربين الرياح"));
document.querySelector("#upgrade-park").addEventListener("click", () => {
  const park = addPark(-15 + Math.random() * 30, 20 + Math.random() * 9, 13, 12);
  park.scale.setScalar(1.15);
  extraTrees += 10;
  updateMetrics();
  showToast("تم تطوير حديقة جديدة وإضافة 10 أشجار");
});
document.querySelector("#transport-slider").addEventListener("input", (event) => {
  transportLevel = Number(event.target.value);
  document.querySelector("#transport-value").textContent = `${transportLevel}%`;
  event.target.style.background = `linear-gradient(to left,#a4d5b5 ${transportLevel}%,rgba(255,255,255,.18) ${transportLevel}%)`;
  updateMetrics();
});
canvas.addEventListener("pointerdown", (event) => { canvas.dataset.pointerX = String(event.clientX); canvas.dataset.pointerY = String(event.clientY); });
canvas.addEventListener("click", (event) => {
  const startX = Number(canvas.dataset.pointerX);
  const startY = Number(canvas.dataset.pointerY);
  if (Math.hypot(event.clientX - startX, event.clientY - startY) > 5) return;
  enterPlacementOnClick(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (!cityEntered || selectedPlacement) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  canvas.style.cursor = raycaster.intersectObjects(pickables, false).length ? "pointer" : "grab";
});
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
});

updateMetrics();
animate();
window.setTimeout(enterCity, 900);
