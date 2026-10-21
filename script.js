
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = (id) => document.getElementById(id);

const game = $("game");
if (!game) {
  throw new Error('Adicione <div id="game"></div> ao HTML.');
}

// ==================================================
// CONFIGURAÇÃO DO JOGO
// ==================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b1c);
scene.fog = new THREE.Fog(0x080b1c, 35, 100);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 1.7, 5);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
game.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xa9c9ff, 0x171025, 2));

const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
mainLight.position.set(5, 12, 7);
mainLight.castShadow = true;
scene.add(mainLight);

// ==================================================
// CENÁRIO
// ==================================================

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.MeshStandardMaterial({
    color: 0x171c31,
    roughness: 0.9,
    metalness: 0.1
  })
);

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(180, 90, 0x593d99, 0x242a49);
grid.position.y = 0.015;
scene.add(grid);

// Rochas e estruturas decorativas
for (let i = 0; i < 45; i++) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.5 + Math.random() * 1.5, 0),
    new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x252d4c : 0x39264f,
      roughness: 0.85
    })
  );

  const angle = Math.random() * Math.PI * 2;
  const distance = 15 + Math.random() * 55;

  rock.position.set(
    Math.cos(angle) * distance,
    0.3,
    Math.sin(angle) * distance
  );

  rock.scale.y = 0.5 + Math.random();
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

// ==================================================
// ESTADO DO JOGO
// ==================================================

const player = {
  health: 100,
  score: 0,
  wave: 1,
  speed: 8
};

let playing = false;
let shopOpen = false;
let lastShot = 0;
let spawnTimer = 0;
let mouseSensitivity = 0.002;

const monsters = [];
const shots = [];
const effects = [];

let weapon = "laser";

const weaponConfig = {
  laser: {
    cooldown: 250,
    speed: 65,
    damage: 1,
    count: 1,
    color: 0x48f5ff
  },
  plasma: {
    cooldown: 500,
    speed: 35,
    damage: 3,
    count: 1,
    color: 0x9c5cff
  },
  spread: {
    cooldown: 650,
    speed: 45,
    damage: 1,
    count: 5,
    color: 0xffb347
  }
};

// ==================================================
// MONSTROS: POSIÇÃO VISÍVEL À FRENTE DO JOGADOR
// ==================================================

function makeMonster(boss = false) {
  const monster = new THREE.Group();
  const size = boss ? 1.8 : 0.75;

  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(size, 2),
    new THREE.MeshStandardMaterial({
      color: boss ? 0xff174f : 0x9b35e8,
      emissive: boss ? 0x770020 : 0x351060,
      emissiveIntensity: 1.2,
      roughness: 0.35,
      metalness: 0.25
    })
  );

  body.castShadow = true;
  monster.add(body);

  // Olhos na parte da frente do monstro
  for (const x of [-0.3, 0.3]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(boss ? 0.22 : 0.13, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x66ffff })
    );

    eye.position.set(x * (size / 0.75), size * 0.2, size * 0.8);
    monster.add(eye);
  }

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(size * 1.25, 16, 12),
    new THREE.MeshBasicMaterial({
      color: boss ? 0xff174f : 0xc05aff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    })
  );

  monster.add(aura);

  // Calcula a direção horizontal para a qual a câmera está olhando.
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;

  if (forward.lengthSq() < 0.001) {
    forward.set(0, 0, -1);
  }

  forward.normalize();

  // Vetor lateral perpendicular à direção do jogador.
  const right = new THREE.Vector3(forward.z, 0, -forward.x);

  // Coloca os inimigos na frente, em vez de espalhá-los aleatoriamente
  // por todo o mapa.
  const side = (Math.random() - 0.5) * 12;
  const distance = boss ? 17 : 11 + Math.random() * 7;

  monster.position.copy(camera.position);
  monster.position.y = 0;

  monster.position.addScaledVector(forward, distance);
  monster.position.addScaledVector(right, side);
  monster.position.y = boss ? 2.0 : 1.0 + Math.random() * 0.7;

  monster.userData = {
    hp: boss ? 25 + player.wave * 5 : 2 + Math.floor(player.wave / 3),
    speed: boss ? 1.2 : 1.8 + Math.random() * 1.2,
    boss,
    attackCooldown: 0,
    phase: Math.random() * Math.PI * 2
  };

  scene.add(monster);
  monsters.push(monster);

  updateHUD();
  return monster;
}

function startWave() {
  if (!playing) return;

  const count = Math.min(4 + player.wave * 2, 30);

  for (let i = 0; i < count; i++) {
    makeMonster(false);
  }

  if (player.wave % 5 === 0) {
    makeMonster(true);
  }

  showMessage("ONDA " + player.wave);
}

// ==================================================
// TIROS: DIREÇÃO CORRETA DA MIRA
// ==================================================

function makeShot(origin, direction, config) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 10),
    new THREE.MeshBasicMaterial({ color: config.color })
  );

  mesh.position.copy(origin);
  scene.add(mesh);

  // direction é guardada como vetor normalizado.
  // A atualização abaixo soma esse vetor, fazendo o tiro avançar.
  shots.push({
    mesh,
    dir: direction.clone().normalize(),
    speed: config.speed,
    damage: config.damage,
    life: 2.5
  });
}

function shoot(aimObject = null) {
  if (!playing || shopOpen) return;

  const now = performance.now();
  const config = weaponConfig[weapon];

  if (now - lastShot < config.cooldown) return;
  lastShot = now;

  // No computador, usa a câmera.
  // No VR, usa a orientação do controle que está mirando.
  const aim = aimObject || camera;
  const direction = new THREE.Vector3();
  const origin = new THREE.Vector3();

  aim.getWorldDirection(direction);
  aim.getWorldPosition(origin);
  direction.normalize();

  // Pequeno afastamento para o tiro não nascer dentro da câmera.
  origin.addScaledVector(direction, 0.7);

  const right = new THREE.Vector3()
    .crossVectors(direction, new THREE.Vector3(0, 1, 0))
    .normalize();

  for (let i = 0; i < config.count; i++) {
    const shotDirection = direction.clone();

    if (config.count > 1) {
      const spread = (i - (config.count - 1) / 2) * 0.075;
      shotDirection.addScaledVector(right, spread).normalize();
    }

    makeShot(origin, shotDirection, config);
  }
}

// ==================================================
// EFEITOS VISUAIS
// ==================================================

function makeExplosion(position, color = 0x9b35e8) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8
    })
  );

  mesh.position.copy(position);
  scene.add(mesh);

  effects.push({ mesh, life: 0.35, maxLife: 0.35 });
}

function showMessage(message) {
  const element = $("message");
  if (element) element.textContent = message;
}

// ==================================================
// ATUALIZAÇÃO DOS MONSTROS
// ==================================================

function updateMonsters(dt) {
  for (let i = monsters.length - 1; i >= 0; i--) {
    const monster = monsters[i];
    const data = monster.userData;

    // O inimigo persegue o jogador.
    const target = new THREE.Vector3(
      camera.position.x,
      monster.position.y,
      camera.position.z
    );

    const direction = target.sub(monster.position);

    if (direction.lengthSq() > 0.001) {
      direction.normalize();
      monster.position.addScaledVector(direction, data.speed * dt);
    }

    // Movimento e animação simples.
    data.phase += dt * 3;
    monster.position.y += Math.sin(data.phase) * dt * 0.3;
    monster.rotation.y += dt * 0.8;

    // Dano ao jogador quando um monstro chega perto.
    const dx = monster.position.x - camera.position.x;
    const dz = monster.position.z - camera.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    data.attackCooldown -= dt;

    if (distance < 1.5 && data.attackCooldown <= 0) {
      player.health = Math.max(0, player.health - (data.boss ? 12 : 5));
      data.attackCooldown = 1.0;
      updateHUD();

      if (player.health <= 0) {
        endGame();
        return;
      }
    }
  }
}

// ==================================================
// COLISÕES: TIROS CONTRA MONSTROS
// ==================================================

function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const shot = shots[i];

    // CORREÇÃO: o tiro avança na direção da mira.
    // Não trocar por addScaledVector(shot.dir, -shot.speed * dt).
    shot.mesh.position.addScaledVector(shot.dir, shot.speed * dt);
    shot.life -= dt;

    let hit = false;

    for (let j = monsters.length - 1; j >= 0; j--) {
      const monster = monsters[j];

      const hitRadius = monster.userData.boss ? 2.0 : 1.0;
      const distance = shot.mesh.position.distanceTo(monster.position);

      if (distance < hitRadius) {
        monster.userData.hp -= shot.damage;

        makeExplosion(
          shot.mesh.position,
          monster.userData.boss ? 0xff174f : 0xb55cff
        );

        hit = true;

        if (monster.userData.hp <= 0) {
          scene.remove(monster);
          monsters.splice(j, 1);

          player.score += monster.userData.boss ? 100 : 10;
          updateHUD();
        }

        break;
      }
    }

    if (hit || shot.life <= 0) {
      scene.remove(shot.mesh);
      shots.splice(i, 1);
    }
  }
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.life -= dt;

    const scale = 1 + (1 - effect.life / effect.maxLife) * 4;
    effect.mesh.scale.setScalar(scale);
    effect.mesh.material.opacity = Math.max(0, effect.life / effect.maxLife);

    if (effect.life <= 0) {
      scene.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      effect.mesh.material.dispose();
      effects.splice(i, 1);
    }
  }
}

// ==================================================
// CONTROLES DO COMPUTADOR
// ==================================================

const keys = {};
let yaw = 0;
let pitch = 0;
let mouseDown = false;

window.addEventListener("keydown", (event) => {
  keys[event.code] = true;

  if (event.code === "Space") {
    event.preventDefault();
    shoot();
  }

  if (event.code === "Digit1") weapon = "laser";
  if (event.code === "Digit2") weapon = "plasma";
  if (event.code === "Digit3") weapon = "spread";
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

renderer.domElement.addEventListener("click", () => {
  if (playing && !renderer.xr.isPresenting) {
    renderer.domElement.requestPointerLock?.();
  }
});

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  if (renderer.xr.isPresenting) return;

  yaw -= event.movementX * mouseSensitivity;
  pitch -= event.movementY * mouseSensitivity;

  pitch = THREE.MathUtils.clamp(
    pitch,
    -Math.PI / 2 + 0.05,
    Math.PI / 2 - 0.05
  );

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});

renderer.domElement.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    mouseDown = true;
    shoot();
  }
});

window.addEventListener("mouseup", () => {
  mouseDown = false;
});

// ==================================================
// CONTROLES VR
// ==================================================

const controllerLeft = renderer.xr.getController(0);
const controllerRight = renderer.xr.getController(1);

scene.add(controllerLeft);
scene.add(controllerRight);

controllerLeft.addEventListener("selectstart", () => {
  // O controle esquerdo é reservado principalmente para movimentação.
});

controllerRight.addEventListener("selectstart", () => {
  shoot(controllerRight);
});

let previousRightTrigger = false;

function updateVRInputs() {
  const session = renderer.xr.getSession();
  if (!session) return;

  for (const source of session.inputSources) {
    if (!source.gamepad) continue;

    const handedness = source.handedness;
    const buttons = source.gamepad.buttons;
    const axes = source.gamepad.axes;

    // Controle esquerdo: movimentação pelo analógico.
    if (handedness === "left" && axes.length >= 2) {
      const x = axes[2] ?? axes[0] ?? 0;
      const y = axes[3] ?? axes[1] ?? 0;

      movePlayer(x, y, 0.12);
    }

    // O gatilho direito dispara na direção do controle.
    if (handedness === "right" && buttons.length > 0) {
      const trigger = buttons[0]?.pressed ?? false;

      if (trigger && !previousRightTrigger) {
        shoot(controllerRight);
      }

      previousRightTrigger = trigger;
    }
  }
}

// ==================================================
// MOVIMENTAÇÃO DO JOGADOR
// ==================================================

function movePlayer(x, y, strength = 1) {
  if (!playing || shopOpen) return;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;

  if (forward.lengthSq() < 0.001) {
    forward.set(0, 0, -1);
  }

  forward.normalize();

  const right = new THREE.Vector3(forward.z, 0, -forward.x);

  camera.position.addScaledVector(right, x * player.speed * strength);
  camera.position.addScaledVector(forward, -y * player.speed * strength);

  camera.position.y = 1.7;
}

function updateKeyboardMovement(dt) {
  if (!playing || shopOpen || renderer.xr.isPresenting) return;

  let x = 0;
  let y = 0;

  if (keys.KeyW || keys.ArrowUp) y -= 1;
  if (keys.KeyS || keys.ArrowDown) y += 1;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;

  if (x !== 0 || y !== 0) {
    const length = Math.hypot(x, y);
    movePlayer(x / length, y / length, dt);
  }
}

// ==================================================
// INTERFACE
// ==================================================

function updateHUD() {
  if ($("score")) $("score").textContent = player.score;
  if ($("wave")) $("wave").textContent = player.wave;
  if ($("remaining")) $("remaining").textContent = monsters.length;

  const healthFill = $("healthfill");
  if (healthFill) {
    healthFill.style.width = player.health + "%";
  }
}

function clearEntities() {
  for (const monster of monsters) scene.remove(monster);
  for (const shot of shots) scene.remove(shot.mesh);

  for (const effect of effects) {
    scene.remove(effect.mesh);
    effect.mesh.geometry.dispose();
    effect.mesh.material.dispose();
  }

  monsters.length = 0;
  shots.length = 0;
  effects.length = 0;
}

function startGame() {
  clearEntities();

  player.health = 100;
  player.score = 0;
  player.wave = 1;

  camera.position.set(0, 1.7, 5);
  camera.rotation.set(0, 0, 0);
  yaw = 0;
  pitch = 0;

  playing = true;
  shopOpen = false;
  lastShot = 0;

  if ($("menu")) $("menu").style.display = "none";
  if ($("shop")) $("shop").style.display = "none";

  startWave();
  updateHUD();
}

function endGame() {
  playing = false;
  showMessage("FIM DE JOGO — Pontuação: " + player.score);

  if ($("menu")) $("menu").style.display = "flex";
  if ($("startBtn")) $("startBtn").textContent = "Jogar novamente";
}

function nextWave() {
  if (!playing) return;

  player.wave++;
  startWave();
  updateHUD();
}

// ==================================================
// BOTÕES HTML OPCIONAIS
// ==================================================

$("startBtn")?.addEventListener("click", startGame);

$("nextWaveBtn")?.addEventListener("click", () => {
  if (monsters.length === 0) nextWave();
});

$("vrBtn")?.addEventListener("click", async () => {
  if (!navigator.xr) {
    showMessage("Este navegador não oferece WebXR.");
    return;
  }

  try {
    const supported = await navigator.xr.isSessionSupported("immersive-vr");

    if (!supported) {
      showMessage("VR não disponível neste dispositivo.");
      return;
    }

    const session = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "bounded-floor"]
    });

    await renderer.xr.setSession(session);
    startGame();
  } catch (error) {
    console.error("Erro ao iniciar VR:", error);
    showMessage("Não foi possível iniciar o VR.");
  }
});

document.querySelectorAll("[data-weapon]").forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.weapon;

    if (weaponConfig[selected]) {
      weapon = selected;
      showMessage("Arma selecionada: " + weapon);
    }
  });
});

$("fireBtn")?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  shoot(renderer.xr.isPresenting ? controllerRight : null);
});

// ==================================================
// RESIZE
// ==================================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================================================
// LOOP PRINCIPAL
// ==================================================

let previousTime = 0;

renderer.setAnimationLoop((time) => {
  const dt = Math.min((time - previousTime) / 1000 || 0, 0.05);
  previousTime = time;

  if (playing) {
    updateKeyboardMovement(dt);

    if (renderer.xr.isPresenting) {
      updateVRInputs();
    }

    if (mouseDown && !renderer.xr.isPresenting) {
      shoot();
    }

    updateMonsters(dt);
    updateShots(dt);
    updateEffects(dt);

    // Avança a onda somente quando todos os inimigos foram derrotados.
    if (monsters.length === 0 && !shopOpen) {
      spawnTimer += dt;

      if (spawnTimer >= 2) {
        spawnTimer = 0;
        nextWave();
      }
    } else {
      spawnTimer = 0;
    }

    updateHUD();
  }

  renderer.render(scene, camera);
});
