(() => {
  const { key, cx, cy } = window.KB;
  const { valid } = window.KBGrid;
  const S = window.S;

  function findPath() {
    const { SPAWN_POINTS, GOAL } = window.KB;
    const start = SPAWN_POINTS[1] || SPAWN_POINTS[0];
    if (!start || !GOAL) return null;
    const q = [start];
    const prev = {};
    const seen = new Set([key(start.c, start.r)]);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (q.length) {
      const n = q.shift();
      if (n.c === GOAL.c && n.r === GOAL.r) {
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
    return null;
  }

  function rebuildPath() {
    const p = findPath();
    if (!p) return false;
    S.path = p;
    return true;
  }

  window.KBPath = { findPath, rebuildPath };
})();
