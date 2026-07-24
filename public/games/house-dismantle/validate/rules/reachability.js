/* Rule: Spatial Reachability — can you walk to every room? */

// Room graph nodes: bay-section cells. Each cell = one bay, front/back half, floor
// Doorways define edges. Check connectivity from entrance.

export function checkReachability() {
  const violations = [];
  const BAYS = 4;
  const FLOORS = 2;

  // Build adjacency graph
  // Node ID: "F{bay}-{fb}" where bay=0..3, fb=front|back
  // Actually use numeric: floor * 8 + bay * 2 + (front?0:1)
  const N = FLOORS * BAYS * 2; // 16 nodes
  const adj = Array.from({ length: N }, () => []);

  function nodeId(floor, bay, front) {
    return floor * BAYS * 2 + bay * 2 + (front ? 0 : 1);
  }

  function connect(a, b) {
    adj[a].push(b);
    adj[b].push(a);
  }

  // Doorways in cross wall z=0: front↔back within each bay, both floors
  for (let f = 0; f < FLOORS; f++) {
    for (let b = 0; b < BAYS; b++) {
      connect(nodeId(f, b, true), nodeId(f, b, false));
    }
  }

  // Corridor doorways in longitudinal walls at z≈-2: bay↔bay+1 (back side), both floors
  for (let f = 0; f < FLOORS; f++) {
    for (let b = 0; b < BAYS - 1; b++) {
      connect(nodeId(f, b, false), nodeId(f, b + 1, false));
    }
  }

  // Stairs connect 1F bay2-back ↔ 2F bay2-back (stairwell area)
  connect(nodeId(0, 1, false), nodeId(1, 1, false)); // bay1 = index 1 (x=-4..0)

  // Entrances: front door at 1F bay2-front (index 2), back door at 1F bay3-back (index 3)
  const entrances = [nodeId(0, 2, true), nodeId(0, 3, false)];

  // BFS from entrances
  const visited = new Set();
  const queue = [...entrances];
  for (const e of entrances) visited.add(e);
  while (queue.length > 0) {
    const cur = queue.shift();
    for (const next of adj[cur]) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  // Check unreachable
  const labels = [];
  for (let f = 0; f < FLOORS; f++) {
    for (let b = 0; b < BAYS; b++) {
      for (const fb of [true, false]) {
        const id = nodeId(f, b, fb);
        if (!visited.has(id)) {
          const roomName = `${f === 0 ? '1F' : '2F'} 开间${b + 1}${fb ? '前' : '后'}`;
          labels.push(roomName);
        }
      }
    }
  }

  if (labels.length > 0) {
    violations.push({
      rule: 'reachability',
      severity: 'error',
      parts: [],
      detail: `${labels.length} 个房间无法到达: ${labels.join(', ')}`,
      fix: { suggestion: '添加门洞或走廊连接这些房间' },
    });
  }

  return violations;
}
