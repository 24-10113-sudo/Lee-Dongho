/* =======================================================
   정원 요정 대날리기 - game.js
   완전 구현: 물리엔진 / 6종 캐릭터 스킬 / 바이옴 지형 / HUD
======================================================= */

'use strict';

// ─────────────────────────────────────────────
// 0. 상수
// ─────────────────────────────────────────────
const GRAVITY   = 0.38;
const AIR_DRAG  = 0.997;
const SCALE     = 1;          // px per meter (canvas 기준)
const MAX_DIST  = 5000;       // 바 최대 거리(m)

// ─────────────────────────────────────────────
// 1. 캐릭터 데이터
// ─────────────────────────────────────────────
const CHARACTERS = [
  {
    id: 'red',
    name: '홍구',
    type: '🔥 로켓 부스터',
    emoji: '🧨',
    color: '#ef4444',
    colorAlpha: 'rgba(239,68,68,0.35)',
    weight: 2.2,       // 무거움
    bounce: 0.52,      // ↑ 탱탱볼처럼 잘 튀게
    airResist: 0.996,
    speed: 55,
    skillName: '🚀 로켓 부스터',
    skillDesc: '강력한 수직 폭발 추진!\n하늘로 솟구쳐 멀리!',
    skillEmoji: '🚀',
    stats: { 파워: 95, 속도: 60, 반발: 25, 스킬: 90 },
    skillFn: applyRocketBoost,
  },
  {
    id: 'blue',
    name: '빙구',
    type: '❄️ 빙결 활공',
    emoji: '🧊',
    color: '#3b82f6',
    colorAlpha: 'rgba(59,130,246,0.35)',
    weight: 0.8,
    bounce: 0.60,      // ↑ 탱탱볼처럼 잘 튀게
    airResist: 0.999,
    speed: 68,
    skillName: '❄️ 빙결 활공',
    skillDesc: '하강 속도를 줄이고\n수평을 유지!',
    skillEmoji: '❄️',
    stats: { 파워: 55, 속도: 90, 반발: 45, 스킬: 75 },
    skillFn: applyIceGlide,
  },
  {
    id: 'green',
    name: '탄탄이',
    type: '🟢 슈퍼 바운스',
    emoji: '🎾',
    color: '#22c55e',
    colorAlpha: 'rgba(34,197,94,0.35)',
    weight: 1.0,
    bounce: 0.88,      // ↑ 최고 반발 캐릭터 강화
    airResist: 0.998,
    speed: 60,
    skillName: '💥 슈퍼 바운스',
    skillDesc: '다음 착지 시\n반발력 3배!',
    skillEmoji: '💥',
    stats: { 파워: 65, 속도: 70, 반발: 95, 스킬: 80 },
    skillFn: applySuperBounce,
  },
  {
    id: 'yellow',
    name: '번개돌이',
    type: '⚡ 지그재그',
    emoji: '⚡',
    color: '#eab308',
    colorAlpha: 'rgba(234,179,8,0.35)',
    weight: 1.0,
    bounce: 0.62,      // ↑ 탱탱볼처럼 잘 튀게
    airResist: 0.998,
    speed: 72,
    skillName: '⚡ 번개 가속',
    skillDesc: '순간 빠른 지그재그로\n수평 속도 2배!',
    skillEmoji: '⚡',
    stats: { 파워: 70, 속도: 95, 반발: 40, 스킬: 85 },
    skillFn: applyLightning,
  },
  {
    id: 'purple',
    name: '마법사',
    type: '🔮 중력 반전',
    emoji: '🔮',
    color: '#a855f7',
    colorAlpha: 'rgba(168,85,247,0.35)',
    weight: 1.1,
    bounce: 0.65,      // ↑ 탱탱볼처럼 잘 튀게
    airResist: 0.998,
    speed: 63,
    skillName: '🔮 중력 반전',
    skillDesc: '1.5초 동안 위로\n떠오름!',
    skillEmoji: '🔮',
    stats: { 파워: 65, 속도: 72, 반발: 50, 스킬: 95 },
    skillFn: applyAntiGravity,
  },
  {
    id: 'orange',
    name: '불꽃이',
    type: '🌀 드릴 스핀',
    emoji: '🌀',
    color: '#f97316',
    colorAlpha: 'rgba(249,115,22,0.35)',
    weight: 1.5,
    bounce: 0.70,      // ↑ 탱탱볼처럼 잘 튀게
    airResist: 0.997,
    speed: 65,
    skillName: '🌀 드릴 스핀',
    skillDesc: '고속 회전으로\n공기저항 제거 + 가속!',
    skillEmoji: '🌀',
    stats: { 파워: 80, 속도: 75, 반발: 55, 스킬: 88 },
    skillFn: applyDrillSpin,
  },
];

// ─────────────────────────────────────────────
// 2. 바이옴 데이터
// ─────────────────────────────────────────────
const BIOMES = [
  {
    name: '🌿 초록 평원',
    startDist: 0,
    endDist: 500,
    skyTop: '#87ceeb',
    skyBot: '#c8f0a0',
    groundColor: '#4ade80',
    groundDark: '#16a34a',
    barColor: '#4ade80',
    roughness: 0.3,
    hills: true,
    particles: 'cloud',
    bgObjects: 'tree',
  },
  {
    name: '🏜️ 황금 사막',
    startDist: 500,
    endDist: 1200,
    skyTop: '#fb923c',
    skyBot: '#fde68a',
    groundColor: '#d97706',
    groundDark: '#92400e',
    barColor: '#f59e0b',
    roughness: 0.5,
    hills: true,
    particles: 'sand',
    bgObjects: 'cactus',
  },
  {
    name: '❄️ 설원',
    startDist: 1200,
    endDist: 2000,
    skyTop: '#93c5fd',
    skyBot: '#e0f2fe',
    groundColor: '#e2e8f0',
    groundDark: '#94a3b8',
    barColor: '#bae6fd',
    roughness: 0.7,
    hills: true,
    particles: 'snow',
    bgObjects: 'pine',
  },
  {
    name: '🌋 화산 지대',
    startDist: 2000,
    endDist: 3000,
    skyTop: '#7f1d1d',
    skyBot: '#991b1b',
    groundColor: '#451a03',
    groundDark: '#1c0a00',
    barColor: '#ef4444',
    roughness: 0.9,
    hills: true,
    particles: 'ember',
    bgObjects: 'volcano',
  },
  {
    name: '🚀 우주',
    startDist: 3000,
    endDist: 5000,
    skyTop: '#020617',
    skyBot: '#0f172a',
    groundColor: '#475569',
    groundDark: '#1e293b',
    barColor: '#818cf8',
    roughness: 0.6,
    hills: false,
    particles: 'star',
    bgObjects: 'crater',
  },
];

// ─────────────────────────────────────────────
// 3. 게임 상태
// ─────────────────────────────────────────────
let state = {
  phase: 'select',   // select / aim / flight / result
  charIdx: -1,
  char: null,

  // 물체
  ball: { x: 0, y: 0, vx: 0, vy: 0, r: 18, angle: 0, angVel: 0 },

  // 투석기
  catapult: { x: 120, y: 0, armAngle: -Math.PI * 0.7 },
  aimDrag: { active: false, startX: 0, startY: 0, endX: 0, endY: 0 },

  // 물리
  inFlight: false,
  onGround: false,
  bounceCount: 0,
  skillUsed: false,
  skillActive: false,
  skillTimer: 0,
  superBounceArmed: false,
  antiGravTimer: 0,
  drillTimer: 0,

  // 거리
  totalDistPx: 0,    // 캔버스 px 기준
  bestDistM: 0,
  currentDistM: 0,
  landDistM: 0,

  // 카메라
  cameraX: 0,
  cameraY: 0,           // 수직 스크롤 (음수 = 위로 올라감)

  // 지형 캐시
  terrain: [],
  terrainSeed: 1,

  // 파티클
  particles: [],
  skillParticles: [],

  // 배경 오브젝트
  bgObjects: [],
};

// ─────────────────────────────────────────────
// 4. 캔버스 세팅
// ─────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  state.catapult.y = groundY() - 10;
  buildTerrain();
}
window.addEventListener('resize', resize);

function groundY() { return canvas.height * 0.7; }

// ─────────────────────────────────────────────
// 5. 지형 생성 (절차적 Perlin-like)
// ─────────────────────────────────────────────
const TERRAIN_CHUNK = 60;  // 점 간격 px

function buildTerrain() {
  const totalPx = MAX_DIST * 6 + canvas.width * 2;
  const pts = Math.ceil(totalPx / TERRAIN_CHUNK) + 4;
  state.terrain = [];

  let y = groundY();
  let seed = state.terrainSeed;
  function rng() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }

  for (let i = 0; i < pts; i++) {
    const xWorld = (i - 1) * TERRAIN_CHUNK;
    const distM  = Math.max(0, (xWorld - 180) / 6);
    const biome  = getBiomeAt(distM);

    // 지형 높이 계산
    const roughness = biome.roughness;
    const noise1 = Math.sin(i * 0.18 + rng() * 0.3) * 40 * roughness;
    const noise2 = Math.sin(i * 0.07 + rng() * 0.2) * 70 * roughness;
    const noise3 = Math.sin(i * 0.04)               * 30 * roughness;
    const target = groundY() + noise1 + noise2 + noise3;

    // 부드럽게 이동
    y = y * 0.8 + target * 0.2;
    y = Math.max(canvas.height * 0.35, Math.min(canvas.height * 0.9, y));

    state.terrain.push({ x: xWorld, y });
  }

  buildBgObjects();
}

function getTerrainY(worldX) {
  const idx = (worldX / TERRAIN_CHUNK) + 1;
  const i   = Math.max(0, Math.min(state.terrain.length - 2, Math.floor(idx)));
  const t   = idx - i;
  const a   = state.terrain[i]?.y ?? groundY();
  const b   = state.terrain[i + 1]?.y ?? groundY();
  return a + (b - a) * t;
}

function buildBgObjects() {
  state.bgObjects = [];
  for (let x = 200; x < MAX_DIST * 6; x += 250 + Math.random() * 300) {
    const distM = (x - 180) / 6;
    const biome = getBiomeAt(distM);
    state.bgObjects.push({ x, type: biome.bgObjects, biome: biome.name });
  }
}

// ─────────────────────────────────────────────
// 6. 바이옴 유틸
// ─────────────────────────────────────────────
function getBiomeAt(distM) {
  for (let i = BIOMES.length - 1; i >= 0; i--) {
    if (distM >= BIOMES[i].startDist) return BIOMES[i];
  }
  return BIOMES[0];
}

function getBiomeBlend(distM) {
  // 현재 + 다음 바이옴 블렌드 비율
  for (let i = 0; i < BIOMES.length; i++) {
    const b = BIOMES[i];
    if (distM < b.endDist) {
      const blendRange = 100;
      const rem = b.endDist - distM;
      const blend = Math.max(0, Math.min(1, rem / blendRange));
      return { cur: b, next: BIOMES[i + 1] || b, blend };
    }
  }
  return { cur: BIOMES[BIOMES.length - 1], next: BIOMES[BIOMES.length - 1], blend: 1 };
}

function lerpColor(c1, c2, t) {
  // #rrggbb 또는 rgb(r,g,b) 두 형식 모두 지원
  const p = (color) => {
    if (color[0] === '#') {
      return [
        parseInt(color.slice(1,3),16),
        parseInt(color.slice(3,5),16),
        parseInt(color.slice(5,7),16),
      ];
    }
    const m = color.match(/\d+/g);
    return [+m[0], +m[1], +m[2]];
  };
  const [r1,g1,b1] = p(c1);
  const [r2,g2,b2] = p(c2);
  const r = Math.round(r1 + (r2-r1)*t);
  const g = Math.round(g1 + (g2-g1)*t);
  const b = Math.round(b1 + (b2-b1)*t);
  return `rgb(${r},${g},${b})`;
}

// ─────────────────────────────────────────────
// 7. UI DOM 참조
// ─────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const hudEl          = $('hud');
const progressBiomeBg= $('progress-biome-bg');
const progressBest   = $('progress-best-marker');
const progressCur    = $('progress-current-marker');
const hudBestDist    = $('hud-best-dist');
const hudCurDist     = $('hud-cur-dist');
const skillToast     = $('skill-toast');
const charSelectScreen = $('char-select-screen');
const charGrid       = $('char-grid');
const btnStart       = $('btn-start');
const globalBestEl   = $('global-best');
const launchUI       = $('launch-ui');
const powerBarFill   = $('power-bar-fill');
const flightUI       = $('flight-ui');
const btnSkill       = $('btn-skill');
const skillIconDisp  = $('skill-icon-display');
const skillNameDisp  = $('skill-name-display');
const skillStatus    = $('skill-status');
const resultScreen   = $('result-screen');
const resultEmoji    = $('result-emoji');
const resultTitle    = $('result-title');
const resultThis     = $('result-this');
const resultBest     = $('result-best');
const resultBiomeInfo= $('result-biome-info');
const btnRetry       = $('btn-retry');
const btnChangeChar  = $('btn-change-char');

// ─────────────────────────────────────────────
// 8. 캐릭터 선택 화면 구성
// ─────────────────────────────────────────────
function buildCharSelect() {
  charGrid.innerHTML = '';
  CHARACTERS.forEach((ch, i) => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.style.setProperty('--char-color', ch.color);
    card.style.setProperty('--char-color-50', ch.colorAlpha);
    card.dataset.idx = i;
    card.innerHTML = `
      <div class="char-avatar">${ch.emoji}</div>
      <div class="char-name">${ch.name}</div>
      <div class="char-type">${ch.type}</div>
      <div class="char-stats">
        ${Object.entries(ch.stats).map(([k, v]) => `
          <div>${k}</div><div>${v}</div>
          <div class="stat-bar-wrap">
            <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${v}%"></div></div>
          </div>
        `).join('')}
      </div>
      <div class="char-skill-badge">
        <div class="skill-badge-title">${ch.skillName}</div>
        <div>${ch.skillDesc.replace('\n', '<br>')}</div>
      </div>
    `;
    card.addEventListener('click', () => selectChar(i));
    charGrid.appendChild(card);
  });
}

function selectChar(i) {
  state.charIdx = i;
  state.char = CHARACTERS[i];
  document.querySelectorAll('.char-card').forEach((c, ci) => {
    c.classList.toggle('selected', ci === i);
  });
  btnStart.disabled = false;
}

btnStart.addEventListener('click', startGame);

btnRetry.addEventListener('click', () => {
  resultScreen.classList.add('hidden');
  resetBall();
  enterAimPhase();
});

btnChangeChar.addEventListener('click', () => {
  resultScreen.classList.add('hidden');
  hudEl.classList.add('hidden');
  charSelectScreen.classList.remove('hidden');
  globalBestEl.textContent = `${Math.round(state.bestDistM)}m`;
  state.phase = 'select';
});

// ─────────────────────────────────────────────
// 9. 게임 시작 / 리셋
// ─────────────────────────────────────────────
function startGame() {
  charSelectScreen.classList.add('hidden');
  hudEl.classList.remove('hidden');
  state.cameraX = 0;
  buildProgressBar();
  resetBall();
  enterAimPhase();
}

function resetBall() {
  const cat = state.catapult;
  const armLen = 80;
  const bx = cat.x + Math.cos(cat.armAngle - Math.PI/2) * armLen;
  const by = groundY() - 60 + Math.sin(cat.armAngle - Math.PI/2) * armLen;
  state.ball = {
    x: bx, y: by,
    vx: 0, vy: 0,
    r: 18, angle: 0, angVel: 0,
  };
  state.inFlight    = false;
  state.onGround    = false;
  state.bounceCount = 0;
  state.skillUsed   = false;
  state.skillActive = false;
  state.skillTimer  = 0;
  state.superBounceArmed = false;
  state.antiGravTimer = 0;
  state.drillTimer  = 0;
  state.currentDistM = 0;
  state.cameraX = 0;
  state.cameraY = 0;
  state.particles   = [];
  state.skillParticles = [];
}

// ─────────────────────────────────────────────
// 10. 발사 준비 (AIM)
// ─────────────────────────────────────────────
function enterAimPhase() {
  state.phase = 'aim';
  launchUI.classList.remove('hidden');
  flightUI.classList.add('hidden');
}

// 마우스 / 터치 드래그로 각도+파워
const aimStart = { x: 0, y: 0, down: false };

canvas.addEventListener('mousedown', (e) => {
  if (state.phase !== 'aim') return;
  aimStart.x = e.clientX;
  aimStart.y = e.clientY;
  aimStart.down = true;
  state.aimDrag.active = true;
  state.aimDrag.startX = e.clientX;
  state.aimDrag.startY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
  if (!aimStart.down || state.phase !== 'aim') return;
  state.aimDrag.endX = e.clientX;
  state.aimDrag.endY = e.clientY;
  updateAimPreview();
});

canvas.addEventListener('mouseup', (e) => {
  if (state.phase !== 'aim' || !aimStart.down) return;
  aimStart.down = false;
  state.aimDrag.active = false;
  launch();
});

// 터치
canvas.addEventListener('touchstart', (e) => {
  if (state.phase !== 'aim') return;
  const t = e.touches[0];
  aimStart.x = t.clientX; aimStart.y = t.clientY; aimStart.down = true;
  state.aimDrag.active = true;
  state.aimDrag.startX = t.clientX; state.aimDrag.startY = t.clientY;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (!aimStart.down || state.phase !== 'aim') return;
  const t = e.touches[0];
  state.aimDrag.endX = t.clientX; state.aimDrag.endY = t.clientY;
  updateAimPreview();
}, { passive: true });

canvas.addEventListener('touchend', () => {
  if (state.phase !== 'aim' || !aimStart.down) return;
  aimStart.down = false;
  state.aimDrag.active = false;
  launch();
});

function getAimVector() {
  const dx = state.aimDrag.startX - state.aimDrag.endX;
  const dy = state.aimDrag.startY - state.aimDrag.endY;
  const dist = Math.hypot(dx, dy);
  const power = Math.min(1, dist / 200);
  const angle = Math.atan2(-dy, dx);
  return { power, angle, dist };
}

function updateAimPreview() {
  const { power } = getAimVector();
  powerBarFill.style.width = `${power * 100}%`;
}

function launch() {
  const ch = state.char;
  const { power, angle } = getAimVector();
  if (power < 0.05) return;

  const speed = ch.speed * power;
  state.ball.vx = Math.cos(angle) * speed;
  state.ball.vy = -Math.sin(angle) * speed;
  state.ball.angVel = speed * 0.05;
  state.inFlight = true;
  state.phase = 'flight';

  launchUI.classList.add('hidden');
  flightUI.classList.remove('hidden');
  updateSkillUI();
  spawnLaunchParticles();
}

// ─────────────────────────────────────────────
// 11. 스킬 발동
// ─────────────────────────────────────────────
function updateSkillUI() {
  const ch = state.char;
  skillIconDisp.textContent = ch.skillEmoji;
  skillNameDisp.textContent = ch.skillName;
  btnSkill.disabled = state.skillUsed;
  skillStatus.textContent = state.skillUsed ? '사용됨 ❌' : '준비됨 ✅';
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && state.phase === 'flight' && !state.skillUsed) {
    e.preventDefault();
    activateSkill();
  }
});
btnSkill.addEventListener('click', () => {
  if (state.phase === 'flight' && !state.skillUsed) activateSkill();
});
// 캔버스 클릭은 스킬 발동에 사용하지 않음
// → 발사(mouseup)와 겹쳐서 즉시 스킬이 터지는 버그 방지
// 스킬은 스페이스바 또는 스킬 버튼으로만 발동

function activateSkill() {
  if (state.skillUsed) return;
  state.skillUsed = true;
  state.char.skillFn();
  updateSkillUI();
  showSkillToast(state.char.skillName);
  spawnSkillParticles();
}

// ─────────────────────────────────────────────
// 12. 스킬 구현들
// ─────────────────────────────────────────────
function applyRocketBoost() {
  // 빨강: 초기 상향 임펄스 + 90프레임 동안 지속 로켓 추진
  state.ball.vx *= 1.3;                      // 수평 초기 가속
  state.ball.vy = -18;                        // 지속 추진을 위한 초기 상승
  state.skillActive = true;
  state.skillTimer  = 90;                     // 약 1.5초 지속 연소
}

function applyIceGlide() {
  // 파랑: 하강 속도 줄이기 + 수평 유지
  state.ball.vy = Math.max(state.ball.vy, -2);
  state.ball.vx *= 1.2;
  state.skillActive = true;
  state.skillTimer  = 80; // 80프레임 동안 공기저항 0
}

function applySuperBounce() {
  // 초록: 다음 바운스 3배
  state.superBounceArmed = true;
  state.skillActive = true;
}

function applyLightning() {
  // 노랑: 순간 수평 가속
  state.ball.vx = Math.abs(state.ball.vx) * 2.2;
  state.ball.vy *= 0.5;
  state.skillActive = true;
  state.skillTimer  = 20;
}

function applyAntiGravity() {
  // 보라: 1.5초 위로 떠오름
  state.ball.vy = -12;
  state.antiGravTimer = 90;
  state.skillActive = true;
}

function applyDrillSpin() {
  // 주황: 드릴 스핀 - 공기저항 0 + 가속
  state.ball.vx *= 1.4;
  state.drillTimer = 60;
  state.skillActive = true;
}

// ─────────────────────────────────────────────
// 13. 물리 업데이트
// ─────────────────────────────────────────────
function updatePhysics() {
  if (!state.inFlight) return;
  const ball = state.ball;
  const ch   = state.char;

  // 중력
  let gravMult = 1;
  if (state.antiGravTimer > 0) {
    gravMult = -0.6;
    state.antiGravTimer--;
  }
  ball.vy += GRAVITY * ch.weight * gravMult;

  // 공기 저항
  let drag = ch.airResist;
  if (state.drillTimer > 0) { drag = 1.001; state.drillTimer--; }
  else if (state.skillActive && ch.id === 'blue' && state.skillTimer > 0) { drag = 1.0005; }

  ball.vx *= drag;
  ball.vy *= AIR_DRAG;

  // 빙결 활공: vy 억제
  if (ch.id === 'blue' && state.skillActive && state.skillTimer > 0) {
    if (ball.vy > 1) ball.vy *= 0.85;
    state.skillTimer--;
  }

  // 로켓 부스터: 타이머 동안 매 프레임 지속 추진
  if (state.skillTimer > 0 && ch.id === 'red') {
    ball.vy -= 1.8;                           // 매 프레임 위쪽 추진
    ball.vx += 0.5;                           // 매 프레임 전방 추진
    gravMult = 0.4;                           // 중력 억제로 상승감 증폭
    state.skillTimer--;
  }

  // 번개 타이머
  if (state.skillTimer > 0 && ch.id === 'yellow') {
    state.skillTimer--;
  }

  // 이동
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.angle += ball.angVel;
  ball.angVel *= 0.98;

  // 지형 충돌 — ball.x는 월드 좌표이므로 cameraX 없이 바로 조회
  const ty = getTerrainY(ball.x);
  if (ball.y + ball.r >= ty) {
    ball.y = ty - ball.r;

    let bounceCoef = ch.bounce;
    if (state.superBounceArmed) {
      bounceCoef = Math.min(0.98, ch.bounce * 3);
      state.superBounceArmed = false;
    }

    // 너무 약한 바운스는 흡수 (미세 진동 방지)
    const incomingVy = Math.abs(ball.vy);
    const bouncedVy = incomingVy * bounceCoef;
    ball.vy = (bouncedVy > 1.0) ? -bouncedVy : 0;

    // 지면 마찰 대폭 감소 → 탱탱볼처럼 잘 굴러감
    ball.vx *= 0.96;
    ball.angVel = ball.angVel * 0.7;
    state.bounceCount++;

    spawnBounceParticles();

    // 정지 조건 완화: 충분히 굴러간 뒤 멈추게
    if (ball.vy === 0 && Math.abs(ball.vx) < 0.4) {
      stopBall();
    }
  }

  // 화면 밖 아래로 떨어졌을 때
  if (ball.y > canvas.height + 200) {
    stopBall();
  }

  // 카메라 추적 (수평)
  const targetCamX = Math.max(0, ball.x - canvas.width * 0.35);
  state.cameraX += (targetCamX - state.cameraX) * 0.1;

  // 카메라 추적 (수직): 공이 화면 위 42% 넘으면 카메라가 따라감
  // 공의 수직 속도가 빠를수록 카메라도 빠르게 추적
  const targetCamY = Math.min(0, ball.y - canvas.height * 0.42);
  const vertLerp = Math.min(0.25, 0.12 + Math.abs(ball.vy) * 0.004);
  state.cameraY += (targetCamY - state.cameraY) * vertLerp;

  // 거리 업데이트
  state.totalDistPx = ball.x;
  state.currentDistM = Math.max(0, Math.round((ball.x - 120) / 6));
  if (state.currentDistM > state.bestDistM) state.bestDistM = state.currentDistM;

  updateHUD();
}

function stopBall() {
  state.inFlight    = false;
  state.landDistM   = state.currentDistM;
  // 최고기록 저장
  if (state.currentDistM > parseFloat(localStorage.getItem('gnome_best') || '0')) {
    localStorage.setItem('gnome_best', state.currentDistM);
    state.bestDistM = state.currentDistM;
  }
  setTimeout(showResult, 600);
}

// ─────────────────────────────────────────────
// 14. HUD 업데이트
// ─────────────────────────────────────────────
function buildProgressBar() {
  progressBiomeBg.innerHTML = '';
  const total = MAX_DIST;
  BIOMES.forEach(b => {
    const seg = document.createElement('div');
    seg.className = 'biome-segment';
    const pct = ((b.endDist - b.startDist) / total) * 100;
    seg.style.cssText = `flex: 0 0 ${pct}%; background: ${b.barColor}; opacity: 0.4;`;
    progressBiomeBg.appendChild(seg);
  });
}

function updateHUD() {
  const cur  = state.currentDistM;
  const best = state.bestDistM;
  const max  = MAX_DIST;

  hudCurDist.textContent  = `${cur}m`;
  hudBestDist.textContent = `${Math.round(best)}m`;

  const barW = $('progress-bar-wrap').offsetWidth;
  const curPct  = Math.min(1, cur  / max);
  const bestPct = Math.min(1, best / max);

  progressCur.style.left  = `${curPct  * 100}%`;
  progressBest.style.left = `${bestPct * 100}%`;
}

// ─────────────────────────────────────────────
// 15. 파티클 시스템
// ─────────────────────────────────────────────
function spawnLaunchParticles() {
  const { x, y } = state.ball;
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    state.particles.push({
      x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 3,
      life: 1, decay: 0.04, r: 3+Math.random()*5,
      color: state.char.color, type: 'launch',
    });
  }
}

function spawnBounceParticles() {
  const { x, y } = state.ball;
  const biome = getBiomeAt(state.currentDistM);
  for (let i = 0; i < 10; i++) {
    state.particles.push({
      x, y, vx: (Math.random()-0.5)*6, vy: -Math.random()*5,
      life: 1, decay: 0.06, r: 2+Math.random()*4,
      color: biome.groundColor, type: 'bounce',
    });
  }
}

function spawnSkillParticles() {
  const { x, y } = state.ball;
  const ch = state.char;
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    state.skillParticles.push({
      x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 2,
      life: 1, decay: 0.025, r: 4+Math.random()*8,
      color: ch.color, type: 'skill',
    });
  }
}

function updateParticles(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.2;
    p.vx *= 0.95;
    p.life -= p.decay;
    if (p.life <= 0) list.splice(i, 1);
  }
}

// 배경 파티클 (바이옴별)
const bgParticles = [];
function spawnBgParticle(biome) {
  const type = biome.particles;
  const x = state.cameraX + canvas.width + Math.random() * 100;
  const y = Math.random() * canvas.height * 0.6;

  if (type === 'cloud') {
    bgParticles.push({ x, y, vx: -0.5, vy: 0, r: 20+Math.random()*30, life: 1, decay: 0.001, type: 'cloud' });
  } else if (type === 'sand') {
    bgParticles.push({ x, y: canvas.height * 0.3 + Math.random() * 60, vx: -2-Math.random()*2, vy: 0.5, r: 2, life: 1, decay: 0.005, type: 'sand', color: '#d97706' });
  } else if (type === 'snow') {
    bgParticles.push({ x, y: 0, vx: -0.3-Math.random(), vy: 1+Math.random(), r: 2+Math.random()*3, life: 1, decay: 0.003, type: 'snow' });
  } else if (type === 'ember') {
    bgParticles.push({ x: state.cameraX + Math.random()*canvas.width, y: canvas.height, vx: (Math.random()-0.5)*2, vy: -(1+Math.random()*3), r: 2, life: 1, decay: 0.008, type: 'ember', color: '#f97316' });
  } else if (type === 'star') {
    bgParticles.push({ x, y: Math.random()*canvas.height*0.5, vx: 0, vy: 0, r: 1+Math.random()*2, life: 1, decay: 0.002, type: 'star' });
  }
}

// ─────────────────────────────────────────────
// 16. 결과 화면
// ─────────────────────────────────────────────
function showResult() {
  state.phase = 'result';
  flightUI.classList.add('hidden');

  const dist = state.landDistM;
  const best = state.bestDistM;
  const biome = getBiomeAt(dist);
  const isNewBest = dist >= best - 1;

  resultEmoji.textContent = dist > 2000 ? '🌟' : dist > 1000 ? '🎉' : dist > 300 ? '😄' : '😅';
  resultTitle.textContent = isNewBest && dist > 0 ? '🏆 신기록!' : '착지!';
  resultThis.textContent  = `${dist}m`;
  resultBest.textContent  = `${Math.round(best)}m`;
  resultBiomeInfo.textContent = `도달 바이옴: ${biome.name}`;

  resultScreen.classList.remove('hidden');
}

// ─────────────────────────────────────────────
// 17. 스킬 토스트
// ─────────────────────────────────────────────
let toastTimer = null;
function showSkillToast(text) {
  skillToast.textContent = text;
  skillToast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => skillToast.classList.add('hidden'), 1500);
}

// ─────────────────────────────────────────────
// 18. 렌더링
// ─────────────────────────────────────────────
function render() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const distM = state.currentDistM;
  const biomeBlend = getBiomeBlend(distM);
  const cur  = biomeBlend.cur;
  const next = biomeBlend.next;
  const t    = 1 - biomeBlend.blend;

  // === 하늘 그라데이션 (고도에 따라 변화) ===
  // altFactor: 0 = 지상, 1 = 우주 (카메라가 얼마나 위로 올라갔는지)
  const altFactor = Math.min(1, Math.max(0, -state.cameraY) / (canvas.height * 0.8));
  const skyT = lerpColor(cur.skyTop, next.skyTop, t);
  const skyB = lerpColor(cur.skyBot, next.skyBot, t);
  // 상층 대기 색 (짙은 남색)
  const upperSkyTop = '#0d1b4b';
  const upperSkyBot = '#1e40af';
  // 우주 색 (거의 검정)
  const spaceSkyTop = '#010614';
  const spaceSkyBot = '#020c2e';
  let finalSkyTop, finalSkyBot;
  if (altFactor < 0.5) {
    const a = altFactor * 2;
    finalSkyTop = lerpColor(skyT, upperSkyTop, a);
    finalSkyBot = lerpColor(skyB, upperSkyBot, a);
  } else {
    const a = (altFactor - 0.5) * 2;
    finalSkyTop = lerpColor(upperSkyTop, spaceSkyTop, a);
    finalSkyBot = lerpColor(upperSkyBot, spaceSkyBot, a);
  }
  const grad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
  grad.addColorStop(0, finalSkyTop);
  grad.addColorStop(1, finalSkyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 별 표시: 우주 바이옴이거나 고도가 높을 때 서서히 나타남
  const biomeStarAlpha = (cur.name === '🚀 우주' || next.name === '🚀 우주') ? 1 : 0;
  const altStarAlpha   = altFactor > 0.3 ? (altFactor - 0.3) / 0.7 : 0;
  const starAlpha = Math.max(biomeStarAlpha, altStarAlpha);
  if (starAlpha > 0) drawStars(starAlpha);

  // === 배경 파티클 ===
  renderBgParticles(cur);

  // === 배경 오브젝트 ===
  renderBgObjects(cur, t);

  // === 지형 ===
  renderTerrain(cur, next, t);

  // === 투석기 ===
  if (state.phase === 'aim' || state.phase === 'select') {
    renderCatapult();
  }

  // === 발사 조준선 ===
  if (state.phase === 'aim' && state.aimDrag.active) {
    renderAimLine();
  }

  // === 파티클 ===
  renderParticles(state.particles);
  renderParticles(state.skillParticles);

  // === 공 (노움) ===
  if (state.phase !== 'select') {
    renderBall();
  }

  // === 스킬 이펙트 오버레이 ===
  if (state.skillActive) {
    renderSkillOverlay();
  }

  // === 거리 텍스트 ===
  if (state.phase === 'flight' || state.phase === 'result') {
    renderDistLabel();
  }
}

function drawStars(alphaMult = 1) {
  ctx.save();
  ctx.fillStyle = 'white';
  // 간단한 별 (고정 패턴) - alphaMult로 서서히 나타남
  for (let i = 0; i < 80; i++) {
    const sx = (i * 137.5) % canvas.width;
    const sy = (i * 79.3) % (canvas.height * 0.6);
    const r = (i % 3 === 0) ? 2 : 1;
    ctx.globalAlpha = (0.3 + (i % 5) * 0.1) * alphaMult;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderBgParticles(biome) {
  // 스폰
  if (Math.random() < 0.15) spawnBgParticle(biome);

  ctx.save();
  bgParticles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;

    const sx = p.x - state.cameraX;
    if (sx < -100 || sx > canvas.width + 100 || p.life <= 0) {
      bgParticles.splice(i, 1);
      return;
    }
    ctx.globalAlpha = p.life * 0.8;

    if (p.type === 'cloud') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(sx, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + p.r*0.6, p.y - p.r*0.3, p.r*0.7, 0, Math.PI*2);
      ctx.fill();
    } else if (p.type === 'snow') {
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(sx, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    } else if (p.type === 'star') {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sx, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color || '#f97316';
      ctx.beginPath();
      ctx.arc(sx, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderBgObjects(biome, blendT) {
  ctx.save();
  state.bgObjects.forEach(obj => {
    const sx = obj.x - state.cameraX;
    if (sx < -200 || sx > canvas.width + 200) return;
    const ty = getTerrainY(obj.x);
    drawBgObject(ctx, obj.type, sx, ty - state.cameraY, blendT);
  });
  ctx.restore();
}

function drawBgObject(ctx, type, x, y, t) {
  ctx.save();
  ctx.globalAlpha = 0.75;
  if (type === 'tree') {
    // 나무
    ctx.fillStyle = '#713f12';
    ctx.fillRect(x - 4, y - 40, 8, 40);
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(x, y - 50, 22, 0, Math.PI*2);
    ctx.fill();
  } else if (type === 'cactus') {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x - 5, y - 60, 10, 60);
    ctx.fillRect(x - 18, y - 45, 14, 8);
    ctx.fillRect(x + 4, y - 35, 14, 8);
    ctx.fillRect(x - 14, y - 60, 8, 20);
    ctx.fillRect(x + 4, y - 50, 8, 20);
  } else if (type === 'pine') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 4, y - 40, 8, 40);
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const h = y - 40 - i * 18;
      ctx.moveTo(x, h - 22 + i*4);
      ctx.lineTo(x + 18 - i*4, h);
      ctx.lineTo(x - 18 + i*4, h);
      ctx.closePath();
      ctx.fill();
    }
  } else if (type === 'volcano') {
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(x - 50, y);
    ctx.lineTo(x, y - 70);
    ctx.lineTo(x + 50, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y - 70, 8, 0, Math.PI*2);
    ctx.fill();
  } else if (type === 'crater') {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y - 5, 35, 10, 0, 0, Math.PI*2);
    ctx.stroke();
  }
  ctx.restore();
}

function renderTerrain(cur, next, t) {
  const W = canvas.width, H = canvas.height;
  const gc = lerpColor(cur.groundColor, next.groundColor, t);
  const gd = lerpColor(cur.groundDark,  next.groundDark,  t);

  // 지형 폴리곤
  ctx.beginPath();
  ctx.moveTo(0, H);

  // 시작점 찾기
  const startX = Math.floor(state.cameraX / TERRAIN_CHUNK - 1) * TERRAIN_CHUNK;
  for (let wx = startX; wx < state.cameraX + W + TERRAIN_CHUNK; wx += TERRAIN_CHUNK) {
    const sx = wx - state.cameraX;
    const ty = getTerrainY(wx) - state.cameraY;   // 수직 카메라 보정
    ctx.lineTo(sx, ty);
  }
  ctx.lineTo(W, H);
  ctx.closePath();

  const tGrad = ctx.createLinearGradient(0, groundY() - 60 - state.cameraY, 0, H);
  tGrad.addColorStop(0, gc);
  tGrad.addColorStop(1, gd);
  ctx.fillStyle = tGrad;
  ctx.fill();

  // 지형 윤곽선
  ctx.beginPath();
  for (let wx = startX; wx < state.cameraX + W + TERRAIN_CHUNK; wx += TERRAIN_CHUNK) {
    const sx = wx - state.cameraX;
    const ty = getTerrainY(wx) - state.cameraY;   // 수직 카메라 보정
    if (wx === startX) ctx.moveTo(sx, ty);
    else ctx.lineTo(sx, ty);
  }
  ctx.strokeStyle = lerpColor(cur.groundDark, next.groundDark, t);
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderCatapult() {
  const cx = state.catapult.x - state.cameraX;
  const cy = groundY() - state.cameraY;

  ctx.save();
  ctx.translate(cx, cy);

  // 받침대
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(20, 0);
  ctx.lineTo(10, -20);
  ctx.lineTo(-10, -20);
  ctx.closePath();
  ctx.fill();

  // 팔
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const armLen = 80;
  ctx.moveTo(0, -20);
  const ax = Math.cos(state.catapult.armAngle - Math.PI/2) * armLen;
  const ay = Math.sin(state.catapult.armAngle - Math.PI/2) * armLen;
  ctx.lineTo(ax, -20 + ay);
  ctx.stroke();

  // 공 받침 (Aim 단계)
  if (state.phase === 'aim') {
    ctx.fillStyle = state.char?.color || '#fbbf24';
    ctx.beginPath();
    ctx.arc(ax, -20 + ay, 8, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.restore();
}

function renderAimLine() {
  const ch = state.char;
  if (!ch) return;
  const { power, angle } = getAimVector();
  const cx = state.catapult.x - state.cameraX;
  const cy = groundY() - 60;

  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = `${ch.color}aa`;
  ctx.lineWidth = 2;

  const speed = ch.speed * power;
  let px = cx, py = cy;
  let vx = Math.cos(angle) * speed;
  let vy = -Math.sin(angle) * speed;

  ctx.beginPath();
  ctx.moveTo(px, py);
  for (let i = 0; i < 40; i++) {
    vx *= ch.airResist;
    vy += GRAVITY * ch.weight;
    vy *= AIR_DRAG;
    px += vx;
    py += vy;
    if (py > canvas.height) break;
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function renderParticles(list) {
  ctx.save();
  list.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x - state.cameraX, p.y - state.cameraY, p.r * p.life, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderBall() {
  const ball = state.ball;
  const ch   = state.char;
  const sx   = ball.x - state.cameraX;
  const sy   = ball.y - state.cameraY;  // 수직 카메라 보정
  const r    = ball.r;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(ball.angle);

  // 그림자
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, r + 4, r * 0.9, 4, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // 스킬 발광
  if (state.skillActive) {
    ctx.shadowBlur  = 30;
    ctx.shadowColor = ch.color;
  }

  // 반짝이 (스킬 활성 시)
  if (state.antiGravTimer > 0) {
    ctx.save();
    const pulseR = r + Math.sin(Date.now() * 0.02) * 5;
    ctx.strokeStyle = ch.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  // 공 몸체 - 그라데이션
  const bg = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.1, 0, 0, r);
  bg.addColorStop(0, lighten(ch.color, 60));
  bg.addColorStop(0.7, ch.color);
  bg.addColorStop(1, darken(ch.color, 40));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI*2);
  ctx.fill();

  // 이모지 그리기
  ctx.shadowBlur = 0;
  ctx.font = `${r * 1.2}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch.emoji, 0, 0);

  ctx.restore();
}

function renderSkillOverlay() {
  const ch = state.char;
  if (!ch) return;
  const sx = state.ball.x - state.cameraX;
  const sy = state.ball.y - state.cameraY;

  if (ch.id === 'red' && state.skillTimer > 0) {
    // 로켓 불꽃
    ctx.save();
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.6 * Math.random();
      ctx.fillStyle   = i < 2 ? '#ef4444' : '#f97316';
      const fx = sx - 20 - Math.random()*20;
      const fy = sy + (Math.random()-0.5)*10;
      ctx.beginPath();
      ctx.arc(fx, fy, 4+Math.random()*6, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (ch.id === 'blue' && state.skillTimer > 0) {
    // 얼음 결정
    ctx.save();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 3; i++) {
      const rx = sx + (Math.random()-0.5)*50;
      const ry = sy + (Math.random()-0.5)*30;
      ctx.beginPath();
      ctx.moveTo(rx-8, ry); ctx.lineTo(rx+8, ry);
      ctx.moveTo(rx, ry-8); ctx.lineTo(rx, ry+8);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (ch.id === 'orange' && state.drillTimer > 0) {
    // 드릴 스핀 파티클
    ctx.save();
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 4; i++) {
      const a = (Date.now() * 0.02 + i * Math.PI/2) % (Math.PI*2);
      const px = sx + Math.cos(a) * 30;
      const py = sy + Math.sin(a) * 15;
      ctx.fillStyle = ch.color;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (ch.id === 'purple' && state.antiGravTimer > 0) {
    // 마법 파티클
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const a = (Date.now() * 0.01 + i * 2.1);
      const px = sx + Math.cos(a) * 35;
      const py = sy + Math.sin(a) * 25 - 10;
      ctx.fillStyle = '#a855f7';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (ch.id === 'green' && state.superBounceArmed) {
    // 슈퍼 바운스 대기 중 - 공 주변 링
    ctx.save();
    const pulse = Math.abs(Math.sin(Date.now() * 0.01)) * 0.7 + 0.3;
    ctx.strokeStyle = ch.color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = pulse;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(sx, sy, state.ball.r + 12, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
  if (ch.id === 'yellow' && state.skillTimer > 0) {
    // 번개
    ctx.save();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    const lx = sx + 20;
    const ly = sy;
    ctx.beginPath();
    ctx.moveTo(lx, ly - 20);
    ctx.lineTo(lx - 8, ly);
    ctx.lineTo(lx + 4, ly);
    ctx.lineTo(lx - 8, ly + 20);
    ctx.stroke();
    ctx.restore();
  }
}

function renderDistLabel() {
  const dist = state.currentDistM;
  if (dist <= 0) return;
  const sx = state.ball.x - state.cameraX;
  const sy = state.ball.y - state.cameraY - state.ball.r - 20;

  ctx.save();
  ctx.font = 'bold 14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(`${dist}m`, sx + 1, sy + 1);
  ctx.fillStyle = '#fff';
  ctx.fillText(`${dist}m`, sx, sy);
  ctx.restore();
}

// ─────────────────────────────────────────────
// 19. 색상 유틸
// ─────────────────────────────────────────────
function lighten(hex, amount) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amount);
  const g = Math.min(255, ((n >>  8) & 255) + amount);
  const b = Math.min(255,  (n        & 255) + amount);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amount) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, ((n >> 16) & 255) - amount);
  const g = Math.max(0, ((n >>  8) & 255) - amount);
  const b = Math.max(0,  (n        & 255) - amount);
  return `rgb(${r},${g},${b})`;
}

// ─────────────────────────────────────────────
// 20. 메인 게임 루프
// ─────────────────────────────────────────────
function gameLoop() {
  if (state.phase === 'flight') {
    updatePhysics();
    updateParticles(state.particles);
    updateParticles(state.skillParticles);
  }
  render();
  requestAnimationFrame(gameLoop);
}

// ─────────────────────────────────────────────
// 21. 초기화
// ─────────────────────────────────────────────
function init() {
  resize();
  buildCharSelect();

  // 로컬스토리지에서 최고기록 불러오기
  const saved = parseFloat(localStorage.getItem('gnome_best') || '0');
  state.bestDistM = saved;
  globalBestEl.textContent = `${Math.round(saved)}m`;

  gameLoop();
}

init();
