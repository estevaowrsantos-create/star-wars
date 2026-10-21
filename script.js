import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.setClearColor(0x030611);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030611, 0.012);

const camera = new THREE.PerspectiveCamera(
  75, innerWidth / innerHeight, 0.1, 500
);

const player = new THREE.Group();
player.position.set(0, 0, 9);
scene.add(player);
player.add(camera);
camera.position.set(0, 1.6, 0);

scene.add(new THREE.HemisphereLight(0x8bdfff, 0x15132d, 2));

const light = new THREE.PointLight(0x27bfff, 35, 70);
light.position.set(0, 8, 0);
scene.add(light);

// MAPAS
const world = new THREE.Group();
scene.add(world);

const mapData = {
  nebula: {
    name: 'NEBULOSA ÓRION',
    fog: 0x030611,
    floor: 0x0a1a30,
    grid: 0x1d9ac9,
    accent: 0x43dfff,
    planet: 0x173c75
  },
  forest: {
    name: 'SELVA VÉSPERA',
    fog: 0x06170f,
    floor: 0x102b20,
    grid: 0x28734a,
    accent: 0x65ffb0,
    planet: 0x1d714b
  },
  ice: {
    name: 'NÍVEA-9',
    fog: 0x091b2a,
    floor: 0x18374b,
    grid: 0x65cfff,
    accent: 0x9beeff,
    planet: 0x6daecb
  },
  lava: {
    name: 'FORJA INFERNAL',
    fog: 0x210906,
    floor: 0x30130f,
    grid: 0xff542f,
    accent: 0xff6a36,
    planet: 0x9d3020
  },
  crystal: {
    name: 'PRISMA-7',
    fog: 0x160a2c,
    floor: 0x21143d,
    grid: 0xb27bff,
    accent: 0xd6a2ff,
    planet: 0x7548b8
  }
};

const arena = new THREE.Mesh(
  new THREE.CylinderGeometry(36, 36, 0.5, 64, 1, true),
  new THREE.MeshStandardMaterial({
    color: 0x0a1a30,
    metalness: 0.65,
    roughness: 0.6,
    side: THREE.DoubleSide
  })
);

arena.rotation.x = Math.PI / 2;
arena.position.set(0, -0.6, -12);
scene.add(arena);

let grid = new THREE.GridHelper(
  72, 36, 0x1d9ac9, 0x15304d
);

grid.position.set(0, -0.32, -12);
scene.add(grid);

const starGeometry = new THREE.BufferGeometry();
const starCount = 2400;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 180;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
  starPositions[i * 3 + 2] = -Math.random() * 180 + 30;
}

starGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(starPositions, 3)
);

scene.add(new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xa5eaff,
    size: 0.25,
    transparent: true,
    opacity: 0.9
  })
));

let planet;
let planetGlow;
let ring;

function setMap(id) {
  const map = mapData[id] || mapData.nebula;

  while (world.children.length) {
    const obj = world.children[0];
    world.remove(obj);
  }

  scene.fog = new THREE.FogExp2(map.fog, 0.014);
  renderer.setClearColor(map.fog);
  arena.material.color.setHex(map.floor);

  scene.remove(grid);
  grid.geometry.dispose();
  grid.material.dispose();

  grid = new THREE.GridHelper(
    72, 36, map.grid, map.grid
  );
  grid.position.set(0, -0.32, -12);
  scene.add(grid);

  planet = new THREE.Mesh(
    new THREE.SphereGeometry(13, 48, 32),
    new THREE.MeshStandardMaterial({
      color: map.planet,
      roughness: 0.88,
      emissive: map.planet,
      emissiveIntensity: 0.12
    })
  );

  planet.position.set(-42, 18, -82);
  world.add(planet);

  planetGlow = new THREE.Mesh(
    new THREE.SphereGeometry(13.35, 40, 28),
    new THREE.MeshBasicMaterial({
      color: map.accent,
      wireframe: true,
      transparent: true,
      opacity: 0.14
    })
  );

  planetGlow.position.copy(planet.position);
  world.add(planetGlow);

  ring = new THREE.Mesh(
    new THREE.TorusGeometry(18, 0.18, 8, 100),
    new THREE.MeshStandardMaterial({
      color: map.accent,
      emissive: map.accent,
      emissiveIntensity: 0.35,
      metalness: 0.8,
      roughness: 0.25
    })
  );

  ring.position.copy(planet.position);
  ring.rotation.set(0.8, 0.2, 0.25);
  ring.scale.set(1, 1, 0.55);
  world.add(ring);

  for (let i = 0; i < 50; i++) {
    let rock;

    if (id === 'crystal') {
      rock = new THREE.Mesh(
        new THREE.OctahedronGeometry(
          0.5 + Math.random() * 1.5
        ),
        new THREE.MeshStandardMaterial({
          color: map.accent,
          emissive: map.accent,
          emissiveIntensity: 0.15,
          metalness: 0.35,
          roughness: 0.22
        })
      );
    } else {
      rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(
          0.35 + Math.random() * 1.25
        ),
        new THREE.MeshStandardMaterial({
          color: id === 'ice' ? 0x9bd8e8 :
                 id === 'lava' ? 0x392b2a :
                 id === 'forest' ? 0x244c35 :
                 0x33445e,
          roughness: 0.92,
          flatShading: true
        })
      );
    }

    const angle = Math.random() * Math.PI * 2;
    const distance = 19 + Math.random() * 27;

    rock.position.set(
      Math.cos(angle) * distance,
      Math.random() * 8 - 3,
      -12 + Math.sin(angle) * distance
    );

    rock.rotation.set(
      Math.random() * 3,
      Math.random() * 3,
      Math.random() * 3
    );

    world.add(rock);
  }

  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 17 + Math.random() * 18;

    const obj = new THREE.Group();

    if (id === 'forest') {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.38, 2.5, 7),
        new THREE.MeshStandardMaterial({
          color: 0x543b2b
        })
      );

      trunk.position.y = 1.1;
      obj.add(trunk);

      for (let k = 0; k < 3; k++) {
        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(1.25 - k * 0.2, 2.1, 7),
          new THREE.MeshStandardMaterial({
            color: k === 1 ? 0x168d63 : 0x0b5948,
            emissive: 0x063d28,
            emissiveIntensity: 0.4
          })
        );

        crown.position.y = 2.2 + k * 0.8;
        obj.add(crown);
      }
    } else if (id === 'ice') {
      obj.add(new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 4, 6),
        new THREE.MeshStandardMaterial({
          color: 0x8bdff5,
          emissive: 0x1a789c,
          emissiveIntensity: 0.35
        })
      ));
    } else if (id === 'lava') {
      obj.add(new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 4, 7),
        new THREE.MeshStandardMaterial({
          color: 0x3b2424,
          emissive: 0x8e210b,
          emissiveIntensity: 0.55
        })
      ));
    } else if (id === 'crystal') {
      obj.add(new THREE.Mesh(
        new THREE.OctahedronGeometry(1.4),
        new THREE.MeshStandardMaterial({
          color: map.accent,
          emissive: map.accent,
          emissiveIntensity: 0.45
        })
      ));
      obj.scale.y = 2.2;
    } else {
      obj.add(new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.8, 4, 8),
        new THREE.MeshStandardMaterial({
          color: 0x123e63,
          emissive: 0x062b4c,
          metalness: 0.8
        })
      ));
    }

    obj.position.set(
      Math.cos(angle) * distance,
      0,
      -12 + Math.sin(angle) * distance
    );

    world.add(obj);
  }

  const tag = document.querySelector('#mapTag');

  if (tag) {
    tag.textContent = map.name;
  }
}

const ambientPulses = [];

for (let i = 0; i < 8; i++) {
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0x54dfff,
      transparent: true,
      opacity: 0.6
    })
  );

  orb.position.set(
    (Math.random() - 0.5) * 60,
    2 + Math.random() * 8,
    -12 + (Math.random() - 0.5) * 60
  );

  scene.add(orb);
  ambientPulses.push(orb);
}

// ESTADO DO JOGO
const monsters = [];
const shots = [];
const remotePlayers = new Map();

let score = 0;
let wave = 1;
let health = 100;
let playing = false;
let fireHeld = false;
let lastShot = 0;
let killedThisWave = 0;
let weapon = 'laser';
let damageUpgrade = 0;
let fireRateUpgrade = 0;
let coins = 0;
let shopOpen = false;

const weaponConfig = {
  laser: {
    cooldown: 180,
    damage: 1,
    count: 1,
    speed: 36,
    color: 0x64f7ff
  },
  plasma: {
    cooldown: 520,
    damage: 3,
    count: 1,
    speed: 25,
    color: 0xffbc55
  },
  spread: {
    cooldown: 650,
    damage: 1,
    count: 3,
    speed: 31,
    color: 0xff73d5
  }
};

const keys = {};
let yaw = 0;
let pitch = 0;
let drag = false;
let lastX = 0;
let lastY = 0;
let joyX = 0;
let joyY = 0;
let joyPointer = null;

const xrControllers = [];
let xrMoveX = 0;
let xrMoveY = 0;
let xrLastFire = 0;

const scoreEl = document.querySelector('#score');
const waveEl = document.querySelector('#wave');
const remainingEl = document.querySelector('#remaining');
const healthEl = document.querySelector('#healthfill');
const message = document.querySelector('#message');
const menu = document.querySelector('#menu');

function updateHUD() {
  scoreEl.textContent = score;
  waveEl.textContent = wave;
  remainingEl.textContent = monsters.length;

  healthEl.style.width = health + '%';
  healthEl.style.background =
    health < 30 ? '#ff456e' : '#43f5a4';

  document.querySelectorAll('[data-weapon]').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.weapon === weapon
    );
  });
}

// MONSTROS
function makeMonster(boss = false) {
  const g = new THREE.Group();
  const size = boss ? 2.5 : 0.85;

  const palette = [
    { skin: 0x6c36ce, glow: 0x9d62ff, eye: 0x75fff0 },
    { skin: 0x168b83, glow: 0x38ffe0, eye: 0xffef8a },
    { skin: 0x9a315a, glow: 0xff477b, eye: 0xffd0f0 },
    { skin: 0x4662b8, glow: 0x62a8ff, eye: 0xff6d9b }
  ];

  const c = palette[Math.floor(Math.random() * palette.length)];

  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(size, 2),
    new THREE.MeshStandardMaterial({
      color: boss ? 0x9f244b : c.skin,
      emissive: boss ? 0x58051d : c.glow,
      emissiveIntensity: 0.22,
      roughness: 0.3,
      metalness: 0.22
    })
  );

  body.scale.set(1, 1.08, 0.88);
  g.add(body);

  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.59, 20, 16),
    new THREE.MeshStandardMaterial({
      color: 0x17213b,
      emissive: c.glow,
      emissiveIntensity: 0.12,
      metalness: 0.35
    })
  );

  belly.position.set(0, -size * 0.22, size * 0.32);
  belly.scale.set(1, 0.9, 0.48);
  g.add(belly);

  for (const x of [-0.28, 0.28]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(boss ? 0.38 : 0.15, 16, 12),
      new THREE.MeshBasicMaterial({ color: c.eye })
    );

    eye.position.set(x * size / 0.75, size * 0.18, size * 0.82);
    g.add(eye);
  }

  const spikeMaterial = new THREE.MeshStandardMaterial({
    color: c.glow,
    emissive: c.glow,
    emissiveIntensity: 0.45,
    metalness: 0.4
  });

  const spikeCount = boss ? 9 : 6;

  for (let i = 0; i < spikeCount; i++) {
    const angle = i / spikeCount * Math.PI * 2;

    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(size * 0.13, size * 0.5, 6),
      spikeMaterial
    );

    spike.position.set(
      Math.cos(angle) * size * 0.72,
      size * 0.52,
      Math.sin(angle) * size * 0.62
    );

    g.add(spike);
  }

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(size * 1.18, 18, 14),
    new THREE.MeshBasicMaterial({
      color: c.glow,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    })
  );

  g.add(aura);

  const angle = Math.random() * Math.PI * 2;
  const distance = boss ? 22 : 15 + Math.random() * 14;

  g.position.set(
    Math.cos(angle) * distance,
    boss ? 1.3 : Math.random() * 3 - 1.2,
    -12 + Math.sin(angle) * distance
  );

  g.userData = {
    id: 'm' + Math.random().toString(36).slice(2),
    hp: boss ? 12 + wave * 3 : 1 + Math.floor(wave / 3),
    speed: boss ? 1.2 : 1.2 + Math.random() * 0.45 + wave * 0.08,
    attack: 0,
    boss
  };

  scene.add(g);
  monsters.push(g);
}

function startWave() {
  shopOpen = false;

  const shop = document.querySelector('#shop');
  if (shop) shop.style.display = 'none';

  killedThisWave = 0;

  if (wave % 5 === 0) {
    makeMonster(true);

    for (let i = 0; i < Math.min(2 + Math.floor(wave / 5), 5); i++) {
      makeMonster();
    }

    message.textContent = '⚠ CHEFE GIGANTE NA ÁREA!';
  } else {
    for (let i = 0; i < Math.min(4 + wave * 2, 18); i++) {
      makeMonster();
    }

    message.textContent = 'ONDA ' + wave;
  }

  updateHUD();
}

function startGame() {
  const select = document.querySelector('#mapSelect');
  setMap(select ? select.value : 'nebula');

  score = 0;
  coins = 0;
  wave = 1;
  health = 100;
  playing = true;
  shopOpen = false;

  menu.style.display = 'none';
  message.textContent = '';

  player.position.set(0, 0, 9);
  yaw = 0;
  pitch = 0;

  while (monsters.length) {
    scene.remove(monsters.pop());
  }

  while (shots.length) {
    scene.remove(shots.pop().mesh);
  }

  startWave();
}

// ARMAS E DISPAROS
function makeShot(origin, direction) {
  const cfg = weaponConfig[weapon];

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(weapon === 'plasma' ? 0.17 : 0.09, 8, 8),
    new THREE.MeshBasicMaterial({ color: cfg.color })
  );

  mesh.position.copy(origin);
  scene.add(mesh);

  shots.push({
    mesh,
    dir: direction.clone().normalize(),
    life: 3,
    damage: cfg.damage + damageUpgrade,
    speed: cfg.speed
  });
}

function shoot(aimObject = null) {
  if (!playing || shopOpen) return;

  const cfg = weaponConfig[weapon];
  const now = performance.now();

  if (now - lastShot < Math.max(90, cfg.cooldown - fireRateUpgrade * 20)) {
    return;
  }

  lastShot = now;

  const direction = new THREE.Vector3();
  const origin = new THREE.Vector3();

  if (aimObject) {
    aimObject.getWorldDirection(direction);
    aimObject.getWorldPosition(origin);
  } else {
    camera.getWorldDirection(direction);
    camera.getWorldPosition(origin);
  }

  for (let i = 0; i < cfg.count; i++) {
    const shotDirection = direction.clone();

    if (cfg.count > 1) {
      const right = new THREE.Vector3()
        .crossVectors(direction, new THREE.Vector3(0, 1, 0))
        .normalize();

      shotDirection.addScaledVector(right, (i - 1) * 0.095);
      shotDirection.normalize();
    }

    makeShot(
      origin.clone().add(direction.clone().multiplyScalar(0.65)),
      shotDirection
    );
  }
}

function endGame() {
  playing = false;
  message.textContent = 'FIM DE JOGO';
  menu.style.display = 'flex';

  const title = document.querySelector('#card h1');
  const description = document.querySelector('#card p');
  const start = document.querySelector('#startBtn');

  if (title) title.textContent = 'FIM DE JOGO';
  if (description) {
    description.textContent =
      `Você marcou ${score} pontos e chegou à onda ${wave}.`;
  }
  if (start) start.textContent = 'JOGAR NOVAMENTE';
}

// LOJA
function openShop() {
  playing = false;
  shopOpen = true;

  const shop = document.querySelector('#shop');
  const box = document.querySelector('#shopOptions');

  if (!shop || !box) {
    wave++;
    playing = true;
    startWave();
    return;
  }

  shop.style.display = 'flex';
  box.innerHTML = '';

  const offers = [
    ['⚡ Dano +1', 150, () => damageUpgrade++],
    ['🔥 Cadência', 120, () => fireRateUpgrade++],
    ['💚 Reparar energia', 100, () => health = Math.min(100, health + 35)],
    ['🔫 Plasma', 220, () => weapon = 'plasma'],
    ['💫 Dispersão', 260, () => weapon = 'spread']
  ];

  offers.forEach(([label, cost, apply]) => {
    const button = document.createElement('button');
    button.textContent = `${label} — ${cost} pontos`;
    button.disabled = score < cost;

    button.addEventListener('click', () => {
      if (score < cost) return;

      score -= cost;
      apply();
      updateHUD();
      openShop();
    });

    box.appendChild(button);
  });
}

const nextWaveButton = document.querySelector('#nextWaveBtn');

if (nextWaveButton) {
  nextWaveButton.addEventListener('click', () => {
    wave++;
    playing = true;
    startWave();
  });
}

document.querySelectorAll('[data-weapon]').forEach(button => {
  button.addEventListener('click', () => {
    weapon = button.dataset.weapon;
    updateHUD();
  });
});

// NAVES
const shipStyles = {
  cyan: { color: 0x45dfff, speed: 7 },
  gold: { color: 0xffc34d, speed: 8.2 },
  violet: { color: 0xb56bff, speed: 6.8 }
};

function getShipSpeed() {
  const select = document.querySelector('#shipSelect');
  const style = select ? select.value : 'cyan';

  return (shipStyles[style] || shipStyles.cyan).speed;
}

// CONTROLES VR
for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5)
    ]),
    new THREE.LineBasicMaterial({
      color: i === 0 ? 0x66ccff : 0xff77cc
    })
  );

  controller.add(line);

  controller.addEventListener('selectstart', () => {
    if (playing && !shopOpen) shoot(controller);
  });

  scene.add(controller);
  xrControllers.push(controller);
}

function updateXRInputs() {
  xrMoveX = 0;
  xrMoveY = 0;

  const session = renderer.xr.getSession();
  if (!session) return;

  for (const source of session.inputSources) {
    const gamepad = source.gamepad;
    if (!gamepad) continue;

    const axes = gamepad.axes;

    const axisX = axes.length >= 4 ? axes[2] : (axes[0] || 0);
    const axisY = axes.length >= 4 ? axes[3] : (axes[1] || 0);

    if (source.handedness === 'left') {
      if (Math.abs(axisX) > 0.12) xrMoveX = axisX;
      if (Math.abs(axisY) > 0.12) xrMoveY = axisY;
    }

    const trigger = gamepad.buttons?.[0];

    if (
      source.handedness === 'right' &&
      trigger?.pressed &&
      performance.now() - xrLastFire > 100
    ) {
      xrLastFire = performance.now();

      if (playing && !shopOpen) {
        shoot(renderer.xr.getController(1));
      }
    }
  }
}

const vrButton = document.querySelector('#vrBtn');

if (vrButton) {
  vrButton.addEventListener('click', async () => {
    try {
      if (!navigator.xr) {
        message.textContent = 'WebXR não disponível neste navegador.';
        return;
      }

      const supported = await navigator.xr.isSessionSupported('immersive-vr');

      if (!supported) {
        message.textContent = 'VR não detectado neste dispositivo.';
        return;
      }

      if (!playing) startGame();

      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      });

      await renderer.xr.setSession(session);

      const help = document.querySelector('#help');

      if (help) {
        help.textContent =
          'VR: analógico esquerdo para mover · mire com o controle direito · gatilho para atirar';
      }
    } catch (error) {
      message.textContent = 'Não foi possível iniciar VR. Use HTTPS e um headset compatível.';
      console.error(error);
    }
  });
}

// CONTROLES COMPUTADOR
renderer.domElement.addEventListener('pointerdown', event => {
  if (!playing) return;

  drag = true;
  lastX = event.clientX;
  lastY = event.clientY;

  if (event.pointerType === 'mouse' && event.button === 0) {
    shoot();
  }
});

window.addEventListener('pointerup', () => {
  drag = false;
});

window.addEventListener('pointermove', event => {
  if (!drag || !playing || renderer.xr.isPresenting) return;

  if (event.pointerType === 'mouse') {
    yaw -= event.movementX * 0.002;
    pitch -= event.movementY * 0.002;
  } else {
    yaw -= (event.clientX - lastX) * 0.005;
    pitch -= (event.clientY - lastY) * 0.005;
    lastX = event.clientX;
    lastY = event.clientY;
  }

  pitch = THREE.MathUtils.clamp(pitch, -1.15, 1.15);

  camera.rotation.order = 'YXZ';
  camera.rotation.set(pitch, yaw, 0);
});

window.addEventListener('keydown', event => {
  keys[event.code] = true;

  if (event.code === 'Space') {
    event.preventDefault();
    fireHeld = true;
    shoot();
  }

  if (event.code === 'Digit1') weapon = 'laser';
  if (event.code === 'Digit2') weapon = 'plasma';
  if (event.code === 'Digit3') weapon = 'spread';

  updateHUD();
});

window.addEventListener('keyup', event => {
  keys[event.code] = false;

  if (event.code === 'Space') {
    fireHeld = false;
  }
});

// JOYSTICK DE CELULAR
const fireButton = document.querySelector('#fireBtn');

if (fireButton) {
  fireButton.addEventListener('pointerdown', event => {
    event.preventDefault();
    fireHeld = true;
    shoot();
  });

  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    fireButton.addEventListener(type, () => {
      fireHeld = false;
    });
  }
}

const joyBase = document.querySelector('#joyBase');
const joyKnob = document.querySelector('#joyKnob');

function resetJoy() {
  joyX = 0;
  joyY = 0;
  joyPointer = null;

  if (joyKnob) {
    joyKnob.style.left = '50%';
    joyKnob.style.top = '50%';
  }
}

function moveJoy(event) {
  if (!joyBase || !joyKnob) return;

  const rect = joyBase.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let dx = event.clientX - cx;
  let dy = event.clientY - cy;

  const max = rect.width * 0.34;
  const length = Math.hypot(dx, dy);

  if (length > max) {
    dx = dx / length * max;
    dy = dy / length * max;
  }

  joyX = dx / max;
  joyY = dy / max;

  joyKnob.style.left = `calc(50% + ${dx}px)`;
  joyKnob.style.top = `calc(50% + ${dy}px)`;
}

if (joyBase) {
  joyBase.addEventListener('pointerdown', event => {
    event.preventDefault();
    joyPointer = event.pointerId;
    joyBase.setPointerCapture(event.pointerId);
    moveJoy(event);
  });

  joyBase.addEventListener('pointermove', event => {
    if (event.pointerId === joyPointer) {
      event.preventDefault();
      moveJoy(event);
    }
  });

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    joyBase.addEventListener(type, resetJoy);
  }
}

// CICLO PRINCIPAL
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);

  if (playing) {
    ambientPulses.forEach((orb, i) => {
      orb.position.y = 2 + Math.sin(performance.now() * 0.001 + i) * 1.4;
      orb.rotation.y += dt * 0.2;
    });

    ring.rotation.z += dt * 0.025;
    planetGlow.rotation.y += dt * 0.01;

    updateXRInputs();

    const xrActive = renderer.xr.isPresenting;
    const viewDirection = new THREE.Vector3();

    camera.getWorldDirection(viewDirection);
    viewDirection.y = 0;

    if (viewDirection.lengthSq() < 0.001) {
      viewDirection.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    }

    viewDirection.normalize();

    const forward = xrActive
      ? viewDirection
      : new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    const movement = new THREE.Vector3();

    if (keys.KeyW || keys.ArrowUp) movement.add(forward);
    if (keys.KeyS || keys.ArrowDown) movement.sub(forward);
    if (keys.KeyA) movement.sub(right);
    if (keys.KeyD) movement.add(right);

    movement.addScaledVector(forward, -joyY);
    movement.addScaledVector(right, joyX);

    if (xrActive) {
      movement.addScaledVector(forward, -xrMoveY);
      movement.addScaledVector(right, xrMoveX);
    }

    if (movement.lengthSq() > 0) {
      player.position.add(
        movement.normalize().multiplyScalar(getShipSpeed() * dt)
      );
    }

    player.position.x = THREE.MathUtils.clamp(
      player.position.x, -27, 27
    );

    player.position.z = THREE.MathUtils.clamp(
      player.position.z, -37, 29
    );

    if (fireHeld) shoot();

    // MONSTROS PERSEGUEM O JOGADOR
    for (let i = monsters.length - 1; i >= 0; i--) {
      const monster = monsters[i];

      const toPlayer = new THREE.Vector3(
        player.position.x - monster.position.x,
        player.position.y + 1 - monster.position.y,
        player.position.z - monster.position.z
      );

      const distance = toPlayer.length();

      if (distance > 1.5) {
        monster.position.add(
          toPlayer.normalize() * monster.userData.speed * dt
        );
      }

      monster.rotation.y += dt * 0.8;

      monster.position.y +=
        Math.sin(performance.now() * 0.002 + i) * dt * 0.25;

      monster.userData.attack -= dt;

      if (distance < 2.1 && monster.userData.attack <= 0) {
        health = Math.max(0, health - 8);
        monster.userData.attack = 0.8;

        updateHUD();

        if (health <= 0) {
          endGame();
          break;
        }
      }
    }

    // MOVIMENTO DOS PROJÉTEIS E COLISÕES
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];

      shot.mesh.position.addScaledVector(shot.dir, shot.speed * dt);
      shot.life -= dt;

      let hit = false;

      for (let j = monsters.length - 1; j >= 0; j--) {
        const monster = monsters[j];

        const radius = monster.userData.boss ? 3.2 : 1.2;

        if (shot.mesh.position.distanceTo(monster.position) < radius) {
          monster.userData.hp -= shot.damage;

          scene.remove(shot.mesh);
          shots.splice(i, 1);
          hit = true;

          if (monster.userData.hp <= 0) {
            const wasBoss = monster.userData.boss;

            scene.remove(monster);
            monsters.splice(j, 1);

            score += wasBoss ? 1200 : 100;
            coins += wasBoss ? 500 : 10;
            killedThisWave++;

            if (wasBoss) {
              message.textContent = 'CHEFE DERROTADO!';
            }

            updateHUD();
          }

          break;
        }
      }

      if (!hit && shot.life <= 0) {
        scene.remove(shot.mesh);
        shots.splice(i, 1);
      }
    }

    // PRÓXIMA ONDA
    if (monsters.length === 0 && !shopOpen) {
      openShop();
    }

    updateHUD();
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// REDIMENSIONAMENTO
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

// MENU
const startButton = document.querySelector('#startBtn');

if (startButton) {
  startButton.addEventListener('click', startGame);
}

// SELEÇÃO DE MAPA
const mapSelect = document.querySelector('#mapSelect');

if (mapSelect) {
  mapSelect.addEventListener('change', event => {
    setMap(event.target.value);
  });
}

setMap('nebula');
updateHUD();
