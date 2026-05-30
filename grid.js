(() => {
  const { G, COLS, ROWS, OX, OY, key, road, blockedTerrain, roadRect, blockedRect, TOWERS } = window.KB;
  const S = window.S;

  function isRoad(c, r) { return road.has(key(c, r)); }
  function isBlockedTerrain(c, r) { return blockedTerrain.has(key(c, r)); }
  function occupied(c, r) {
    return S.barriers.some(b => b.c === c && b.r === r)
      || S.barrels.some(b => b.c === c && b.r === r)
      || S.towers.some(t => t.c === c && t.r === r);
  }
  function blocked(c, r) {
    return S.barriers.some(b => b.c === c && b.r === r)
      || S.towers.some(t => t.onRoad && !TOWERS[t.type].trap && t.c === c && t.r === r);
  }
  function canHeroEnterCell(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS && !isBlockedTerrain(c, r);
  }
  function canEnemyEnterCell(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS && isRoad(c, r) && !isBlockedTerrain(c, r) && !blocked(c, r);
  }
  function canBuildOnCell(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS && !isBlockedTerrain(c, r);
  }
  function valid(c, r) { return canEnemyEnterCell(c, r); }
  function cellAt(x, y) { return { c: Math.floor((x - OX) / G), r: Math.floor((y - OY) / G) }; }
  function getMouseWorldPosition() { return { x: mouse.x, y: mouse.y }; }
  function getSnappedBuildTile(x, y) {
    const { c, r } = cellAt(x, y);
    return { c, r, x: cx(c), y: cy(r) };
  }
  function routePath(start, goal) {
    if (!start || !goal) return [];
    const q = [{ c: start.c, r: start.r }];
    const prev = {};
    const seen = new Set([key(start.c, start.r)]);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (q.length) {
      const n = q.shift();
      if (n.c === goal.c && n.r === goal.r) {
        const arr = [];
        let k = key(n.c, n.r);
        while (k) {
          const [c, r] = k.split(',').map(Number);
          arr.push({ c, r, x: cx(c), y: cy(r) });
          k = prev[k];
        }
        return arr.reverse();
      }
      for (const [dc, dr] of dirs) {
        const c = n.c + dc, r = n.r + dr, k = key(c, r);
        if (!seen.has(k) && valid(c, r)) {
          seen.add(k);
          prev[k] = key(n.c, n.r);
          q.push({ c, r });
        }
      }
    }
    return [];
  }
  function rebuildPath() {
    S.paths = window.KB.SPAWN_POINTS.map(sp => routePath(sp, window.KB.GOAL));
    S.path = S.paths[1] || S.paths[0] || [];
    return S.path.length > 0;
  }
  function applyLevel(levelId, opts = {}) {
    const lvl = window.KB.LEVELS[levelId] || window.KB.LEVELS.field;
    window.KB.LEVEL_ID = levelId in window.KB.LEVELS ? levelId : 'field';
    road.clear();
    blockedTerrain.clear();
    for (const rect of lvl.roadRects) roadRect(rect[0], rect[1], rect[2], rect[3]);
    for (const rect of (lvl.blockedRects || [])) blockedRect(rect[0], rect[1], rect[2], rect[3]);
    window.KB.SPAWN_POINTS = lvl.spawns.map(p => ({ ...p }));
    window.KB.GOAL = { ...lvl.goal };
    S.levelId = window.KB.LEVEL_ID;
    S.levelLabel = lvl.label;
    const ok = rebuildPath();
    if (!opts.silent && typeof toast === 'function') toast(`${lvl.label} loaded.`);
    return ok;
  }

  window.KBGrid = {
    isRoad,
    isBlockedTerrain,
    occupied,
    blocked,
    canHeroEnterCell,
    canEnemyEnterCell,
    canBuildOnCell,
    valid,
    cellAt,
    getMouseWorldPosition,
    getSnappedBuildTile,
    routePath,
    rebuildPath,
    applyLevel,
  };
})();
