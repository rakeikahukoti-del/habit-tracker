// Shared trig helpers for the code-drawn SVG frame components
// (BadgeFrame.js, ../rank/RankMedalFrame.js). Both are precomputed once at
// module load against a fixed 96x96 viewBox with a fixed center - pulled
// out here (Phase 9 rank-medal conversion) so the two components share one
// copy of the point math instead of each carrying its own.
export function pointAt(r, deg, center = 48) {
  const rad = (deg * Math.PI) / 180;

  return [center + r * Math.cos(rad), center - r * Math.sin(rad)];
}

export function round(n) {
  return Math.round(n * 100) / 100;
}

export function polygonPoints(r, sides, rotation = 90, center = 48) {
  const pts = [];

  for (let i = 0; i < sides; i++) {
    pts.push(pointAt(r, rotation - (i * 360) / sides, center));
  }

  return pts.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
}

// Alternates between rOuter/rInner each point - a faceted rim when count is
// small, a star or scalloped rosette when count is larger.
export function facetedRimPoints(rOuter, rInner, count, center = 48) {
  const pts = [];

  for (let i = 0; i < count; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;

    pts.push(pointAt(r, 90 - (i * 360) / count, center));
  }

  return pts.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
}

export function radialTicks(rInner, rOuter, count, shortenOdd, center = 48) {
  const ticks = [];

  for (let i = 0; i < count; i++) {
    const deg = 90 - (i * 360) / count;
    const outer = shortenOdd && i % 2 !== 0 ? rOuter - 3 : rOuter;
    const [x1, y1] = pointAt(rInner, deg, center);
    const [x2, y2] = pointAt(outer, deg, center);

    ticks.push({ x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2) });
  }

  return ticks;
}

export function hexVertices(r, rotation = 90, center = 48) {
  const pts = [];

  for (let i = 0; i < 6; i++) {
    const [x, y] = pointAt(r, rotation - i * 60, center);

    pts.push({ cx: round(x), cy: round(y) });
  }

  return pts;
}
