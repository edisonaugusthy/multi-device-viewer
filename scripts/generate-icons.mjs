import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";

const sizes = [16, 32, 48, 128];
const canvasSize = 1024;
const outDir = join(process.cwd(), "public", "icons");
const sourceDir = join(process.cwd(), "store-assets", "icon-source");
const source = join(sourceDir, "multi-device-dashboard-icon-source.png");
const resizedSource = join(sourceDir, "multi-device-dashboard-icon-128.png");

mkdirSync(outDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });

const png = new PNG({ width: canvasSize, height: canvasSize });

drawTablet({ x: 300, y: 88, width: 650, height: 560, radius: 48 });
drawLaptop({ x: 32, y: 328, width: 500, height: 486, radius: 30 });
drawPhone({ x: 476, y: 426, width: 286, height: 520, radius: 68 });
drawWatch({ x: 716, y: 662, width: 250, height: 250, radius: 70 });

writeFileSync(source, PNG.sync.write(png));

execFileSync("sips", ["-z", "128", "128", source, "--out", resizedSource], {
  stdio: "inherit"
});

for (const size of sizes) {
  execFileSync("sips", ["-z", String(size), String(size), resizedSource, "--out", join(outDir, `icon-${size}.png`)], {
    stdio: "inherit"
  });
}

function drawTablet({ x, y, width, height, radius }) {
  fillRoundedRect(x, y, width, height, radius, "#111827");
  fillRoundedRect(x + 26, y + 34, width - 52, height - 68, radius - 20, "#f8fafc");
  drawHeader(x + 26, y + 34, width - 52, 68, "#e5e7eb");
  drawBars(x + 110, y + 170, 390, 220);
  drawCard(x + 455, y + 180, 118, 150, "#38bdf8");
  drawCard(x + 455, y + 360, 118, 98, "#f97316");
  drawDotRow(x + width - 104, y + 64);
}

function drawLaptop({ x, y, width, height, radius }) {
  fillRoundedRect(x, y, width, height, radius, "#0f172a");
  fillRoundedRect(x + 28, y + 54, width - 56, height - 108, 8, "#ffffff");
  drawHeader(x + 28, y + 54, width - 56, 76, "#e2e8f0");
  drawSearch(x + 62, y + 192, 178, 38);
  drawButton(x + 274, y + 192, 134, 38, "#22c55e");
  drawTableRows(x + 62, y + 270, 320, 220);
  fillRoundedRect(x + 80, y + height - 28, width - 160, 34, 6, "#1f2937");
}

function drawPhone({ x, y, width, height, radius }) {
  fillRoundedRect(x, y, width, height, radius, "#030712");
  fillRoundedRect(x + 20, y + 22, width - 40, height - 44, radius - 24, "#334155");
  drawHeader(x + 20, y + 22, width - 40, 82, "#111827");
  fillRoundedRect(x + 88, y + 28, 112, 24, 14, "#020617");
  drawFolder(x + 70, y + 162, 154, 70);
  drawFolder(x + 70, y + 264, 154, 70);
  drawFolder(x + 70, y + 366, 154, 70);
}

function drawWatch({ x, y, width, height, radius }) {
  fillRoundedRect(x + 72, y - 42, 110, 62, 28, "#111827");
  fillRoundedRect(x + 72, y + height - 20, 110, 62, 28, "#111827");
  fillRoundedRect(x, y, width, height, radius, "#0b1120");
  fillRoundedRect(x + 22, y + 24, width - 44, height - 48, radius - 30, "#111827");
  drawHeader(x + 22, y + 24, width - 44, 58, "#020617");
  fillRoundedRect(x + 58, y + 116, 138, 30, 12, "#334155");
  fillRoundedRect(x + 58, y + 162, 118, 28, 12, "#475569");
  fillRoundedRect(x + 58, y + 204, 150, 28, 12, "#475569");
  fillRoundedRect(x + width - 12, y + 86, 20, 70, 10, "#111827");
}

function drawHeader(x, y, width, height, color) {
  fillRect(x, y, width, height, color);
  fillCircle(x + 42, y + height / 2, 13, "#ef4444");
  fillCircle(x + 78, y + height / 2, 13, "#f59e0b");
  fillCircle(x + 114, y + height / 2, 13, "#22c55e");
}

function drawBars(x, y, width, height) {
  const colors = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];
  for (let i = 0; i < 13; i += 1) {
    const barHeight = 46 + ((i * 37) % 116);
    const barX = x + i * (width / 13);
    fillRect(barX, y + height - barHeight, 18, barHeight, colors[i % colors.length]);
  }

  for (let i = 0; i < 5; i += 1) {
    fillRect(x - 18, y + i * 44, width + 30, 3, "#cbd5e1");
  }
}

function drawCard(x, y, width, height, color) {
  fillRoundedRect(x, y, width, height, 18, "#e2e8f0");
  fillCircle(x + width / 2, y + height / 2, Math.min(width, height) * 0.3, color);
  fillCircle(x + width / 2, y + height / 2, Math.min(width, height) * 0.16, "#f8fafc");
}

function drawSearch(x, y, width, height) {
  fillRoundedRect(x, y, width, height, 8, "#f8fafc");
  strokeRoundedRect(x, y, width, height, 8, "#cbd5e1", 3);
}

function drawButton(x, y, width, height, color) {
  fillRoundedRect(x, y, width, height, 8, color);
}

function drawTableRows(x, y, width, height) {
  for (let row = 0; row < 4; row += 1) {
    const rowY = y + row * (height / 4);
    fillRect(x, rowY, width, 3, "#e5e7eb");
    fillRoundedRect(x + 18, rowY + 24, 116, 28, 14, row % 2 === 0 ? "#7dd3fc" : "#fca5a5");
    fillCircle(x + 178, rowY + 36, 18, "#94a3b8");
    fillCircle(x + 224, rowY + 36, 18, "#64748b");
  }
}

function drawDotRow(x, y) {
  fillCircle(x, y, 6, "#64748b");
  fillCircle(x + 22, y, 6, "#64748b");
  fillCircle(x + 44, y, 6, "#64748b");
}

function drawFolder(x, y, width, height) {
  fillRoundedRect(x, y + 10, width, height - 10, 10, "#38bdf8");
  fillRoundedRect(x + 8, y, 72, 28, 8, "#7dd3fc");
  fillRoundedRect(x + 22, y + 26, width - 44, 12, 6, "#bae6fd");
}

function fillRoundedRect(x, y, width, height, radius, color) {
  for (let py = Math.floor(y); py < Math.ceil(y + height); py += 1) {
    for (let px = Math.floor(x); px < Math.ceil(x + width); px += 1) {
      if (isInsideRoundedRect(px, py, x, y, width, height, radius)) {
        setPixel(px, py, color);
      }
    }
  }
}

function strokeRoundedRect(x, y, width, height, radius, color, thickness) {
  for (let i = 0; i < thickness; i += 1) {
    fillRoundedRect(x + i, y + i, width - i * 2, height - i * 2, radius, color);
  }
  fillRoundedRect(x + thickness, y + thickness, width - thickness * 2, height - thickness * 2, radius - thickness, "#f8fafc");
}

function fillRect(x, y, width, height, color) {
  for (let py = Math.floor(y); py < Math.ceil(y + height); py += 1) {
    for (let px = Math.floor(x); px < Math.ceil(x + width); px += 1) {
      setPixel(px, py, color);
    }
  }
}

function fillCircle(cx, cy, radius, color) {
  const radiusSquared = radius ** 2;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radiusSquared) {
        setPixel(x, y, color);
      }
    }
  }
}

function isInsideRoundedRect(px, py, x, y, width, height, radius) {
  const innerLeft = x + radius;
  const innerRight = x + width - radius;
  const innerTop = y + radius;
  const innerBottom = y + height - radius;

  if (px >= innerLeft && px < innerRight && py >= y && py < y + height) {
    return true;
  }

  if (px >= x && px < x + width && py >= innerTop && py < innerBottom) {
    return true;
  }

  const cornerX = px < innerLeft ? innerLeft : innerRight - 1;
  const cornerY = py < innerTop ? innerTop : innerBottom - 1;

  return (px - cornerX) ** 2 + (py - cornerY) ** 2 <= radius ** 2;
}

function setPixel(x, y, color) {
  if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) {
    return;
  }

  const [red, green, blue, alpha] = hexToRgba(color);
  const index = (Math.round(y) * canvasSize + Math.round(x)) * 4;
  png.data[index] = red;
  png.data[index + 1] = green;
  png.data[index + 2] = blue;
  png.data[index + 3] = alpha;
}

function hexToRgba(hex) {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    255
  ];
}
