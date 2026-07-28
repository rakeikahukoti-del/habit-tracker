const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const ROOT = path.join(__dirname, "..");

const COLORS = {
  amber: "#F59E0B",
  black: "#000000",
  blue: "#3B82F6",
  bronze: "#A97142",
  bronzeDark: "#5B3820",
  bronzeLight: "#D6A374",
  charcoal: "#1A1D22",
  cyan: "#6CAFC0",
  danger: "#EF4444",
  dark: "#0F1115",
  dark2: "#1A1D22",
  gold: "#C9A456",
  goldDark: "#6F5527",
  goldLight: "#F2D88D",
  green: "#6AA37A",
  light: "#F4F4F2",
  master: "#A63E49",
  masterDark: "#4C141B",
  masterLight: "#E6A2AA",
  platinum: "#8B5CF6",
  platinumDark: "#3A245F",
  platinumLight: "#C7B5F8",
  purple: "#8B5CF6",
  silver: "#A7ACB2",
  silverDark: "#5F6A76",
  silverLight: "#EEF2F5",
  slate: "#64748B",
  transparent: "#00000000",
  white: "#FFFFFF",
};

const rankPalettes = {
  bronze: {
    dark: COLORS.bronzeDark,
    fill: COLORS.bronze,
    light: COLORS.bronzeLight,
    name: "Bronze",
  },
  silver: {
    dark: COLORS.silverDark,
    fill: COLORS.silver,
    light: COLORS.silverLight,
    name: "Silver",
  },
  gold: {
    dark: COLORS.goldDark,
    fill: COLORS.gold,
    light: COLORS.goldLight,
    name: "Gold",
  },
  platinum: {
    dark: COLORS.platinumDark,
    fill: COLORS.platinum,
    light: COLORS.platinumLight,
    name: "Platinum",
  },
  diamond: {
    dark: "#1D5E73",
    fill: COLORS.cyan,
    light: "#D6F3F7",
    name: "Diamond",
  },
  master: {
    dark: COLORS.masterDark,
    fill: COLORS.master,
    light: COLORS.masterLight,
    name: "Master",
  },
};

const achievementDefinitions = [
  ["first-habit-created", "target", COLORS.amber],
  ["first-completion", "check", COLORS.blue],
  ["first-perfect-day", "star", COLORS.gold],
  ["three-day-streak", "flame", "#D96B3F"],
  ["seven-day-streak", "flame", "#E47A45"],
  ["fourteen-day-streak", "flame", COLORS.gold],
  ["thirty-day-streak", "flame", COLORS.platinum],
  ["sixty-day-streak", "flame", COLORS.cyan],
  ["one-hundred-day-streak", "flame", COLORS.master],
  ["three-habits-one-day", "calendar", COLORS.amber],
  ["five-habits-one-day", "calendar", COLORS.blue],
  ["ten-habits-one-day", "calendar", COLORS.purple],
  ["ten-total-completions", "bolt", COLORS.amber],
  ["fifty-total-completions", "bolt", COLORS.blue],
  ["one-hundred-total-completions", "bolt", COLORS.gold],
  ["two-fifty-total-completions", "bolt", COLORS.platinum],
  ["five-hundred-total-completions", "bolt", COLORS.cyan],
  ["reach-level-five", "mountain", COLORS.silver],
  ["reach-level-ten", "mountain", COLORS.gold],
  ["reach-level-twenty-five", "mountain", COLORS.cyan],
  ["reach-level-forty", "mountain", COLORS.master],
  ["unlock-silver", "shield", COLORS.silver],
  ["unlock-gold", "shield", COLORS.gold],
  ["unlock-platinum", "shield", COLORS.platinum],
  ["unlock-diamond", "shield", COLORS.cyan],
  ["unlock-master", "shield", COLORS.master],
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function hexToRgba(hex) {
  const normalized = hex.replace("#", "");
  const hasAlpha = normalized.length === 8;

  return {
    a: hasAlpha ? parseInt(normalized.slice(6, 8), 16) : 255,
    b: parseInt(normalized.slice(4, 6), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    r: parseInt(normalized.slice(0, 2), 16),
  };
}

function createCanvas(width, height, background = COLORS.transparent) {
  const png = new PNG({ colorType: 6, height, width });
  const color = hexToRgba(background);

  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = color.r;
    png.data[index + 1] = color.g;
    png.data[index + 2] = color.b;
    png.data[index + 3] = color.a;
  }

  return png;
}

function writePng(png, outputPath) {
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, PNG.sync.write(png));
}

function putPixel(png, x, y, color) {
  const px = Math.round(x);
  const py = Math.round(y);

  if (px < 0 || py < 0 || px >= png.width || py >= png.height) {
    return;
  }

  const rgba = typeof color === "string" ? hexToRgba(color) : color;
  const index = (py * png.width + px) * 4;
  const alpha = rgba.a / 255;
  const inverseAlpha = 1 - alpha;

  png.data[index] = Math.round(rgba.r * alpha + png.data[index] * inverseAlpha);
  png.data[index + 1] = Math.round(
    rgba.g * alpha + png.data[index + 1] * inverseAlpha
  );
  png.data[index + 2] = Math.round(
    rgba.b * alpha + png.data[index + 2] * inverseAlpha
  );
  png.data[index + 3] = Math.min(255, Math.round(rgba.a + png.data[index + 3] * inverseAlpha));
}

function fillPolygon(png, points, color) {
  const ys = points.map((point) => point[1]);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(png.height - 1, Math.ceil(Math.max(...ys)));

  for (let y = minY; y <= maxY; y += 1) {
    const intersections = [];

    for (let i = 0; i < points.length; i += 1) {
      const first = points[i];
      const second = points[(i + 1) % points.length];

      if (
        (first[1] <= y && second[1] > y) ||
        (second[1] <= y && first[1] > y)
      ) {
        const x =
          first[0] + ((y - first[1]) * (second[0] - first[0])) / (second[1] - first[1]);

        intersections.push(x);
      }
    }

    intersections.sort((a, b) => a - b);

    for (let i = 0; i < intersections.length; i += 2) {
      const startX = Math.max(0, Math.ceil(intersections[i]));
      const endX = Math.min(png.width - 1, Math.floor(intersections[i + 1]));

      for (let x = startX; x <= endX; x += 1) {
        putPixel(png, x, y, color);
      }
    }
  }
}

function fillCircle(png, centerX, centerY, radius, color) {
  const radiusSquared = radius * radius;

  for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
    for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;

      if (dx * dx + dy * dy <= radiusSquared) {
        putPixel(png, x, y, color);
      }
    }
  }
}

function strokeLine(png, from, to, color, width = 8) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  for (let step = 0; step <= steps; step += 1) {
    const progress = steps === 0 ? 0 : step / steps;
    fillCircle(
      png,
      from[0] + dx * progress,
      from[1] + dy * progress,
      width / 2,
      color
    );
  }
}

function strokePolyline(png, points, color, width) {
  for (let index = 0; index < points.length - 1; index += 1) {
    strokeLine(png, points[index], points[index + 1], color, width);
  }
}

function starPoints(cx, cy, outerRadius, innerRadius, count = 5) {
  const points = [];

  for (let index = 0; index < count * 2; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / count;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;

    points.push([
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
    ]);
  }

  return points;
}

function hexPoints(cx, cy, radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 3;

    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
}

function drawWolf(png, color, cutoutColor, box = [0, 0, png.width, png.height]) {
  const [x, y, width, height] = box;
  const px = (value) => x + (value / 1024) * width;
  const py = (value) => y + (value / 1024) * height;
  const polygon = (points, fill) =>
    fillPolygon(
      png,
      points.map(([pointX, pointY]) => [px(pointX), py(pointY)]),
      fill
    );

  polygon(
    [
      [182, 90],
      [320, 354],
      [250, 374],
      [192, 604],
      [122, 492],
    ],
    color
  );
  polygon(
    [
      [842, 90],
      [704, 354],
      [774, 374],
      [832, 604],
      [902, 492],
    ],
    color
  );
  polygon(
    [
      [230, 160],
      [318, 348],
      [252, 326],
      [204, 492],
      [160, 430],
    ],
    cutoutColor
  );
  polygon(
    [
      [794, 160],
      [706, 348],
      [772, 326],
      [820, 492],
      [864, 430],
    ],
    cutoutColor
  );

  polygon(
    [
      [292, 332],
      [512, 224],
      [512, 758],
      [374, 696],
      [306, 540],
    ],
    color
  );
  polygon(
    [
      [732, 332],
      [512, 224],
      [512, 758],
      [650, 696],
      [718, 540],
    ],
    color
  );
  polygon(
    [
      [170, 466],
      [306, 540],
      [374, 696],
      [268, 662],
      [138, 548],
    ],
    color
  );
  polygon(
    [
      [854, 466],
      [718, 540],
      [650, 696],
      [756, 662],
      [886, 548],
    ],
    color
  );
  polygon(
    [
      [312, 690],
      [512, 822],
      [512, 944],
      [382, 846],
    ],
    color
  );
  polygon(
    [
      [712, 690],
      [512, 822],
      [512, 944],
      [642, 846],
    ],
    color
  );
  polygon(
    [
      [382, 782],
      [512, 838],
      [642, 782],
      [584, 906],
      [512, 944],
      [440, 906],
    ],
    color
  );

  polygon(
    [
      [318, 512],
      [446, 476],
      [412, 536],
      [344, 552],
    ],
    cutoutColor
  );
  polygon(
    [
      [706, 512],
      [578, 476],
      [612, 536],
      [680, 552],
    ],
    cutoutColor
  );
  polygon(
    [
      [460, 790],
      [512, 818],
      [564, 790],
      [540, 846],
      [484, 846],
    ],
    cutoutColor
  );
}

function drawRankBadge(outputPath, palette) {
  const png = createCanvas(512, 512);

  fillPolygon(png, hexPoints(256, 256, 210), palette.dark);
  fillPolygon(png, hexPoints(256, 256, 188), palette.fill);
  fillPolygon(png, hexPoints(256, 256, 152), "#16191D");
  fillPolygon(png, hexPoints(256, 256, 128), palette.dark);
  fillPolygon(png, starPoints(256, 256, 96, 42), palette.light);
  fillPolygon(png, starPoints(256, 256, 62, 28), palette.fill);
  strokePolyline(png, hexPoints(256, 256, 188).concat([hexPoints(256, 256, 188)[0]]), palette.light, 7);

  writePng(png, outputPath);
}

function drawAchievementBadge(outputPath, symbol, accent) {
  const png = createCanvas(512, 512);

  fillPolygon(png, hexPoints(256, 256, 212), "#11161B");
  strokePolyline(png, hexPoints(256, 256, 212).concat([hexPoints(256, 256, 212)[0]]), accent, 8);
  fillPolygon(png, hexPoints(256, 256, 164), "#1A1D22");
  strokePolyline(png, hexPoints(256, 256, 164).concat([hexPoints(256, 256, 164)[0]]), "#3C4048", 5);

  drawSymbol(png, symbol, accent);
  writePng(png, outputPath);
}

function drawSymbol(png, symbol, accent) {
  const white = "#F4F4F2";

  if (symbol === "target") {
    strokeCircle(png, 256, 256, 86, accent, 10);
    strokeCircle(png, 256, 256, 46, white, 8);
    fillCircle(png, 256, 256, 13, accent);
    strokeLine(png, [256, 154], [256, 104], white, 8);
    strokeLine(png, [256, 358], [256, 408], white, 8);
    strokeLine(png, [154, 256], [104, 256], white, 8);
    strokeLine(png, [358, 256], [408, 256], white, 8);
    return;
  }

  if (symbol === "check") {
    strokeLine(png, [168, 268], [230, 330], white, 18);
    strokeLine(png, [230, 330], [356, 190], accent, 18);
    return;
  }

  if (symbol === "star") {
    fillPolygon(png, starPoints(256, 252, 110, 46), accent);
    fillPolygon(png, starPoints(256, 252, 64, 28), white);
    return;
  }

  if (symbol === "flame") {
    fillPolygon(
      png,
      [
        [252, 126],
        [326, 232],
        [296, 346],
        [232, 386],
        [174, 330],
        [182, 234],
        [224, 278],
      ],
      accent
    );
    fillPolygon(
      png,
      [
        [256, 224],
        [300, 298],
        [256, 354],
        [218, 312],
      ],
      white
    );
    return;
  }

  if (symbol === "calendar") {
    strokePolyline(png, [[164, 178], [348, 178], [348, 350], [164, 350], [164, 178]], accent, 12);
    strokeLine(png, [164, 226], [348, 226], white, 10);
    strokeLine(png, [208, 142], [208, 198], white, 12);
    strokeLine(png, [304, 142], [304, 198], white, 12);
    strokeLine(png, [212, 292], [246, 326], white, 12);
    strokeLine(png, [246, 326], [314, 260], accent, 12);
    return;
  }

  if (symbol === "bolt") {
    fillPolygon(
      png,
      [
        [286, 122],
        [176, 282],
        [246, 282],
        [218, 390],
        [344, 220],
        [270, 220],
      ],
      accent
    );
    return;
  }

  if (symbol === "mountain") {
    strokePolyline(png, [[136, 350], [224, 210], [286, 298], [326, 242], [390, 350]], accent, 14);
    strokeLine(png, [224, 210], [250, 268], white, 10);
    strokeLine(png, [326, 242], [344, 290], white, 10);
    return;
  }

  if (symbol === "shield") {
    fillPolygon(png, [[256, 126], [354, 166], [334, 314], [256, 386], [178, 314], [158, 166]], "#151A1F");
    strokePolyline(png, [[256, 126], [354, 166], [334, 314], [256, 386], [178, 314], [158, 166], [256, 126]], accent, 12);
    fillPolygon(png, starPoints(256, 260, 64, 28), white);
  }
}

function strokeCircle(png, cx, cy, radius, color, width) {
  for (let angle = 0; angle < Math.PI * 2; angle += 0.0035) {
    fillCircle(png, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, width / 2, color);
  }
}

function drawWolfAsset(outputPath, { background, color, cutoutColor, padding = 110, size = 1024 }) {
  const png = createCanvas(size, size, background);
  drawWolf(png, color, cutoutColor, [padding, padding, size - padding * 2, size - padding * 2]);
  writePng(png, outputPath);
}

function drawLockup(outputPath, variant, stacked = false) {
  const width = stacked ? 1200 : 1600;
  const height = stacked ? 1200 : 520;
  const background = variant === "dark" ? COLORS.dark : COLORS.light;
  const color = variant === "dark" ? COLORS.white : COLORS.black;
  const png = createCanvas(width, height, background);

  if (stacked) {
    drawWolf(png, color, background, [430, 120, 340, 340]);
    drawWordmark(png, "MOMENTUM", 600, 620, 34, color, true);
    drawWordmark(png, "SMALL HABITS. BIG MOMENTUM.", 600, 730, 16, color, true);
  } else {
    drawWolf(png, color, background, [120, 90, 340, 340]);
    drawWordmark(png, "MOMENTUM", 560, 220, 38, color, false);
    drawWordmark(png, "SMALL HABITS. BIG MOMENTUM.", 566, 316, 16, color, false);
  }

  writePng(png, outputPath);
}

function drawWordmark(png, text, x, y, size, color, center) {
  const glyphWidth = size * 0.7;
  const gap = size * 0.34;
  const totalWidth = text.length * glyphWidth + (text.length - 1) * gap;
  let cursor = center ? x - totalWidth / 2 : x;

  for (const character of text) {
    if (character === " ") {
      cursor += glyphWidth;
    } else if (character === ".") {
      fillCircle(png, cursor + glyphWidth / 2, y + size, size * 0.07, color);
    } else {
      drawGlyphBlock(png, character, cursor, y, size, color);
    }

    cursor += glyphWidth + gap;
  }
}

function drawGlyphBlock(png, character, x, y, size, color) {
  const width = size * 0.52;
  const height = size;
  const thick = Math.max(3, size * 0.11);

  if (character === "I") {
    strokeLine(png, [x + width / 2, y], [x + width / 2, y + height], color, thick);
    return;
  }

  if (character === "A") {
    strokeLine(png, [x, y + height], [x + width / 2, y], color, thick);
    strokeLine(png, [x + width, y + height], [x + width / 2, y], color, thick);
    strokeLine(png, [x + width * 0.26, y + height * 0.58], [x + width * 0.74, y + height * 0.58], color, thick);
    return;
  }

  if (character === "M") {
    strokePolyline(png, [[x, y + height], [x, y], [x + width / 2, y + height * 0.46], [x + width, y], [x + width, y + height]], color, thick);
    return;
  }

  if (character === "N") {
    strokePolyline(png, [[x, y + height], [x, y], [x + width, y + height], [x + width, y]], color, thick);
    return;
  }

  if (character === "T") {
    strokeLine(png, [x, y], [x + width, y], color, thick);
    strokeLine(png, [x + width / 2, y], [x + width / 2, y + height], color, thick);
    return;
  }

  if (character === "U") {
    strokePolyline(png, [[x, y], [x, y + height * 0.78], [x + width / 2, y + height], [x + width, y + height * 0.78], [x + width, y]], color, thick);
    return;
  }

  if (character === "H") {
    strokeLine(png, [x, y], [x, y + height], color, thick);
    strokeLine(png, [x + width, y], [x + width, y + height], color, thick);
    strokeLine(png, [x, y + height / 2], [x + width, y + height / 2], color, thick);
    return;
  }

  if (character === "L") {
    strokePolyline(png, [[x, y], [x, y + height], [x + width, y + height]], color, thick);
    return;
  }

  if (character === "B") {
    strokePolyline(png, [[x, y + height], [x, y], [x + width * 0.8, y + height * 0.18], [x + width * 0.48, y + height * 0.5], [x + width * 0.86, y + height * 0.82], [x, y + height]], color, thick);
    return;
  }

  if (character === "G") {
    strokePolyline(png, [[x + width, y + height * 0.22], [x + width * 0.7, y], [x, y + height * 0.22], [x, y + height * 0.82], [x + width * 0.74, y + height], [x + width, y + height * 0.7], [x + width * 0.58, y + height * 0.7]], color, thick);
    return;
  }

  strokePolyline(png, [[x + width / 2, y], [x + width, y + height / 2], [x + width / 2, y + height], [x, y + height / 2], [x + width / 2, y]], color, thick);
}

function main() {
  drawWolfAsset(path.join(ROOT, "assets/branding/app-icon-dark.png"), {
    background: COLORS.dark,
    color: COLORS.white,
    cutoutColor: COLORS.dark,
    padding: 122,
  });
  drawWolfAsset(path.join(ROOT, "assets/branding/app-icon-light.png"), {
    background: COLORS.light,
    color: COLORS.black,
    cutoutColor: COLORS.light,
    padding: 122,
  });
  drawWolfAsset(path.join(ROOT, "assets/branding/wolf-white.png"), {
    background: COLORS.dark,
    color: COLORS.white,
    cutoutColor: COLORS.dark,
    padding: 100,
  });
  drawWolfAsset(path.join(ROOT, "assets/branding/wolf-black.png"), {
    background: COLORS.light,
    color: COLORS.black,
    cutoutColor: COLORS.light,
    padding: 100,
  });
  drawWolfAsset(path.join(ROOT, "assets/branding/wolf-white-transparent.png"), {
    background: COLORS.transparent,
    color: COLORS.white,
    cutoutColor: COLORS.transparent,
    padding: 92,
  });
  drawWolfAsset(path.join(ROOT, "assets/branding/wolf-black-transparent.png"), {
    background: COLORS.transparent,
    color: COLORS.black,
    cutoutColor: COLORS.transparent,
    padding: 92,
  });
  drawWolfAsset(path.join(ROOT, "assets/branding/adaptive-foreground.png"), {
    background: COLORS.transparent,
    color: COLORS.white,
    cutoutColor: COLORS.transparent,
    padding: 140,
  });
  drawWolfAsset(path.join(ROOT, "assets/branding/splash-logo.png"), {
    background: COLORS.transparent,
    color: COLORS.white,
    cutoutColor: COLORS.transparent,
    padding: 132,
  });

  drawLockup(path.join(ROOT, "assets/branding/lockups/horizontal-dark.png"), "dark", false);
  drawLockup(path.join(ROOT, "assets/branding/lockups/horizontal-light.png"), "light", false);
  drawLockup(path.join(ROOT, "assets/branding/lockups/stacked-dark.png"), "dark", true);
  drawLockup(path.join(ROOT, "assets/branding/lockups/stacked-light.png"), "light", true);

  Object.entries(rankPalettes).forEach(([rank, palette]) => {
    drawRankBadge(path.join(ROOT, `assets/ranks/${rank}.png`), palette);
  });
  drawRankBadge(path.join(ROOT, "assets/ranks/locked.png"), {
    dark: "#252A31",
    fill: "#3C4048",
    light: "#64748B",
  });

  achievementDefinitions.forEach(([id, symbol, accent]) => {
    drawAchievementBadge(path.join(ROOT, `assets/achievements/${id}.png`), symbol, accent);
  });
}

main();
