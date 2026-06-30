export const SKINS = [
  { id: "estandar", name: "Estándar", rarity: "común", body: "#5a6340", accent: "#3f4630" },
  { id: "desertico", name: "Desértico", rarity: "común", body: "#b9a06b", accent: "#8c7748" },
  { id: "urbano", name: "Urbano", rarity: "común", body: "#6e7378", accent: "#4c5054" },
  { id: "nieve", name: "Nieve", rarity: "raro", body: "#dfe4ea", accent: "#aab2bd" },
  { id: "selva", name: "Selva", rarity: "raro", body: "#2f4a2a", accent: "#1d3019" },
  { id: "acero", name: "Acero", rarity: "épico", body: "#5b6675", accent: "#2f3742" },
  { id: "oro", name: "Oro", rarity: "épico", body: "#d4af37", accent: "#8a6f1e" },
  { id: "chroma", name: "Chroma", rarity: "legendario", body: "#ff00aa", accent: "#00e5ff", chroma: true },
];

export const DEATH_ANIMS = [
  { id: "explosion", name: "Explosión", col: "#EF9F27" },
  { id: "sangre", name: "Salpicadura", col: "#c0392b" },
  { id: "humo", name: "Humo", col: "#9aa0a6" },
  { id: "pixeles", name: "Pixeles", col: "#7F77DD" },
];

export const RARITY_COLOR = { "común": "#8fa0c8", "raro": "#378ADD", "épico": "#7F77DD", "legendario": "#FAC775" };

const byId = {};
SKINS.forEach((s) => (byId[s.id] = s));
export function getSkin(id) { return byId[id] || SKINS[0]; }
export function randomBotSkin() { return SKINS[Math.floor(Math.random() * 5)].id; }
const dById = {};
DEATH_ANIMS.forEach((d) => (dById[d.id] = d));
export function getDeath(id) { return dById[id] || DEATH_ANIMS[0]; }

function chromaCol(off, t) { return "hsl(" + Math.floor((t * 80 + off) % 360) + ",85%,55%)"; }

export function drawSoldier(ctx, x, y, r, skin, aim, t) {
  const body = skin.chroma ? chromaCol(0, t) : skin.body;
  const acc = skin.chroma ? chromaCol(60, t) : skin.accent;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(aim);
  ctx.fillStyle = acc;
  ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.72, r * 1.05, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = "#1b1b1b";
  ctx.fillRect(r * 0.3, -r * 0.13, r * 1.45, r * 0.26);
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.32, r * 0.22, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.55, r * 0.32, r * 0.22, 0, 6.283); ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(-r * 0.12, 0, r * 0.85, r * 0.8, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = acc;
  ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.55, 0, 6.283); ctx.fill();
  ctx.fillStyle = skin.chroma ? chromaCol(120, t) : body;
  ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.4, 0, 6.283); ctx.fill();
  ctx.restore();
}

export function drawSoldierPreview(canvas, skinId) {
  const c = canvas.getContext("2d"), s = canvas.width;
  c.clearRect(0, 0, s, s);
  drawSoldier(c, s / 2, s / 2, s / 2 - 8, getSkin(skinId), -Math.PI / 2, performance.now() / 1000);
}

export function drawDeathPreview(canvas, deathId) {
  const c = canvas.getContext("2d"), s = canvas.width, d = getDeath(deathId);
  c.clearRect(0, 0, s, s);
  c.fillStyle = d.col;
  if (deathId === "pixeles") { for (let i = 0; i < 9; i++) c.fillRect(s / 2 - 18 + (i % 3) * 14, s / 2 - 18 + Math.floor(i / 3) * 14, 9, 9); }
  else if (deathId === "humo") { c.globalAlpha = 0.6; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(s / 2 + (i - 1.5) * 8, s / 2, 9, 0, 6.283); c.fill(); } c.globalAlpha = 1; }
  else { for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; c.beginPath(); c.arc(s / 2 + Math.cos(a) * 16, s / 2 + Math.sin(a) * 16, 4, 0, 6.283); c.fill(); } }
}
