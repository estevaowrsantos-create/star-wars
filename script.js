import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas=document.querySelector('#game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.xr.enabled=true;
renderer.setClearColor(0x030611);
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x030611,.012);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,500);
camera.position.set(0,2,9);
const player=new THREE.Group(); player.position.set(0,0,9); scene.add(player); player.add(camera); camera.position.set(0,1.6,0);
const hemi=new THREE.HemisphereLight(0x8bdfff,0x15132d,2);scene.add(hemi);
const light=new THREE.PointLight(0x27bfff,35,70);light.position.set(0,8,0);scene.add(light);
// Cenários selecionáveis: cada mapa altera terreno, atmosfera, iluminação e objetos.
const world=new THREE.Group();scene.add(world);
let activeMap='nebula', mapAccent=0x43dfff;
const mapData={
 nebula:{name:'NEBULOSA ÔRION',desc:'ESTAÇÃO ORION · CAMPO DE ASTEROIDES',fog:0x030611,fogDensity:.012,floor:0x0a1a30,grid:0x1d9ac9,accent:0x43dfff,planet:0x173c75},
 forest:{name:'SELVA VÉSPERA',desc:'FLORESTA BIOLUMINESCENTE · SETOR 04',fog:0x06170f,fogDensity:.018,floor:0x102b20,grid:0x28734a,accent:0x65ffb0,planet:0x1d714b},
 ice:{name:'NÍVEA-9',desc:'PLANETA GLACIAL · TEMPESTADE DE GELO',fog:0x091b2a,fogDensity:.016,floor:0x18374b,grid:0x65cfff,accent:0x9beeff,planet:0x6daecb},
 lava:{name:'FORJA INFERNAL',desc:'MUNDO VULCÂNICO · ZONA DE RISCO',fog:0x210906,fogDensity:.014,floor:0x30130f,grid:0xff542f,accent:0xff6a36,planet:0x9d3020},
 crystal:{name:'PRISMA-7',desc:'PLANETA DE CRISTAIS · CAMPO ENERGÉTICO',fog:0x160a2c,fogDensity:.013,floor:0x21143d,grid:0xb27bff,accent:0xd6a2ff,planet:0x7548b8}
};
const arena=new THREE.Mesh(new THREE.CylinderGeometry(36,36,.5,64,1,true),new THREE.MeshStandardMaterial({color:0x0a1a30,metalness:.65,roughness:.6,side:THREE.DoubleSide}));arena.rotation.x=Math.PI/2;arena.position.set(0,-.6,-12);scene.add(arena);
let grid=new THREE.GridHelper(72,36,0x1d9ac9,0x15304d);grid.position.set(0,-.32,-12);scene.add(grid);
const stars=new THREE.BufferGeometry(), starN=2400, pos=new Float32Array(starN*3);
for(let i=0;i<starN;i++){pos[i*3]=(Math.random()-.5)*180;pos[i*3+1]=(Math.random()-.5)*100;pos[i*3+2]=-Math.random()*180+30}
stars.setAttribute('position',new THREE.BufferAttribute(pos,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xa5eaff,size:.25,transparent:true,opacity:.9})));
let planet=null,planetGlow=null,ring=null;
function setMap(id){
 activeMap=mapData[id]?id:'nebula';const d=mapData[activeMap];mapAccent=d.accent;
 while(world.children.length){const o=world.children.pop();if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}}
 scene.fog=new THREE.FogExp2(d.fog,d.fogDensity);renderer.setClearColor(d.fog);arena.material.color.setHex(d.floor);grid.parent.remove(grid);grid.geometry.dispose();grid.material.dispose();grid=new THREE.GridHelper(72,36,d.grid,d.grid);grid.position.set(0,-.32,-12);scene.add(grid);
 const pmat=new THREE.MeshStandardMaterial({color:d.planet,roughness:.88,emissive:d.planet,emissiveIntensity:.12});planet=new THREE.Mesh(new THREE.SphereGeometry(13,48,32),pmat);planet.position.set(-42,18,-82);world.add(planet);
 planetGlow=new THREE.Mesh(new THREE.SphereGeometry(13.35,40,28),new THREE.MeshBasicMaterial({color:d.accent,wireframe:true,transparent:true,opacity:.14}));planetGlow.position.copy(planet.position);world.add(planetGlow);
 ring=new THREE.Mesh(new THREE.TorusGeometry(18,.18,8,100),new THREE.MeshStandardMaterial({color:d.accent,emissive:d.accent,emissiveIntensity:.35,metalness:.8,roughness:.25}));ring.position.copy(planet.position);ring.rotation.set(.8,.2,.25);ring.scale.set(1,1,.55);world.add(ring);
 const rockMat=new THREE.MeshStandardMaterial({color:activeMap==='ice'?0x9bd8e8:activeMap==='lava'?0x392b2a:activeMap==='forest'?0x244c35:activeMap==='crystal'?0x6747a2:0x33445e,roughness:.92,flatShading:true});
 for(let i=0;i<62;i++){const a=Math.random()*Math.PI*2,r=19+Math.random()*27;let rock;
  if(activeMap==='crystal'){rock=new THREE.Mesh(new THREE.OctahedronGeometry(.5+Math.random()*1.5,0),new THREE.MeshStandardMaterial({color:d.accent,emissive:d.accent,emissiveIntensity:.15,metalness:.35,roughness:.22,transparent:true,opacity:.88}));}
  else rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.35+Math.random()*1.25,0),rockMat);
  rock.position.set(Math.cos(a)*r,Math.random()*8-3,-12+Math.sin(a)*r);rock.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);rock.scale.y=.55+Math.random();world.add(rock);
 }
 // Silhuetas próprias por bioma: árvores, pilares de gelo, vulcões ou cristais.
 for(let i=0;i<30;i++){const a=Math.random()*Math.PI*2,r=17+Math.random()*18,x=Math.cos(a)*r,z=-12+Math.sin(a)*r;let obj;
  if(activeMap==='forest'){
   obj=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.38,2.5,7),new THREE.MeshStandardMaterial({color:0x543b2b,roughness:1}));trunk.position.y=1.1;obj.add(trunk);
   for(let k=0;k<3;k++){const crown=new THREE.Mesh(new THREE.ConeGeometry(1.25-k*.2,2.1,7),new THREE.MeshStandardMaterial({color:k===1?0x168d63:0x0b5948,emissive:0x063d28,emissiveIntensity:.4,roughness:.8}));crown.position.y=2.2+k*.8;obj.add(crown)}
   const glow=new THREE.PointLight(0x45ffad,1.1,5);glow.position.y=2.6;obj.add(glow);
  }else if(activeMap==='ice'){
   obj=new THREE.Mesh(new THREE.ConeGeometry(.65+Math.random()*.7,2.5+Math.random()*3,6),new THREE.MeshStandardMaterial({color:0x8bdff5,emissive:0x1a789c,emissiveIntensity:.35,metalness:.2,roughness:.18,transparent:true,opacity:.88}));
  }else if(activeMap==='lava'){
   obj=new THREE.Mesh(new THREE.ConeGeometry(1.2+Math.random(),2.5+Math.random()*3,7),new THREE.MeshStandardMaterial({color:0x3b2424,emissive:0x8e210b,emissiveIntensity:.55,roughness:1}));
   const crack=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshBasicMaterial({color:0xff6a2c}));crack.position.y=1.1;obj.add(crack);
  }else if(activeMap==='crystal'){
   obj=new THREE.Mesh(new THREE.OctahedronGeometry(.8+Math.random()*1.2,0),new THREE.MeshStandardMaterial({color:d.accent,emissive:d.accent,emissiveIntensity:.45,metalness:.3,roughness:.2}));obj.scale.y=2.2;
  }else{
   obj=new THREE.Group();const stem=new THREE.Mesh(new THREE.CylinderGeometry(.45,.8,3+Math.random()*5,8),new THREE.MeshStandardMaterial({color:0x123e63,metalness:.8,roughness:.3,emissive:0x062b4c}));stem.position.y=1.5;obj.add(stem);const beacon=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),new THREE.MeshBasicMaterial({color:i%2?0x36eaff:0xff4cbb}));beacon.position.y=4.3;obj.add(beacon);
  }
  obj.position.set(x,0,z);if(activeMap==='forest')obj.scale.setScalar(.8+Math.random()*.65);world.add(obj);
 }
 for(let i=0;i<4;i++){const pad=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.8,.35,24),new THREE.MeshStandardMaterial({color:d.floor,metalness:.7,roughness:.35,emissive:d.accent,emissiveIntensity:.08}));pad.position.set((i-1.5)*13,-.1,-25-(i%2)*8);world.add(pad);const halo=new THREE.Mesh(new THREE.TorusGeometry(3.05,.08,8,40),new THREE.MeshBasicMaterial({color:d.accent}));halo.rotation.x=Math.PI/2;halo.position.set(pad.position.x,.12,pad.position.z);world.add(halo)}
 document.querySelector('#mapTag').innerHTML=`SECTOR <b>${d.name}</b><br>${d.desc}`;
}
setMap('nebula');
const ambientPulses=[];for(let i=0;i<8;i++){const orb=new THREE.Mesh(new THREE.SphereGeometry(.12+Math.random()*.18,10,8),new THREE.MeshBasicMaterial({color:0x54dfff,transparent:true,opacity:.6}));orb.position.set((Math.random()-.5)*60,2+Math.random()*8,-12+(Math.random()-.5)*60);scene.add(orb);ambientPulses.push(orb)}
const monsterMat=new THREE.MeshStandardMaterial({color:0x7b37d8,emissive:0x28084a,roughness:.4,metalness:.15});
const eyeMat=new THREE.MeshBasicMaterial({color:0xff4d79});
const shotMat=new THREE.MeshBasicMaterial({color:0x64f7ff});
const monsters=[],shots=[],enemyShots=[],remotePlayers=new Map();
let score=0,wave=1,health=100,playing=false,fireHeld=false,lastShot=0,spawned=0,killedThisWave=0;
let weapon='laser',damageUpgrade=0,fireRateUpgrade=0,coins=0,shopOpen=false,peer=null,connection=null,onlineRole='solo',syncTimer=0;
const weaponConfig={laser:{cooldown:180,damage:1,count:1,speed:36,color:0x64f7ff},plasma:{cooldown:520,damage:3,count:1,speed:25,color:0xffbc55},spread:{cooldown:650,damage:1,count:3,speed:31,color:0xff73d5}};
const keys={};let yaw=0,pitch=0,drag=false,lastX=0,lastY=0;let joyX=0,joyY=0,joyPointer=null;
const scoreEl=document.querySelector('#score'),waveEl=document.querySelector('#wave'),remainingEl=document.querySelector('#remaining'),healthEl=document.querySelector('#healthfill'),message=document.querySelector('#message'),menu=document.querySelector('#menu');
function updateHUD(){scoreEl.textContent=score;waveEl.textContent=wave;remainingEl.textContent=monsters.length;healthEl.style.width=health+'%';healthEl.style.background=health<30?'#ff456e':'#43f5a4';document.querySelectorAll('[data-weapon]').forEach(b=>b.classList.toggle('active',b.dataset.weapon===weapon))}
function makeMonster(boss=false){
 const g=new THREE.Group(),size=boss?2.5:.75+Math.random()*.25;
 const palette=[{skin:0x6c36ce,glow:0x9d62ff,eye:0x75fff0},{skin:0x168b83,glow:0x38ffe0,eye:0xffef8a},{skin:0x9a315a,glow:0xff477b,eye:0xffd0f0},{skin:0x4662b8,glow:0x62a8ff,eye:0xff6d9b}];
 const c=palette[Math.floor(Math.random()*palette.length)];
 const bodyMat=new THREE.MeshStandardMaterial({color:boss?0x9f244b:c.skin,emissive:boss?0x58051d:c.glow,emissiveIntensity:.22,roughness:.3,metalness:.22});
 const body=new THREE.Mesh(new THREE.IcosahedronGeometry(size,boss?2:2),bodyMat);body.scale.set(1,1.08,.88);g.add(body);
 const belly=new THREE.Mesh(new THREE.SphereGeometry(size*.59,20,16),new THREE.MeshStandardMaterial({color:boss?0x401026:0x17213b,emissive:c.glow,emissiveIntensity:.12,metalness:.35,roughness:.32}));belly.position.set(0,-size*.22,size*.32);belly.scale.set(1,.9,.48);g.add(belly);
 const eyeMat2=new THREE.MeshStandardMaterial({color:c.eye,emissive:c.eye,emissiveIntensity:2.2,roughness:.15});
 for(const x of (boss?[-.75,.75]:[-.28,.28])){const socket=new THREE.Mesh(new THREE.SphereGeometry(boss?.38:.2,16,12),new THREE.MeshStandardMaterial({color:0x160d2a,roughness:.25}));socket.position.set(x*size/0.75,size*.18,size*.68);g.add(socket);const eye=new THREE.Mesh(new THREE.SphereGeometry(boss?.25:.13,16,12),eyeMat2);eye.position.set(x*size/0.75,size*.19,size*.82);g.add(eye);const pupil=new THREE.Mesh(new THREE.SphereGeometry(boss?.09:.045,10,8),new THREE.MeshBasicMaterial({color:0xffffff}));pupil.position.set(x*size/0.75-.025,size*.2,size*.92);g.add(pupil)}
 // Coroa de espinhos e pequenas placas de armadura deixam cada criatura mais legível.
 const spikeMat=new THREE.MeshStandardMaterial({color:boss?0xff527d:c.glow,emissive:c.glow,emissiveIntensity:.45,metalness:.4,roughness:.25});
 const spikes=boss?9:6;for(let i=0;i<spikes;i++){const a=i/spikes*Math.PI*2;const sp=new THREE.Mesh(new THREE.ConeGeometry(size*(boss?.17:.13),size*(boss?.65:.48),6),spikeMat);sp.position.set(Math.cos(a)*size*.72,size*.52,Math.sin(a)*size*.62);sp.rotation.z=-Math.cos(a)*.65;sp.rotation.x=Math.sin(a)*.65;g.add(sp)}
 for(const side of [-1,1]){const horn=new THREE.Mesh(new THREE.ConeGeometry(size*.12,size*(boss?.8:.5),7),spikeMat);horn.position.set(side*size*.48,size*.9,size*.08);horn.rotation.z=-side*.38;g.add(horn);
  const claw=new THREE.Mesh(new THREE.ConeGeometry(size*.12,size*.65,6),spikeMat);claw.position.set(side*size*.83,-size*.48,size*.12);claw.rotation.z=side*-1.0;g.add(claw)}
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(size*.2,size*.045,6,18),new THREE.MeshBasicMaterial({color:0xff315d}));mouth.position.set(0,-size*.1,size*.83);g.add(mouth);
 const aura=new THREE.Mesh(new THREE.SphereGeometry(size*1.18,18,14),new THREE.MeshBasicMaterial({color:c.glow,wireframe:true,transparent:true,opacity:.12}));g.add(aura);
 const core=new THREE.Mesh(new THREE.OctahedronGeometry(size*.16,1),new THREE.MeshBasicMaterial({color:0xffffff}));core.position.set(0,-size*.23,size*.67);g.add(core);
 const angle=Math.random()*Math.PI*2,dist=boss?22:15+Math.random()*14;g.position.set(Math.cos(angle)*dist,boss?1.3:Math.random()*3-1.2,-12+Math.sin(angle)*dist);
 g.userData={id:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),hp:boss?12+wave*3:1+Math.floor(wave/3),maxHp:boss?12+wave*3:1+Math.floor(wave/3),speed:boss?Math.max(.8,1.15+wave*.025):1.2+Math.random()*.45+wave*.08,attack:0,boss};scene.add(g);monsters.push(g);
}
function startWave(){shopOpen=false;document.querySelector('#shop').style.display='none';spawned=0;killedThisWave=0;const bossWave=wave%5===0;if(bossWave){makeMonster(true);for(let i=0;i<Math.min(2+Math.floor(wave/5),5);i++)makeMonster();message.textContent='⚠ CHEFE GIGANTE NA ÁREA!'}else{for(let i=0;i<Math.min(4+wave*2,18);i++)makeMonster();message.textContent='ONDA '+wave}setTimeout(()=>{if(playing)message.textContent=''},1800);updateHUD()}
function startGame(){setMap(document.querySelector('#mapSelect').value);score=0;coins=0;wave=1;health=100;damageUpgrade=0;fireRateUpgrade=0;applyShipStyle();playing=true;shopOpen=false;document.querySelector('#shop').style.display='none';menu.style.display='none';message.textContent='';player.position.set(0,0,9);yaw=0;pitch=0;camera.rotation.set(0,0,0);while(monsters.length)scene.remove(monsters.pop());while(shots.length)scene.remove(shots.pop().mesh);startWave()}
function makeShot(origin,direction,enemy=false){
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(enemy?.13:(weapon==='plasma'?.17:.09),8,8),enemy?new THREE.MeshBasicMaterial({color:0xff477e}):new THREE.MeshBasicMaterial({color:weaponConfig[weapon].color}));
 mesh.position.copy(origin);scene.add(mesh);(enemy?enemyShots:shots).push({mesh,dir:direction.clone().normalize(),life:3,enemy,damage:enemy?1:weaponConfig[weapon].damage+damageUpgrade,speed:enemy?12:weaponConfig[weapon].speed});
}
function shoot(){if(!playing||shopOpen)return;const cfg=weaponConfig[weapon],now=performance.now();if(now-lastShot<Math.max(90,cfg.cooldown-fireRateUpgrade*20))return;lastShot=now;const dir=new THREE.Vector3();camera.getWorldDirection(dir);const origin=new THREE.Vector3();camera.getWorldPosition(origin);for(let i=0;i<cfg.count;i++){const d=dir.clone();if(cfg.count>1)d.x+=(i-1)*.095;makeShot(origin.clone().add(dir.clone().multiplyScalar(.65)),d)}}
function endGame(){playing=false;message.textContent='FIM DE JOGO';menu.style.display='flex';document.querySelector('#card h1').innerHTML='FIM DE JOGO';document.querySelector('#card p').textContent=`Você marcou ${score} pontos e chegou à onda ${wave}.`;document.querySelector('#startBtn').textContent='JOGAR NOVAMENTE';document.querySelector('#shop').style.display='none'}
function openShop(){
 playing=false;shopOpen=true;document.querySelector('#shop').style.display='flex';const box=document.querySelector('#shopOptions');box.innerHTML='';
 const offers=[['⚡ Dano +1',150,()=>damageUpgrade++],['🔥 Cadência +20%',120,()=>fireRateUpgrade++],['💚 Reparar +35 energia',100,()=>health=Math.min(100,health+35)],['🔫 Desbloquear Plasma',220,()=>weapon='plasma'],['💫 Desbloquear Dispersão',260,()=>weapon='spread']];
 offers.forEach(([label,cost,apply])=>{const b=document.createElement('button');b.textContent=label+'\n'+cost+' pontos';b.disabled=score<cost;b.style.opacity=b.disabled?'.45':'1';b.addEventListener('click',()=>{if(score<cost)return;score-=cost;apply();updateHUD();openShop()});box.appendChild(b)});
 const note=document.createElement('p');note.textContent=`Saldo: ${score} pontos · Arma atual: ${weapon.toUpperCase()}`;box.appendChild(note);
}
document.querySelector('#nextWaveBtn').addEventListener('click',()=>{wave++;playing=true;startWave()});
document.querySelectorAll('[data-weapon]').forEach(b=>b.addEventListener('click',()=>{weapon=b.dataset.weapon;updateHUD()}));
window.addEventListener('keydown',e=>{if(e.code==='Digit1')weapon='laser';if(e.code==='Digit2')weapon='plasma';if(e.code==='Digit3')weapon='spread';updateHUD()});
const shipStyles={cyan:{color:0x45dfff,emissive:0x075c78,speed:7},gold:{color:0xffc34d,emissive:0x754100,speed:8.2},violet:{color:0xb56bff,emissive:0x35105e,speed:6.8}};
function applyShipStyle(){const style=shipStyles[document.querySelector('#shipSelect').value]||shipStyles.cyan;player.userData.shipStyle=document.querySelector('#shipSelect').value;}
function makeRemote(id,style='cyan'){if(remotePlayers.has(id))return remotePlayers.get(id);const g=new THREE.Group();const cfg=shipStyles[style]||shipStyles.cyan;const mat=new THREE.MeshStandardMaterial({color:cfg.color,emissive:cfg.emissive,metalness:.7,roughness:.25});const ship=new THREE.Mesh(new THREE.ConeGeometry(.55,1.5,6),mat);ship.rotation.x=Math.PI/2;g.add(ship);const wingMat=new THREE.MeshStandardMaterial({color:cfg.color,metalness:.6,roughness:.3,emissive:cfg.emissive});for(const side of [-1,1]){const wing=new THREE.Mesh(new THREE.BoxGeometry(.85,.08,.34),wingMat);wing.position.set(side*.58,0,.12);wing.rotation.y=side*.2;g.add(wing)}const glow=new THREE.PointLight(cfg.color,2,7);glow.position.z=.4;g.add(glow);scene.add(g);remotePlayers.set(id,g);return g}
function syncWorld(){if(!connection||!connection.open)return;if(onlineRole==='host'){connection.send({type:'world',score,wave,health,monsters:monsters.map(m=>({id:m.userData.id,x:m.position.x,y:m.position.y,z:m.position.z,hp:m.userData.hp,maxHp:m.userData.maxHp,boss:m.userData.boss}))})}}
function applyWorld(data){if(onlineRole!=='guest')return;score=data.score;wave=data.wave;health=data.health;const incoming=new Set(data.monsters.map(m=>m.id));for(let i=monsters.length-1;i>=0;i--){if(!incoming.has(monsters[i].userData.id)){scene.remove(monsters[i]);monsters.splice(i,1)}}for(const state of data.monsters){let m=monsters.find(x=>x.userData.id===state.id);if(!m){makeMonster(state.boss);m=monsters[monsters.length-1];m.userData.id=state.id;m.userData.boss=state.boss}m.position.set(state.x,state.y,state.z);m.userData.hp=state.hp;m.userData.maxHp=state.maxHp;m.userData.boss=state.boss}updateHUD()}

function setupConnection(conn){connection=conn;conn.on('open',()=>{document.querySelector('#lobbyStatus').textContent='Conectado! Coop ativo · ID: '+(peer?.id||'');if(!playing)startGame();if(onlineRole==='guest')conn.send({type:'hello',style:document.querySelector('#shipSelect').value})});conn.on('data',data=>{if(data.type==='hello'){makeRemote(conn.peer,data.style)}if(data.type==='state'){const g=makeRemote(conn.peer,data.style);g.position.set(data.x,data.y+1,data.z);g.rotation.y=data.yaw||0;}if(data.type==='world')applyWorld(data);if(data.type==='hit'&&onlineRole==='host'){const m=monsters.find(x=>x.userData.id===data.id);if(m){m.userData.hp-=Math.max(1,Math.min(5,data.damage||1));if(m.userData.hp<=0){const idx=monsters.indexOf(m),boss=m.userData.boss;scene.remove(m);monsters.splice(idx,1);score+=boss?1200:100;coins+=boss?500:10;if(boss)message.textContent='CHEFE DERROTADO! +1200 PONTOS';updateHUD()}}}});conn.on('close',()=>{const g=remotePlayers.get(conn.peer);if(g){scene.remove(g);remotePlayers.delete(conn.peer)}document.querySelector('#lobbyStatus').textContent='O outro piloto desconectou.'});}
document.querySelector('#hostBtn').addEventListener('click',()=>{
 if(!window.Peer){document.querySelector('#lobbyStatus').textContent='Biblioteca online não carregou. Confira a conexão com a internet.';return}
 try{peer?.destroy();onlineRole='host';peer=new Peer();document.querySelector('#lobbyStatus').textContent='Criando sala online...';peer.on('open',id=>{document.querySelector('#roomCode').value=id;document.querySelector('#lobbyStatus').textContent='Sala criada! Compartilhe este ID com seu amigo: '+id});peer.on('connection',setupConnection);peer.on('error',e=>document.querySelector('#lobbyStatus').textContent='Erro online: '+e.type+'. Tente criar outra sala.')}catch(e){document.querySelector('#lobbyStatus').textContent='Não foi possível criar a sala.'}
});
document.querySelector('#joinBtn').addEventListener('click',()=>{
 const id=document.querySelector('#roomCode').value.trim();if(!id){document.querySelector('#lobbyStatus').textContent='Digite o ID da sala do anfitrião.';return}if(!window.Peer){document.querySelector('#lobbyStatus').textContent='Biblioteca online não carregou. Confira a internet.';return}
 try{peer?.destroy();onlineRole='guest';peer=new Peer();document.querySelector('#lobbyStatus').textContent='Conectando à sala...';peer.on('open',()=>setupConnection(peer.connect(id,{reliable:true})));peer.on('error',e=>document.querySelector('#lobbyStatus').textContent='Falha ao conectar: '+e.type)}catch(e){document.querySelector('#lobbyStatus').textContent='Não foi possível entrar na sala.'}
});
document.querySelector('#mapSelect').addEventListener('change',e=>setMap(e.target.value));
document.querySelector('#startBtn').addEventListener('click',startGame);
document.querySelector('#vrBtn').addEventListener('click',async()=>{
 try{
  if(!navigator.xr){message.textContent='WebXR não disponível neste navegador. Tente um navegador compatível em um headset VR.';return}
  const ok=await navigator.xr.isSessionSupported('immersive-vr');
  if(!ok){message.textContent='VR imersivo não foi detectado neste dispositivo.';return}
  if(!playing)startGame();
  const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});
  await renderer.xr.setSession(session);
 }catch(e){message.textContent='Não foi possível iniciar VR. Use HTTPS e um dispositivo compatível.'}
});
renderer.domElement.addEventListener('pointerdown',e=>{if(!playing)return;drag=true;lastX=e.clientX;lastY=e.clientY;if(e.pointerType==='mouse'&&e.button===0)shoot();});
window.addEventListener('pointerup',()=>drag=false);
window.addEventListener('pointermove',e=>{if(!drag||!playing)return;if(e.pointerType==='mouse'&&document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.002;pitch-=e.movementY*.002}else if(e.pointerType!=='mouse'){yaw-=(e.clientX-lastX)*.005;pitch-=(e.clientY-lastY)*.005;lastX=e.clientX;lastY=e.clientY}pitch=Math.max(-1.15,Math.min(1.15,pitch));camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0)});
renderer.domElement.addEventListener('click',()=>{if(playing&&document.pointerLockElement!==renderer.domElement&&matchMedia('(pointer:fine)').matches)renderer.domElement.requestPointerLock?.()});
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space'){e.preventDefault();fireHeld=true;shoot()}if(e.code==='KeyP')playing=!playing});
window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Space')fireHeld=false});
document.querySelector('#fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;shoot()});
for(const ev of ['pointerup','pointercancel','pointerleave'])document.querySelector('#fireBtn').addEventListener(ev,()=>fireHeld=false);
const joyBase=document.querySelector('#joyBase'),joyKnob=document.querySelector('#joyKnob');
function resetJoy(){joyX=0;joyY=0;joyPointer=null;joyKnob.style.left='50%';joyKnob.style.top='50%'}
function moveJoy(e){const r=joyBase.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.34,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max}joyX=dx/max;joyY=dy/max;joyKnob.style.left=`calc(50% + ${dx}px)`;joyKnob.style.top=`calc(50% + ${dy}px)`}
joyBase.addEventListener('pointerdown',e=>{e.preventDefault();joyPointer=e.pointerId;joyBase.setPointerCapture(e.pointerId);moveJoy(e)});
joyBase.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer){e.preventDefault();moveJoy(e)}});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])joyBase.addEventListener(ev,resetJoy);
const clock=new THREE.Clock();
function animate(){
 const dt=Math.min(clock.getDelta(),.04);
 if(playing){
  ambientPulses.forEach((o,i)=>{o.position.y=2+Math.sin(performance.now()*.001+i)*1.4;o.rotation.y+=dt*.2});
  ring.rotation.z+=dt*.025;planetGlow.rotation.y+=dt*.01;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const move=new THREE.Vector3();
  if(keys.KeyW||keys.ArrowUp)move.add(forward);
  if(keys.KeyS||keys.ArrowDown)move.sub(forward);
  if(keys.KeyA)move.sub(right);
  if(keys.KeyD)move.add(right);
  if(Math.abs(joyY)>.08)move.addScaledVector(forward,-joyY);
  if(Math.abs(joyX)>.08)move.addScaledVector(right,joyX);
  if(move.lengthSq())player.position.add(move.normalize().multiplyScalar((shipStyles[player.userData.shipStyle||'cyan']||shipStyles.cyan).speed*dt));
  player.position.x=THREE.MathUtils.clamp(player.position.x,-27,27);player.position.z=THREE.MathUtils.clamp(player.position.z,-37,29);
  if(fireHeld)shoot();
  for(let i=monsters.length-1;i>=0;i--){
   const m=monsters[i],to=new THREE.Vector3(player.position.x-m.position.x,player.position.y+1-m.position.y,player.position.z-m.position.z);
   const d=to.length();if(d>1.5)m.position.add(to.normalize().multiplyScalar(m.userData.speed*dt));
   m.rotation.y+=dt*.8;m.position.y+=Math.sin(performance.now()*.002+i)*dt*.25;
   m.userData.attack-=dt;if(d<2.1&&m.userData.attack<=0){health=Math.max(0,health-8);m.userData.attack=.8;updateHUD();if(health<=0){endGame();break}}
  }
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.mesh.position.addScaledVector(s.dir,s.speed*dt);s.life-=dt;let hit=false;
   for(let j=monsters.length-1;j>=0;j--){if(s.mesh.position.distanceTo(monsters[j].position)<(monsters[j].userData.boss?3.2:1.2)){if(connection&&connection.open&&onlineRole==='guest'){connection.send({type:'hit',id:monsters[j].userData.id,damage:s.damage})}else{monsters[j].userData.hp-=s.damage}scene.remove(s.mesh);shots.splice(i,1);hit=true;if(monsters[j].userData.hp<=0&&!(connection&&connection.open&&onlineRole==='guest')){const wasBoss=monsters[j].userData.boss;scene.remove(monsters[j]);monsters.splice(j,1);score+=wasBoss?1200:100;killedThisWave++;coins+=wasBoss?500:10;updateHUD();if(wasBoss)message.textContent='CHEFE DERROTADO! +1200 PONTOS'}break}}
   if(!hit&&s.life<=0){scene.remove(s.mesh);shots.splice(i,1)}
  }
  if(monsters.length===0&&!shopOpen){openShop()}
  if(connection&&connection.open){syncTimer+=dt;if(syncTimer>.08){syncTimer=0;connection.send({type:'state',x:player.position.x,y:player.position.y,z:player.position.z,yaw:yaw,style:player.userData.shipStyle||'cyan',score:score,wave:wave});syncWorld()}}
  updateHUD();
 }
 renderer.render(scene,camera);
}
renderer.setAnimationLoop(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});
