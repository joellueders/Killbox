(() => {
  const G = 44;
  const COLS = 30;
  const ROWS = 15;
  const OX = 28;
  const OY = 88;

  const cx = c => OX + c * G + G / 2;
  const cy = r => OY + r * G + G / 2;
  const key = (c, r) => c + ',' + r;
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function segDist(px, py, ax, ay, bx, by) {
    const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = l2 ? clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2, 0, 1) : 0;
    return dist(px, py, ax + (bx - ax) * t, ay + (by - ay) * t);
  }

  const LEVELS = {
    field: {
      label: 'Field',
      roadRects: [
        [0, 6, 7, 10],
        [5, 3, 11, 10],
        [9, 3, 16, 6],
        [14, 3, 19, 12],
        [17, 9, 25, 12],
        [22, 5, 29, 12],
        [24, 5, 29, 8],
      ],
      blockedRects: [],
      spawns: [
        { c: 0, r: 6, label: 'TOP' },
        { c: 0, r: 8, label: 'MID' },
        { c: 0, r: 10, label: 'BOT' },
      ],
      goal: { c: 29, r: 7 },
      heroSpawn: { c: 2, r: 13 },
    },
    ring: {
      label: 'Ring',
      roadRects: [
        [0, 2, 5, 3],
        [5, 2, 8, 5],
        [8, 4, 12, 5],
        [17, 4, 21, 5],
        [21, 2, 24, 5],
        [24, 2, 29, 3],
        [0, 11, 5, 12],
        [5, 10, 8, 12],
        [8, 9, 12, 10],
        [17, 9, 21, 10],
        [21, 10, 24, 12],
        [24, 11, 29, 12],
        [11, 5, 12, 9],
        [17, 5, 18, 9],
        [12, 6, 17, 8],
        [13, 4, 16, 5],
        [13, 9, 16, 10],
        [12, 7, 17, 8],
      ],
      blockedRects: [
        [0, 0, 3, 1],
        [9, 0, 10, 3],
        [19, 0, 20, 3],
        [26, 0, 29, 1],
        [0, 13, 3, 14],
        [9, 11, 10, 14],
        [19, 11, 20, 14],
        [26, 13, 29, 14],
        [6, 6, 7, 8],
        [22, 6, 23, 8],
      ],
      spawns: [
        { c: 0, r: 2, label: 'NW' },
        { c: 29, r: 2, label: 'NE' },
        { c: 0, r: 12, label: 'SW' },
        { c: 29, r: 12, label: 'SE' },
      ],
      goal: { c: 15, r: 7 },
      heroSpawn: { c: 14, r: 7 },
    },
    split: {
      label: 'Split',
      roadRects: [
        [0, 5, 7, 6],
        [0, 9, 7, 10],
        [7, 4, 10, 6],
        [10, 2, 12, 4],
        [7, 10, 10, 12],
        [10, 10, 12, 12],
        [12, 2, 21, 4],
        [12, 10, 21, 12],
        [21, 3, 26, 5],
        [21, 9, 26, 11],
        [23, 5, 29, 9],
      ],
      blockedRects: [
        [12, 5, 17, 9],
        [12, 0, 13, 1],
        [16, 0, 17, 1],
        [12, 13, 13, 14],
        [16, 13, 17, 14],
        [0, 0, 5, 3],
        [0, 11, 5, 14],
        [24, 0, 29, 2],
        [24, 12, 29, 14],
        [6, 0, 6, 2],
        [6, 12, 6, 14],
      ],
      spawns: [
        { c: 0, r: 5, label: 'TOP' },
        { c: 0, r: 9, label: 'BOTTOM' },
      ],
      goal: { c: 28, r: 7 },
      heroSpawn: { c: 9, r: 5 },
    },
  };

  const road = new Set();
  const blockedTerrain = new Set();
  function roadRect(x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) road.add(key(x, y));
  }
  function blockedRect(x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) blockedTerrain.add(key(x, y));
  }

  let LEVEL_ID = 'field';
  let SPAWN_POINTS = LEVELS.field.spawns.map(p => ({ ...p }));
  let GOAL = { ...LEVELS.field.goal };

  const TOWERS = {
    archer: { n: 'Archer Tower', c: 55, r: 118, rate: .60, d: 19, fill: '#6d8b3d', role: 'Cheap fast arrows.' },
    ballista: { n: 'Ballista', c: 115, r: 172, rate: 1.5, d: 72, fill: '#8b5a2b', role: 'Long-range heavy bolts.' },
    frost: { n: 'Frost Mage', c: 95, r: 108, rate: 1.1, d: 10, fill: '#8fb6c8', role: 'Slows groups.', slow: .70, splash: 50 },
    cauldron: { n: 'Fire Cauldron', c: 125, r: 92, rate: 5.2, d: 1, fill: '#a74b25', role: 'Ground burn support. Softens chokepoints.', burn: 0.02, splash: 10, maxTargets: 1, firePatch: true },
    cannon: { n: 'Cannon', c: 155, r: 145, rate: 2.0, d: 83, fill: '#55514a', role: 'Slow heavy splash.', splash: 88 },
    barracks: { n: 'Barracks', c: 130, r: 90, rate: 1.2, d: 17, fill: '#7c3d2d', role: 'Fighting blocker. Holds enemies in place.', slow: .28 },
    spire: { n: 'Lightning Spire', c: 185, r: 130, rate: 1.35, d: 62, fill: '#7a62b9', role: 'Chains lightning through clustered enemies.', chain: 4 },
    alchemist: { n: 'Alchemist', c: 105, r: 122, rate: 1.0, d: 9, fill: '#6f8d3b', role: 'Poison shots.', poison: 36 },
    spikes: { n: 'Spike Floor', c: 70, r: 38, rate: 3.0, d: 34, fill: '#8a8178', role: 'Trigger burst trap. Spikes fire up on contact.', trap: true, triggerTrap: true },
    tar: { n: 'Push Wall', c: 90, r: 72, rate: 3.1, d: 2, fill: '#5d4d37', role: 'Directional shove trap. Repositions enemies.', trap: true, directional: true, push: 235, coneRange: 130, coneWidth: .6 },
    spring: { n: 'Spring Launcher', c: 105, r: 40, rate: 3.0, d: 8, fill: '#9a7c4f', role: 'Directional launch trap. Tosses enemies down-lane.', trap: true, directional: true, spring: true, launch: 330 },
    mace: { n: 'Swinging Mace', c: 130, r: 62, rate: 2.7, d: 22, fill: '#6a6760', role: 'Periodic swing arc. Knocks and bruises groups.', trap: true, directional: true, mace: true, push: 190, coneRange: 112, coneWidth: .95 },
    barrier: { n: 'Barrier', c: 25, r: 0, fill: '#5a3420', role: 'Cheap solid road blocker. 520 HP.' },
    barrel: { n: 'Powder Barrel', c: 50, r: 0, fill: '#8b4424', role: 'One-use explosive. Shoot it.' },
  };

  const CORE_TOWER_TYPES = new Set(['archer', 'ballista', 'frost', 'cauldron', 'cannon', 'spire', 'alchemist']);
  function isCoreTowerType(type) { return CORE_TOWER_TYPES.has(type); }
  function towerHasDurability(t) { return !!t && !!TOWERS[t.type] && !isCoreTowerType(t.type); }
  function towerDisabledUntil(t) { return t && t.disabledUntil ? t.disabledUntil : 0; }
  function towerIsDisabled(t) { return isCoreTowerType(t?.type) && towerDisabledUntil(t) > performance.now() / 1000; }

  const BUILD_ORDER = ['archer', 'ballista', 'spikes', 'tar', 'barrier', 'barrel', 'spire', 'cannon'];
  const VOLLEY_CD = 8;
  const OIL_CD = 10;
  const SHOVE_CD = 2.2;

  window.KB = {
    G, COLS, ROWS, OX, OY,
    cx, cy, key, dist, clamp, segDist,
    LEVELS, road, blockedTerrain, roadRect, blockedRect,
    LEVEL_ID, SPAWN_POINTS, GOAL,
    TOWERS, CORE_TOWER_TYPES, isCoreTowerType, towerHasDurability, towerDisabledUntil, towerIsDisabled,
    BUILD_ORDER, VOLLEY_CD, OIL_CD, SHOVE_CD,
  };
})();
