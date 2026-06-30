import { getSprite } from "./sprites.js";

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

function drawImgRot(ctx, img, x, y, r, aim) {
  const s = r * 3, iw = img.naturalWidth, ih = img.naturalHeight, sc = s / Math.max(iw, ih);
  const w = iw * sc, h = ih * sc;
  ctx.save(); ctx.translate(x, y); ctx.rotate(aim + Math.PI / 2);
  ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
}

export function drawSoldier(ctx, x, y, r, skin, aim, t) {
  const img = getSprite("/sprites/soldado_" + skin.id + ".png");
  if (img) { drawImgRot(ctx, img, x, y, r, aim); return; }
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

export const ZOMBIE_SKINS = [
  { id: "clasico", name: "Clásico", shirt: "#8a8f87", flesh: "#7d9b5e", hair: "#262420" },
  { id: "putrefaccion", name: "Putrefacción", shirt: "#9a9b7a", flesh: "#9aa86a", hair: "#33301f", blood: true },
  { id: "sangriento", name: "Sangriento", shirt: "#8a8f87", flesh: "#7d9b5e", hair: "#262420", blood: true, gore: true },
  { id: "huesudo", name: "Huesudo", shirt: "#7d8278", flesh: "#cfc9ad", bone: true },
  { id: "rapido", name: "Rápido", shirt: "#6f7a66", flesh: "#5f7d4a", hair: "#161616" },
];
const zById = {};
ZOMBIE_SKINS.forEach((z) => (zById[z.id] = z));
export function getZombie(id) { return zById[id] || ZOMBIE_SKINS[0]; }
export function randomZombie() { return ZOMBIE_SKINS[Math.floor(Math.random() * ZOMBIE_SKINS.length)].id; }

export function drawZombie(ctx, x, y, r, z, aim, t) {
  const img = getSprite("/sprites/zombie_" + z.id + ".png");
  if (img) { drawImgRot(ctx, img, x, y, r, aim); return; }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(aim);
  ctx.strokeStyle = z.flesh;
  ctx.lineWidth = r * 0.34;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, -r * 0.35); ctx.lineTo(r * 1.05, -r * 0.55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, r * 0.35); ctx.lineTo(r * 1.05, r * 0.55); ctx.stroke();
  ctx.fillStyle = z.flesh;
  ctx.beginPath(); ctx.arc(r * 1.05, -r * 0.55, r * 0.18, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 1.05, r * 0.55, r * 0.18, 0, 6.283); ctx.fill();
  ctx.fillStyle = z.shirt;
  ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.72, r * 0.72, 0, 0, 6.283); ctx.fill();
  if (z.blood) { ctx.fillStyle = z.gore ? "#a01818" : "#7a2a1a"; for (let i = 0; i < 4; i++) { const a = i * 1.7; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.4 - r * 0.1, Math.sin(a) * r * 0.4, r * 0.12, 0, 6.283); ctx.fill(); } }
  if (z.bone) {
    ctx.fillStyle = z.flesh; ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.55, 0, 6.283); ctx.fill();
    ctx.fillStyle = "#2a261f"; ctx.beginPath(); ctx.arc(r * 0.15, -r * 0.2, r * 0.12, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.arc(r * 0.15, r * 0.2, r * 0.12, 0, 6.283); ctx.fill();
  } else {
    ctx.fillStyle = z.flesh; ctx.beginPath(); ctx.arc(-r * 0.05, 0, r * 0.55, 0, 6.283); ctx.fill();
    ctx.fillStyle = z.hair; ctx.beginPath(); ctx.arc(-r * 0.18, 0, r * 0.42, -1.4, 1.4); ctx.fill();
  }
  ctx.restore();
}

export function drawZombiePreview(canvas, id) {
  const c = canvas.getContext("2d"), s = canvas.width;
  c.clearRect(0, 0, s, s);
  drawZombie(c, s / 2, s / 2, s / 2 - 8, getZombie(id), -Math.PI / 2, performance.now() / 1000);
}
