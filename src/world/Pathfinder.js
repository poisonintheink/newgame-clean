export function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function findPath(world, start, goal) {
  if (!world || !world.isWalkable(start.x, start.y) || !world.isWalkable(goal.x, goal.y)) {
    return [];
  }

  const openSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const startKey = `${start.x},${start.y}`;
  const goalKey = `${goal.x},${goal.y}`;

  openSet.add(startKey);
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(start, goal));

  function getLowestFScore() {
    let lowestKey = null;
    let lowest = Infinity;
    for (const key of openSet) {
      const score = fScore.get(key) ?? Infinity;
      if (score < lowest) {
        lowest = score;
        lowestKey = key;
      }
    }
    return lowestKey;
  }

  function reconstructPath(currentKey) {
    const path = [currentKey];
    while (cameFrom.has(currentKey)) {
      currentKey = cameFrom.get(currentKey);
      path.unshift(currentKey);
    }
    return path.map(k => {
      const [x, y] = k.split(',').map(Number);
      return { x, y };
    });
  }

  while (openSet.size > 0) {
    const currentKey = getLowestFScore();
    if (!currentKey) break;
    if (currentKey === goalKey) {
      return reconstructPath(currentKey);
    }

    openSet.delete(currentKey);
    const [cx, cy] = currentKey.split(',').map(Number);
    const neighbors = [
      { x: cx + 1, y: cy },
      { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 },
      { x: cx, y: cy - 1 },
    ];

    for (const n of neighbors) {
      if (!world.isWalkable(n.x, n.y)) continue;
      const nKey = `${n.x},${n.y}`;
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

      if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
        cameFrom.set(nKey, currentKey);
        gScore.set(nKey, tentativeG);
        fScore.set(nKey, tentativeG + heuristic(n, goal));
        if (!openSet.has(nKey)) {
          openSet.add(nKey);
        }
      }
    }
  }

  return [];
}