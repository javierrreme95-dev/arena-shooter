export const SKINS = [
  { id: "recluta", name: "Recluta", rarity: "común", body: "#6b7a99", accent: "#aab6cf", deco: "none" },
  { id: "azul", name: "Cadete Azul", rarity: "común", body: "#378ADD", accent: "#9fd0ff", deco: "visor" },
  { id: "verde", name: "Comando Verde", rarity: "común", body: "#639922", accent: "#C0DD97", deco: "visor" },
  { id: "naranja", name: "Pyro Naranja", rarity: "raro", body: "#EF9F27", accent: "#FAC775", deco: "ring" },
  { id: "morado", name: "Sombra Morada", rarity: "raro", body: "#7F77DD", accent: "#CECBF6", deco: "star" },
  { id: "cian", name: "Neón Cian", rarity: "épico", body: "#1D9E75", accent: "#5DCAA5", deco: "neon" },
  { id: "dorado", name: "Rey Dorado", rarity: "épico", body: "#E0A52B", accent: "#FFE08A", deco: "crown" },
  { id: "calavera", name: "Calavera", rarity: "legendario", body: "#d6d6cf", accent: "#2c2c2a", deco: "skull" },
];

export const RARITY_COLOR = {
  "común": "#8fa0c8",
  "raro": "#378ADD",
  "épico": "#7F77DD",
  "legendario": "#FAC775",
};

const byId = {};
SKINS.forEach((s) => (byId[s.id] = s));
export function getSkin(id) { return byId[id] || SKINS[0]; }
export function randomBotSkin() { return SKINS[Math.floor(Math.random() * SKINS.length)].id; }

export function drawSkin(ctx, x, y, r, skin) {
  ctx.fillStyle = skin.body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 6.283);
  ctx.fill();
  ctx.fillStyle = skin.accent;
  ctx.strokeStyle = skin.accent;
  ctx.lineWidth = 2;
  if (skin.deco === "ring") {
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, 6.283); ctx.stroke();
  } else if (skin.deco === "star") {
    star(ctx, x, y, r * 0.5);
  } else if (skin.deco === "visor") {
    ctx.beginPath(); ctx.arc(x, y, r * 0.6, -0.9, 0.9); ctx.lineWidth = 3; ctx.stroke();
  } else if (skin.deco === "neon") {
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r - 1, 0, 6.283); ctx.stroke();
    ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
  } else if (skin.deco === "crown") {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y - r * 0.5);
    ctx.lineTo(x - r * 0.25, y - r * 0.9); ctx.lineTo(x, y - r * 0.5);
    ctx.lineTo(x + r * 0.25, y - r * 0.9); ctx.lineTo(x + r * 0.5, y - r * 0.5);
    ctx.closePath(); ctx.fill();
  } else if (skin.deco === "skull") {
    ctx.fillStyle = skin.accent;
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.15, r * 0.18, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.18, 0, 6.283); ctx.fill();
    ctx.fillRect(x - r * 0.3, y + r * 0.3, r * 0.6, r * 0.15);
  }
}

function star(ctx, cx, cy, R) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a2) * R * 0.45, cy + Math.sin(a2) * R * 0.45);
  }
  ctx.closePath();
  ctx.fill();
}
