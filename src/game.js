import { getSkin, drawSoldier, randomBotSkin, getDeath, getZombie, randomZombie, drawZombie } from "./skins.js";
import * as P from "./progress.js";

let cv, ctx, W, H, cb = {};
let mode = "normal", state = "menu";
let ents = [], bullets = [], nades = [], pups = [], parts = [], rings = [], floats = [], feed = [];
let scoreA = 0, scoreB = 0, cfgKill = 15, timer = 0, hill = null, flag = null, ctfTurns = [], ctfIdx = 0, pupT = 0, hillMove = 0, over = null;
const keys = {}, mouse = { x: 330, y: 230, down: false };
const RESP = 8;
const walls = [
  { x: 300, y: 70, w: 60, h: 90 }, { x: 300, y: 300, w: 60, h: 90 },
  { x: 120, y: 200, w: 90, h: 55 }, { x: 450, y: 200, w: 90, h: 55 },
];
const ALLYC = { azul: "#378ADD", verde: "#5DCAA5" };
const ENEMYC = { rojo: "#E24B4A", negro: "#0e131c" };

const rnd = (a, b) => a + Math.random() * (b - a);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inR = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
const nowS = () => performance.now() / 1000;
function los(a, b) { for (let t = 0; t <= 1; t += 0.06) { const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t; for (const w of walls) if (inR(x, y, w)) return true; } return false; }
function spawn(team) {
  const lft = team === "A" || team === "S" || team === "P";
  let x = lft ? rnd(30, 90) : team === "B" ? rnd(W - 90, W - 30) : rnd(60, W - 60), y = rnd(40, H - 40), n = 0;
  while (n++ < 60) { let ok = true; for (const w of walls) if (inR(x, y, w)) { ok = false; break; } if (ok) break; x = rnd(60, W - 60); y = rnd(40, H - 40); }
  return { x, y };
}
function mkE(team, isP, smul, name) {
  const p = spawn(team);
  return { x: p.x, y: p.y, r: 13, team, isP, name, hp: 100, aim: 0, cd: 0, alive: true, resp: 0, dx: p.x, dy: p.y, kills: 0, points: 0, smul: smul || 1, bf: { fire: 0, sh: 0, bl: 0 }, shp: 0, wp: "gun", gr: 0, carry: false, skin: isP ? P.getEquipped() : randomBotSkin(), zskin: "clasico", mag: 24, reserve: 120, reloading: 0 };
}
function isEnemy(a, b) { if (mode === "koth") return a !== b; return a.team !== b.team; }
function nEnemy(e) { let best = null, bd = 1e9; for (const o of ents) if (o.alive && isEnemy(e, o)) { const d = dist(e, o); if (d < bd) { bd = d; best = o; } } return best; }
function playerEnt() { return ents.find((e) => e.isP); }

export function init(canvas, callbacks) {
  cv = canvas; ctx = cv.getContext("2d"); W = cv.width; H = cv.height; cb = callbacks || {};
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase(); keys[k] = true;
    const me = playerEnt();
    if (me) {
      if (k === "1") me.wp = "gun";
      if (k === "2" && me.gr > 0) me.wp = "nade";
      if (k === P.getSetting("keySwitch")) me.wp = me.wp === "gun" && me.gr > 0 ? "nade" : "gun";
      if (k === P.getSetting("keyReload")) reload(me);
    }
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
  const mp = (ev) => { const rc = cv.getBoundingClientRect(), sx = cv.width / rc.width, sy = cv.height / rc.height; const c = ev.touches ? ev.touches[0] : ev; mouse.x = (c.clientX - rc.left) * sx; mouse.y = (c.clientY - rc.top) * sy; };
  cv.addEventListener("mousemove", mp);
  cv.addEventListener("mousedown", (e) => { cv.focus(); mp(e); mouse.down = true; });
  window.addEventListener("mouseup", () => { mouse.down = false; });
  cv.addEventListener("touchstart", (e) => { mp(e); mouse.down = true; e.preventDefault(); }, { passive: false });
  cv.addEventListener("touchmove", (e) => { mp(e); e.preventDefault(); }, { passive: false });
  cv.addEventListener("touchend", () => { mouse.down = false; });
  requestAnimationFrame(loop);
}

export function start(m, cfg) {
  mode = m; bullets = []; nades = []; pups = []; parts = []; rings = []; floats = []; feed = [];
  over = null; scoreA = 0; scoreB = 0; timer = 0; flag = null; hill = null; pupT = 2; hillMove = 0;
  cfgKill = (cfg && cfg.kill) || 15;
  if (m === "normal") {
    const s = (cfg && cfg.size) || 3;
    ents = [mkE("A", true, 1, "TÚ")];
    for (let i = 1; i < s; i++) ents.push(mkE("A", false, 1, "Aliado " + i));
    for (let j = 0; j < s; j++) ents.push(mkE("B", false, 1, "Rojo " + (j + 1)));
  } else if (m === "ctf") {
    ents = [mkE("A", true, 1, "TÚ")];
    for (let i = 1; i < 3; i++) ents.push(mkE("A", false, 1, "Aliado " + i));
    for (let j = 0; j < 3; j++) ents.push(mkE("B", false, 1, "Rojo " + (j + 1)));
    ctfTurns = ["A", "B", "A", "B", "A", "B"]; ctfIdx = 0; timer = 90; newFlag();
  } else if (m === "koth") {
    ents = [mkE("P", true, 1, "TÚ")];
    for (let i = 0; i < 5; i++) ents.push(mkE("FFA" + i, false, 1, "Bot " + (i + 1)));
    hill = { x: W / 2, y: H / 2, r: 55 }; hillMove = 18;
  } else if (m === "inf") {
    ents = [mkE("Z", false, 1.5, "Infectado")]; ents[0].wp = "none"; ents[0].zskin = "rapido";
    ents.push(mkE("S", true, 1, "TÚ"));
    for (let i = 0; i < 8; i++) ents.push(mkE("S", false, 1, "Humano " + (i + 1)));
    timer = 60;
  }
  state = "play"; cv.focus();
}

function newFlag() { const at = ctfTurns[ctfIdx]; flag = { x: at === "A" ? 20 : W - 20, y: H / 2, carrier: null, att: at }; }
function fcd(e) { return (e.bf.fire > 0 ? 0.09 : 0.18) * (e.isP ? 1 : 3.2); }
function shoot(e, ang) { bullets.push({ x: e.x + Math.cos(ang) * 18, y: e.y + Math.sin(ang) * 18, vx: Math.cos(ang) * 460, vy: Math.sin(ang) * 460, team: e.team, by: e, life: 1.4 }); }
function reload(e) { if (e.reloading > 0 || e.reserve <= 0 || e.mag >= 24) return; e.reloading = 1.3; }
function throwNade(e) { if (e.gr <= 0) return; e.gr--; const ang = e.aim, d = Math.min(220, dist(e, { x: mouse.x, y: mouse.y })); nades.push({ x: e.x, y: e.y, tx: e.x + Math.cos(ang) * d, ty: e.y + Math.sin(ang) * d, t: 0.7, team: e.team }); }
function hurt(e, dmg, by) { if (e.bf.sh > 0 && e.shp > 0) { e.shp -= dmg; if (e.shp < 0) { e.hp += e.shp; e.shp = 0; } } else e.hp -= dmg; if (e.hp <= 0 && e.alive) die(e, by); }

function spawnDeath(e) {
  const id = P.getEquippedDeath(), d = getDeath(id), col = d.col;
  if (id === "pixeles") { for (let i = 0; i < 16; i++) { const a = rnd(0, 6.28), s = rnd(40, 170); parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.5, 0.9), col: "hsl(" + Math.floor(rnd(0, 360)) + ",80%,60%)", sz: 5 }); } }
  else if (id === "humo") { for (let i = 0; i < 4; i++) rings.push({ x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), r: 6, max: 40, life: 0.8, col: "rgba(150,156,166,0.5)", lw: 8 }); for (let i = 0; i < 6; i++) { const a = rnd(0, 6.28); parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, life: 0.9, col: "#9aa0a6", sz: 4 }); } }
  else if (id === "sangre") { for (let i = 0; i < 20; i++) { const a = rnd(0, 6.28), s = rnd(20, 120); parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.6, 1.2), col: col, sz: rnd(3, 6) }); } }
  else { for (let i = 0; i < 16; i++) { const a = rnd(0, 6.28), s = rnd(40, 180); parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.4, 0.8), col, sz: 4 }); } rings.push({ x: e.x, y: e.y, r: 6, max: 38, life: 0.4, col, lw: 3 }); }
}
function die(e, by) {
  e.alive = false; e.carry = false; e.dx = e.x; e.dy = e.y; e.resp = RESP;
  spawnDeath(e);
  if (by) { feed.unshift({ txt: by.name + " ▸ " + e.name, life: 4 }); if (feed.length > 5) feed.pop(); }
  if (by && by.isP) floats.push({ x: e.x, y: e.y, txt: "+50", life: 1, col: "#FAC775" });
  if (mode === "normal") { if (by) { if (by.team === "A") scoreA++; else scoreB++; } if (scoreA >= cfgKill) endGame("Ganó Azul"); if (scoreB >= cfgKill) endGame("Ganó Rojo"); }
  else if (mode === "koth") { if (by) by.kills++; }
  else if (mode === "ctf") { if (flag && flag.carrier === e) { flag.carrier = null; flag.x = flag.att === "A" ? 20 : W - 20; flag.y = H / 2; } }
}
function pickup(e, ty) {
  if (ty === "fire") e.bf.fire = 6;
  else if (ty === "nade") e.gr += 2;
  else if (ty === "shield") { e.bf.sh = 6; e.shp = 60; }
  else if (ty === "revive") { for (const o of ents) if (o.team === e.team && !o.alive) { o.alive = true; o.hp = 100; o.resp = 0; const p = spawn(o.team); o.x = p.x; o.y = p.y; break; } }
  else if (ty === "blind") { for (const o of ents) if (isEnemy(e, o)) o.bf.bl = 5; }
}
function moveC(e, dx, dy) {
  let nx = e.x + dx; if (nx > e.r && nx < W - e.r) { let h = false; for (const r of walls) if (nx + e.r > r.x && nx - e.r < r.x + r.w && e.y + e.r > r.y && e.y - e.r < r.y + r.h) { h = true; break; } if (!h) e.x = nx; }
  let ny = e.y + dy; if (ny > e.r && ny < H - e.r) { let h = false; for (const r of walls) if (e.x + e.r > r.x && e.x - e.r < r.x + r.w && ny + e.r > r.y && ny - e.r < r.y + r.h) { h = true; break; } if (!h) e.y = ny; }
}
function endGame(text) { if (over) return; over = text; const me = playerEnt(); let won; if (mode === "koth") won = text.indexOf("Ganaste") >= 0; else if (mode === "inf") won = me.team === "S" ? text.indexOf("Sobrevivieron") >= 0 : text.indexOf("infectados") >= 0; else won = text.indexOf("Azul") >= 0; if (won) cb.win && cb.win(); else cb.match && cb.match(); }
function nextTurn() { ctfIdx++; if (ctfIdx >= ctfTurns.length) { endGame(scoreA > scoreB ? "Ganó Azul (bandera)" : scoreB > scoreA ? "Ganó Rojo (bandera)" : "Empate"); return; } timer = 90; newFlag(); }
function ctfBot(e, dt) {
  const sp = 150 * e.smul, att = flag && flag.att === e.team, tg = nEnemy(e);
  if (att) {
    let aim;
    if (flag.carrier === e) { const tx = e.team === "A" ? W - 20 : 20; aim = Math.atan2(H / 2 - e.y, tx - e.x); }
    else if (!flag.carrier) aim = Math.atan2(flag.y - e.y, flag.x - e.x);
    else aim = tg ? Math.atan2(tg.y - e.y, tg.x - e.x) : 0;
    moveC(e, Math.cos(aim) * sp * 0.8 * dt, Math.sin(aim) * sp * 0.8 * dt);
    if (tg) { e.aim = Math.atan2(tg.y - e.y, tg.x - e.x); if (dist(e, tg) < 320 && !los(e, tg) && e.cd <= 0) { shoot(e, e.aim); e.cd = fcd(e); } }
  } else if (tg) {
    const d = dist(e, tg), a = Math.atan2(tg.y - e.y, tg.x - e.x); e.aim = a;
    moveC(e, (d > 220 ? Math.cos(a) : -Math.cos(a) * 0.4) * sp * 0.7 * dt, (d > 220 ? Math.sin(a) : -Math.sin(a) * 0.4) * sp * 0.7 * dt);
    if (d < 340 && !los(e, tg) && e.cd <= 0) { shoot(e, a + rnd(-0.1, 0.1)); e.cd = fcd(e); }
  }
}

function update(dt) {
  for (const f of parts) { f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; f.vx *= 0.96; f.vy *= 0.96; }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
  for (const rg of rings) { rg.r += (rg.max - rg.r) * dt * 7; rg.life -= dt; }
  for (let i = rings.length - 1; i >= 0; i--) if (rings[i].life <= 0) rings.splice(i, 1);
  for (const ft of floats) { ft.y -= 28 * dt; ft.life -= dt; }
  for (let i = floats.length - 1; i >= 0; i--) if (floats[i].life <= 0) floats.splice(i, 1);
  for (const fe of feed) fe.life -= dt;
  for (let i = feed.length - 1; i >= 0; i--) if (feed[i].life <= 0) feed.splice(i, 1);

  if (state !== "play" || over) return;

  if (mode === "koth") { hillMove -= dt; if (hillMove <= 0) { hillMove = 18; hill.x = rnd(120, W - 120); hill.y = rnd(90, H - 90); } }
  if (mode === "ctf" || mode === "inf") { timer -= dt; if (timer <= 0) { if (mode === "ctf") nextTurn(); else { const sv = ents.filter((o) => o.team === "S").length; endGame(sv > 0 ? "Sobrevivieron los humanos" : "Ganaron los infectados"); } } }
  if (mode === "normal") { pupT -= dt; if (pupT <= 0 && pups.length < 4) { pupT = 5; const ty = ["fire", "nade", "shield", "revive", "blind"][Math.floor(rnd(0, 5))]; const p = spawn("mid"); pups.push({ x: p.x, y: p.y, ty }); } }

  for (const e of ents) {
    if (!e.alive) { e.resp -= dt; if (e.resp <= 0) { e.alive = true; e.hp = 100; e.mag = 24; e.reloading = 0; const p = spawn(e.team); e.x = p.x; e.y = p.y; } continue; }
    for (const k in e.bf) if (e.bf[k] > 0) e.bf[k] -= dt;
    if (e.reloading > 0) { e.reloading -= dt; if (e.reloading <= 0) { const need = 24 - e.mag, take = Math.min(need, e.reserve); e.mag += take; e.reserve -= take; } }
    const sp = 150 * e.smul;
    if (e.isP) {
      let dx = 0, dy = 0;
      if (keys.w || keys.arrowup) dy--; if (keys.s || keys.arrowdown) dy++; if (keys.a || keys.arrowleft) dx--; if (keys.d || keys.arrowright) dx++;
      const m = Math.hypot(dx, dy) || 1; moveC(e, (dx / m) * sp * dt, (dy / m) * sp * dt);
      e.aim = Math.atan2(mouse.y - e.y, mouse.x - e.x); e.cd -= dt;
      if (mouse.down && e.cd <= 0 && e.wp !== "none") {
        if (e.wp === "nade") { throwNade(e); e.cd = 0.5; if (e.gr === 0) e.wp = "gun"; }
        else if (e.reloading <= 0) { if (e.mag > 0) { shoot(e, e.aim); e.mag--; e.cd = fcd(e); if (e.mag === 0) reload(e); } else reload(e); }
      }
    } else {
      e.cd -= dt; const tg = nEnemy(e);
      if (mode === "inf" && e.team === "Z") { if (tg) { const a = Math.atan2(tg.y - e.y, tg.x - e.x); e.aim = a; moveC(e, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt); } }
      else if (mode === "ctf") ctfBot(e, dt);
      else if (tg) {
        const d = dist(e, tg), a = Math.atan2(tg.y - e.y, tg.x - e.x); e.aim = a;
        let mx, my; if (d > 240) { mx = Math.cos(a); my = Math.sin(a); } else if (d < 150) { mx = -Math.cos(a); my = -Math.sin(a); } else { mx = Math.cos(a + 1.57) * 0.7; my = Math.sin(a + 1.57) * 0.7; }
        moveC(e, mx * sp * 0.8 * dt, my * sp * 0.8 * dt);
        const rng = e.bf.bl > 0 ? 160 : 360;
        if (e.wp !== "none" && d < rng && !los(e, tg) && e.cd <= 0) { shoot(e, a + rnd(-0.1, 0.1)); e.cd = fcd(e); }
      }
    }
    if (mode === "inf" && e.team === "Z") for (const o of ents) if (o.team === "S" && o.alive && dist(e, o) < e.r + o.r + 2) { o.team = "Z"; o.smul = 1.5; o.wp = "none"; o.zskin = randomZombie(); }
    if (mode === "koth" && hill) { const inside = ents.filter((o) => o.alive && dist(o, hill) < hill.r); if (inside.length === 1) inside[0].points += dt; }
    if (mode === "ctf" && flag) {
      if (!flag.carrier && e.team === flag.att && dist(e, flag) < e.r + 8) { flag.carrier = e; e.carry = true; }
      if (flag.carrier === e) { flag.x = e.x; flag.y = e.y; const tgt = flag.att === "A" ? W - 20 : 20; if (Math.abs(e.x - tgt) < 30) { if (flag.att === "A") scoreA++; else scoreB++; nextTurn(); } }
    }
  }
  if (mode === "koth") for (const e of ents) if (e.points >= 50) endGame((e.isP ? "¡Ganaste!" : "Ganó un bot") + " (Rey de la colina)");
  if (mode === "inf" && ents.filter((o) => o.team === "S").length === 0) endGame("Ganaron los infectados");

  for (let b = bullets.length - 1; b >= 0; b--) {
    const bl = bullets[b]; bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.life -= dt;
    let dead = bl.life <= 0 || bl.x < 0 || bl.x > W || bl.y < 0 || bl.y > H;
    if (!dead) for (const w of walls) if (inR(bl.x, bl.y, w)) { dead = true; break; }
    if (!dead) for (const e2 of ents) if (e2.alive && e2 !== bl.by && isEnemy(bl.by, e2) && dist(e2, bl) < e2.r) { hurt(e2, 22, bl.by); dead = true; break; }
    if (dead) bullets.splice(b, 1);
  }
  for (let n = nades.length - 1; n >= 0; n--) {
    const nd = nades[n]; nd.t -= dt; nd.x += (nd.tx - nd.x) * Math.min(1, dt * 4); nd.y += (nd.ty - nd.y) * Math.min(1, dt * 4);
    if (nd.t <= 0) { rings.push({ x: nd.x, y: nd.y, r: 8, max: 60, life: 0.35, col: "#FAC775", lw: 4 }); for (const e3 of ents) if (e3.alive && e3.team !== nd.team && dist(e3, nd) < 60) hurt(e3, 55, null); nades.splice(n, 1); }
  }
  for (let p = pups.length - 1; p >= 0; p--) for (const e4 of ents) if (e4.alive && dist(e4, pups[p]) < e4.r + 8) { pickup(e4, pups[p].ty); pups.splice(p, 1); break; }
}

function allyOfPlayer(o) { const me = playerEnt(); if (!me) return true; if (mode === "koth") return o === me; return o.team === me.team; }
function barCol(o) { return allyOfPlayer(o) ? ALLYC[P.getSetting("ally")] || ALLYC.azul : ENEMYC[P.getSetting("enemy")] || ENEMYC.rojo; }

const PUPC = { fire: "#EF9F27", nade: "#5DCAA5", shield: "#85B7EB", revive: "#ED93B1", blind: "#7F77DD" };
function drawPup(x, y, ty) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.283); ctx.fill();
  ctx.fillStyle = PUPC[ty]; ctx.strokeStyle = PUPC[ty]; ctx.lineWidth = 2;
  if (ty === "fire") { ctx.beginPath(); ctx.moveTo(2, -7); ctx.lineTo(-4, 1); ctx.lineTo(0, 1); ctx.lineTo(-2, 7); ctx.lineTo(4, -1); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill(); }
  else if (ty === "nade") { ctx.beginPath(); ctx.arc(0, 1, 5, 0, 6.283); ctx.fill(); ctx.fillRect(-2, -7, 4, 3); }
  else if (ty === "shield") { ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(6, -4); ctx.lineTo(6, 2); ctx.lineTo(0, 7); ctx.lineTo(-6, 2); ctx.lineTo(-6, -4); ctx.closePath(); ctx.fill(); }
  else if (ty === "revive") { ctx.fillRect(-2, -6, 4, 12); ctx.fillRect(-6, -2, 12, 4); }
  else if (ty === "blind") { ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, 0, 0, 6.283); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 2, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(7, 5); ctx.stroke(); }
  ctx.restore();
}

function drawFlag(x, y, col) {
  ctx.strokeStyle = "#3a3327"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y - 20); ctx.stroke();
  ctx.fillStyle = "#cfd3d8"; ctx.beginPath(); ctx.arc(x, y - 21, 2.5, 0, 6.283); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 19); ctx.quadraticCurveTo(x + 11, y - 16, x + 20, y - 18); ctx.lineTo(x + 20, y - 6); ctx.quadraticCurveTo(x + 11, y - 4, x + 1, y - 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "700 9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("★", x + 10, y - 9);
}

function draw() {
  const t = nowS();
  ctx.clearRect(0, 0, W, H);
  if (state === "menu") {
    ctx.fillStyle = "#cdd6ee"; ctx.textAlign = "center"; ctx.font = "600 22px sans-serif";
    ctx.fillText("Elige un modo arriba para jugar", W / 2, H / 2 - 6);
    ctx.font = "14px sans-serif"; ctx.fillStyle = "#8fa0c8";
    ctx.fillText("Tus skins se ven en la partida · gana XP para tu pase", W / 2, H / 2 + 20);
    return;
  }
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let gx = 0; gx < W; gx += 44) ctx.fillRect(gx, 0, 1, H);
  for (let gy = 0; gy < H; gy += 44) ctx.fillRect(0, gy, W, 1);
  if (mode === "ctf") { ctx.fillStyle = "rgba(55,138,221,0.18)"; ctx.fillRect(0, H / 2 - 55, 42, 110); ctx.fillStyle = "rgba(226,75,74,0.18)"; ctx.fillRect(W - 42, H / 2 - 55, 42, 110); }
  if (mode === "koth" && hill) { const ins = ents.filter((o) => o.alive && dist(o, hill) < hill.r); ctx.fillStyle = ins.length === 1 ? "rgba(93,202,165,0.22)" : "rgba(239,159,39,0.18)"; ctx.beginPath(); ctx.arc(hill.x, hill.y, hill.r, 0, 6.283); ctx.fill(); ctx.strokeStyle = ins.length === 1 ? "#5DCAA5" : "#EF9F27"; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = "#2c3b63"; for (const r of walls) ctx.fillRect(r.x, r.y, r.w, r.h);
  for (const pu of pups) drawPup(pu.x, pu.y, pu.ty);
  for (const nd of nades) { ctx.fillStyle = "#cfcfc6"; ctx.beginPath(); ctx.arc(nd.x, nd.y, 5, 0, 6.283); ctx.fill(); }
  for (const bl of bullets) { ctx.fillStyle = "#ffe8a0"; ctx.beginPath(); ctx.arc(bl.x, bl.y, 3, 0, 6.283); ctx.fill(); }
  if (mode === "ctf" && flag && !flag.carrier) drawFlag(flag.x, flag.y, flag.att === "A" ? "#378ADD" : "#E24B4A");

  for (const o of ents) {
    if (!o.alive) {
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.arc(o.dx, o.dy, 13, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#cdd6ee"; ctx.font = "700 14px sans-serif"; ctx.textAlign = "center"; ctx.fillText(Math.ceil(o.resp), o.dx, o.dy + 5);
      continue;
    }
    if (mode === "inf" && o.team === "Z") drawZombie(ctx, o.x, o.y, o.r, getZombie(o.zskin), o.aim, t);
    else drawSoldier(ctx, o.x, o.y, o.r, getSkin(o.skin), o.aim, t);
    if (o.carry) drawFlag(o.x, o.y - o.r - 4, o.team === "A" ? "#378ADD" : "#E24B4A");
    if (o.isP) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 3, 0, 6.283); ctx.stroke(); }
    if (o.bf.sh > 0 && o.shp > 0) { ctx.strokeStyle = "#85B7EB"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 6, 0, 6.283); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fillRect(o.x - 15, o.y - o.r - 9, 30, 5);
    ctx.fillStyle = barCol(o); ctx.fillRect(o.x - 15, o.y - o.r - 9, (30 * Math.max(0, o.hp)) / 100, 5);
    if (mode === "koth") { ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif"; ctx.textAlign = "center"; ctx.fillText(Math.floor(o.points), o.x, o.y - o.r - 13); }
  }

  for (const rg of rings) { ctx.globalAlpha = Math.max(0, rg.life * 2); ctx.strokeStyle = rg.col; ctx.lineWidth = rg.lw || 3; ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
  for (const f of parts) { ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.col; const s = f.sz || 4; ctx.fillRect(f.x - s / 2, f.y - s / 2, s, s); ctx.globalAlpha = 1; }
  for (const ft of floats) { ctx.globalAlpha = Math.max(0, ft.life); ctx.fillStyle = ft.col; ctx.font = "700 16px sans-serif"; ctx.textAlign = "center"; ctx.fillText(ft.txt, ft.x, ft.y); ctx.globalAlpha = 1; }

  ctx.textAlign = "right"; ctx.font = "12px sans-serif";
  for (let i = 0; i < feed.length; i++) { ctx.globalAlpha = Math.min(1, feed[i].life); ctx.fillStyle = "#dbe3f5"; ctx.fillText(feed[i].txt, W - 8, 16 + i * 16); ctx.globalAlpha = 1; }

  const me = playerEnt();
  if (me && me.alive) {
    ctx.textAlign = "left"; ctx.font = "700 13px sans-serif";
    ctx.fillStyle = me.wp === "gun" ? "#ffe8a0" : "#cfcfc6";
    ctx.fillText("Balas " + (me.reloading > 0 ? "recargando…" : me.mag + " / " + me.reserve), 10, H - 24);
    ctx.fillStyle = me.wp === "nade" ? "#5DCAA5" : "#9fb0d6";
    ctx.fillText("Granadas " + me.gr + (me.wp === "nade" ? "  (activo)" : ""), 10, H - 8);
  }
  if (me && me.alive && me.bf.bl > 0) { const g = ctx.createRadialGradient(me.x, me.y, 40, me.x, me.y, 260); g.addColorStop(0, "rgba(10,12,24,0)"); g.addColorStop(1, "rgba(8,10,20,0.92)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  if (me && !me.alive && state === "play" && !over) { ctx.fillStyle = "rgba(10,14,28,0.55)"; ctx.fillRect(0, H / 2 - 34, W, 68); ctx.fillStyle = "#fff"; ctx.font = "600 22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Reapareces en " + Math.ceil(me.resp) + "…", W / 2, H / 2 + 7); }

  if (over) { ctx.fillStyle = "rgba(10,14,28,0.8)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "600 28px sans-serif"; ctx.textAlign = "center"; ctx.fillText(over, W / 2, H / 2); ctx.fillStyle = "#cdd6ee"; ctx.font = "14px sans-serif"; ctx.fillText("Elige un modo arriba para jugar otra vez", W / 2, H / 2 + 28); }
  hud();
}

function hud() {
  const hl = document.getElementById("hl"), hr = document.getElementById("hr");
  if (!hl) return;
  if (state === "menu") { hl.textContent = ""; hr.textContent = ""; return; }
  if (mode === "normal") { hl.innerHTML = '<b style="color:#378ADD">Azul</b> ' + scoreA + " — " + scoreB + ' <b style="color:#E24B4A">Rojo</b> · meta ' + cfgKill; hr.textContent = "Munición limitada · recarga con R"; }
  else if (mode === "ctf") { hl.innerHTML = '<b style="color:#378ADD">Azul</b> ' + scoreA + " — " + scoreB + ' <b style="color:#E24B4A">Rojo</b>'; hr.textContent = "Ataca " + (ctfTurns[ctfIdx] === "A" ? "Azul" : "Rojo") + " · " + Math.ceil(timer) + "s (" + (ctfIdx + 1) + "/6)"; }
  else if (mode === "koth") { const top = ents.slice().sort((a, b) => b.points - a.points)[0]; hl.textContent = "Rey de la colina · meta 50"; hr.textContent = "Líder: " + (top.isP ? "TÚ" : "bot") + " " + Math.floor(top.points); }
  else if (mode === "inf") { hl.textContent = "Infección · humanos vivos: " + ents.filter((o) => o.team === "S").length; hr.textContent = "Tiempo: " + Math.ceil(timer) + "s"; }
}

let last = 0;
function loop(t) { const dt = Math.min(0.04, (t - last) / 1000) || 0; last = t; update(dt); draw(); requestAnimationFrame(loop); }
